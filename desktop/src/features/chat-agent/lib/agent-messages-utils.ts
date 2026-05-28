/**
 * Pure utility helpers extracted from uclaw's AgentMessages.tsx into a
 * sibling module so the pure utility surface is independently testable
 * and agent-messages.tsx stays focused on rendering.
 *
 * All function implementations are verbatim from uclaw's AgentMessages.tsx.
 * Import retargets applied: @/lib/proma-types → local type files.
 */

import type { AgentMessage, AgentEventUsage, ToolActivity } from './agent-types'
import type { ChatToolActivity } from './chat-types'

// ─────────────────────────────────────────────────────────
// AttachedFileRef
// ─────────────────────────────────────────────────────────

/** 解析的附件引用 */
export interface AttachedFileRef {
  filename: string
  path: string
}

// ─────────────────────────────────────────────────────────
// formatDuration
// ─────────────────────────────────────────────────────────

/** 格式化耗时（毫秒 → 可读字符串） */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toFixed(0)}s`
}

// ─────────────────────────────────────────────────────────
// buildUsageTooltip
// ─────────────────────────────────────────────────────────

/** 构建 usage tooltip 多行文本 */
export function buildUsageTooltip(durationMs: number, usage?: AgentEventUsage): string {
  const lines: string[] = []
  lines.push(`耗时: ${formatDuration(durationMs)}`)
  if (usage) {
    const pureInput = usage.inputTokens - (usage.cacheReadTokens ?? 0) - (usage.cacheCreationTokens ?? 0)
    if (pureInput > 0) lines.push(`输入: ${pureInput.toLocaleString()}`)
    if (usage.outputTokens) lines.push(`输出: ${usage.outputTokens.toLocaleString()}`)
    if (usage.cacheCreationTokens) lines.push(`缓存写入: ${usage.cacheCreationTokens.toLocaleString()}`)
    if (usage.cacheReadTokens) lines.push(`缓存读取: ${usage.cacheReadTokens.toLocaleString()}`)
  }
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────
// formatRelativeShort
// ─────────────────────────────────────────────────────────

/** 相对时间戳 — 简化显示，如 "2m ago" / "刚刚" */
export function formatRelativeShort(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

// ─────────────────────────────────────────────────────────
// isImageFile
// ─────────────────────────────────────────────────────────

/** 判断文件是否为图片类型 */
export function isImageFile(filename: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(filename)
}

// ─────────────────────────────────────────────────────────
// parseAttachedFiles
// ─────────────────────────────────────────────────────────

/** 解析消息中的 <attached_files> 块，返回文件列表和剩余文本 */
export function parseAttachedFiles(content: string): { files: AttachedFileRef[]; text: string } {
  const regex = /<attached_files>\n?([\s\S]*?)\n?<\/attached_files>\n*/
  const match = content.match(regex)
  if (!match) return { files: [], text: content }

  const files: AttachedFileRef[] = []
  const lines = match[1]!.split('\n')
  for (const line of lines) {
    // 格式: - filename: /path/to/file
    const lineMatch = line.match(/^-\s+(.+?):\s+(.+)$/)
    if (lineMatch) {
      files.push({ filename: lineMatch[1]!.trim(), path: lineMatch[2]!.trim() })
    }
  }

  const text = content.replace(regex, '').trim()
  return { files, text }
}

// ─────────────────────────────────────────────────────────
// agentActivitiesToChatActivities
// ─────────────────────────────────────────────────────────

/**
 * 把流式 agent ToolActivity[] 转换为持久化展示用的 ChatToolActivity[] start/result 配对。
 */
export function agentActivitiesToChatActivities(activities: ToolActivity[]): ChatToolActivity[] {
  const out: ChatToolActivity[] = []
  for (const a of activities) {
    out.push({
      toolCallId: a.toolUseId,
      type: 'start',
      toolName: a.toolName,
      input: a.input,
      // 携带实时输出 — 工具完成后 liveOutput 不再有意义（result 接管），仅在 running 时传递
      liveOutput: a.done ? undefined : a.liveOutput,
    })
    if (a.done) {
      out.push({
        toolCallId: a.toolUseId,
        type: 'result',
        toolName: a.toolName,
        input: a.input,
        result: a.result,
        isError: a.isError,
        status: a.isError ? 'failed' : 'completed',
      })
    }
  }
  return out
}

// ─────────────────────────────────────────────────────────
// extractToolActivities
// ─────────────────────────────────────────────────────────

/** 从持久化事件中提取工具活动列表 */
export function extractToolActivities(events: AgentMessage['events']): ToolActivity[] {
  if (!events) return []

  const activities: ToolActivity[] = []
  for (const event of events) {
    if (event.type === 'tool_start') {
      const existingIdx = activities.findIndex((t) => t.toolUseId === event.toolUseId)
      if (existingIdx >= 0) {
        activities[existingIdx] = {
          ...activities[existingIdx]!,
          input: event.input,
          intent: event.intent || activities[existingIdx]!.intent,
          displayName: event.displayName || activities[existingIdx]!.displayName,
        }
      } else {
        activities.push({
          toolUseId: event.toolUseId ?? '',
          toolName: event.toolName ?? '',
          input: event.input,
          intent: event.intent,
          displayName: event.displayName,
          done: true,
          parentToolUseId: event.parentToolUseId,
        })
      }
    } else if (event.type === 'tool_result') {
      const idx = activities.findIndex((t) => t.toolUseId === event.toolUseId)
      if (idx >= 0) {
        activities[idx] = {
          ...activities[idx]!,
          result: event.result,
          isError: event.isError,
          done: true,
          imageAttachments: event.imageAttachments,
        }
      }
    } else if (event.type === 'task_backgrounded') {
      const idx = activities.findIndex((t) => t.toolUseId === event.toolUseId)
      if (idx >= 0) {
        activities[idx] = { ...activities[idx]!, isBackground: true, taskId: event.taskId }
      }
    } else if (event.type === 'shell_backgrounded') {
      const idx = activities.findIndex((t) => t.toolUseId === event.toolUseId)
      if (idx >= 0) {
        activities[idx] = { ...activities[idx]!, isBackground: true, shellId: event.shellId }
      }
    } else if (event.type === 'task_progress') {
      const idx = activities.findIndex((t) => t.toolUseId === event.toolUseId)
      if (idx >= 0) {
        activities[idx] = { ...activities[idx]!, elapsedSeconds: event.elapsedSeconds }
      }
    } else if (event.type === 'task_started' && event.toolUseId) {
      const idx = activities.findIndex((t) => t.toolUseId === event.toolUseId)
      if (idx >= 0) {
        activities[idx] = { ...activities[idx]!, intent: event.description, taskId: event.taskId }
      }
    }
  }
  return activities
}
