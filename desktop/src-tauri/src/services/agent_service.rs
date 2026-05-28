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
