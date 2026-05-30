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
  reviewStatus?: { completed: boolean; reviewCount: number }
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

// ─── Plan 3.5.s.a Wave C — GeneralSettings + PromptSettings IPC stubs ────────
// GeneralSettings calls getSettings/patchSettings (language, theme).
// PromptSettings calls system-prompt CRUD (create/update/delete/setDefault/versions).
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until the Rust backend ships
// the corresponding Tauri commands. Source: uclaw `@/lib/tauri-bridge`.

/** Global app settings payload. Mirrors uclaw lib/types.ts Settings. */
export interface Settings {
  language: string
  theme: string
  configPath: string
  dataPath: string
  monthlyBudgetUsd?: number | null
}

/** Partial patch for global app settings. Mirrors uclaw lib/types.ts PatchSettingsInput. */
export interface PatchSettingsInput {
  language?: string
  theme?: string
  /** Send `null` to clear; omit to leave unchanged. */
  monthlyBudgetUsd?: number | null
}

/**
 * Fetch global app settings (language, theme, paths, etc.).
 * Plan 3.5.s.a Wave C stub.
 */
export async function getSettings(): Promise<Settings> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getSettings')
}

/**
 * Patch (update) global app settings.
 * Plan 3.5.s.a Wave C stub.
 */
export async function patchSettings(_input: PatchSettingsInput): Promise<Settings> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: patchSettings')
}

/**
 * Fetch the full system prompt config (list of prompts + defaultPromptId).
 * Plan 3.5.s.a Wave C stub.
 */
export async function getSystemPromptConfig(): Promise<import('./chat-types').SystemPromptConfig> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getSystemPromptConfig')
}

/**
 * Create a new system prompt.
 * Plan 3.5.s.a Wave C stub.
 */
export async function createSystemPrompt(
  _input: import('./chat-types').SystemPromptCreateInput,
): Promise<import('./chat-types').SystemPrompt> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: createSystemPrompt')
}

/**
 * Update an existing system prompt (name and/or content).
 * Plan 3.5.s.a Wave C stub.
 */
export async function updateSystemPrompt(
  _id: string,
  _input: import('./chat-types').SystemPromptUpdateInput,
): Promise<import('./chat-types').SystemPrompt> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: updateSystemPrompt')
}

/**
 * Delete a system prompt by id.
 * Plan 3.5.s.a Wave C stub.
 */
export async function deleteSystemPrompt(_id: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: deleteSystemPrompt')
}

/**
 * Set the default system prompt.
 * Plan 3.5.s.a Wave C stub.
 */
export async function setDefaultPrompt(_id: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: setDefaultPrompt')
}

/**
 * Fetch version history for a system prompt.
 * Plan 3.5.s.a Wave C stub.
 */
export async function getSystemPromptVersions(
  _promptId: string,
): Promise<import('./chat-types').SystemPromptVersion[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getSystemPromptVersions')
}

// ─── Plan 3.5.s.a Wave D — Connectivity tab: Channel + Usage IPC stubs ────────
// ChannelSettings calls provider CRUD (list/get/configure/remove/test/models).
// UsageSettings calls cost dashboard queries + onTurnCost event.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until the Rust backend ships
// the corresponding Tauri commands. Source: uclaw `@/lib/tauri-bridge`.

import type {
  ProviderInfo,
  ProviderConfigResponse,
  ProviderConfigureInput,
  ModelInfo,
  TestConnectionInput,
  TestResultInfo,
  ListModelsInput,
  DailyCostRollup,
  ModelCostRollup,
  SessionCostRollup,
  WorkspaceCostRollup,
  TurnCost,
} from './agent-types'

// Re-export types so callers can import from the stub module.
export type {
  ProviderInfo,
  ProviderConfigResponse,
  ProviderConfigureInput,
  ModelInfo,
  TestConnectionInput,
  TestResultInfo,
  ListModelsInput,
  DailyCostRollup,
  ModelCostRollup,
  SessionCostRollup,
  WorkspaceCostRollup,
  TurnCost,
}

/**
 * List all known providers (configured or not).
 * Plan 3.5.s.a Wave D stub.
 */
export async function listProviders(): Promise<ProviderInfo[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listProviders')
}

/**
 * List IDs of providers that have been configured with API keys.
 * Plan 3.5.s.a Wave D stub.
 */
export async function listConfiguredProviders(): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listConfiguredProviders')
}

/**
 * Get the stored configuration for a single provider.
 * Plan 3.5.s.a Wave D stub.
 */
export async function getProviderConfig(_providerId: string): Promise<ProviderConfigResponse | null> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getProviderConfig')
}

/**
 * Save/update a provider configuration alongside its selected model IDs.
 * Plan 3.5.s.a Wave D stub.
 */
export async function configureProviderWithModels(_input: ProviderConfigureInput): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: configureProviderWithModels')
}

/**
 * Remove a provider's stored configuration.
 * Plan 3.5.s.a Wave D stub.
 */
export async function removeProviderConfig(_providerId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: removeProviderConfig')
}

/**
 * Test connectivity to a provider endpoint.
 * Plan 3.5.s.a Wave D stub.
 */
export async function testProviderConnection(_input: TestConnectionInput): Promise<TestResultInfo> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: testProviderConnection')
}

/**
 * Fetch the list of models available from a provider.
 * Plan 3.5.s.a Wave D stub.
 */
export async function listProviderModels(_input: ListModelsInput): Promise<ModelInfo[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listProviderModels')
}

/**
 * Get the list of model IDs configured (selected) for a specific provider.
 * Plan 3.5.s.a Wave D stub.
 */
export async function getConfiguredModels(_providerId: string): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getConfiguredModels')
}

/**
 * Subscribe to agent:turn_cost events from the Tauri backend.
 * Each event fires after every LLM turn with cost + token data.
 * Plan 3.5.s.a Wave D stub — returns a no-op unlisten.
 */
export async function onTurnCost(_cb: (payload: TurnCost) => void): Promise<UnlistenFn> {
  return () => {}
}

/**
 * Fetch daily cost rollups for the last N days.
 * Plan 3.5.s.a Wave D stub.
 */
export async function getDailyCosts(_daysBack = 30): Promise<DailyCostRollup[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getDailyCosts')
}

/**
 * Fetch per-model cost rollups for the last N days.
 * Plan 3.5.s.a Wave D stub.
 */
export async function getModelCosts(_daysBack = 30): Promise<ModelCostRollup[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getModelCosts')
}

/**
 * Fetch per-session cost rollups for the last N days (most recent first).
 * Plan 3.5.s.a Wave D stub.
 */
export async function getSessionCosts(_daysBack = 30, _limit = 50): Promise<SessionCostRollup[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getSessionCosts')
}

/**
 * Fetch the total cost in USD for all sessions since a given epoch ms timestamp.
 * Used by the monthly rollup in cost atoms.
 * Plan 3.5.s.a Wave D stub.
 */
export async function getMonthCostTotal(_sinceMs: number): Promise<number> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getMonthCostTotal')
}

/**
 * Fetch per-workspace cost rollups since a given epoch ms timestamp.
 * Plan 3.5.s.a Wave D stub.
 */
export async function listWorkspaceCostRollup(_sinceMs: number): Promise<WorkspaceCostRollup[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listWorkspaceCostRollup')
}

// ─── Plan 3.5.s.a Wave E — Tools tab: ActiveManifestSkill + Permission types ─
// ToolSettings calls listActiveManifestSkills.
// PermissionsSettings calls listPermissionRules, createPermissionRule,
//   deletePermissionRule, listPermissionAudit, removeAutoApprovedTool, unblockTool.
//   getSafetyPolicy is already stubbed above (Wave 2b.2.c.4.b).
// WorkspaceSkillTagsEditor calls getWorkspaceSkillTags, setWorkspaceSkillTags.
// WorkspaceSandboxSettings calls listAlwaysAllowedPaths, addAlwaysAllowedPath,
//   removeAlwaysAllowedPath, listSessionAllowedPaths, promoteSessionPathToGlobal, openFolderDialog.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND.

/** An entry in the active skill manifest injected into the agent system prompt. */
export interface ActiveManifestSkill {
  rank: number
  name: string
  summary: string
  provenance: 'bundled' | 'user' | 'project' | 'learned'
  citedCount: number
}

/** A per-session or per-pattern permission rule. */
export interface PermissionRule {
  id: string
  scope: 'session' | 'pattern'
  sessionId?: string
  toolName: string
  /** For pattern scope: argument prefix to match. */
  target?: string
  mode: 'allow' | 'block' | 'ask'
  createdAt: number
}

/** A single permission audit log entry. */
export interface PermissionAuditEntry {
  id: string
  sessionId: string
  toolName: string
  argsHash: string
  decision: 'auto_approve' | 'user_approve' | 'user_deny' | 'blocked'
  ruleId?: string
  createdAt: number
}

/** Input for creating a new permission rule. */
export interface CreatePermissionRuleInput {
  scope: 'session' | 'pattern'
  sessionId?: string
  toolName: string
  target?: string
  mode: 'allow' | 'block' | 'ask'
}

/**
 * List the active skill manifest rows that will be injected into the agent system prompt.
 * Plan 3.5.s.a Wave E stub.
 */
export async function listActiveManifestSkills(): Promise<ActiveManifestSkill[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listActiveManifestSkills')
}

/**
 * List all permission rules (session + pattern scopes).
 * Plan 3.5.s.a Wave E stub.
 */
export async function listPermissionRules(): Promise<PermissionRule[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listPermissionRules')
}

/**
 * Create a new permission rule.
 * Plan 3.5.s.a Wave E stub.
 */
export async function createPermissionRule(
  _input: CreatePermissionRuleInput,
): Promise<PermissionRule> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: createPermissionRule')
}

/**
 * Delete a permission rule by id.
 * Plan 3.5.s.a Wave E stub.
 */
export async function deletePermissionRule(_id: string): Promise<boolean> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: deletePermissionRule')
}

/**
 * List the most recent N permission audit entries across all sessions.
 * Plan 3.5.s.a Wave E stub.
 */
export async function listPermissionAudit(
  _sessionId: string | undefined,
  _limit: number,
): Promise<PermissionAuditEntry[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listPermissionAudit')
}

/**
 * Remove a tool from the global auto-approved (whitelist) list.
 * Plan 3.5.s.a Wave E stub.
 */
export async function removeAutoApprovedTool(_input: { toolName: string }): Promise<SafetyPolicyResponse> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: removeAutoApprovedTool')
}

/**
 * Remove a tool from the global blocked list.
 * Plan 3.5.s.a Wave E stub.
 */
export async function unblockTool(_input: { toolName: string }): Promise<SafetyPolicyResponse> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: unblockTool')
}

/**
 * Get the skill tags for a specific workspace.
 * Plan 3.5.s.a Wave E stub.
 */
export async function getWorkspaceSkillTags(_workspaceId: string): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getWorkspaceSkillTags')
}

/**
 * Set the skill tags for a specific workspace. Returns normalized tag list.
 * Plan 3.5.s.a Wave E stub.
 */
export async function setWorkspaceSkillTags(
  _workspaceId: string,
  _tags: string[],
): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: setWorkspaceSkillTags')
}

/**
 * List global always-allowed sandbox paths.
 * Plan 3.5.s.a Wave E stub.
 */
export async function listAlwaysAllowedPaths(): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listAlwaysAllowedPaths')
}

/**
 * Add a path to the global always-allowed sandbox list.
 * Plan 3.5.s.a Wave E stub.
 */
export async function addAlwaysAllowedPath(_path: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: addAlwaysAllowedPath')
}

/**
 * Remove a path from the global always-allowed sandbox list.
 * Plan 3.5.s.a Wave E stub.
 */
export async function removeAlwaysAllowedPath(_path: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: removeAlwaysAllowedPath')
}

/**
 * List session-scoped temporarily allowed sandbox paths.
 * Plan 3.5.s.a Wave E stub.
 */
export async function listSessionAllowedPaths(_sessionId: string): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: listSessionAllowedPaths')
}

/**
 * Promote a session-scoped allowed path to the global always-allowed list.
 * Plan 3.5.s.a Wave E stub.
 */
export async function promoteSessionPathToGlobal(
  _sessionId: string,
  _path: string,
): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: promoteSessionPathToGlobal')
}

/**
 * Open a native folder picker dialog. Returns null if user cancels.
 * Plan 3.5.s.a Wave E stub.
 */
export async function openFolderDialog(): Promise<{ path: string; name: string } | null> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: openFolderDialog')
}

// === Plan 3.5.s.b additions ===
// ─── Wave B — IntelligenceTab cluster stubs ──────────────────────────────────
// ModelSettings calls getRoleModels + setRoleModel (setRoleModel already stubbed above).
// IntelligenceTab calls proactiveStatus + proactiveStart + proactiveStop.
// PromptsSettings calls readWorkspaceUclawMd + writeWorkspaceUclawMd +
//   readDefaultPrompts + openWorkspaceUclawMdExternally.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until Rust backend ships.

/** Config for a single model role assignment. Mirrors uclaw lib/tauri-bridge.ts. */
export interface ModelRoleConfig {
  role: string
  model_ref: string | null
}

/**
 * Fetch the per-role model assignments.
 * Plan 3.5.s.b Wave B stub.
 */
export async function getRoleModels(): Promise<ModelRoleConfig[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getRoleModels')
}

/**
 * Query the status of the Gene Evolution Protocol service.
 * Returns a ServiceHealth object with a nested status field.
 * Plan 3.5.s.b Wave B stub.
 */
export async function proactiveStatus(): Promise<unknown> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: proactiveStatus')
}

/**
 * Start the Gene Evolution Protocol (proactive) service.
 * Plan 3.5.s.b Wave B stub.
 */
export async function proactiveStart(): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: proactiveStart')
}

/**
 * Stop the Gene Evolution Protocol (proactive) service.
 * Plan 3.5.s.b Wave B stub.
 */
export async function proactiveStop(): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: proactiveStop')
}

/**
 * Read the workspace-level uclaw.md file.
 * Returns empty string if the file doesn't exist.
 * Plan 3.5.s.b Wave B stub.
 */
export async function readWorkspaceUclawMd(): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: readWorkspaceUclawMd')
}

/**
 * Write content to the workspace-level uclaw.md file.
 * Plan 3.5.s.b Wave B stub.
 */
export async function writeWorkspaceUclawMd(_content: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: writeWorkspaceUclawMd')
}

/** The default prompts payload from the backend. Mirrors uclaw lib/types.ts DefaultPromptsResponse. */
export interface DefaultPromptsResponse {
  baseline: string
  modeAsk: string
  modeAcceptEdits: string
  modePlan: string
  modeBypass: string
}

/**
 * Read the built-in default prompt templates (baseline + per-mode additions).
 * Plan 3.5.s.b Wave B stub.
 */
export async function readDefaultPrompts(): Promise<DefaultPromptsResponse> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: readDefaultPrompts')
}

/**
 * Open the workspace uclaw.md file in the system's default external editor.
 * Plan 3.5.s.b Wave B stub.
 */
export async function openWorkspaceUclawMdExternally(): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: openWorkspaceUclawMdExternally')
}

// ─── Wave B — Persona IPC stubs ───────────────────────────────────────────────
// PersonaStudio calls getPersonaConfig + updatePersonaVoiceProfile.
// PersonaBondTimeline calls getPersonaRelationshipTimeline + createPersonaJournalEntry +
//   deletePersonaJournalEntry + promotePersonaJournalEntry + updatePersonaKeepsakeStatus +
//   updatePersonaRelationshipSettings + updatePersonaBadgeVisibility.
// Types are defined in @/features/chat-agent/lib/persona-types.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND.

import type {
  PersonaConfig,
  PersonaRelationshipTimeline,
  VoiceProfile,
  CreatePersonaJournalEntryInput,
  PromotePersonaJournalEntryInput,
  UpdatePersonaKeepsakeStatusInput,
  UpdatePersonaRelationshipSettingsInput,
  UpdatePersonaBadgeVisibilityInput,
} from './persona-types'

export type {
  PersonaConfig,
  PersonaRelationshipTimeline,
  VoiceProfile,
  CreatePersonaJournalEntryInput,
  PromotePersonaJournalEntryInput,
  UpdatePersonaKeepsakeStatusInput,
  UpdatePersonaRelationshipSettingsInput,
  UpdatePersonaBadgeVisibilityInput,
}

/**
 * Fetch the Persona configuration (presets + current voice profile + rendered prompt).
 * Plan 3.5.s.b Wave B stub.
 */
export async function getPersonaConfig(): Promise<PersonaConfig> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getPersonaConfig')
}

/**
 * Update the Persona voice profile sliders. Returns updated PersonaConfig.
 * Plan 3.5.s.b Wave B stub.
 */
export async function updatePersonaVoiceProfile(_input: VoiceProfile): Promise<PersonaConfig> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: updatePersonaVoiceProfile')
}

/**
 * Fetch the full persona relationship timeline (affinity, bond, keepsakes, badges, journals).
 * Plan 3.5.s.b Wave B stub.
 */
export async function getPersonaRelationshipTimeline(): Promise<PersonaRelationshipTimeline> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getPersonaRelationshipTimeline')
}

/**
 * Update the status of a persona keepsake (accept / hide / discard).
 * Plan 3.5.s.b Wave B stub.
 */
export async function updatePersonaKeepsakeStatus(
  _input: UpdatePersonaKeepsakeStatusInput,
): Promise<PersonaRelationshipTimeline> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: updatePersonaKeepsakeStatus')
}

/**
 * Create a new persona journal entry.
 * Plan 3.5.s.b Wave B stub.
 */
export async function createPersonaJournalEntry(
  _input: CreatePersonaJournalEntryInput,
): Promise<PersonaRelationshipTimeline> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: createPersonaJournalEntry')
}

/**
 * Delete a persona journal entry by id.
 * Plan 3.5.s.b Wave B stub.
 */
export async function deletePersonaJournalEntry(
  _id: string,
): Promise<PersonaRelationshipTimeline> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: deletePersonaJournalEntry')
}

/**
 * Promote a journal entry to a bond profile field.
 * Plan 3.5.s.b Wave B stub.
 */
export async function promotePersonaJournalEntry(
  _input: PromotePersonaJournalEntryInput,
): Promise<PersonaRelationshipTimeline> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: promotePersonaJournalEntry')
}

/**
 * Update persona relationship settings (e.g. gamificationEnabled).
 * Plan 3.5.s.b Wave B stub.
 */
export async function updatePersonaRelationshipSettings(
  _input: UpdatePersonaRelationshipSettingsInput,
): Promise<PersonaRelationshipTimeline> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: updatePersonaRelationshipSettings')
}

/**
 * Update the visibility of a persona badge (hide/show).
 * Plan 3.5.s.b Wave B stub.
 */
export async function updatePersonaBadgeVisibility(
  _input: UpdatePersonaBadgeVisibilityInput,
): Promise<PersonaRelationshipTimeline> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: updatePersonaBadgeVisibility')
}

// ─── Wave C — MemoryRecallSettings IPC stubs ──────────────────────────────────
// MemoryRecallSettings calls getMemoryRecallConfig + patchMemoryRecallConfig.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until the Rust backend ships.
// Source: uclaw `@/lib/tauri-bridge` lines 374-397.

/** The memory recall config DTO. Mirrors uclaw lib/tauri-bridge.ts MemoryRecallConfigDto. */
export interface MemoryRecallConfigDto {
  bootLimit?: number
  triggerLimit?: number
  seedLimit?: number
  expansionLimit?: number
  recentLimit?: number
  fusionStrategy?: 'rrf' | 'weighted'
  rrfK?: number
  ftsWeight?: number
  vectorWeight?: number
  bootLearnedSkillsLimit?: number
  tokenBudget?: number
  layerExpandedSeedTake?: number
  layerExpandedMaxDepth?: number
  timeDecayHalfLifeDays?: number
  ftsFallbackLimitMultiplier?: number
  bootUserProfileLimit?: number
}

/**
 * Fetch the current memory recall config from the backend.
 * Plan 3.5.s.b Wave C stub.
 */
export async function getMemoryRecallConfig(): Promise<MemoryRecallConfigDto> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: getMemoryRecallConfig')
}

/**
 * Patch (update) the memory recall config. Returns the persisted config.
 * Plan 3.5.s.b Wave C stub.
 */
export async function patchMemoryRecallConfig(
  _input: MemoryRecallConfigDto,
): Promise<MemoryRecallConfigDto> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: patchMemoryRecallConfig')
}

// ─── Wave D — LearnedProfileTab IPC stubs ─────────────────────────────────────
// LearnedProfileTab calls memoryLearningListFacets + memoryLearningDismissFacet +
//   memoryLearningRebuildNow + memoryLearningPromoteFacet + memoryLearningDemoteFacet.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until the Rust backend ships.
// Source: uclaw `@/lib/tauri-bridge` lines 1081–1110.

import type {
  LearningListFacetsInput,
  LearningRebuildNowInput,
  LearningDismissFacetInput,
  LearningDismissOutcome,
  LearningPromoteFacetInput,
  LearningDemoteFacetInput,
  LearningSetStateOutcome,
  FacetDto,
} from './learned-profile-types'

export type {
  LearningListFacetsInput,
  LearningRebuildNowInput,
  LearningDismissFacetInput,
  LearningDismissOutcome,
  LearningPromoteFacetInput,
  LearningDemoteFacetInput,
  LearningSetStateOutcome,
  FacetDto,
}

/**
 * List facets from the learning pipeline. Both class and state filters are optional.
 * Plan 3.5.s.b Wave D stub.
 */
export async function memoryLearningListFacets(
  _input: LearningListFacetsInput,
): Promise<FacetDto[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: memoryLearningListFacets')
}

/**
 * Dismiss a facet (flip state to "forgotten"). Does not delete.
 * Plan 3.5.s.b Wave D stub.
 */
export async function memoryLearningDismissFacet(
  _input: LearningDismissFacetInput,
): Promise<LearningDismissOutcome> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: memoryLearningDismissFacet')
}

/**
 * Manually trigger a stability rebuild of the facet cache.
 * Plan 3.5.s.b Wave D stub.
 */
export async function memoryLearningRebuildNow(
  _input: LearningRebuildNowInput,
): Promise<Record<string, unknown>> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: memoryLearningRebuildNow')
}

/**
 * Promote a facet to "active" state (soft override).
 * Plan 3.5.s.b Wave D stub.
 */
export async function memoryLearningPromoteFacet(
  _input: LearningPromoteFacetInput,
): Promise<LearningSetStateOutcome> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: memoryLearningPromoteFacet')
}

/**
 * Demote a facet from "active" to "provisional" state.
 * Plan 3.5.s.b Wave D stub.
 */
export async function memoryLearningDemoteFacet(
  _input: LearningDemoteFacetInput,
): Promise<LearningSetStateOutcome> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: memoryLearningDemoteFacet')
}

// ─── Wave E — ShortcutSettings IPC stub ──────────────────────────────────────
// ShortcutSettings calls updateGlobalShortcut to sync global OS-registered
// shortcuts to the backend whenever the user overrides a binding that appears
// in GLOBAL_SHORTCUT_IDS. Throws NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until
// the Rust global-shortcut registration backend ships.
// Source: uclaw `@/lib/tauri-bridge` lines 2535–2537.

/**
 * Notify the backend of a new key combo for a globally-registered shortcut.
 * Called when the user overrides (or resets) a shortcut in GLOBAL_SHORTCUT_IDS.
 * Pass an empty string to unregister the shortcut.
 * Plan 3.5.s.b Wave E stub.
 */
export async function updateGlobalShortcut(_shortcutId: string, _newCombo: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: updateGlobalShortcut')
}

// === Plan 3.5.s.c additions ===

// ─── Wave A — STT IPC stubs ────────────────────────────────────────────────────
// SttSettings calls stt_model_status + stt_download_model.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until the Rust backend ships.
// Source: uclaw `@/lib/tauri-bridge` (these are raw invoke() calls in SttSettings, not wrapped).

/** Mirrors uclaw `stt-atoms.ts` ModelStatus shape. */
export type SttModelStatusKind = 'unknown' | 'not-downloaded' | 'downloading' | 'ready' | 'error'

export interface SttModelStatusReport {
  kind: SttModelStatusKind
  progress?: number
  bytesDownloaded?: number
  bytesTotal?: number
  message?: string
  dir?: string
}

/** Plan 3.5.s.c Wave A stub — replaced by Rust `stt_model_status` command. */
export async function sttModelStatus(): Promise<SttModelStatusReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: stt_model_status')
}

/** Plan 3.5.s.c Wave A stub — replaced by Rust `stt_download_model` command. */
export async function sttDownloadModel(_args: { targetDir?: string | null }): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: stt_download_model')
}

// ─── Wave A — IM Channel IPC stubs ────────────────────────────────────────────
// ImChannelsSettings + ImChannelAccordionRow + ImChannelForm + WechatIlinkBindingPanel
// call these. All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND. The `im_channel_status_changed`
// event is consumed via Tauri `listen()` — no stub needed; the listen call gracefully
// no-ops in test/non-Tauri envs.

// Re-export canonical types from im-channel-atoms (avoids duplicate declarations
// with divergent shapes — the atoms file is the source of truth, ported verbatim
// from uclaw atoms/im-channel-atoms.ts).
import type {
  ImChannelRow as ImChannelRowAtom,
  ImChannelInput as ImChannelInputAtom,
  ImChannelStatus as ImChannelStatusAtom,
} from '../atoms/im-channel-atoms'
export type ImChannelRow = ImChannelRowAtom
export type ImChannelInput = ImChannelInputAtom
export type ImChannelStatus = ImChannelStatusAtom

/** Plan 3.5.s.c Wave A stub. */
export async function listImChannels(): Promise<ImChannelRow[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: list_im_channels')
}

/** Plan 3.5.s.c Wave A stub. */
export async function getImChannelStatuses(): Promise<ImChannelStatus[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_im_channel_statuses')
}

/** Plan 3.5.s.c Wave A stub. */
export async function toggleImChannel(_args: { id: string; enabled: boolean }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: toggle_im_channel')
}

/** Plan 3.5.s.c Wave A stub. */
export async function deleteImChannel(_args: { id: string }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: delete_im_channel')
}

/** Plan 3.5.s.c Wave A stub. */
export async function createImChannel(_args: { input: ImChannelInput }): Promise<ImChannelRow> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: create_im_channel')
}

/** Plan 3.5.s.c Wave A stub. */
export async function updateImChannel(_args: { id: string; input: ImChannelInput }): Promise<ImChannelRow> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: update_im_channel')
}

/** Plan 3.5.s.c Wave A stub. (listSpaces already exported above in Plan 3.5-slim section.) */
// NOTE: listSpaces is already defined in the Plan 3.5-slim section above; no duplicate added here.

/** Plan 3.5.s.c Wave A stub. */
export async function saveWechatIlinkToken(
  _args: { instanceId: string; botToken: string; accountId: string },
): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: save_wechat_ilink_token')
}

/** Plan 3.5.s.c Wave A stub. */
export async function disconnectWechatIlink(_args: { instanceId: string }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: disconnect_wechat_ilink')
}

// ─── Wave A — BrowserRuntime IPC stubs ────────────────────────────────────────
// BrowserRuntimeSettings + sub-components call ~9 wrappers. The exact `args`/return
// shapes must match uclaw `ui/src/lib/tauri-bridge.ts` lines 185–356 verbatim.
// Re-export the type aliases below for downstream consumers.

import type {
  BrowserRuntimeControlCenterReport,
  BrowserRuntimeProviderId,
  BrowserRuntimeProviderProbeSummary,
  StartupRuntimePackStatusReport,
} from './startup-doctor'

// Re-export so consumers can import them from this same module like uclaw does.
export type { BrowserRuntimeControlCenterReport, BrowserRuntimeProviderId } from './startup-doctor'

// These types live in uclaw `tauri-bridge.ts` next to the wrapper signatures.
// Port verbatim by reading uclaw `tauri-bridge.ts:215–360`. Schema below captures
// the named exports we depend on (the implementer copies the exact interface bodies).

export type PlaywrightSetupAction =
  | 'auto_setup'
  | 'install_node_with_homebrew'
  | 'refresh_skills'
  | 'probe_mcp'

export interface PlaywrightSetupStepExecutionReport {
  stepId: string
  command: string
  args: string[]
  status: 'succeeded' | 'failed' | 'timed_out' | 'spawn_failed'
  exitCode?: number | null
  stdout: string
  stderr: string
  error?: string | null
}

export interface PlaywrightSetupExecutionReport {
  action: PlaywrightSetupAction
  status: 'succeeded' | 'failed' | 'blocked'
  blockedReason?: string | null
  stepReports: PlaywrightSetupStepExecutionReport[]
}

// BrowserIdentity* — verbatim from uclaw `tauri-bridge.ts:253–340`.
export type BrowserIdentityKind = 'real_browser_profile' | 'storage_state' | 'cookie_jar' | 'bearer_token'
export type BrowserIdentityProvider = 'system_chrome' | 'playwright' | 'browser_use' | 'manual_import'
export type BrowserIdentityScope = 'workspace' | 'session' | 'global'
export type BrowserIdentityStatus = 'live' | 'stale' | 'unknown' | 'revoked'

export interface BrowserIdentityProfileSummary {
  id: string
  label: string
  originPattern: string
  kind: BrowserIdentityKind
  provider: BrowserIdentityProvider
  scope: BrowserIdentityScope
  createdAtMs: number
  lastUsedAtMs: number | null
  lastVerifiedAtMs: number | null
  expiresAtMs: number | null
  revokedAtMs: number | null
  status: BrowserIdentityStatus
  revoked: boolean
}

export interface BrowserIdentityActiveTaskSummary {
  profileId: string
  runId: string
  sessionId: string
  task: string
  status:
    | 'running'
    | 'completed'
    | 'failed'
    | 'stopped'
    | 'needs_user_intervention'
    | 'paused_waiting_for_browser_runtime'
    | 'paused_checkpointed'
  startedAtMs: number
  updatedAtMs: number
  drainDeadlineMs: number | null
}

export interface BrowserIdentityStatusReport {
  profiles: BrowserIdentityProfileSummary[]
  authorizedCount: number
  revokedCount: number
  activeTaskCount: number
  activeTasks: BrowserIdentityActiveTaskSummary[]
}

export interface BrowserIdentityRevocationReport {
  profile: BrowserIdentityProfileSummary | null
  revoked: boolean
  activeTaskCount: number
  activeTasks: BrowserIdentityActiveTaskSummary[]
  drainDeadlineMs: number | null
}

/** Plan 3.5.s.c Wave A stub. Signature: `() => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:188). */
export async function getBrowserRuntimeControlCenter(): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_browser_runtime_control_center')
}

/** Plan 3.5.s.c Wave A stub. Signature: `() => Promise<StartupRuntimePackStatusReport>` (uclaw tauri-bridge.ts:185). */
export async function getBrowserRuntimeStatus(): Promise<StartupRuntimePackStatusReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_browser_runtime_status')
}

/** Plan 3.5.s.c Wave A stub. Signature: `() => Promise<BrowserIdentityStatusReport>` (uclaw tauri-bridge.ts:343). */
export async function listBrowserIdentities(): Promise<BrowserIdentityStatusReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: list_browser_identities')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(profileId: string) => Promise<BrowserIdentityRevocationReport>` (uclaw tauri-bridge.ts:356). */
export async function revokeBrowserIdentity(_profileId: string): Promise<BrowserIdentityRevocationReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: revoke_browser_identity')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(providerId: BrowserRuntimeProviderId) => Promise<BrowserRuntimeProviderProbeSummary>` (uclaw tauri-bridge.ts:207). */
export async function runBrowserRuntimeProviderProbe(
  _providerId: BrowserRuntimeProviderId,
): Promise<BrowserRuntimeProviderProbeSummary> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: run_browser_runtime_provider_probe')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(action: PlaywrightSetupAction) => Promise<PlaywrightSetupExecutionReport>` (uclaw tauri-bridge.ts:236). */
export async function runPlaywrightSetup(_action: PlaywrightSetupAction): Promise<PlaywrightSetupExecutionReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: run_playwright_setup')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(exposed: boolean) => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:202). */
export async function setBrowserRuntimeMcpRawToolsExposed(_exposed: boolean): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: set_browser_runtime_mcp_raw_tools_exposed')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(providerId, enabled) => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:191). */
export async function setBrowserRuntimeProviderEnabled(
  _providerId: BrowserRuntimeProviderId,
  _enabled: boolean,
): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: set_browser_runtime_provider_enabled')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(providerIds: BrowserRuntimeProviderId[]) => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:197). */
export async function setBrowserRuntimeProviderPriority(
  _providerIds: BrowserRuntimeProviderId[],
): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: set_browser_runtime_provider_priority')
}
