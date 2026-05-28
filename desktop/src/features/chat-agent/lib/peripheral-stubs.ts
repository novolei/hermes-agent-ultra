/**
 * Plan 2b.2.b.2 — feature-local stubs for the atoms and Tauri bridge
 * helpers that AgentMessages.tsx imports from uclaw's chat-side modules.
 *
 * Each export is a minimum-viable replacement so the slim AgentMessages
 * port compiles and renders. Plan 2b.2.c upgrades each to the real
 * backend implementation. The exported names + shapes match uclaw's
 * signatures exactly — no consumer changes needed when 2b.2.c swaps these out.
 */
import { atom } from 'jotai'
import type { Channel } from './chat-types'
import type { MinimapItem } from '@/features/chat-agent/components/ai-elements/scroll-minimap'

// ---- Minimal type shapes (mirrors uclaw agent-atoms.ts stubs) ---------------

/** Matches uclaw ProactiveLearningEvent — only the fields AgentMessages accesses. */
export interface ProactiveLearningEvent {
  scenario: string
  items_extracted: number
  categories: string[]
  timestamp: string
  summary: string
  sessionId?: string | null
}

/** Matches uclaw MemoryRecallEvent — only the fields AgentMessages accesses. */
export interface MemoryRecallEvent {
  totalCandidates: number
  skillsCount: number
  bootCount: number
  triggeredCount: number
  relevantCount: number
  expandedCount: number
  recentCount: number
  items: Array<{ nodeId: string; title: string; kind: string; source: string }>
  conversationId: string | null
  timestamp: string
}

// ---- Side-feature atoms ----------------------------------------------------

/** uclaw: channels for chat-mode model selection. Empty in agent-mode MVP. */
export const channelsAtom = atom<Channel[]>([])

/** uclaw: per-tab minimap scroll position cache. Map keyed by sessionId. */
export const tabMinimapCacheAtom = atom<Map<string, MinimapItem[]>>(new Map())

/** uclaw: events emitted when the agent proactively recalls a learning. */
export const proactiveLearningEventsAtom = atom<ProactiveLearningEvent[]>([])

/** uclaw: per-session memory recall events keyed by sessionId / conversationId. */
export const memoryRecallEventAtom = atom<Map<string, MemoryRecallEvent>>(new Map())

/** uclaw: per-session skill recall events keyed by sessionId. */
export const skillRecallsMapAtom = atom<Map<string, unknown[]>>(new Map())

/** uclaw: returns a function that resolves agent id → display name. */
export const agentDisplayNameForAtom = atom<(agentId: string | undefined) => string | undefined>(
  () => () => undefined,
)

/** uclaw: user preference for the sticky-user-message indicator. */
export const stickyUserMessageEnabledAtom = atom<boolean>(true)

// ---- Tauri bridge shims ----------------------------------------------------
// Plan 3.5 ships the real file-preview window; until then no-ops.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function readAttachment(_localPath: string): Promise<string | null> {
  return null
}

export interface SaveImageArgs {
  localPath: string
  filename: string
  mediaType: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function saveImageAs(_args: SaveImageArgs): Promise<boolean> {
  return false
}
