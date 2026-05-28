import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  stickyUserMessageEnabledAtom,
  agentStatusBarEnabledAtom,
  planModeSuggestEnabledAtom,
  initializeUiPreferences,
  updateStickyUserMessageEnabled,
} from './ui-preferences'

describe('ui-preferences atoms', () => {
  it('stickyUserMessageEnabledAtom defaults to true', () => {
    const store = createStore()
    expect(store.get(stickyUserMessageEnabledAtom)).toBe(true)
  })

  it('agentStatusBarEnabledAtom defaults to false', () => {
    const store = createStore()
    expect(store.get(agentStatusBarEnabledAtom)).toBe(false)
  })

  it('planModeSuggestEnabledAtom defaults to true', () => {
    const store = createStore()
    expect(store.get(planModeSuggestEnabledAtom)).toBe(true)
  })

  it('initializeUiPreferences is callable without throwing', async () => {
    const setStickyUserMessageEnabled = vi.fn()
    await expect(
      initializeUiPreferences(setStickyUserMessageEnabled),
    ).resolves.not.toThrow()
    expect(setStickyUserMessageEnabled).toHaveBeenCalled()
  })

  it('initializeUiPreferences calls setStickyUserMessageEnabled with cached value', async () => {
    const setStickyUserMessageEnabled = vi.fn()
    // Clear any existing cache
    try {
      localStorage.removeItem('hermes-sticky-user-message')
    } catch {
      // localStorage may not be available
    }
    await initializeUiPreferences(setStickyUserMessageEnabled)
    // Should be called with the default (true) when no cache exists
    expect(setStickyUserMessageEnabled).toHaveBeenCalledWith(expect.any(Boolean))
  })

  it('updateStickyUserMessageEnabled persists to localStorage', async () => {
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
    const originalLocalStorage = global.localStorage
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    try {
      await updateStickyUserMessageEnabled(false)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hermes-sticky-user-message', 'false')

      await updateStickyUserMessageEnabled(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hermes-sticky-user-message', 'true')
    } finally {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    }
  })
})
