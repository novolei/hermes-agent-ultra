import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Bot, FileText, FileImage, AlertTriangle, RotateCw, ChevronDown, ChevronRight, Download, Zap, Brain } from 'lucide-react'
import { ImageLightbox } from '@/shared/ui/image-lightbox'
import { Spinner } from '@/shared/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { getModelLogo, resolveModelDisplayName } from '@/features/chat-agent/lib/model-logo'
import { userProfileAtom } from '@/features/chat-agent/atoms/user-profile'
import { useSmoothStream } from '@/shared/lib/use-smooth-stream'
import { normalizeAgentMarkdown } from '@/shared/lib/normalize-agent-markdown'
import { parseSkillCitations } from '@/shared/lib/skill-citation'
import { WelcomeEmptyState } from '@/features/chat-agent/components/welcome-empty-state'
import { ScrollMinimap } from '@/features/chat-agent/components/ai-elements/scroll-minimap'
import { StickyUserMessage } from '@/features/chat-agent/components/ai-elements/sticky-user-message'
import { UserAvatar } from '@/features/chat-agent/components/user-avatar'
import { CopyButton } from '@/features/chat-agent/components/copy-button'
import {
  channelsAtom,
  tabMinimapCacheAtom,
  proactiveLearningEventsAtom,
  memoryRecallEventAtom,
  skillRecallsMapAtom,
  agentDisplayNameForAtom,
  stickyUserMessageEnabledAtom,
  saveImageAs,
  readAttachment,
} from '@/features/chat-agent/lib/peripheral-stubs'
import {
  formatDuration,
  buildUsageTooltip,
  formatRelativeShort,
  parseAttachedFiles,
  isImageFile,
  extractToolActivities,
  agentActivitiesToChatActivities,
  type AttachedFileRef,
} from '@/features/chat-agent/lib/agent-messages-utils'
import { formatMessageTime } from '@/features/chat-agent/lib/format-message-time'
import { ToolActivityList, ChatToolActivityIndicator } from '@/features/chat-agent/components/stubs/tool-activity-list'
import { ThinkingBlock, NativeBlockRenderer } from '@/features/chat-agent/components/stubs/content-block'
import { SkillCitationChips, SkillRecallChips } from '@/features/chat-agent/components/stubs/skill-chips'
import { ProactiveLearningChip, MemoryRecallChip } from '@/features/chat-agent/components/stubs/learning-chips'
import { CompactingIndicator, CompactBoundaryDivider } from '@/features/chat-agent/components/stubs/sdk-message-renderer'
import { ScrollPositionManager } from '@/features/chat-agent/components/stubs/scroll-position-manager'
import type { AgentEventUsage, ToolActivity, RetryAttempt } from '@/features/chat-agent/lib/agent-types'
import type { AgentStreamState } from '@/features/chat-agent/atoms/agent-atoms'
import { MessageResponse } from '@/features/chat-agent/components/ai-elements/message'

// ---- Small private helpers (Task 11) --------------------------------------

/** Welcome state delegate. */
function EmptyState(): React.ReactElement {
  return <WelcomeEmptyState />
}

/** Assistant logo with fallback to Bot icon for unknown providers. */
function AssistantLogo({ model }: { model?: string }): React.ReactElement {
  // getModelLogo returns '' for unknown providers — fall back to Bot icon so we
  // never render <img src=""> (broken image).
  const logoUrl = model ? getModelLogo(model) : ''
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={model}
        className="size-[35px] rounded-[25%] object-cover bg-muted/30"
      />
    )
  }
  return (
    <div className="size-[35px] rounded-[25%] bg-primary/10 flex items-center justify-center">
      <Bot size={18} className="text-primary" />
    </div>
  )
}

/** Inline image attachment renderer with lightbox + save-as. */
function InlineImage({ attachment }: { attachment: { localPath: string; filename: string; mediaType: string } }): React.ReactElement {
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)

  React.useEffect(() => {
    readAttachment(attachment.localPath)
      .then((base64: string | null) => {
        if (base64) {
          setImageSrc(`data:${attachment.mediaType};base64,${base64}`)
        }
      })
      .catch((error: unknown) => {
        console.error('[InlineImage] 读取附件失败:', error)
      })
  }, [attachment.localPath, attachment.mediaType])

  // NOTE: desktop stub's saveImageAs takes SaveImageArgs object, not (path, filename) like uclaw.
  // Adapted accordingly — mediaType is already on the attachment object.
  const handleSave = React.useCallback((): void => {
    void saveImageAs({ localPath: attachment.localPath, filename: attachment.filename, mediaType: attachment.mediaType })
  }, [attachment.localPath, attachment.filename, attachment.mediaType])

  if (!imageSrc) {
    return <div className="size-[280px] rounded-lg bg-muted/30 animate-pulse shrink-0" />
  }

  return (
    <div className="relative group inline-block">
      <img
        src={imageSrc}
        alt={attachment.filename}
        className="size-[280px] rounded-lg object-cover shrink-0 cursor-pointer"
        onClick={() => setLightboxOpen(true)}
      />
      <button
        type="button"
        onClick={handleSave}
        className="absolute bottom-2 right-2 p-1.5 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        title="保存图片"
      >
        <Download className="size-4" />
      </button>
      <ImageLightbox
        src={imageSrc}
        alt={attachment.filename}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  )
}

/** Collected images from tool results. */
function ToolResultInlineImages({ activities }: { activities: ToolActivity[] }): React.ReactElement | null {
  const allImages = activities.flatMap((a) => a.imageAttachments ?? [])
  if (allImages.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {allImages.map((img, i) => (
        <InlineImage key={`${img.localPath}-${i}`} attachment={img} />
      ))}
    </div>
  )
}

/** File path chip for parsed <attached_files>. */
function AttachedFileChip({ file }: { file: AttachedFileRef }): React.ReactElement {
  const isImg = isImageFile(file.filename)
  const Icon = isImg ? FileImage : FileText

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-[12px] text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate max-w-[200px]">{file.filename}</span>
    </div>
  )
}

/** Duration + token usage display, hidden when both missing. */
function MessageMetaBar({ durationMs, usage }: { durationMs?: number; usage?: AgentEventUsage }): React.ReactElement | null {
  if (durationMs == null && usage == null) return null

  const parts: string[] = []
  if (durationMs != null) parts.push(formatDuration(durationMs))
  if (usage) {
    const { inputTokens, outputTokens, costUsd } = usage
    parts.push(`${inputTokens.toLocaleString()} 输入`)
    parts.push(`${(outputTokens ?? 0).toLocaleString()} 输出`)
    if (costUsd != null && costUsd > 0) parts.push(`$${costUsd.toFixed(4)}`)
  }

  const tooltipText = durationMs != null ? buildUsageTooltip(durationMs, usage) : null

  const content = (
    <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground/50 tabular-nums cursor-default hover:text-muted-foreground/70 transition-colors animate-in fade-in duration-300">
      <Zap size={11} strokeWidth={2} className="shrink-0" />
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="opacity-40">·</span>}
          <span>{p}</span>
        </React.Fragment>
      ))}
    </span>
  )

  if (!tooltipText) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top">
        <p className="whitespace-pre-line text-left">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  )
}

// ---- Medium render components (Task 12) -----------------------------------

/** Context-compaction fold card. */
function CompactionFoldCard({
  markdown,
  createdAt,
}: {
  markdown: string
  createdAt: number
}): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false)

  // Quick stats — count `### ` headings in the markdown for the
  // collapsed summary. Each section corresponds to one of the 8
  // StructuredFold fields. Skipping empty body bodies returns 0.
  const sectionCount = React.useMemo(() => {
    const matches = markdown.match(/^###\s+/gm)
    return matches?.length ?? 0
  }, [markdown])

  // Strip the leading `## Earlier conversation (compacted)\n` header
  // since we render our own header in the card chrome.
  const body = React.useMemo(() => {
    return markdown.replace(/^##\s+Earlier conversation \(compacted\)\s*\n+/, '')
  }, [markdown])

  return (
    <div
      className={cn(
        'flex items-center gap-3 my-4 px-1',
        expanded && 'flex-col items-stretch',
      )}
    >
      {!expanded && (
        <>
          <div className="flex-1 h-px bg-border/40" />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5',
              'rounded-full border border-border/40 bg-muted/30',
              'px-2.5 py-0.5 text-[11px] text-muted-foreground/75',
              'hover:bg-muted/50 hover:text-foreground transition-colors',
            )}
          >
            <Brain className="size-3" />
            <span>上下文已压缩为结构化摘要</span>
            {sectionCount > 0 && (
              <span className="text-[10px] text-muted-foreground/45">
                · {sectionCount} 个分项
              </span>
            )}
            <ChevronRight className="size-3 opacity-60" />
          </button>
          <div className="flex-1 h-px bg-border/40" />
        </>
      )}
      {expanded && (
        <div
          className={cn(
            'rounded-xl border border-border/50 bg-muted/20',
            'overflow-hidden',
          )}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2',
              'border-b border-border/40 bg-muted/30',
              'text-left text-[11px] text-muted-foreground/85',
              'hover:bg-muted/50 transition-colors',
            )}
          >
            <Brain className="size-3.5 text-emerald-500/85" />
            <span className="flex-1 font-medium">上下文摘要 (M2-G StructuredFold)</span>
            <span className="text-[10px] text-muted-foreground/55">
              {sectionCount} 个分项 · {formatRelativeShort(createdAt)}
            </span>
            <ChevronDown className="size-3.5 opacity-60" />
          </button>
          <div className="px-4 py-3 text-[12.5px] text-foreground/85">
            <MessageResponse sessionId={null}>{body}</MessageResponse>
          </div>
        </div>
      )}
    </div>
  )
}

/** Retrying notice (banner during automatic retry backoff). */
function RetryingNotice({ retrying }: { retrying: NonNullable<AgentStreamState['retrying']> }): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)

  // 倒计时逻辑
  React.useEffect(() => {
    if (retrying.failed || retrying.history.length === 0) {
      setCountdown(0)
      return
    }

    const lastAttempt = retrying.history[retrying.history.length - 1]
    if (!lastAttempt) return

    // 计算倒计时
    const updateCountdown = (): void => {
      const elapsed = (Date.now() - lastAttempt.timestamp) / 1000 // 已过去的秒数
      const remaining = Math.max(0, lastAttempt.delaySeconds - elapsed)
      setCountdown(Math.ceil(remaining))

      if (remaining <= 0) {
        setCountdown(0)
      }
    }

    // 立即更新一次
    updateCountdown()

    // 每 100ms 更新一次倒计时
    const timer = setInterval(updateCountdown, 100)
    return () => clearInterval(timer)
  }, [retrying.failed, retrying.history])

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-3 mb-3">
      {/* 头部：简洁状态 */}
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(!expanded)}
      >
        {retrying.failed ? (
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <RotateCw className="size-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
        )}
        <span className="text-sm text-amber-900 dark:text-amber-100 flex-1">
          {retrying.failed
            ? `重试失败 (${retrying.currentAttempt}/${retrying.maxAttempts})`
            : countdown > 0
              ? `重试倒计时 ${countdown}秒 (${retrying.currentAttempt}/${retrying.maxAttempts})`
              : `重试中 (${retrying.currentAttempt}/${retrying.maxAttempts})`}
          {retrying.history.length > 0 && ` · ${retrying.history[retrying.history.length - 1]?.reason}`}
        </span>
        {expanded ? (
          <ChevronDown className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        )}
      </button>

      {/* 展开内容：重试历史 */}
      {expanded && retrying.history.length > 0 && (
        <div className="mt-3 space-y-3 border-t border-amber-200 dark:border-amber-800 pt-3">
          <div className="text-xs font-medium text-amber-900 dark:text-amber-100">
            尝试历史：
          </div>
          {retrying.history.map((attempt, index) => (
            <RetryAttemptItem
              key={attempt.timestamp}
              attempt={attempt}
              isLatest={index === retrying.history.length - 1}
              isFailed={retrying.failed && index === retrying.history.length - 1}
            />
          ))}
          {!retrying.failed && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 pl-6">
              {countdown > 0 ? (
                <>
                  <RotateCw className="size-3 animate-spin" />
                  <span>等待 {countdown} 秒后开始第 {retrying.currentAttempt} 次尝试</span>
                </>
              ) : (
                <>
                  <RotateCw className="size-3 animate-spin" />
                  <span>正在进行第 {retrying.currentAttempt} 次尝试...</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RetryAttemptItem({
  attempt,
  isLatest,
  isFailed: _isFailed,
}: {
  attempt: RetryAttempt
  isLatest: boolean
  isFailed: boolean
}): React.ReactElement {
  const [showStderr, setShowStderr] = React.useState(false)
  const [showStack, setShowStack] = React.useState(false)

  const time = new Date(attempt.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className={cn('pl-6 space-y-2', isLatest && 'font-medium')}>
      {/* 尝试头部 */}
      <div className="flex items-start gap-2">
        <span className="text-destructive shrink-0">❌</span>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-xs text-amber-900 dark:text-amber-100">
            第 {attempt.attempt} 次 ({time}) - {attempt.reason}
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-300 font-mono break-words">
            {attempt.errorMessage}
          </div>

          {/* 环境信息 */}
          {attempt.environment && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 space-y-0.5">
              <div>运行时: {attempt.environment.runtime}</div>
              <div>平台: {attempt.environment.platform}</div>
              <div>模型: {attempt.environment.model}</div>
              {attempt.environment.workspace && <div>工作区: {attempt.environment.workspace}</div>}
            </div>
          )}

          {/* 可展开的 stderr */}
          {attempt.stderr && (
            <div className="mt-2">
              <button
                type="button"
                className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                onClick={() => setShowStderr(!showStderr)}
              >
                {showStderr ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                显示 stderr 输出
              </button>
              {showStderr && (
                <pre className="mt-1 text-[10px] text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/30 p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
                  {attempt.stderr}
                </pre>
              )}
            </div>
          )}

          {/* 可展开的堆栈跟踪 */}
          {attempt.stack && (
            <div className="mt-2">
              <button
                type="button"
                className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                onClick={() => setShowStack(!showStack)}
              >
                {showStack ? (
                  <ChevronDown className="size-3" />
                ) : (
                  <ChevronRight className="size-3" />
                )}
                显示堆栈跟踪
              </button>
              {showStack && (
                <pre className="mt-1 text-[10px] text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/30 p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
                  {attempt.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Public DurationBadge — exported (uclaw exports this). */
export function DurationBadge({ durationMs, usage }: { durationMs: number; usage?: AgentEventUsage }): React.ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-[12px] text-muted-foreground/50 tabular-nums cursor-default hover:text-muted-foreground/70 transition-colors">
          {formatDuration(durationMs)}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="whitespace-pre-line text-left">{buildUsageTooltip(durationMs, usage)}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function AgentRunningIndicator({
  startedAt,
  toolCount,
  inputTokens,
  outputTokens,
}: {
  startedAt?: number
  toolCount?: number
  inputTokens?: number
  outputTokens?: number
}): React.ReactElement {
  const [elapsed, setElapsed] = React.useState(0)

  React.useEffect(() => {
    const start = startedAt ?? Date.now()
    const update = (): void => setElapsed((Date.now() - start) / 1000)
    update()
    const timer = setInterval(update, 100)
    return () => clearInterval(timer)
  }, [startedAt])

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s.toFixed(1)}s`
  }
  const formatTokens = (n?: number): string => {
    if (!n) return '0'
    if (n < 1000) return String(n)
    return `${(n / 1000).toFixed(1)}k`
  }

  const showStats = (toolCount ?? 0) > 0 || !!inputTokens || !!outputTokens

  return (
    <div className="flex items-center gap-2 min-h-[28px]">
      {/* 3×3 ripple-pulse grid spinner — see .spinner in globals.css */}
      <Spinner size="sm" className="text-primary/75" aria-label="正在执行" />
      <span className="text-[13px] font-light text-muted-foreground/75 tabular-nums">
        Agent Running {formatTime(elapsed)}
      </span>
      {showStats && (
        <span className="text-[11px] text-muted-foreground/50 tabular-nums">
          {(toolCount ?? 0) > 0 && <>· {toolCount} 工具</>}
          {(inputTokens || outputTokens) && (
            <> · ↑{formatTokens(inputTokens)} ↓{formatTokens(outputTokens)}</>
          )}
        </span>
      )}
    </div>
  )
}

// ---- Forward-reference placeholder (Tasks 11-12) ---------------------------
//
// All helpers and every import needed by Tasks 13-15 are referenced here so
// the TS strict `noUnusedLocals` check passes before the full component body
// is added. Tasks 13-15 will wire the symbols into the real AgentMessages
// component and remove this export.
//
const _forwardImports = {
  // jotai hooks (Task 13-15 message loop)
  useAtomValue,
  useSetAtom,
  // shared UI (Task 13-15)
  Button,
  // model display (Task 13 header)
  resolveModelDisplayName,
  // atoms (Task 14-15)
  userProfileAtom,
  channelsAtom,
  tabMinimapCacheAtom,
  proactiveLearningEventsAtom,
  memoryRecallEventAtom,
  skillRecallsMapAtom,
  agentDisplayNameForAtom,
  stickyUserMessageEnabledAtom,
  // shared lib (Task 13-15)
  useSmoothStream,
  normalizeAgentMarkdown,
  parseSkillCitations,
  // scroll / layout components (Task 14-15)
  ScrollMinimap,
  StickyUserMessage,
  // user/copy UI (Task 13)
  UserAvatar,
  CopyButton,
  // utils (Task 13-15)
  parseAttachedFiles,
  extractToolActivities,
  agentActivitiesToChatActivities,
  formatMessageTime,
  // tool/content components (Task 13)
  ToolActivityList,
  ChatToolActivityIndicator,
  ThinkingBlock,
  NativeBlockRenderer,
  // chip components (Task 13-14)
  SkillCitationChips,
  SkillRecallChips,
  ProactiveLearningChip,
  MemoryRecallChip,
  // SDK renderer (Task 14)
  CompactingIndicator,
  CompactBoundaryDivider,
  // scroll position (Task 15)
  ScrollPositionManager,
} as const

// Hoist references so strict-mode noUnusedLocals doesn't flag the private
// helpers (Task 14 & 15 will reference them all properly).
export const __INTERNAL_FORWARD_REFS = {
  _forwardImports,
  EmptyState,
  AssistantLogo,
  InlineImage,
  ToolResultInlineImages,
  AttachedFileChip,
  MessageMetaBar,
  CompactionFoldCard,
  RetryingNotice,
  RetryAttemptItem,
  AgentRunningIndicator,
} satisfies Record<string, unknown>
