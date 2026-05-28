import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { workingSessionGroupsAtom, workingSessionIdsSetAtom } from './working-atoms'

describe('working-atoms', () => {
  it('exposes a stable empty set when no sessions are working', () => {
    const store = createStore()
    const set = store.get(workingSessionIdsSetAtom)
    expect(set).toBeInstanceOf(Set)
    expect(set.size).toBe(0)
  })

  it('groups working sessions by workspace', () => {
    const store = createStore()
    const groups = store.get(workingSessionGroupsAtom)
    expect(Array.isArray(groups.todo)).toBe(true)
    expect(Array.isArray(groups.running)).toBe(true)
    expect(Array.isArray(groups.done)).toBe(true)
  })
})
