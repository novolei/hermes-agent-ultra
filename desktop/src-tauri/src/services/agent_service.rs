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
pub fn translate_chunk(session_id: &str, chunk: &StreamChunk) -> Vec<TranslatedEvent> {
    let mut out = Vec::new();
    if let Some(delta) = chunk.delta.as_ref() {
        if let Some(text) = delta.content.as_ref() {
            if !text.is_empty() {
                out.push(TranslatedEvent::TextDelta(TextDeltaEvent {
                    session_id: session_id.to_string(),
                    text: text.clone(),
                }));
            }
        }
        if let Some(tool_calls) = delta.tool_calls.as_ref() {
            for tc in tool_calls.iter() {
                out.push(TranslatedEvent::ToolCallDelta(ToolCallDeltaEvent {
                    session_id: session_id.to_string(),
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
            session_id: session_id.to_string(),
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
            estimated_cost: usage.estimated_cost,
        }));
    }
    out
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
}
