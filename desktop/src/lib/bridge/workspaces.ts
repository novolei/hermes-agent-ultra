/**
 * Plan 3.2 — frontend wrappers for the Rust Tauri workspace CRUD commands
 * defined in desktop/src-tauri/src/commands/workspaces.rs. Consumers:
 * atoms/workspace.ts action atoms + the 6 workspace UI components.
 */
import { commands, type WorkspaceInfo, type CreateWorkspaceArgs, type UpdateWorkspaceArgs } from './generated'

export type { WorkspaceInfo, CreateWorkspaceArgs, UpdateWorkspaceArgs }

/**
 * Returns the workspace list ordered by position (then creation time).
 * Returns empty array on error.
 */
export async function listWorkspaces(): Promise<WorkspaceInfo[]> {
  try {
    const result = await commands.workspaceList()
    return result.status === 'ok' ? result.data : []
  } catch {
    return []
  }
}

/**
 * Create a new workspace with the given arguments.
 * Returns the created WorkspaceInfo on success, null on failure.
 */
export async function createWorkspace(args: CreateWorkspaceArgs): Promise<WorkspaceInfo | null> {
  try {
    const result = await commands.workspaceCreate(args)
    return result.status === 'ok' ? result.data : null
  } catch {
    return null
  }
}

/**
 * Update an existing workspace.
 * Returns true on success, false on failure.
 */
export async function updateWorkspace(args: UpdateWorkspaceArgs): Promise<boolean> {
  try {
    const result = await commands.workspaceUpdate(args)
    return result.status === 'ok'
  } catch {
    return false
  }
}

/**
 * Delete a workspace by ID.
 * Returns true on success, false on failure.
 */
export async function deleteWorkspace(id: string): Promise<boolean> {
  try {
    const result = await commands.workspaceDelete(id)
    return result.status === 'ok'
  } catch {
    return false
  }
}

/**
 * Reorder workspaces using an array of IDs in the desired order.
 * Returns true on success, false on failure.
 */
export async function reorderWorkspaces(orderedIds: string[]): Promise<boolean> {
  try {
    const result = await commands.workspaceReorder(orderedIds)
    return result.status === 'ok'
  } catch {
    return false
  }
}

/**
 * Get the ID of the currently active workspace.
 * Returns the workspace ID, null if no workspace is active, or null on error.
 */
export async function getActiveWorkspaceId(): Promise<string | null> {
  try {
    const result = await commands.workspaceGetActive()
    return result.status === 'ok' ? (result.data ?? null) : null
  } catch {
    return null
  }
}

/**
 * Set the active workspace by ID, or clear the active workspace if id is null.
 * Returns true on success, false on failure.
 */
export async function setActiveWorkspaceId(id: string | null): Promise<boolean> {
  try {
    const result = await commands.workspaceSetActive(id)
    return result.status === 'ok'
  } catch {
    return false
  }
}
