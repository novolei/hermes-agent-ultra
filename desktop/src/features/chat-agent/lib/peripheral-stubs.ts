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

// ---- Side-feature atoms ----------------------------------------------------

/** uclaw: channels for chat-mode model selection. Empty in agent-mode MVP. */
export const channelsAtom = atom<Channel[]>([])

/** uclaw: per-tab minimap scroll position cache. */
export const tabMinimapCacheAtom = atom<Record<string, { scrollTop: number }>>({})

/** uclaw: events emitted when the agent proactively recalls a learning. */
export const proactiveLearningEventsAtom = atom<unknown[]>([])

/** uclaw: per-message memory recall events keyed by message id. */
export const memoryRecallEventAtom = atom<Record<string, unknown>>({})

/** uclaw: per-message skill recall events keyed by message id. */
export const skillRecallsMapAtom = atom<Record<string, unknown>>({})

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
