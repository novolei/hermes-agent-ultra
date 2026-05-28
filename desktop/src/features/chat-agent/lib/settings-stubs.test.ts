import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  settingsTabAtom,
  settingsOpenAtom,
  environmentCheckDialogOpenAtom,
  openExternal,
  recordSkillCited,
  listInvocableSkills,
  searchWorkspaceFilesForMention,
} from './settings-stubs'

describe('settings-stubs', () => {
  it('settings atoms have safe defaults', () => {
    const store = createStore()
    expect(store.get(settingsTabAtom)).toBe('connectivity')
    expect(store.get(settingsOpenAtom)).toBe(false)
    expect(store.get(environmentCheckDialogOpenAtom)).toBe(false)
  })

  it('shim functions resolve without throwing', async () => {
    await expect(openExternal('http://example.com')).resolves.toBeUndefined()
    await expect(recordSkillCited('test-skill')).resolves.toBeUndefined()
    await expect(listInvocableSkills()).resolves.toEqual([])
    await expect(searchWorkspaceFilesForMention('s', 'q')).resolves.toEqual([])
  })
})
