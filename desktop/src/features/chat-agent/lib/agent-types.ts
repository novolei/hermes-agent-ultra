/**
 * Agent-specific types — used by components/agent/*.
 * Split from the legacy proma-types.ts as part of P1 cleanup (Roadmap A4).
 */

// re-export shared chat types so agent consumers don't need 2 imports
import type { ChatToolActivity, FileAttachment, ContentBlock } from './chat-types'
export type { ChatToolActivity, FileAttachment, ContentBlock }

// ─────────────────────────────────────────────────────────
// Agent Types
// ─────────────────────────────────────────────────────────

/** Agent 会话元数据 */
export interface AgentSessionMeta {
  id: string
  title: string
  /** 会话标题 emoji（自动生成） */
  titleEmoji?: string
  /** 标题生成中（占位动画） */
  titlePending?: boolean
  workspaceId?: string
  channelId?: string
  modelId?: string
  sdkSessionId?: string
  /** 是否置顶 (legacy, chat-only) */
  pinned?: boolean
  /** 是否已归档 */
  archived?: boolean
  /** Pin timestamp (ms). Null means unpinned. Canonical agent-UI pin state
   *  — distinct from the legacy `pinned?: boolean` which is chat-only. */
  pinnedAt?: number | null
  /** 手动标记为工作中 */
  manualWorking?: boolean
  /** 附加的额外目录 */
  attachedDirectories?: string[]
  /** Raw metadata JSON blob from agent_sessions.metadata_json. Contains
   *  `origin`, `spec_id`, `prev_run_session_id` for automation-run sessions
   *  (origin starts with "automation:"). Present whenever sessions are loaded
   *  from list_agent_sessions; may be absent on optimistically-created sessions. */
  metadataJson?: string
  /** IM channel that originated this session (e.g. "wechat_ilink", "wecom_bot").
   *  Present iff a matching row exists in im_sessions. When set, the sidebar
   *  item and tab render a channel-specific icon instead of `titleEmoji`. */
  imChannelType?: string
  /** Chat ID on the IM side (e.g. WeChat user UIN). Companion to imChannelType. */
  imChatId?: string
  messageCount: number
  createdAt: number
  updatedAt: number
}

/** Agent 消息 */
export interface AgentMessage {
  id: string
  sessionId?: string
  role: 'user' | 'assistant' | 'system' | 'status'
  content: string
  model?: string
  createdAt: number
  durationMs?: number
  usage?: AgentEventUsage
  errorCode?: string
  events?: AgentEvent[]
  attachedDirectories?: string[]
  /** Concatenated thinking-block text — assistant only, hydrated from DB. */
  reasoning?: string
  /** Persisted tool activity records (ChatToolActivity[]), hydrated from DB. */
  toolActivities?: ChatToolActivity[]
  /** Same as ChatMessage.contentBlocks — see chat-types.ts. */
  contentBlocks?: ContentBlock[]
  /** Whether this message has been logically compacted (P1 logical-marking).
   *  Compacted messages stay in the DB but are marked for visual distinction
   *  and exclusion from LLM context. Default: false. */
  compacted?: boolean
}


/** Agent 事件类型（流式） */
export interface AgentEvent {
  type: string
  sessionId?: string
  text?: string
  toolUseId?: string
  toolName?: string
  input?: any
  result?: string
  isError?: boolean
  intent?: string
  displayName?: string
  parentToolUseId?: string
  taskId?: string
  taskType?: string
  description?: string
  status?: any
  summary?: string
  outputFile?: string
  usage?: any
  lastToolName?: string
  elapsedSeconds?: number
  shellId?: string
  imageAttachments?: Array<{ localPath: string; filename: string; mediaType: string }>
  attempt?: number
  maxAttempts?: number
  attemptData?: RetryAttempt
  finalAttempt?: RetryAttempt
  // Plan 2b.2.b.1 (Task 29) — Closing Plan 2b.2.a follow-up: surfaces
  // these fields at the type level so the bridge adapter can drop its
  // Record<string, unknown> casts without losing payload.
  reason?: string
  message?: string
}

/** Agent 工作区 */
export interface AgentWorkspace {
  id: string
  name: string
  icon: string
  path: string | null
  attachedDirs?: string[]
  sortOrder?: number
  createdAt: number
  updatedAt: number
}

/** Agent 待发送文件 */
export interface AgentPendingFile {
  id: string
  filename: string
  mediaType: string
  size: number
  content?: string
  previewUrl?: string
  sourcePath?: string
}

/** 重试尝试记录 */
export interface RetryAttempt {
  attempt: number
  reason: string
  errorMessage: string
  timestamp: number
  delaySeconds: number
  environment?: {
    runtime: string
    platform: string
    model: string
    workspace?: string
  }
  stderr?: string
  stack?: string
}

/** 任务用量统计 */
export interface TaskUsage {
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  costUsd?: number
}

/** Agent 事件用量 */
export interface AgentEventUsage {
  inputTokens: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  costUsd?: number
}

/** 工具活动（流式 agent 运行期状态） */
export interface ToolActivity {
  toolUseId: string
  toolName: string
  input: Record<string, unknown>
  intent?: string
  displayName?: string
  result?: string
  isError?: boolean
  done: boolean
  parentToolUseId?: string
  elapsedSeconds?: number
  taskId?: string
  shellId?: string
  isBackground?: boolean
  /** MCP 工具返回的图片附件 */
  imageAttachments?: Array<{ localPath: string; filename: string; mediaType: string }>
  /** 流式工具的实时输出窗口(有界 256KB);done 后由持久化 result 接管 */
  liveOutput?: { segments: { stream: 'stdout' | 'stderr'; text: string }[]; bytes: number; droppedHead: boolean }
}

/** 模型选择选项（简版，Agent 模块使用） */
export interface SelectedModelOption {
  channelId: string
  modelId: string
}

/** 危险等级 */
export type DangerLevel = 'safe' | 'normal' | 'dangerous'

/** 恢复操作 */
export interface RecoveryAction {
  action: string
  label: string
  description?: string
  payload?: string
}

// ─────────────────────────────────────────────────────────
// Permission Types
// ─────────────────────────────────────────────────────────

/** 权限模式 */
export type PromaPermissionMode = 'auto' | 'ask' | 'deny' | 'bypassPermissions' | 'plan'

/** 权限模式循环顺序 */
export const PROMA_PERMISSION_MODE_ORDER: PromaPermissionMode[] = ['auto', 'bypassPermissions', 'plan']

/** 权限请求 */
export interface PermissionRequest {
  requestId: string
  sessionId: string
  toolName: string
  toolInput: Record<string, unknown>
  input?: Record<string, unknown>
  riskLevel?: string
  dangerLevel: DangerLevel
  description?: string
  command?: string
  sdkDisplayName?: string
  sdkTitle?: string
  sdkDescription?: string
}

/** 权限响应 */
export interface PermissionResponse {
  requestId: string
  sessionId: string
  allowed: boolean
  rememberForSession?: boolean
  rememberForWorkspace?: boolean
}

/** AskUser 请求 */
export interface AskUserRequest {
  requestId: string
  sessionId: string
  questions: AskUserQuestion[]
}

/** AskUser 问题 */
export interface AskUserQuestion {
  question: string
  header?: string
  multiSelect: boolean
  options: Array<{ label: string; description?: string; preview?: string }>
}

/** AskUser 响应 */
export interface AskUserResponse {
  requestId: string
  answers: Record<string, string>
}

/** ExitPlanMode 请求 — backend wire format (see ExitPlanRequestPayload) */
export interface ExitPlanModeRequest {
  requestId: string
  sessionId: string
  plan: string
  allowedPrompts?: string[]
}

/** 思考模式配置 */
export interface ThinkingConfig {
  type: 'enabled' | 'disabled' | 'adaptive'
  budgetTokens?: number
}

/** Agent 推理深度 */
export type AgentEffort = 'low' | 'medium' | 'high'

/** Agent 发送输入 */
export interface AgentSendInput {
  sessionId: string
  userMessage: string
  channelId: string
  modelId?: string
  workspaceId?: string
  startedAt?: number
  permissionMode?: PromaPermissionMode
  thinking?: ThinkingConfig
  effort?: AgentEffort
  maxBudgetUsd?: number
  maxTurns?: number
  additionalDirectories?: string[]
  files?: AgentPendingFile[]
  mentionedSkills?: string[]
  mentionedMcpServers?: string[]
  /** Strategy preset forwarded to the backend manifest re-ranker. */
  strategy?: 'balanced' | 'repair' | 'optimize' | 'innovate'
}

/** Agent 队列消息输入 */
export interface AgentQueueMessageInput {
  sessionId: string
  userMessage: string
  uuid?: string
  interrupt?: boolean
}

/** Agent 流式事件 */
export interface AgentStreamEvent {
  sessionId: string
  event: AgentEvent
}

/** Agent 流式完成载荷 */
export interface AgentStreamCompletePayload {
  sessionId: string
}

/** Agent 生成标题输入 */
export interface AgentGenerateTitleInput {
  sessionId: string
}

// ─────────────────────────────────────────────────────────
// Pending Requests Snapshot
// ─────────────────────────────────────────────────────────

export interface PendingRequestsSnapshot {
  permissions: Array<{ sessionId: string; requests: PermissionRequest[] }>
  askUser: Array<{ sessionId: string; requests: AskUserRequest[] }>
  exitPlan: Array<{ sessionId: string; requests: ExitPlanModeRequest[] }>
}

// ─────────────────────────────────────────────────────────
// Workspace Capabilities
// ─────────────────────────────────────────────────────────

export interface WorkspaceCapabilities {
  mcpServers: Array<{ name: string; enabled: boolean }>
  skills: Array<{ name: string }>
}

// ─────────────────────────────────────────────────────────
// Search Result Types (Agent)
// ─────────────────────────────────────────────────────────

export interface AgentMessageSearchResult {
  sessionId: string
  sessionTitle: string
  snippet: string
  matchStart: number
  matchLength: number
  archived?: boolean
}

// ─────────────────────────────────────────────────────────
// Recent Thread (SearchPalette browse mode)
// ─────────────────────────────────────────────────────────

/** Cross-domain recent thread shown in the search palette's browse mode. */
export interface RecentThread {
  id: string
  kind: 'chat' | 'agent'
  title: string
  titleEmoji?: string
  titlePending?: boolean
  workspaceName: string
  workspaceId: string
  messageCount: number
  updatedAt: string
}

// ─────────────────────────────────────────────────────────
// Utility Functions (stub)
// ─────────────────────────────────────────────────────────

/** Diff workspace capabilities (stub) */
export function diffCapabilities(_prev: WorkspaceCapabilities, _next: WorkspaceCapabilities): unknown[] {
  return []
}

/** Migrate old permission mode values (stub) */
export function migratePermissionMode(mode: string): string {
  if (mode === 'acceptEdits' || mode === 'smart' || mode === 'supervised') {
    return 'auto'
  }
  return mode
}

// ─────────────────────────────────────────────────────────
// Model Selection Types (Plan 4.d/4.e)
// ─────────────────────────────────────────────────────────

/** Provider + active model selection (returned by getActiveModel) */
export interface ModelSelectionInfo {
  providerId: string
  modelId: string
}

// ─────────────────────────────────────────────────────────
// Wave D: Provider / Channel Types (Plan 3.5.s.a)
// ─────────────────────────────────────────────────────────

/** Provider info returned by listProviders. Mirrors uclaw lib/types.ts ProviderInfo. */
export interface ProviderInfo {
  id: string
  displayName: string
  authType: string
  defaultBaseUrl: string
  defaultApi: string
  serviceCategory: string
  geoCategory: string
  supportsModels: boolean
}

/** Per-provider configuration response. Mirrors uclaw lib/types.ts ProviderConfigResponse. */
export interface ProviderConfigResponse {
  providerId: string
  displayName: string
  hasApiKey: boolean
  maskedKey?: string | null
  baseUrl?: string | null
  api?: string | null
}

/** Input for configuring a provider with model IDs. Mirrors uclaw ProviderConfigureInput. */
export interface ProviderConfigureInput {
  providerId: string
  displayName: string
  apiKey?: string | null
  baseUrl?: string | null
  api?: string | null
  modelIds: string[]
}

/** Model info returned by listProviderModels. Mirrors uclaw lib/types.ts ModelInfo. */
export interface ModelInfo {
  id: string
  name: string
  contextWindow?: number | null
  maxTokens?: number | null
  modality: string
  reasoning: boolean
  supportsReasoningEffort: boolean
}

/** Input for testing a provider connection. */
export interface TestConnectionInput {
  providerId: string
  baseUrl: string
  apiKey?: string | null
}

/** Result of a provider connection test. */
export interface TestResultInfo {
  success: boolean
  message: string
  latencyMs?: number | null
  details?: string | null
}

/** Input for listing available models from a provider. */
export interface ListModelsInput {
  providerId: string
  baseUrl: string
  apiKey?: string | null
}

// ─────────────────────────────────────────────────────────
// Wave D: Cost / Usage Types (Plan 3.5.s.a)
// ─────────────────────────────────────────────────────────

/** Daily cost rollup row. Mirrors uclaw lib/types.ts DailyCostRollup. */
export interface DailyCostRollup {
  day: string // YYYY-MM-DD
  inputTokens: number
  outputTokens: number
  costUsd: number
  turnCount: number
}

/** Per-model cost rollup row. Mirrors uclaw lib/types.ts ModelCostRollup. */
export interface ModelCostRollup {
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  turnCount: number
}

/** Per-session cost rollup row. Mirrors uclaw lib/types.ts SessionCostRollup. */
export interface SessionCostRollup {
  sessionId: string
  title: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  turnCount: number
  lastUsedAt: number
}

/** Per-workspace monthly cost rollup. Mirrors uclaw lib/types.ts WorkspaceCostRollup. */
export interface WorkspaceCostRollup {
  workspaceId: string
  workspaceName: string
  workspaceIcon: string
  totalCostUsd: number
  totalTokens: number
}

/** Payload for agent:turn_cost event. Mirrors uclaw lib/types.ts TurnCost. */
export interface TurnCost {
  sessionId: string
  costUsd: number
  inputTokens: number
  outputTokens: number
  model: string
}
