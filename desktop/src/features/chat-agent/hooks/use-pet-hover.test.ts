import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { usePetHover } from './use-pet-hover'
import { petHoverActiveAtom } from '@/features/chat-agent/atoms/pet-atoms'
import { createElement, type ReactNode } from 'react'

const wrapper = (store: ReturnType<typeof createStore>) => {
  return ({ children }: { children: ReactNode }) => createElement(Provider, { store }, children)
}

describe('usePetHover', () => {
  it('initializes with onMouseEnter and onMouseLeave handlers', () => {
    const store = createStore()
    const { result } = renderHook(() => usePetHover(), { wrapper: wrapper(store) })
    expect(result.current).toHaveProperty('onMouseEnter')
    expect(result.current).toHaveProperty('onMouseLeave')
    expect(typeof result.current.onMouseEnter).toBe('function')
    expect(typeof result.current.onMouseLeave).toBe('function')
  })

  it('sets petHoverActiveAtom to true on onMouseEnter', () => {
    const store = createStore()
    const { result } = renderHook(() => usePetHover(), { wrapper: wrapper(store) })
    result.current.onMouseEnter()
    expect(store.get(petHoverActiveAtom)).toBe(true)
  })

  it('sets petHoverActiveAtom to false on onMouseLeave', () => {
    const store = createStore()
    const { result } = renderHook(() => usePetHover(), { wrapper: wrapper(store) })
    result.current.onMouseEnter()
    result.current.onMouseLeave()
    expect(store.get(petHoverActiveAtom)).toBe(false)
  })
})
