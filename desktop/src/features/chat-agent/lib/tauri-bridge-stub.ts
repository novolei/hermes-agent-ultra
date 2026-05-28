/**
 * Stubs for uclaw's `@/lib/tauri-bridge` imports inside `agent-atoms.ts`.
 *
 * The state-machine port (Plan 2b.2.a) needs these symbols to type-check
 * but does NOT exercise them in any unit test. Real implementations land
 * later:
 *   - `togglePinAgentSession`: throws on call (Plan 3+ implements session
 *     pinning when the workspace/session UI lands).
 *   - `onAskUserRequest` / `onExitPlanRequest`: subscribe to real Tauri
 *     events; the events don't fire from our backend yet (Plan 2c+), so
 *     these listeners are no-ops in practice but the wire is intact.
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { AskUserRequest, ExitPlanModeRequest } from './agent-types'

/** Toggle the pinned state of an agent session. Returns the new pinnedAt timestamp or null. */
export async function togglePinAgentSession(_sessionId: string): Promise<void> {
  throw new Error('togglePinAgentSession: not implemented in Plan 2b.2.a (state-machine port)')
}

/**
 * Toggle the archived state of an agent session.
 * Returns the new archived epoch-ms timestamp, or null when un-archiving.
 * Stub — real implementation lands when the Rust command is wired up.
 */
export async function toggleArchiveAgentSession(_id: string): Promise<number | null> {
  throw new Error('toggleArchiveAgentSession: not yet implemented')
}

/**
 * Permanently delete an agent session.
 * Returns true on success.
 * Stub — real implementation lands when the Rust command is wired up.
 */
export async function deleteAgentSession(_id: string): Promise<boolean> {
  throw new Error('deleteAgentSession: not yet implemented')
}

/** Subscribe to agent:ask_user_request events from the Tauri backend. */
export const onAskUserRequest = (cb: (payload: AskUserRequest) => void): Promise<UnlistenFn> =>
  listen('agent:ask_user_request', (e) => cb(e.payload as AskUserRequest))

/** Subscribe to agent:exit_plan_request events from the Tauri backend. */
export const onExitPlanRequest = (cb: (payload: ExitPlanModeRequest) => void): Promise<UnlistenFn> =>
  listen('agent:exit_plan_request', (e) => cb(e.payload as ExitPlanModeRequest))

// ─── Plan 3.3 B6-prereq: automation + symphony type stubs ─────────────────
// BottomDock + LeftSidebar import atoms/hooks that consume these types from
// @/lib/tauri-bridge. The real Tauri commands ship in Plan 4 (automation)
// and a future plan (symphony). Until then we expose placeholder types
// (shape-only) + a single throwing async function so verbatim ports compile.

export type HumaneSpecRow = {
  id: string
  title: string
  [key: string]: unknown
}
export type AutomationActivity = {
  spec_id: string
  [key: string]: unknown
}
export type EscalationRow = {
  id: string
  spec_id: string
  [key: string]: unknown
}
export type ChatSessionSummary = {
  id: string
  spec_id: string
  [key: string]: unknown
}
export type SymphonyWorkflowSummary = {
  id: string
  name: string
  [key: string]: unknown
}
export type SymphonyWorkflowDetailDto = {
  id: string
  nodes: unknown[]
  edges: unknown[]
  [key: string]: unknown
}
export type SymphonyRunRow = {
  id: string
  workflowId: string
  [key: string]: unknown
}
export type SymphonyNodeRunRow = {
  runId: string
  nodeId: string
  status: string
  [key: string]: unknown
}
export type SymphonyNodeUpdateEvent = {
  runId: string
  nodeId: string
  status: string
  [key: string]: unknown
}

export async function listChatSessionsForSpec(_specId: string): Promise<ChatSessionSummary[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: listChatSessionsForSpec')
}

// ─── Plan 3.3 C2: git stubs for SidebarGitActions ─────────────────────────

/**
 * Probe if the workspace directory is a git repository.
 * Plan 3.3 C2 stub.
 */
export async function gitIsRepo(_cwd: string): Promise<boolean> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: gitIsRepo')
}

/**
 * Get the current branch name for a git repository.
 * Plan 3.3 C2 stub.
 */
export async function gitCurrentBranch(_cwd: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: gitCurrentBranch')
}

// ─── Plan 3.3 C3: session move stub for MoveSessionDialog ──────────────────

/**
 * Move an agent session to a different workspace.
 * Plan 3.3 C3 stub.
 */
export async function moveAgentSessionToWorkspace(_params: {
  sessionId: string
  targetWorkspaceId: string
}): Promise<any> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: moveAgentSessionToWorkspace')
}
