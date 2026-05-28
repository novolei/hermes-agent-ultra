//! Typed payloads for the `agent:*` Tauri events. Each variant is a distinct
//! event name + struct; helpers wrap `AppHandle::emit` for compile-time safety.

use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, PartialEq, specta::Type, tauri_specta::Event)]
pub struct TextDeltaEvent {
    pub session_id: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, specta::Type, tauri_specta::Event)]
pub struct ToolCallDeltaEvent {
    pub session_id: String,
    pub index: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arguments_chunk: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub call_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, specta::Type, tauri_specta::Event)]
pub struct UsageEvent {
    pub session_id: String,
    /// Token counts are capped at u32 for frontend JSON-number safety (u64 exceeds
    /// JS Number precision; LLM responses comfortably fit in ~4 B tokens).
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estimated_cost: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct DoneEvent {
    pub session_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct ErrorEvent {
    pub session_id: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct ToolStartEvent {
    pub session_id: String,
    pub tool: String,
    /// JSON-encoded tool arguments. Frontend may `JSON.parse` if it needs the
    /// structured form; we keep the wire format as a string so specta exports
    /// a plain TS `string` (avoids `serde_json::Value` → `unknown` widening).
    pub arguments_json: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct ToolResultEvent {
    pub session_id: String,
    pub tool: String,
    pub result: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct ThinkingDeltaEvent {
    pub session_id: String,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct StatusEvent {
    pub session_id: String,
    /// Free-form event_type from hermes-agent's status_callback. Observed today:
    /// `"lifecycle"` (retries, compacting, context pressure). Future values are
    /// possible — frontend should treat as opaque tag.
    pub event_type: String,
    pub message: String,
}

pub const TEXT_DELTA: &str = "agent:text-delta";
pub const TOOL_CALL_DELTA: &str = "agent:tool-call-delta";
pub const USAGE: &str = "agent:usage";
pub const DONE: &str = "agent:done";
pub const ERROR: &str = "agent:error";
pub const TOOL_START: &str = "agent:tool-start";
pub const TOOL_RESULT: &str = "agent:tool-result";
pub const THINKING_DELTA: &str = "agent:thinking-delta";
pub const STATUS: &str = "agent:status";

pub fn emit_text_delta(app: &AppHandle, e: TextDeltaEvent) {
    if let Err(err) = app.emit(TEXT_DELTA, e) {
        tracing::warn!(target = "events", "emit text-delta failed: {err}");
    }
}

pub fn emit_tool_call_delta(app: &AppHandle, e: ToolCallDeltaEvent) {
    if let Err(err) = app.emit(TOOL_CALL_DELTA, e) {
        tracing::warn!(target = "events", "emit tool-call-delta failed: {err}");
    }
}

pub fn emit_usage(app: &AppHandle, e: UsageEvent) {
    if let Err(err) = app.emit(USAGE, e) {
        tracing::warn!(target = "events", "emit usage failed: {err}");
    }
}

pub fn emit_done(app: &AppHandle, e: DoneEvent) {
    if let Err(err) = app.emit(DONE, e) {
        tracing::warn!(target = "events", "emit done failed: {err}");
    }
}

pub fn emit_error(app: &AppHandle, e: ErrorEvent) {
    if let Err(err) = app.emit(ERROR, e) {
        tracing::warn!(target = "events", "emit error failed: {err}");
    }
}

pub fn emit_tool_start(app: &AppHandle, e: ToolStartEvent) {
    if let Err(err) = app.emit(TOOL_START, e) {
        tracing::warn!(target = "events", "emit tool-start failed: {err}");
    }
}

pub fn emit_tool_result(app: &AppHandle, e: ToolResultEvent) {
    if let Err(err) = app.emit(TOOL_RESULT, e) {
        tracing::warn!(target = "events", "emit tool-result failed: {err}");
    }
}

pub fn emit_thinking_delta(app: &AppHandle, e: ThinkingDeltaEvent) {
    if let Err(err) = app.emit(THINKING_DELTA, e) {
        tracing::warn!(target = "events", "emit thinking-delta failed: {err}");
    }
}

pub fn emit_status(app: &AppHandle, e: StatusEvent) {
    if let Err(err) = app.emit(STATUS, e) {
        tracing::warn!(target = "events", "emit status failed: {err}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn text_delta_serializes_to_snake_case_json() {
        let json = serde_json::to_value(TextDeltaEvent {
            session_id: "s1".into(),
            text: "hi".into(),
        })
        .unwrap();
        assert_eq!(json["session_id"], "s1");
        assert_eq!(json["text"], "hi");
    }

    #[test]
    fn usage_serializes_with_optional_cost() {
        let json = serde_json::to_value(UsageEvent {
            session_id: "s1".into(),
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
            estimated_cost: Some(0.0001),
        })
        .unwrap();
        assert_eq!(json["prompt_tokens"], 10);
        assert_eq!(json["completion_tokens"], 20);
        assert_eq!(json["total_tokens"], 30);
        assert_eq!(json["estimated_cost"], 0.0001);
    }

    #[test]
    fn done_serializes_with_optional_reason() {
        let json = serde_json::to_value(DoneEvent {
            session_id: "s1".into(),
            reason: None,
        })
        .unwrap();
        assert_eq!(json["session_id"], "s1");
        assert!(json.get("reason").map(|v| v.is_null()).unwrap_or(true));
    }

    #[test]
    fn tool_call_delta_skips_none_optional_fields() {
        let json = serde_json::to_value(ToolCallDeltaEvent {
            session_id: "s1".into(),
            index: 0,
            function_name: None,
            arguments_chunk: None,
            call_id: None,
        })
        .unwrap();
        assert_eq!(json["session_id"], "s1");
        assert_eq!(json["index"], 0);
        assert!(
            json.get("function_name").is_none(),
            "None should be skipped"
        );
        assert!(
            json.get("arguments_chunk").is_none(),
            "None should be skipped"
        );
        assert!(json.get("call_id").is_none(), "None should be skipped");
    }

    #[test]
    fn error_serializes_with_message() {
        let json = serde_json::to_value(ErrorEvent {
            session_id: "s1".into(),
            message: "boom".into(),
        })
        .unwrap();
        assert_eq!(json["session_id"], "s1");
        assert_eq!(json["message"], "boom");
    }

    #[test]
    fn tool_start_serializes_with_arguments_json() {
        let json = serde_json::to_value(ToolStartEvent {
            session_id: "s1".into(),
            tool: "shell".into(),
            arguments_json: r#"{"cmd":"ls"}"#.into(),
        })
        .unwrap();
        assert_eq!(json["session_id"], "s1");
        assert_eq!(json["tool"], "shell");
        assert_eq!(json["arguments_json"], r#"{"cmd":"ls"}"#);
    }

    #[test]
    fn tool_result_serializes_with_result_string() {
        let json = serde_json::to_value(ToolResultEvent {
            session_id: "s1".into(),
            tool: "shell".into(),
            result: "hello\n".into(),
        })
        .unwrap();
        assert_eq!(json["tool"], "shell");
        assert_eq!(json["result"], "hello\n");
    }

    #[test]
    fn thinking_delta_serializes_with_token() {
        let json = serde_json::to_value(ThinkingDeltaEvent {
            session_id: "s1".into(),
            token: "Let me think...".into(),
        })
        .unwrap();
        assert_eq!(json["token"], "Let me think...");
    }

    #[test]
    fn status_serializes_with_event_type_and_message() {
        let json = serde_json::to_value(StatusEvent {
            session_id: "s1".into(),
            event_type: "lifecycle".into(),
            message: "Retrying API call (attempt 2/3)".into(),
        })
        .unwrap();
        assert_eq!(json["event_type"], "lifecycle");
        assert_eq!(json["message"], "Retrying API call (attempt 2/3)");
    }
}
