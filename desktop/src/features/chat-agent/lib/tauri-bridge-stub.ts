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
import type { ConversationMeta, UserProfile, FeishuNotifyMode } from './chat-types'

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

// ─── Plan 3.3 C2: git stubs for SidebarGitActions + BranchPicker ──────────

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

/**
 * List all branches in the repository (raw output).
 * Plan 3.3 C2 extension for BranchPicker port.
 */
export async function gitBranches(_cwd: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: gitBranches')
}

/**
 * Get the git status output for uncommitted change detection.
 * Plan 3.3 C2 extension for BranchPicker port.
 */
export async function gitStatus(_cwd: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: gitStatus')
}

/**
 * Checkout a branch by name.
 * Plan 3.3 C2 extension for BranchPicker port.
 */
export async function gitCheckoutBranch(_cwd: string, _branch: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: gitCheckoutBranch')
}

/**
 * Create and checkout a new branch.
 * Plan 3.3 C2 extension for BranchPicker port.
 */
export async function gitCreateBranch(_cwd: string, _branch: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: gitCreateBranch')
}

/**
 * Initialize a git repository.
 * Plan 3.3 C2 extension for BranchPicker port.
 */
export async function gitInitRepo(_cwd: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: gitInitRepo')
}

/**
 * Parse raw git branch list output into structured data.
 * Pure utility function for BranchPicker.
 */
export interface BranchListItem {
  name: string
  isCurrent: boolean
}

export function parseBranchList(_raw: string): BranchListItem[] {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_3: parseBranchList')
}

/**
 * Extract uncommitted file count from git status output.
 * Pure utility function for BranchPicker.
 */
export function uncommittedFromStatus(_statusRaw: string | null): number {
  return 0 // Default to no uncommitted files in stub
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

// ─── Plan 2b.2.c.4.b: banner IPC stubs ────────────────────────────────────
// All throw NOT_IMPLEMENTED until the Rust agent-session backend ships the
// corresponding Tauri commands. Real implementations arrive in Plan 4.x
// (backend) once permission/safety/ask-user flow is wired.

/** Respond to an exit-plan-mode request from the agent. Plan 4.x stub. */
export async function respondExitPlanMode(_input: {
  requestId: string
  decision: 'accept_and_auto' | 'accept_keep_plan' | 'reject'
  feedback?: string
  allowedPrompts?: string[]
  sessionId: string
}): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondExitPlanMode')
}

/** Respond to an ask-user request with answers. Plan 4.x stub. */
export async function respondAskUser(_input: { requestId: string; answers: Record<string, string> }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondAskUser')
}

/** Respond to a permission request. Plan 4.x stub. */
export async function respondPermission(_input: any): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondPermission')
}

/** Respond to a plan-mode-suggest event. Plan 4.x stub. */
export async function respondPlanModeSuggest(
  _eventId: string,
  _outcome: 'accepted' | 'skipped' | 'silenced' | 'aborted',
  _declineReason?: string,
): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondPlanModeSuggest')
}

/** Get the current global safety policy. Plan 4.x stub. */
export async function getSafetyPolicy(): Promise<SafetyPolicyResponse> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: getSafetyPolicy')
}

/** Set the global safety mode. Plan 4.x stub. */
export async function setSafetyMode(_input: SetSafetyModeInput): Promise<SafetyPolicyResponse> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: setSafetyMode')
}

/** Safety policy response from the backend. */
export interface SafetyPolicyResponse {
  globalMode: SafetyModeWire
  toolOverrides: Record<string, SafetyModeWire>
  autoApprovedTools: string[]
  blockedTools: string[]
}

/** Input to set the global safety mode. */
export interface SetSafetyModeInput {
  mode: SafetyModeWire
}

// ─── Plan 2b.2.c.4.d A3: Browser screencast stubs ────────────────────────
// useBrowserScreencast hook (Wave B2) consumes these IPC wrappers.
// Real implementations land in Plan 4+ (browser backend).

export interface ScreencastFramePayload {
  sessionId: string
  tabId: string
  dataB64: string
  pageWidth: number
  pageHeight: number
}

/** Subscribe to live screencast frames from the browser backend. Plan 4+ stub. */
export function listenScreencastFrames(
  _handler: (payload: ScreencastFramePayload) => void
): Promise<() => void> {
  return Promise.resolve(() => { /* no-op stub */ })
}

/** Start a screencast for a specific session + tab. Plan 4+ stub. */
export async function browserStartScreencast(_sessionId: string, _tabId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_PLUS: browserStartScreencast')
}

/** Stop the screencast for a specific session + tab. Plan 4+ stub. */
export async function browserStopScreencast(_sessionId: string, _tabId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_PLUS: browserStopScreencast')
}

/** Capture a single screenshot from a specific session + tab. Plan 4+ stub. */
export async function browserCaptureScreenshot(_sessionId: string, _tabId: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_PLUS: browserCaptureScreenshot')
}

// ─── Plan 2b.2.c.4.c — STT Rust IPC surface (documentation only) ──────────
// The STT components (SpeechButton, SttModal, FirstRunDialog) call the
// following Tauri commands and listen for these events DIRECTLY via
// @tauri-apps/api/{core,event}, NOT through our typed bridge wrappers.
// Until the Rust STT backend ships, invoke() rejects with "command not
// found" and listen() never fires. This is the expected stub behavior:
// click SpeechButton → SttModal mounts → invoke('stt_start_listen')
// rejects → SttModal shows error toast → modal closes.
//
// Tauri commands required (Rust backend checklist):
//   - stt_download_model({ request: { preset: 'quantized', force: false } }): Promise<string>
//     Downloads the SenseVoice quantized model, returns the model directory path.
//
//   - stt_transcribe({ request: { audio_bytes_base64: string, language: string | null, sample_rate: 16000 } }): Promise<{ text: string }>
//     Transcribes PCM audio (base64-encoded) at 16kHz to text. language can be null for auto-detection.
//
// Tauri events emitted (Rust backend checklist):
//   - stt:openflow-download-progress
//     Payload: { file: string, downloaded: number, total: number | null, percent: number, source?: 'hf' | 'mirror' }
//     Fired during model download to report per-file progress and mirror fallback events.
//
// No typed wrappers exported here — components use raw invoke()/listen().

// ─── Plan 3.5-slim — SearchPalette type stubs ────────────────────────────────
// Wire types for SearchPalette command-menu stubs. Fragment searching and space
// browsing are deferred to the Rust backend; type aliases ensure SearchPalette
// can import and pass results through components without compilation errors.

/** A workspace / space summary shown in SearchPalette browse mode. */
export interface SpaceSummary {
  id: string
  name: string
  icon: string
  conversationCount?: number
  lastUpdated?: string
  createdAt: string
  updatedAt: string
}

/** A fragment search result row returned by searchFragments(). */
export interface FragmentSearchHit {
  id: string
  title: string | null
  snippet: string
  tags: string[]
  subtype?: string
  source: string
  createdAt: number
}

/** A fragment metadata object for detailed views. */
export interface FragmentItem {
  id: string
  title: string | null
  content: string
  source: string
  tags: string[]
  subtype?: string
  createdAt: number
  reviewStatus?: string
}

// ─── Plan 2b.2.c.4.d/4.e — ProviderModelSelector + BrowserPreviewOverlay + FeishuNotifyToggle IPC stubs ───
// All throw NOT_IMPLEMENTED until the Rust model-provider + browser + feishu backends ship.

/** Get all configured provider/model pairs. ProviderModelSelector consumes. Plan 4.d/4.e stub. */
export async function getAllConfiguredModels(): Promise<[string, string[]][]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: getAllConfiguredModels')
}

/** Set the active model for a given provider. ProviderModelSelector consumes. Plan 4.d/4.e stub. */
export async function setActiveModel(_providerId: string, _modelId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: setActiveModel')
}

/** Set the model for a given role. ProviderModelSelector consumes. Plan 4.d/4.e stub. */
export async function setRoleModel(_role: string, _modelRef: string | null): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: setRoleModel')
}

/** Open a URL externally. BrowserPreviewOverlay consumes. Plan 4.d/4.e stub. */
export async function openExternal(_url: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: openExternal')
}

/** Set Feishu session notification mode. FeishuNotifyToggle consumes. Plan 4.d/4.e stub. */
export async function setFeishuSessionNotify(_sessionId: string, _mode: FeishuNotifyMode): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: setFeishuSessionNotify')
}

// ─── Plan 3.5-slim — SearchPalette IPC stubs ──────────────────────────────────
// All throw NOT_IMPLEMENTED until the Rust search backends ship. The
// SearchPalette degrades to empty state when invoke() rejects.

/** List recent conversations and agent sessions for the browse-mode palette. Plan 3.5-slim stub. */
export async function listRecentThreads(): Promise<Array<import('./agent-types').RecentThread>> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_BACKEND: listRecentThreads')
}

/** List all workspaces / spaces for the browse-mode palette. Plan 3.5-slim stub. */
export async function listSpaces(): Promise<SpaceSummary[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_BACKEND: listSpaces')
}

/** Search fragment database by query string. Plan 3.5-slim stub. */
export async function searchFragments(_query: string): Promise<FragmentSearchHit[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_BACKEND: searchFragments')
}
