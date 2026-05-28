//! Typed payloads for the `agent:*` Tauri events. Each variant is a distinct
//! event name + struct; helpers wrap `AppHandle::emit` for compile-time safety.

use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct TextDeltaEvent {
    pub session_id: String,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct ToolCallDeltaEvent {
    pub session_id: String,
    pub index: u32,
    pub function_name: Option<String>,
    pub arguments_chunk: Option<String>,
    pub call_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct UsageEvent {
    pub session_id: String,
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub total_tokens: u64,
    pub estimated_cost: Option<f64>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct DoneEvent {
    pub session_id: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct ErrorEvent {
    pub session_id: String,
    pub message: String,
}

pub const TEXT_DELTA: &str = "agent:text-delta";
pub const TOOL_CALL_DELTA: &str = "agent:tool-call-delta";
pub const USAGE: &str = "agent:usage";
pub const DONE: &str = "agent:done";
pub const ERROR: &str = "agent:error";

pub fn emit_text_delta(app: &AppHandle, session_id: &str, text: &str) {
    let _ = app.emit(TEXT_DELTA, TextDeltaEvent {
        session_id: session_id.into(),
        text: text.into(),
    });
}

pub fn emit_tool_call_delta(app: &AppHandle, e: ToolCallDeltaEvent) {
    let _ = app.emit(TOOL_CALL_DELTA, e);
}

pub fn emit_usage(app: &AppHandle, e: UsageEvent) {
    let _ = app.emit(USAGE, e);
}

pub fn emit_done(app: &AppHandle, session_id: &str, reason: Option<String>) {
    let _ = app.emit(DONE, DoneEvent { session_id: session_id.into(), reason });
}

pub fn emit_error(app: &AppHandle, session_id: &str, message: &str) {
    let _ = app.emit(ERROR, ErrorEvent {
        session_id: session_id.into(),
        message: message.into(),
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn text_delta_serializes_to_camelcase_json() {
        let json = serde_json::to_value(TextDeltaEvent {
            session_id: "s1".into(),
            text: "hi".into(),
        }).unwrap();
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
        }).unwrap();
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
        }).unwrap();
        assert_eq!(json["session_id"], "s1");
        assert!(json.get("reason").map(|v| v.is_null()).unwrap_or(true));
    }
}
