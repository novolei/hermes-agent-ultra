/**
 * After Plan 2b.2.c.2, this file holds ONLY:
 *   - Settings / UI atoms (settingsTabAtom, settingsOpenAtom, etc.)
 *   - Tauri shims (readAttachment, saveImageAs, openExternal)
 *   - recordSkillCited (no-op until Plan 4 ships the real Tauri command)
 *   - Composer autocomplete bridge stubs (listInvocableSkills,
 *     searchWorkspaceFilesForMention; real backends land in Plan 3+)
 *
 * All atom shadows that previously duplicated real atoms have been removed:
 *   channelsAtom          → atoms/chat-atoms.ts
 *   tabMinimapCacheAtom   → atoms/tab-atoms.ts
 *   proactiveLearningEventsAtom, memoryRecallEventAtom,
 *   skillRecallsMapAtom   → atoms/agent-atoms.ts
 *   agentDisplayNameForAtom → atoms/agent-display-name.ts
 *   stickyUserMessageEnabledAtom → atoms/ui-preferences.ts
 *
 * Plan 2b.2.c.3 deletes this file entirely when the real Tauri commands land.
 */
import { atom } from 'jotai'
import type { InvocableSkill, WorkspaceFileMatch } from './types'

// ---- Settings / UI atoms (uclaw: @/atoms/settings-tab, @/atoms/environment) --
// Stubs so SDKMessageRenderer's ErrorMessage recovery actions compile without
// requiring the full settings panel (Plan 3+).

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

/** uclaw: @/lib/tauri-bridge → openExternal. Opens a URL in the system browser. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function openExternal(_url: string): Promise<void> {
  // Plan 3+ wires this to the real Tauri shell:open command.
}

/**
 * Plan 2b.2.c.2 — no-op stub for uclaw's recordSkillCited Tauri command.
 * Real implementation lands in Plan 4 (skill registry backend).
 * SkillCitationChips calls this when a citation is clicked.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function recordSkillCited(_skillName: string): Promise<void> {
  return
}

// ---- Composer autocomplete bridge stubs ------------------------------------
// Plan 2b.2.c.2 — stubs for composer mention controller's Tauri IPC calls.
// Real implementations land when the skill registry + workspace file search
// backends are wired (Plan 3+). Until then the popup opens empty but
// doesn't crash.

/**
 * uclaw: @/lib/tauri-bridge → listInvocableSkills.
 * Lists skills available for `/`-autocomplete in the composer.
 * Returns empty array until the real Tauri backend is wired.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function listInvocableSkills(_spaceId?: string): Promise<InvocableSkill[]> {
  return []
}

/**
 * uclaw: @/lib/tauri-bridge → searchWorkspaceFilesForMention.
 * Searches workspace files for `@`-autocomplete in the composer.
 * Returns empty array until the real Tauri backend is wired.
 */
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
