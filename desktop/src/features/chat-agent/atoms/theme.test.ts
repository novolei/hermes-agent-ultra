import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'

// Mock Tauri invoke so initializeTheme etc. don't try to call backend
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}))

// Mock window.matchMedia (not available in Node/jsdom without polyfill)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage (not available in this jsdom configuration)
const stored: Record<string, string> = {}
const mockLocalStorage = {
  setItem: vi.fn((key: string, value: string) => { stored[key] = value }),
  getItem: vi.fn((key: string) => stored[key] ?? null),
  removeItem: vi.fn((key: string) => { delete stored[key] }),
  clear: vi.fn(() => { Object.keys(stored).forEach((k) => delete stored[k]) }),
  length: 0,
  key: vi.fn(() => null),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

const mod = await import('./theme')

describe('theme atoms', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    vi.clearAllMocks()
    // Restore the mock functions after clearAllMocks
    mockLocalStorage.setItem = vi.fn((key: string, value: string) => { stored[key] = value })
    mockLocalStorage.getItem = vi.fn((key: string) => stored[key] ?? null)
    mockLocalStorage.removeItem = vi.fn((key: string) => { delete stored[key] })
    mockLocalStorage.clear = vi.fn(() => { Object.keys(stored).forEach((k) => delete stored[k]) })
    // Reset <html> classes between tests
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('themeModeAtom has a default value (light, dark, system, or special)', () => {
    const store = createStore()
    const value = store.get(mod.themeModeAtom)
    expect(['light', 'dark', 'system', 'special']).toContain(value)
  })

  it('themeStyleAtom has a default value', () => {
    const store = createStore()
    const value = store.get(mod.themeStyleAtom)
    expect(typeof value).toBe('string')
  })

  it('systemIsDarkAtom defaults to a boolean', () => {
    const store = createStore()
    expect(typeof store.get(mod.systemIsDarkAtom)).toBe('boolean')
  })

  it('resolvedThemeAtom resolves to light or dark', () => {
    const store = createStore()
    const resolved = store.get(mod.resolvedThemeAtom)
    expect(['light', 'dark']).toContain(resolved)
  })

  it('applyThemeToDOM adds dark class for dark mode', () => {
    // uclaw uses classList.toggle('dark') rather than data-theme attribute
    document.documentElement.className = ''
    mod.applyThemeToDOM('dark', 'default', true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applyThemeToDOM with non-default style adds a theme-* class', () => {
    document.documentElement.className = ''
    mod.applyThemeToDOM('special', 'ocean-light', false)
    expect(document.documentElement.className).toContain('theme-')
  })

  it('initializeTheme is callable and resolves', async () => {
    // initializeTheme(setThemeMode, setSystemIsDark, setThemeStyle?)
    const setThemeMode = vi.fn()
    const setSystemIsDark = vi.fn()
    const cleanup = await mod.initializeTheme(setThemeMode, setSystemIsDark)
    expect(typeof cleanup).toBe('function')
    cleanup()
  })

  it('updateThemeMode persists to localStorage', async () => {
    await mod.updateThemeMode('dark')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hermes-theme-mode', 'dark')
  })

  it('updateThemeStyle persists to localStorage', async () => {
    await mod.updateThemeStyle('ocean-dark')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hermes-theme-style', 'ocean-dark')
  })
})
