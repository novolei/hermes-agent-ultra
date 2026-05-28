/**
 * Plan 2b.2.c.3 — feature-local stubs for settings atoms + composer-skill
 * autocomplete + external-link helper. Replaces peripheral-stubs.ts (deleted
 * in this task).
 *
 * Roadmap:
 *   Plan 3.5 (settings UI) replaces the settings atoms with the real wired
 *   surface and wires openExternal via tauri-plugin-opener.
 *   Plan 4 (skill registry) replaces listInvocableSkills + recordSkillCited.
 *   Plan 3 (workspace) replaces searchWorkspaceFilesForMention.
 */
import { atom } from 'jotai'
import type { InvocableSkill, WorkspaceFileMatch } from './types'

// ---- Settings atoms (Plan 3.5 ships real settings UI) ---------------------

export type SettingsTab =
  | 'connectivity'
  | 'intelligence'
  | 'tools'
  | 'memoryRecall'
  | 'learnedProfile'
  | 'imChannels'
  | 'general'
  | 'stt'
  | 'shortcuts'
  | 'pet'
  | 'proxy'
  | 'browserRuntime'
  | 'system'
  | 'about'

/** uclaw: @/atoms/settings-tab → settingsTabAtom */
export const settingsTabAtom = atom<SettingsTab>('connectivity')

/** uclaw: @/atoms/settings-tab → settingsOpenAtom */
export const settingsOpenAtom = atom(false)

/** uclaw: @/atoms/environment → environmentCheckDialogOpenAtom */
export const environmentCheckDialogOpenAtom = atom(false)

// ---- Shims (Plan 4 / 3.5 implementations) ---------------------------------

/** Plan 3.5 — open external URL via the OS shell (tauri-plugin-opener). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function openExternal(_url: string): Promise<void> {
  // No-op until Plan 3.5 wires the plugin-opener bridge.
}

/** Plan 4 — record a skill citation event into the skill registry. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function recordSkillCited(_skillName: string): Promise<void> {
  return
}

// ---- Composer autocomplete bridge stubs ------------------------------------

/** Plan 4 — list skills available for composer mention autocomplete. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function listInvocableSkills(_spaceId?: string): Promise<InvocableSkill[]> {
  return []
}

/** Plan 3 — search workspace files for the composer mention autocomplete. */
export async function searchWorkspaceFilesForMention(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _sessionId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _query: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _limit?: number,
): Promise<WorkspaceFileMatch[]> {
  return []
}
