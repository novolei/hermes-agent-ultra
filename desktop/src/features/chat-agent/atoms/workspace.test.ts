import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { activeWorkspaceIdAtom, workspacesAtom } from './workspace'

describe('workspace atoms (dormant stubs)', () => {
  it('activeWorkspaceIdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(activeWorkspaceIdAtom)).toBeNull()
  })

  it('workspacesAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(workspacesAtom)).toEqual([])
  })
})
