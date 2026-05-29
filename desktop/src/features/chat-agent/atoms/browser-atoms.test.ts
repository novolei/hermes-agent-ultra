import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  browserScreencastFrameAtom,
  browserDOMStateAtom,
  browserScreencastActiveAtom,
  browserDOMOverlayVisibleAtom,
  browserNavStateAtom,
  browserTaskRunAtom,
  browserStateAtom,
  isBrowserLoadingAtom,
  type ScreencastFrameEntry,
  type DOMStateEntry,
  type NavStateEntry,
  type BrowserTaskRunEntry,
  type BrowserState,
} from './browser-atoms'

describe('browser-atoms', () => {
  beforeEach(() => localStorage.clear())

  it('browserScreencastFrameAtom has Map<string, ScreencastFrameEntry> default', () => {
    const store = createStore()
    const value = store.get(browserScreencastFrameAtom)
    expect(value).toBeInstanceOf(Map)
    expect(value.size).toBe(0)
  })

  it('browserDOMStateAtom has Map<string, DOMStateEntry> default', () => {
    const store = createStore()
    const value = store.get(browserDOMStateAtom)
    expect(value).toBeInstanceOf(Map)
    expect(value.size).toBe(0)
  })

  it('browserScreencastActiveAtom has Set<string> default', () => {
    const store = createStore()
    const value = store.get(browserScreencastActiveAtom)
    expect(value).toBeInstanceOf(Set)
    expect(value.size).toBe(0)
  })

  it('browserDOMOverlayVisibleAtom has false default', () => {
    const store = createStore()
    expect(store.get(browserDOMOverlayVisibleAtom)).toBe(false)
  })

  it('browserNavStateAtom has Map<string, NavStateEntry> default', () => {
    const store = createStore()
    const value = store.get(browserNavStateAtom)
    expect(value).toBeInstanceOf(Map)
    expect(value.size).toBe(0)
  })

  it('browserTaskRunAtom has Map<string, BrowserTaskRunEntry> default', () => {
    const store = createStore()
    const value = store.get(browserTaskRunAtom)
    expect(value).toBeInstanceOf(Map)
    expect(value.size).toBe(0)
  })

  it('browserStateAtom (V1 compat stub) has correct default', () => {
    const store = createStore()
    const value = store.get(browserStateAtom)
    expect(value).toEqual({
      running: false,
      tabs: [],
      activeTabId: null,
    })
  })

  it('isBrowserLoadingAtom (V1 compat stub) has false default', () => {
    const store = createStore()
    expect(store.get(isBrowserLoadingAtom)).toBe(false)
  })

  it('can write and read screencast frame entries', () => {
    const store = createStore()
    const entry: ScreencastFrameEntry = {
      tabId: 'tab-1',
      dataB64: 'abc123',
      pageWidth: 1920,
      pageHeight: 1080,
      timestamp: Date.now(),
    }
    const map = new Map([['session-1', entry]])
    store.set(browserScreencastFrameAtom, map)
    expect(store.get(browserScreencastFrameAtom).get('session-1')).toEqual(entry)
  })

  it('can set browserDOMOverlayVisibleAtom to true', () => {
    const store = createStore()
    store.set(browserDOMOverlayVisibleAtom, true)
    expect(store.get(browserDOMOverlayVisibleAtom)).toBe(true)
  })
})
