// Ported verbatim from uclaw ui/src/atoms/preview-chip-atoms.ts (Plan FB.b Wave A2)
// Only addPendingAttachmentAction + its required types are ported here.
// Chip-rendering exports (chipResolutionCacheAtom, setChipResolutionAction,
// invalidateChipResolutionsAction) are already provided by lib/preview-chip-stubs.tsx.
/**
 * preview-chip-atoms — addPendingAttachmentAction for file-path chips (W4c).
 *
 * `addPendingAttachmentAction` is dispatched by Shift-click on a chip OR
 * on a FileTreeNode row. It eagerly fetches bytes (so the resulting
 * PendingAttachment carries `localPath` for downstream send paths) and
 * surfaces a sonner toast.
 */

import { atom } from 'jotai'
import { toast } from 'sonner'
import { invoke } from '@tauri-apps/api/core'
import type { PendingAttachment } from '@/features/chat-agent/atoms/chat-atoms'
import { pendingAttachmentsAtom } from '@/features/chat-agent/atoms/chat-atoms'
import { agentPendingFilesAtom } from '@/features/chat-agent/atoms/agent-atoms'
import type { AgentPendingFile } from '@/features/chat-agent/lib/agent-types'

// PreviewBytes serializes without serde rename_all — fields are snake_case.
interface PreviewBytesIpcPayload {
  resolved_path: string
  bytes: number[]
  size: number
  truncated: boolean
  mtime_ms: number
}

interface AddAttachmentPayload {
  mountId: string
  relPath: string
  name: string
  sessionId: string | null
  absolutePath: string
}

function inferMediaType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) {
    return `image/${ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext}`
  }
  if (ext === 'pdf') return 'application/pdf'
  return 'text/plain'
}

export const addPendingAttachmentAction = atom(
  null,
  async (get, set, payload: AddAttachmentPayload) => {
    // Two parallel composer atoms exist: `pendingAttachmentsAtom` (Chat
    // mode, global) and `agentPendingFilesAtom` (Agent mode, session-
    // scoped). The user only ever sees one composer, but we don't know
    // which from this action's call site (rail Shift-click is Agent-only,
    // FilePathChip can be either). Writing to both keeps the chip visible
    // regardless of mode; both composers clear their own list on send.
    const chatList = get(pendingAttachmentsAtom)
    const agentList = get(agentPendingFilesAtom)
    const dedupeKey = payload.absolutePath || `${payload.mountId}::${payload.relPath}`
    const inChat = chatList.some(
      (a) => (a.localPath || a.filename) === dedupeKey || a.localPath === payload.absolutePath,
    )
    const inAgent = agentList.some(
      (a) => a.sourcePath === payload.absolutePath || a.filename === payload.name,
    )
    if (inChat && inAgent) {
      toast.info('文件已在附件中', { id: 'attachment-added', description: payload.name })
      return
    }
    try {
      const result = await invoke<PreviewBytesIpcPayload>('preview_read_bytes', {
        mountId: payload.mountId,
        relPath: payload.relPath,
        sessionId: payload.sessionId ?? null,
      })
      const mediaType = inferMediaType(payload.name)
      if (!inChat) {
        const next: PendingAttachment = {
          filename: payload.name,
          localPath: result.resolved_path,
          mediaType,
          size: result.size,
        }
        set(pendingAttachmentsAtom, [...chatList, next])
      }
      if (!inAgent) {
        const next: AgentPendingFile = {
          id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          filename: payload.name,
          mediaType,
          size: result.size,
          sourcePath: result.resolved_path,
        }
        set(agentPendingFilesAtom, [...agentList, next])
      }
      toast.success(`已添加 ${payload.name}`, { id: 'attachment-added' })
    } catch (err) {
      toast.error('无法添加附件', {
        id: 'attachment-added',
        description: err instanceof Error ? err.message : String(err),
      })
    }
  },
)
