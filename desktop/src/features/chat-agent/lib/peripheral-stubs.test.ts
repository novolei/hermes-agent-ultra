import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  channelsAtom,
  tabMinimapCacheAtom,
  proactiveLearningEventsAtom,
  memoryRecallEventAtom,
  skillRecallsMapAtom,
  agentDisplayNameForAtom,
  stickyUserMessageEnabledAtom,
  readAttachment,
  saveImageAs,
} from './peripheral-stubs'

describe('peripheral-stubs (Plan 2b.2.c will replace these)', () => {
  it('exports static-default atoms with safe initial values', () => {
    const store = createStore()
    expect(store.get(channelsAtom)).toEqual([])
    expect(store.get(tabMinimapCacheAtom)).toEqual(new Map())
    expect(store.get(proactiveLearningEventsAtom)).toEqual([])
    expect(store.get(memoryRecallEventAtom)).toEqual(new Map())
    expect(store.get(skillRecallsMapAtom)).toEqual(new Map())
    expect(typeof store.get(agentDisplayNameForAtom)).toBe('function')
    expect(store.get(stickyUserMessageEnabledAtom)).toBe(true)
  })

  it('exports no-op Tauri attachment shims', async () => {
    await expect(readAttachment('/x')).resolves.toBeNull()
    await expect(saveImageAs({ localPath: '/x', filename: 'x.png', mediaType: 'image/png' })).resolves.toBe(false)
  })
})
