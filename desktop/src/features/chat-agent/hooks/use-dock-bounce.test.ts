import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider } from 'jotai'
import { useDockBounce } from './use-dock-bounce'
import { createElement, type ReactNode, useRef } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, null, children)

describe('use-dock-bounce', () => {
  it('initializes without throwing', () => {
    const { result } = renderHook(
      () => {
        const ref = useRef(null)
        useDockBounce(ref)
        return ref
      },
      { wrapper },
    )
    expect(result).toBeDefined()
  })
})
