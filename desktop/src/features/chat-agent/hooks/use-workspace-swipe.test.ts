import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider } from 'jotai'
import { useWorkspaceSwipe, useWorkspaceArrowSwitch } from './use-workspace-swipe'
import { createElement, type ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, null, children)

describe('use-workspace-swipe', () => {
  it('useWorkspaceSwipe initializes without throwing', () => {
    const { result } = renderHook(() => useWorkspaceSwipe({ current: null }), { wrapper })
    expect(result.current).toBeUndefined()
  })

  it('useWorkspaceArrowSwitch is callable', () => {
    const { result } = renderHook(() => useWorkspaceArrowSwitch(), { wrapper })
    expect(result.current).toBeUndefined()
  })
})
