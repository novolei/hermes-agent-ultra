/**
 * top-level-view — top-level-view atom
 *
 * Desktop has two parallel top-level surfaces:
 *  - 'workspace'    : task flow (chat / agent / files / artifacts), hosted in WorkspaceShell
 *  - 'kaleidoscope' : config flow (personas / apps / skills / integrations / memory / output), hosted in KaleidoscopeShell
 *
 * Not persisted — app restarts back to 'workspace' (task flow is the default entry).
 * `appModeAtom` (chat/agent) only takes effect when topLevelView === 'workspace'.
 *
 * Plan 3.2 — ported from uclaw atoms/top-level-view.ts
 */
import { atom } from 'jotai'

export type TopLevelView = 'workspace' | 'kaleidoscope'

export const topLevelViewAtom = atom<TopLevelView>('workspace')
