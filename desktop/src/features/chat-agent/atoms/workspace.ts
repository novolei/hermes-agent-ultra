// Plan 2b.2.c.3 — dormant workspace atom extracted to its own file so Plan 3
// (Navigation spine) can ship the real workspace module by replacing this
// file's contents with the verbatim uclaw atoms/workspace.ts port. AgentMessages
// + ComposerMentionController consume this file directly; no consumer change
// needed when Plan 3 lands.

import { atom } from 'jotai'

export interface WorkspaceMeta {
  id: string
  name: string
}

/**
 * Dormant in MVP — Plan 3 populates this with the real active workspace ID.
 */
export const activeWorkspaceIdAtom = atom<string | null>(null)

/**
 * Dormant in MVP — Plan 3 populates from the workspace list backend.
 */
export const workspacesAtom = atom<WorkspaceMeta[]>([])
