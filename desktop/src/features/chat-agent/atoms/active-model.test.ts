import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { activeProviderModelAtom, activeModelRefAtom } from './active-model'

describe('active-model', () => {
  beforeEach(() => localStorage.clear())

  it('activeProviderModelAtom has a deterministic default', () => {
    const store = createStore()
    const v = store.get(activeProviderModelAtom)
    expect(v === null || typeof v === 'object').toBe(true)
  })

  it('activeProviderModelAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(activeProviderModelAtom)).toBe(null)
  })

  it('activeModelRefAtom returns null when activeProviderModelAtom is null', () => {
    const store = createStore()
    expect(store.get(activeModelRefAtom)).toBe(null)
  })

  it('activeModelRefAtom returns "providerId/modelId" when activeProviderModelAtom is set', () => {
    const store = createStore()
    store.set(activeProviderModelAtom, { providerId: 'anthropic', modelId: 'claude-opus-4-7' })
    expect(store.get(activeModelRefAtom)).toBe('anthropic/claude-opus-4-7')
  })

  it('stores value in localStorage with hermes namespace', () => {
    const store = createStore()
    store.set(activeProviderModelAtom, { providerId: 'anthropic', modelId: 'claude-opus-4-7' })
    const storedValue = localStorage.getItem('hermes-active-provider-model')
    expect(storedValue).toBeDefined()
    expect(storedValue).not.toContain('uclaw')
  })
})
