//! `agent` domain commands. Thin wrappers over `services::agent_service`.

use crate::state::AppState;
use serde::Serialize;
use tauri::{AppHandle, State};

#[derive(Debug, Serialize, specta::Type)]
pub struct AgentSendError {
    pub message: String,
}

#[tauri::command]
#[specta::specta]
pub async fn agent_send_message(
    app: AppHandle,
    state: State<'_, AppState>,
    session_id: String,
    text: String,
) -> Result<String, AgentSendError> {
    state
        .agent
        .send_message_streaming(app, &state.session, session_id, text)
        .await
        .map_err(|e| AgentSendError { message: e.to_string() })
}
