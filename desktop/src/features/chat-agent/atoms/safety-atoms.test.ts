import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { safetyModeAtom } from './safety-atoms'

describe('safety-atoms', () => {
  beforeEach(() => localStorage.clear())

  it('safetyModeAtom has a deterministic default', () => {
    const store = createStore()
    const v = store.get(safetyModeAtom)
    expect(v).toBe('supervised')
  })

  it('safetyModeAtom can be written to', () => {
    const store = createStore()
    store.set(safetyModeAtom, 'ask')
    const v = store.get(safetyModeAtom)
    expect(v).toBe('ask')
  })

  it('safetyModeAtom accepts all valid SafetyModeWire values', () => {
    const store = createStore()
    const validValues: Array<'ask' | 'acceptedits' | 'plan' | 'supervised' | 'yolo'> = [
      'ask',
      'acceptedits',
      'plan',
      'supervised',
      'yolo',
    ]

    for (const val of validValues) {
      store.set(safetyModeAtom, val)
      expect(store.get(safetyModeAtom)).toBe(val)
    }
  })
})
