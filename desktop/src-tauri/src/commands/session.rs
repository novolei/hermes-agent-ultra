//! `session` domain commands. Thin wrappers over `services::session_service`.

use crate::state::AppState;
use hermes_core::MessageRole;
use serde::Serialize;
use tauri::State;

/// Frontend-facing message shape. Mirrors `hermes_core::Message` but only
/// surfaces the fields the UI cares about for v1.
#[derive(Debug, Clone, Serialize, specta::Type)]
pub struct SessionMessage {
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}

#[derive(Debug, Serialize, specta::Type)]
pub struct SessionLoadError {
    pub message: String,
}

#[tauri::command]
#[specta::specta]
pub fn session_load(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<Vec<SessionMessage>, SessionLoadError> {
    state
        .session
        .load(&session_id)
        .map(|msgs| {
            msgs.into_iter()
                .map(|m| SessionMessage {
                    role: match m.role {
                        MessageRole::System => "system".to_string(),
                        MessageRole::User => "user".to_string(),
                        MessageRole::Assistant => "assistant".to_string(),
                        MessageRole::Tool => "tool".to_string(),
                    },
                    content: m.content,
                })
                .collect()
        })
        .map_err(|e| SessionLoadError {
            message: e.to_string(),
        })
}
