import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider } from 'jotai'
import { useSyncActiveTabSideEffects } from './use-sync-active-tab-side-effects'
import { createElement, type ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, null, children)

describe('use-sync-active-tab-side-effects', () => {
  it('initializes without throwing', () => {
    const { result } = renderHook(() => useSyncActiveTabSideEffects(), { wrapper })
    expect(result).toBeDefined()
  })
})
