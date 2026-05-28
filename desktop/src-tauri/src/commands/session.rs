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

/// Toggle the archived flag for an agent session.
///
/// Returns the archived epoch-ms timestamp (as f64 to stay within JS safe
/// integer range) when archiving, or `null` when un-archiving. Fails with an
/// error string when the session is not found.
///
/// Plan 3.3 F1.
#[tauri::command]
#[specta::specta]
pub fn toggle_archive_agent_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<Option<f64>, String> {
    state
        .session
        .toggle_archive(&session_id)
        .map(|opt| opt.map(|ms| ms as f64))
        .map_err(|e| e.to_string())
}

/// Permanently delete an agent session and all its messages.
///
/// Returns `true` when the session existed and was removed, `false` when it
/// was already absent.
///
/// Plan 3.3 F1.
#[tauri::command]
#[specta::specta]
pub fn delete_agent_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<bool, String> {
    state
        .session
        .delete_one(&session_id)
        .map_err(|e| e.to_string())
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
