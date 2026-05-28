import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { themeAtom, applyThemeToDocumentEffect } from './theme-atoms'

describe('themeAtom', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to light', () => {
    const store = createStore()
    expect(store.get(themeAtom)).toBe('light')
  })

  it('updates and exposes the new value', () => {
    const store = createStore()
    store.set(themeAtom, 'dark')
    expect(store.get(themeAtom)).toBe('dark')
  })

  it('applyThemeToDocumentEffect mirrors the atom to <html data-theme>', () => {
    const store = createStore()
    const unsubscribe = applyThemeToDocumentEffect(store)
    try {
      store.set(themeAtom, 'dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      store.set(themeAtom, 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    } finally {
      unsubscribe()
    }
  })
})
