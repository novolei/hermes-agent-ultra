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
 *
 * Plan 2b.2.c.4.a (D2) additions: AgentView IPC wrappers — updateSettings,
 * getAgentSessionPath, getAgentSessionMessages, sendAgentMessage, stopAgent,
 * openFileDialog, getPathForFile, checkPathsType, forkAgentSession,
 * rewindSession, saveFilesToAgentSession, agentSteer, agentFollowUp,
 * onStreamComplete, onQueuedConsumed, attachSessionDirectory,
 * estimateSessionContext. All throw NOT_IMPLEMENTED. Real port: Plan 4.a D3+.
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { AskUserRequest, ExitPlanModeRequest, AgentSessionMeta, WorkspaceCapabilities, AgentSendInput, AgentMessage } from './agent-types'
import type { ConversationMeta, UserProfile } from './chat-types'

/**
 * SafetyMode wire type — mirrors the Rust enum's serde shape.
 * Used by PermissionModeSelector + PermissionBanner to display/set the global safety policy.
 */
export type SafetyModeWire = 'ask' | 'acceptedits' | 'plan' | 'supervised' | 'yolo'

/** Toggle the pinned state of an agent session. Returns the new pinnedAt timestamp or null. */
export async function togglePinAgentSession(_sessionId: string): Promise<void> {
  throw new Error('togglePinAgentSession: not implemented in Plan 2b.2.a (state-machine port)')
}

/** Subscribe to agent:ask_user_request events from the Tauri backend. */
export const onAskUserRequest = (cb: (payload: AskUserRequest) => void): Promise<UnlistenFn> =>
  listen('agent:ask_user_request', (e) => cb(e.payload as AskUserRequest))

/** Subscribe to agent:exit_plan_request events from the Tauri backend. */
export const onExitPlanRequest = (cb: (payload: ExitPlanModeRequest) => void): Promise<UnlistenFn> =>
  listen('agent:exit_plan_request', (e) => cb(e.payload as ExitPlanModeRequest))

/**
 * Subscribe to agent:need_approval events from the Tauri backend (tool approval signals).
 * Gracefully handles test environments where Tauri is not available.
 */
export const onNeedApproval = (cb: () => void): Promise<UnlistenFn> => {
  return listen('agent:need_approval', () => cb()).catch(() => {
    // Test environment or Tauri not available — return a no-op unlisten function
    return () => {}
  })
}

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

// ─── Plan 3.3 E1: conversation + agent session + user profile stubs ───────
// LeftSidebar calls these IPC wrappers. Real implementations land in Plan 3.3 F1
// (agent session backend) and a future chat plan. Until then they're stubs.

/**
 * List all conversations (chat mode).
 * Plan 3.3 E1 stub.
 */
export async function listConversations(): Promise<ConversationMeta[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: listConversations')
}

/**
 * Create a new conversation.
 * Plan 3.3 E1 stub.
 */
export async function createConversation(_params: {
  title?: string
  modelId?: string
  channelId?: string
}): Promise<ConversationMeta> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: createConversation')
}

/**
 * Update the title of a conversation.
 * Plan 3.3 E1 stub.
 */
export async function updateConversationTitle(_id: string, _newTitle: string): Promise<ConversationMeta> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: updateConversationTitle')
}

/**
 * Toggle the pinned state of a conversation. Returns the updated ConversationMeta.
 * Plan 3.3 E1 stub.
 */
export async function togglePinConversation(_id: string): Promise<ConversationMeta> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: togglePinConversation')
}

/**
 * Toggle the archived state of a conversation.
 * Returns the new archivedAt timestamp or null when un-archiving.
 * Plan 3.3 E1 stub.
 */
export async function toggleArchiveConversation(_id: string): Promise<number | null> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: toggleArchiveConversation')
}

/**
 * Permanently delete a conversation.
 * Plan 3.3 E1 stub.
 */
export async function deleteConversation(_id: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: deleteConversation')
}

/**
 * Get the current user's profile (display name + avatar).
 * Plan 3.3 E1 stub.
 */
export async function getUserProfile(): Promise<UserProfile> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: getUserProfile')
}

/**
 * List all agent sessions.
 * Plan 3.3 E1 stub.
 */
export async function listAgentSessions(): Promise<AgentSessionMeta[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: listAgentSessions')
}

/**
 * Create a new agent session.
 * Plan 3.3 E1 stub.
 */
export async function createAgentSession(
  _title?: string,
  _channelId?: string,
  _workspaceId?: string,
): Promise<AgentSessionMeta> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: createAgentSession')
}

/**
 * Update the title of an agent session.
 * Plan 3.3 E1 stub.
 */
export async function updateAgentSessionTitle(_id: string, _newTitle: string): Promise<AgentSessionMeta> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: updateAgentSessionTitle')
}

/**
 * Toggle the manual-working flag of an agent session.
 * Returns the updated AgentSessionMeta.
 * Plan 3.3 E1 stub.
 */
export async function toggleManualWorkingAgentSession(_id: string): Promise<AgentSessionMeta> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: toggleManualWorkingAgentSession')
}

/**
 * Get the capabilities (MCP servers + skills) for a workspace.
 * Plan 3.3 E1 stub.
 */
export async function getWorkspaceCapabilities(_workspaceId: string): Promise<WorkspaceCapabilities> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3_E1: getWorkspaceCapabilities')
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

// ─── Plan 2b.2.c.4.a D2: AgentView IPC wrappers ───────────────────────────
// All stubs throw NOT_IMPLEMENTED. Real implementations arrive when the
// Rust backend for agent sessions lands in Plan 4.a D3+.
// Source: uclaw `@/lib/tauri-bridge` — see lines 1495–1886.

/** Update global / per-session settings. Plan 4.a D3+ stub. */
export async function updateSettings(_patch: Record<string, unknown>): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: updateSettings')
}

/** Get the filesystem path for an agent session within a workspace. Plan 4.a D3+ stub. */
export async function getAgentSessionPath(_workspaceId: string, _sessionId: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: getAgentSessionPath')
}

/** Fetch persisted messages for an agent session. Plan 4.a D3+ stub. */
export async function getAgentSessionMessages(_sessionId: string): Promise<AgentMessage[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: getAgentSessionMessages')
}

/** Send a user message to the agent. Plan 4.a D3+ stub. */
export async function sendAgentMessage(_input: AgentSendInput): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: sendAgentMessage')
}

/** Interrupt / stop a running agent session. Plan 4.a D3+ stub. */
export async function stopAgent(_sessionId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: stopAgent')
}

/** Steer a queued message (interrupt current turn and inject user message). Plan 4.a D3+ stub. */
export async function agentSteer(_input: { sessionId: string; userMessage: string; uuid?: string }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: agentSteer')
}

/** Enqueue a follow-up message without interrupting the current turn. Plan 4.a D3+ stub. */
export async function agentFollowUp(_input: { sessionId: string; userMessage: string; uuid?: string }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: agentFollowUp')
}

/** Fork an agent session up to a given message UUID. Plan 4.a D3+ stub. */
export async function forkAgentSession(_input: { sessionId: string; upToMessageUuid: string }): Promise<AgentSessionMeta> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: forkAgentSession')
}

/** Rewind an agent session to a given assistant message UUID. Plan 4.a D3+ stub. */
export async function rewindSession(_input: { sessionId: string; assistantMessageUuid: string }): Promise<any> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: rewindSession')
}

/** Save files to an agent session directory. Plan 4.a D3+ stub. */
export async function saveFilesToAgentSession(_input: {
  workspaceSlug: string
  sessionId: string
  files: Array<{ filename: string; data: string }>
}): Promise<Array<{ filename: string; targetPath: string }>> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: saveFilesToAgentSession')
}

/** Open a native file picker dialog. Plan 4.a D3+ stub. */
export async function openFileDialog(): Promise<{
  files: Array<{ filename: string; mediaType: string; size: number; data: string }>
}> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: openFileDialog')
}

/**
 * Get the real filesystem path for a dropped File (via Tauri preload webUtils).
 * Plan 4.a D3+ stub.
 */
export function getPathForFile(_file: File): string | null {
  return null
}

/** Detect which paths are directories and which are regular files. Plan 4.a D3+ stub. */
export async function checkPathsType(_paths: string[]): Promise<{ directories: string[]; files: string[] }> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: checkPathsType')
}

/** Attach a directory to an agent session. Plan 4.a D3+ stub. */
export async function attachSessionDirectory(_sessionId: string, _dirPath: string): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: attachSessionDirectory')
}

/** Estimate the token context usage for a session from persisted messages. Plan 4.a D3+ stub. */
export async function estimateSessionContext(_sessionId: string): Promise<{
  inputTokens: number
  contextWindow: number
} | null> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_A_D3: estimateSessionContext')
}

/** Type alias for cleanup functions returned by event listeners. */
type CleanupFn = () => void

/**
 * Subscribe to the chat:stream-complete event (fired when an agent turn finishes).
 * Plan 4.a D3+ stub — returns a no-op cleanup.
 */
export function onStreamComplete(_cb: (payload: { conversationId: string }) => void): CleanupFn {
  return () => { /* no-op stub */ }
}

/**
 * Subscribe to the agent:queued-consumed event (backend confirmed a queued message
 * was consumed by the agent loop). Plan 4.a D3+ stub — returns a no-op cleanup.
 */
export function onQueuedConsumed(
  _cb: (payload: { sessionId: string; uuid: string }) => void
): CleanupFn {
  return () => { /* no-op stub */ }
}
