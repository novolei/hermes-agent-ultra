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
import type { AgentEventUsage, ToolActivity } from '@/features/chat-agent/lib/agent-types'

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

// ---- Forward-reference placeholder (Task 11) --------------------------------
//
// All 6 helpers and every import needed by Tasks 12-15 are referenced here so
// the TS strict `noUnusedLocals` check passes before the full component body
// is added. Tasks 12-15 remove this export and wire the symbols into the real
// AgentMessages component instead.
//
// Imports consumed only by Task 12-15 that have no other use in this file yet:
const _forwardImports = {
  // jotai hooks (Task 12-15 message loop)
  useAtomValue,
  useSetAtom,
  // lucide icons (various message renders)
  AlertTriangle,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Brain,
  // shared UI (Task 13-15)
  Spinner,
  Button,
  cn,
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
  // scroll / layout components (Task 14-15); MinimapItem/AgentMessage/AgentStreamState
  // are type-only — Tasks 12-15 will import them when needed.
  ScrollMinimap,
  StickyUserMessage,
  // user/copy UI (Task 13)
  UserAvatar,
  CopyButton,
  // utils (Task 12-15)
  formatRelativeShort,
  parseAttachedFiles,
  extractToolActivities,
  agentActivitiesToChatActivities,
  formatMessageTime,
  // tool/content components (Task 12-13)
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

export const __TASK11_PLACEHOLDER_USE = {
  _forwardImports,
  EmptyState,
  AssistantLogo,
  InlineImage,
  ToolResultInlineImages,
  AttachedFileChip,
  MessageMetaBar,
} satisfies Record<string, unknown>
