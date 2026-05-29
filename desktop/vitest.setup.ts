import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Provide a simple in-memory localStorage polyfill for test environments
// where Node.js / jsdom does not expose window.localStorage.
// This allows jotai's atomWithStorage to function correctly in unit tests.
if (typeof globalThis.localStorage === 'undefined') {
  const storage: Record<string, string> = {}
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = String(value) },
      removeItem: (key: string) => { delete storage[key] },
      clear: () => { Object.keys(storage).forEach((k) => delete storage[k]) },
      get length() { return Object.keys(storage).length },
      key: (index: number) => Object.keys(storage)[index] ?? null,
    },
    writable: false,
  })
}

// Provide ResizeObserver polyfill for test environments where jsdom does not expose it
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserver,
    writable: true,
  })
}

afterEach(() => {
  cleanup()
  // Clear localStorage between tests to prevent state leakage.
  if (typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.clear()
  }
})
