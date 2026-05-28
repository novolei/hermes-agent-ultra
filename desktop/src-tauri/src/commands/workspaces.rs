//! Tauri commands for workspace CRUD. Thin wrappers over `WorkspaceService`.
//!
//! Plan 3.2 — backs the frontend `lib/bridge/workspaces.ts` typed wrappers
//! and the action atoms in `atoms/workspace.ts`.

use crate::services::workspace_service::WorkspaceRow;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, specta::Type)]
pub struct WorkspaceError {
    pub message: String,
}

impl From<hermes_core::AgentError> for WorkspaceError {
    fn from(e: hermes_core::AgentError) -> Self {
        WorkspaceError {
            message: format!("{e}"),
        }
    }
}

#[derive(Debug, Serialize, specta::Type)]
pub struct WorkspaceInfo {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub cwd: Option<String>,
    pub color: Option<String>,
    /// Sort order within the workspace list (TypeScript `number`).
    pub position: i32,
    /// Unix timestamp (seconds). Represented as `number` in TypeScript; f64 covers
    /// all epoch-second values exactly within JS safe-integer range.
    pub created_at: f64,
    pub updated_at: f64,
}

impl From<WorkspaceRow> for WorkspaceInfo {
    fn from(r: WorkspaceRow) -> Self {
        WorkspaceInfo {
            id: r.id,
            name: r.name,
            icon: r.icon,
            cwd: r.cwd,
            color: r.color,
            position: r.position as i32,
            created_at: r.created_at as f64,
            updated_at: r.updated_at as f64,
        }
    }
}

#[derive(Debug, Deserialize, specta::Type)]
pub struct CreateWorkspaceArgs {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub cwd: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize, specta::Type)]
pub struct UpdateWorkspaceArgs {
    pub id: String,
    pub name: Option<String>,
    pub icon: Option<String>,
    pub cwd: Option<String>,
    pub color: Option<String>,
}

#[tauri::command]
#[specta::specta]
pub fn workspace_list(state: State<'_, AppState>) -> Result<Vec<WorkspaceInfo>, WorkspaceError> {
    Ok(state
        .workspace
        .list()?
        .into_iter()
        .map(WorkspaceInfo::from)
        .collect())
}

#[tauri::command]
#[specta::specta]
pub fn workspace_create(
    state: State<'_, AppState>,
    args: CreateWorkspaceArgs,
) -> Result<WorkspaceInfo, WorkspaceError> {
    let row = state.workspace.create(
        &args.id,
        &args.name,
        args.icon.as_deref(),
        args.cwd.as_deref(),
        args.color.as_deref(),
    )?;
    Ok(row.into())
}

#[tauri::command]
#[specta::specta]
pub fn workspace_update(
    state: State<'_, AppState>,
    args: UpdateWorkspaceArgs,
) -> Result<(), WorkspaceError> {
    state.workspace.update(
        &args.id,
        args.name.as_deref(),
        args.icon.as_deref(),
        args.cwd.as_deref(),
        args.color.as_deref(),
    )?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn workspace_delete(state: State<'_, AppState>, id: String) -> Result<(), WorkspaceError> {
    state.workspace.delete(&id)?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn workspace_reorder(
    state: State<'_, AppState>,
    ordered_ids: Vec<String>,
) -> Result<(), WorkspaceError> {
    state.workspace.reorder(&ordered_ids)?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn workspace_get_active(state: State<'_, AppState>) -> Result<Option<String>, WorkspaceError> {
    Ok(state.workspace.get_active()?)
}

#[tauri::command]
#[specta::specta]
pub fn workspace_set_active(
    state: State<'_, AppState>,
    id: Option<String>,
) -> Result<(), WorkspaceError> {
    state.workspace.set_active(id.as_deref())?;
    Ok(())
}
