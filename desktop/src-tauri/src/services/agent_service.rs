//! Wraps `hermes_agent::AgentLoop` and bridges its streaming output into
//! typed `agent:*` Tauri events. The `translate_chunk` helper is a pure
//! function and is the only piece unit-testable without a real provider.
//! The full streaming wrapper (`send_message_streaming`) is added in Task 5.

use hermes_core::StreamChunk;

use crate::events::{TextDeltaEvent, ToolCallDeltaEvent, UsageEvent};

/// A single observable side-effect produced while translating a chunk.
/// `agent_service` (Task 5) will convert these into `AppHandle::emit` calls;
/// tests inspect them directly without needing a Tauri app handle.
#[derive(Debug, Clone, PartialEq)]
pub enum TranslatedEvent {
    TextDelta(TextDeltaEvent),
    ToolCallDelta(ToolCallDeltaEvent),
    Usage(UsageEvent),
}

/// Translate one `StreamChunk` into zero or more `TranslatedEvent`s.
/// Pure: takes a chunk, returns owned events tagged with the session id.
///
/// Note: `chunk.finish_reason` is intentionally NOT translated here — the
/// streaming wrapper in `send_message_streaming` (Task 5) emits `agent:done`
/// when the stream completes. Adding finish_reason handling to this function
/// would cause `agent:done` to be emitted twice per stream.
pub fn translate_chunk(session_id: &str, chunk: &StreamChunk) -> Vec<TranslatedEvent> {
    let sid = session_id.to_string();
    let mut out = Vec::new();
    if let Some(delta) = chunk.delta.as_ref() {
        if let Some(text) = delta.content.as_ref() {
            if !text.is_empty() {
                out.push(TranslatedEvent::TextDelta(TextDeltaEvent {
                    session_id: sid.clone(),
                    text: text.clone(),
                }));
            }
        }
        if let Some(tool_calls) = delta.tool_calls.as_ref() {
            for tc in tool_calls.iter() {
                out.push(TranslatedEvent::ToolCallDelta(ToolCallDeltaEvent {
                    session_id: sid.clone(),
                    index: tc.index,
                    function_name: tc.function.as_ref().and_then(|f| f.name.clone()),
                    arguments_chunk: tc.function.as_ref().and_then(|f| f.arguments.clone()),
                    call_id: tc.id.clone(),
                }));
            }
        }
    }
    if let Some(usage) = chunk.usage.as_ref() {
        out.push(TranslatedEvent::Usage(UsageEvent {
            session_id: sid.clone(),
            // Saturating cast: UsageStats uses u64 but token counts fit in u32 for any
            // foreseeable LLM response; clamp rather than panic or wrap.
            prompt_tokens: usage.prompt_tokens.min(u32::MAX as u64) as u32,
            completion_tokens: usage.completion_tokens.min(u32::MAX as u64) as u32,
            total_tokens: usage.total_tokens.min(u32::MAX as u64) as u32,
            estimated_cost: usage.estimated_cost,
        }));
    }
    out
}

use std::sync::Arc;
use tokio::sync::Mutex;

use hermes_agent::agent_loop::ToolRegistry as AgentToolRegistry;
use hermes_agent::provider::{AnthropicProvider, OpenAiProvider};
use hermes_agent::{AgentConfig, AgentLoop};
use hermes_core::{AgentError, LlmProvider, Message, MessageRole};
use tauri::AppHandle;

use crate::events;
use crate::services::session_service::SessionService;

/// Lazily-constructed AgentLoop wrapper. Holds the single LLM provider for
/// the desktop session; constructed on first use from env vars (MVP).
pub struct AgentService {
    inner: Mutex<Option<Arc<AgentLoop>>>,
}

// TODO(plan-2b-or-3): Currently a single AgentLoop is reused across all
// sessions, so `AgentConfig.session_id` is unset and hermes-agent's
// internal session tracking (replay recorder, memory sync, hook contexts)
// all use "". Harmless in MVP because we set skip_memory + no replay/hooks,
// but once those land, refactor to either:
//   (a) construct AgentLoop per call (canonical hermes-http pattern), or
//   (b) cache the provider only and rebuild AgentLoop per send.
// Tracked alongside the per-session concurrency lock that the same refactor
// should introduce.
impl AgentService {
    pub fn new() -> Self {
        Self { inner: Mutex::new(None) }
    }

    /// Returns (or initialises) the underlying AgentLoop.
    /// MVP: env-var driven. Plan 4.5's settings UI replaces this.
    async fn get_or_init(&self) -> Result<Arc<AgentLoop>, AgentError> {
        let mut guard = self.inner.lock().await;
        if let Some(existing) = guard.as_ref() {
            return Ok(existing.clone());
        }
        let (provider, model) = build_provider_from_env()?;
        let config = AgentConfig {
            model,
            stream: true,
            max_turns: 20,
            ..AgentConfig::default()
        };
        let tools = Arc::new(AgentToolRegistry::new());
        let agent = Arc::new(AgentLoop::new(config, tools, provider));
        *guard = Some(agent.clone());
        Ok(agent)
    }

    /// Send a user message, stream chunks back to the frontend via Tauri
    /// events, persist the resulting history, return the final assistant
    /// text.
    pub async fn send_message_streaming(
        &self,
        app: AppHandle,
        session: &SessionService,
        session_id: String,
        user_text: String,
    ) -> Result<String, AgentError> {
        let agent = self.get_or_init().await?;

        // Load prior history (empty for new sessions) and append the new user turn.
        let mut history = match session.load(&session_id) {
            Ok(h) => h,
            Err(e) => {
                tracing::warn!(target = "agent_service", "session.load({session_id}) failed: {e}; using empty history");
                // Emit a non-fatal error event so the UI can surface a banner if it wants.
                events::emit_error(&app, events::ErrorEvent {
                    session_id: session_id.clone(),
                    message: format!("session.load failed (using empty history): {e}"),
                });
                Vec::new()
            }
        };
        history.push(Message {
            role: MessageRole::User,
            content: Some(user_text),
            tool_calls: None,
            tool_call_id: None,
            name: None,
            reasoning_content: None,
            cache_control: None,
        });

        // Stream callback: translate chunks → emit Tauri events.
        let app_for_cb = app.clone();
        let session_for_cb = session_id.clone();
        let on_chunk: Box<dyn Fn(hermes_core::StreamChunk) + Send + Sync> = Box::new(move |chunk| {
            for tev in translate_chunk(&session_for_cb, &chunk) {
                match tev {
                    TranslatedEvent::TextDelta(e) =>
                        events::emit_text_delta(&app_for_cb, e),
                    TranslatedEvent::ToolCallDelta(e) =>
                        events::emit_tool_call_delta(&app_for_cb, e),
                    TranslatedEvent::Usage(e) => events::emit_usage(&app_for_cb, e),
                }
            }
        });

        // Drive the loop.
        let result = match agent.run_stream(history, None, Some(on_chunk)).await {
            Ok(r) => r,
            Err(e) => {
                events::emit_error(&app, events::ErrorEvent {
                    session_id: session_id.clone(),
                    message: e.to_string(),
                });
                return Err(e);
            }
        };

        // Persist updated history + return the last assistant reply.
        if let Err(e) = session.save(&session_id, &result.messages, None) {
            tracing::warn!(target = "agent_service", "session.save({session_id}) failed: {e}");
        }
        let reply = result
            .messages
            .iter()
            .rev()
            .find(|m| matches!(m.role, MessageRole::Assistant))
            .and_then(|m| m.content.clone())
            .unwrap_or_default();

        let reason = if result.interrupted {
            "interrupted"
        } else if result.finished_naturally {
            "stop"
        } else {
            "max_turns"
        };
        events::emit_done(&app, events::DoneEvent {
            session_id: session_id.clone(),
            reason: Some(reason.into()),
        });
        Ok(reply)
    }
}

impl Default for AgentService {
    fn default() -> Self { Self::new() }
}

/// MVP provider selection. Reads `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY` as a
/// fallback). Plan 4.5 replaces this with a settings-driven config. Returns
/// `(provider, "provider:model")` where the model string is what `AgentConfig.model`
/// expects (e.g. "openai:gpt-4o-mini").
fn build_provider_from_env() -> Result<(Arc<dyn LlmProvider>, String), AgentError> {
    if let Ok(key) = std::env::var("OPENAI_API_KEY") {
        let model = std::env::var("HERMES_DESKTOP_MODEL")
            .unwrap_or_else(|_| "gpt-4o-mini".to_string());
        let model = model.splitn(2, ':').last().unwrap_or(&model).to_string();
        let provider: Arc<dyn LlmProvider> =
            Arc::new(OpenAiProvider::new(key).with_model(model.clone()));
        return Ok((provider, format!("openai:{}", model)));
    }
    if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
        let model = std::env::var("HERMES_DESKTOP_MODEL")
            .unwrap_or_else(|_| "claude-3-5-sonnet-20241022".to_string());
        let model = model.splitn(2, ':').last().unwrap_or(&model).to_string();
        // AnthropicProvider::with_model exists (confirmed at provider.rs:919) —
        // chain it to honour HERMES_DESKTOP_MODEL.
        let provider: Arc<dyn LlmProvider> =
            Arc::new(AnthropicProvider::new(key).with_model(model.clone()));
        return Ok((provider, format!("anthropic:{}", model)));
    }
    Err(AgentError::Config(
        "no API key found in environment (set OPENAI_API_KEY or ANTHROPIC_API_KEY)".into(),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use hermes_core::{StreamChunk, StreamDelta, UsageStats};

    #[test]
    fn text_delta_chunk_maps_to_text_delta_event() {
        let chunk = StreamChunk {
            delta: Some(StreamDelta {
                content: Some("hello".into()),
                tool_calls: None,
                extra: None,
            }),
            finish_reason: None,
            usage: None,
        };
        let events = translate_chunk("s1", &chunk);
        assert_eq!(events.len(), 1);
        match &events[0] {
            TranslatedEvent::TextDelta(e) => {
                assert_eq!(e.session_id, "s1");
                assert_eq!(e.text, "hello");
            }
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn empty_text_delta_is_skipped() {
        let chunk = StreamChunk {
            delta: Some(StreamDelta {
                content: Some("".into()),
                tool_calls: None,
                extra: None,
            }),
            finish_reason: None,
            usage: None,
        };
        assert!(translate_chunk("s1", &chunk).is_empty());
    }

    #[test]
    fn usage_chunk_maps_to_usage_event() {
        let chunk = StreamChunk {
            delta: None,
            finish_reason: Some("stop".into()),
            usage: Some(UsageStats {
                prompt_tokens: 10,
                completion_tokens: 20,
                total_tokens: 30,
                estimated_cost: Some(0.000123),
            }),
        };
        let events = translate_chunk("s1", &chunk);
        assert_eq!(events.len(), 1);
        match &events[0] {
            TranslatedEvent::Usage(e) => {
                assert_eq!(e.total_tokens, 30);
                assert_eq!(e.estimated_cost, Some(0.000123));
            }
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn empty_chunk_emits_nothing() {
        let chunk = StreamChunk { delta: None, finish_reason: None, usage: None };
        assert!(translate_chunk("s1", &chunk).is_empty());
    }

    #[test]
    fn tool_call_delta_with_name_and_args_maps_correctly() {
        use hermes_core::{FunctionCallDelta, ToolCallDelta};
        let chunk = StreamChunk {
            delta: Some(StreamDelta {
                content: None,
                tool_calls: Some(vec![ToolCallDelta {
                    index: 0,
                    id: Some("call_abc".into()),
                    function: Some(FunctionCallDelta {
                        name: Some("my_tool".into()),
                        arguments: Some("{\"a\":1}".into()),
                    }),
                }]),
                extra: None,
            }),
            finish_reason: None,
            usage: None,
        };
        let events = translate_chunk("s1", &chunk);
        assert_eq!(events.len(), 1);
        match &events[0] {
            TranslatedEvent::ToolCallDelta(e) => {
                assert_eq!(e.session_id, "s1");
                assert_eq!(e.index, 0);
                assert_eq!(e.call_id.as_deref(), Some("call_abc"));
                assert_eq!(e.function_name.as_deref(), Some("my_tool"));
                assert_eq!(e.arguments_chunk.as_deref(), Some("{\"a\":1}"));
            }
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn tool_call_delta_with_arguments_only_maps_correctly() {
        // Common OpenAI pattern: name arrives in chunk 0, subsequent chunks
        // carry only arguments fragments (no name, no id).
        use hermes_core::{FunctionCallDelta, ToolCallDelta};
        let chunk = StreamChunk {
            delta: Some(StreamDelta {
                content: None,
                tool_calls: Some(vec![ToolCallDelta {
                    index: 0,
                    id: None,
                    function: Some(FunctionCallDelta {
                        name: None,
                        arguments: Some("\"value\"}".into()),
                    }),
                }]),
                extra: None,
            }),
            finish_reason: None,
            usage: None,
        };
        let events = translate_chunk("s1", &chunk);
        assert_eq!(events.len(), 1);
        match &events[0] {
            TranslatedEvent::ToolCallDelta(e) => {
                assert!(e.call_id.is_none(), "id should be None");
                assert!(e.function_name.is_none(), "name should be None");
                assert_eq!(e.arguments_chunk.as_deref(), Some("\"value\"}"));
            }
            other => panic!("unexpected event: {other:?}"),
        }
    }

    #[test]
    fn chunk_with_content_and_usage_emits_both_events_in_order() {
        // OpenAI's stream_options.include_usage=true sends usage in the final
        // chunk alongside any remaining text delta.
        let chunk = StreamChunk {
            delta: Some(StreamDelta {
                content: Some("last".into()),
                tool_calls: None,
                extra: None,
            }),
            finish_reason: Some("stop".into()),
            usage: Some(UsageStats {
                prompt_tokens: 1,
                completion_tokens: 2,
                total_tokens: 3,
                estimated_cost: None,
            }),
        };
        let events = translate_chunk("s1", &chunk);
        assert_eq!(events.len(), 2, "expected text-delta then usage");
        assert!(matches!(events[0], TranslatedEvent::TextDelta(_)));
        assert!(matches!(events[1], TranslatedEvent::Usage(_)));
    }
}
