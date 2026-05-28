import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { sidebarViewModeAtom, agentSidebarTopHeightAtom, workspaceListHeightAtom } from './sidebar-atoms'

describe('sidebar-atoms', () => {
  it('sidebarViewModeAtom defaults to "active"', () => {
    const store = createStore()
    expect(store.get(sidebarViewModeAtom)).toBe('active')
  })

  it('agentSidebarTopHeightAtom defaults to -1', () => {
    const store = createStore()
    expect(store.get(agentSidebarTopHeightAtom)).toBe(-1)
  })

  it('agentSidebarTopHeightAtom can be set to numeric values', () => {
    const store = createStore()
    store.set(agentSidebarTopHeightAtom, 240)
    expect(store.get(agentSidebarTopHeightAtom)).toBe(240)
  })

  it('agentSidebarTopHeightAtom persists to localStorage with hermes namespace', () => {
    const stored: Record<string, string> = {}
    const mockLocalStorage = {
      setItem: vi.fn((key, value) => {
        stored[key] = value
      }),
      getItem: vi.fn((key) => stored[key] || null),
      removeItem: vi.fn((key) => {
        delete stored[key]
      }),
      clear: vi.fn(() => {
        Object.keys(stored).forEach((key) => delete stored[key])
      }),
      length: 0,
      key: vi.fn(() => null),
    }
    const originalLocalStorage = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    try {
      const store = createStore()
      store.set(agentSidebarTopHeightAtom, 240)

      // Verify the key is persisted with the hermes namespace
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hermes-agent-sidebar-top-height', '240')
      expect(stored['hermes-agent-sidebar-top-height']).toBe('240')
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    }
  })

  it('workspaceListHeightAtom persists to localStorage with hermes namespace and not uclaw', () => {
    const stored: Record<string, string> = {}
    const mockLocalStorage = {
      setItem: vi.fn((key, value) => {
        stored[key] = value
      }),
      getItem: vi.fn((key) => stored[key] || null),
      removeItem: vi.fn((key) => {
        delete stored[key]
      }),
      clear: vi.fn(() => {
        Object.keys(stored).forEach((key) => delete stored[key])
      }),
      length: 0,
      key: vi.fn(() => null),
    }
    const originalLocalStorage = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    try {
      const store = createStore()
      store.set(workspaceListHeightAtom, 150)

      // Verify the key is persisted with the hermes namespace and does not contain uclaw
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hermes-workspace-list-height', '150')
      const storedValue = stored['hermes-workspace-list-height']
      expect(storedValue).not.toBeNull()
      expect(storedValue).not.toContain('uclaw')
      expect(storedValue).toBe('150')
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    }
  })
})
