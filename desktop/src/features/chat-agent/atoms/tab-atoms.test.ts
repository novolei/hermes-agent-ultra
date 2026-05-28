// Plan 2b.2.c.2 — default-value tests for tab-atoms.ts port.
import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'jotai/vanilla'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}))

const mod = await import('./tab-atoms')

describe('tab-atoms', () => {
  it('tabsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(mod.tabsAtom)).toEqual([])
  })

  it('activeTabIdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(mod.activeTabIdAtom)).toBeNull()
  })

  it('tabMruAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(mod.tabMruAtom)).toEqual([])
  })

  it('tabMinimapCacheAtom defaults to empty record', () => {
    const store = createStore()
    const cache = store.get(mod.tabMinimapCacheAtom)
    // Could be Record<string, ...> or Map<...>; assert empty
    expect(cache).toBeDefined()
    if (cache instanceof Map) {
      expect(cache.size).toBe(0)
    } else {
      expect(Object.keys(cache as Record<string, unknown>).length).toBe(0)
    }
  })

  it('visibleTabsAtom is a derived atom and returns an array', () => {
    const store = createStore()
    expect(Array.isArray(store.get(mod.visibleTabsAtom))).toBe(true)
  })

  it('workspaceActiveTabIdMapAtom defaults to empty Map', () => {
    const store = createStore()
    const m = store.get(mod.workspaceActiveTabIdMapAtom)
    expect(m instanceof Map).toBe(true)
    expect(m.size).toBe(0)
  })

  it('activeWorkspaceIdAtom defaults to null (dormant until Plan 3)', () => {
    const store = createStore()
    expect(store.get(mod.activeWorkspaceIdAtom)).toBeNull()
  })
})
