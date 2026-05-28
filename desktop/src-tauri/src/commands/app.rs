//! `app` domain commands. Thin wrappers over `services::app_service`.

use crate::services::app_service::AppInfo;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub fn app_info(state: State<'_, AppState>) -> AppInfo {
    state.app.info()
}
