/**
 * preview-panel-atoms — desktop stub for uclaw's @/atoms/preview-panel-atoms.
 *
 * Provides just enough for ToolActivityItem to compile and tests to verify
 * openPreviewTabAction writes to previewTabsAtom. Plan 3.5 (App Shell +
 * file preview) replaces this with the real implementation.
 *
 * The exported shapes and atom identities match uclaw's signatures exactly —
 * swapping in the real module in Plan 3.5 requires zero consumer changes.
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// ── Tab types ──────────────────────────────────────────────────────────

export type PreviewTabSource = 'agent' | 'manual'
export type PreviewTabType = 'file' | 'browser'

export interface PreviewFileTarget {
  mountId: string
  relPath: string
  name: string
  sessionId?: string | null
  absolutePath?: string
}

export interface PreviewTabItem {
  mountId: string
  relPath: string
  name: string
  absolutePath?: string
  sessionId?: string | null
  source: PreviewTabSource
  addedAt: number
  type: PreviewTabType
  browser?: { agentSessionId: string; initialUrl: string }
}

// ── Atoms ──────────────────────────────────────────────────────────────

export const previewTabsAtom = atom<PreviewTabItem[]>([])
export const activePreviewTabKeyAtom = atom<string | null>(null)
export const previewPanelOpenAtom = atom<boolean>(false)
export const autoPreviewEnabledAtom = atomWithStorage<boolean>(
  'hermes-auto-preview-enabled',
  true,
)

// ── Helpers ────────────────────────────────────────────────────────────

export function previewTabKey(
  t: Pick<PreviewTabItem, 'mountId' | 'relPath'>,
): string {
  return `${t.mountId}:${t.relPath}`
}

function sortPreviewTabs(tabs: PreviewTabItem[]): PreviewTabItem[] {
  return [...tabs].sort((a, b) => {
    if (a.source !== b.source) return a.source === 'agent' ? -1 : 1
    return a.addedAt - b.addedAt
  })
}

// ── Actions ────────────────────────────────────────────────────────────

/**
 * Open a file in a new tab, or focus the existing tab if already open.
 * Mirrors uclaw's openPreviewTabAction.
 */
export const openPreviewTabAction = atom(
  null,
  (
    get,
    set,
    payload: { target: PreviewFileTarget; source: PreviewTabSource },
  ) => {
    const tabs = get(previewTabsAtom)
    const key = previewTabKey(payload.target)
    const existing = tabs.find((t) => previewTabKey(t) === key)
    if (existing) {
      set(activePreviewTabKeyAtom, key)
      if (payload.source === 'agent' && existing.source === 'manual') {
        set(
          previewTabsAtom,
          sortPreviewTabs(
            tabs.map((t) =>
              previewTabKey(t) === key ? { ...t, source: 'agent' as const } : t,
            ),
          ),
        )
      }
      set(previewPanelOpenAtom, true)
      return
    }
    const tab: PreviewTabItem = {
      mountId: payload.target.mountId,
      relPath: payload.target.relPath,
      name: payload.target.name,
      absolutePath: payload.target.absolutePath,
      sessionId: payload.target.sessionId,
      source: payload.source,
      addedAt: Date.now(),
      type: 'file',
    }
    set(previewTabsAtom, sortPreviewTabs([...tabs, tab]))
    set(activePreviewTabKeyAtom, key)
    set(previewPanelOpenAtom, true)
  },
)
