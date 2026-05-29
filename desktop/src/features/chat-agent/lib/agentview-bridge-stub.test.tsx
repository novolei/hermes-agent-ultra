/**
 * Smoke tests for agentview-bridge-stub.tsx — Plan 2b.2.c.4.a
 *
 * Verifies:
 *   1. Sufficient number of component stub exports exist (future-proof count check)
 *   2. Key component stubs render a hidden placeholder with the expected data-stub attr
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import type React from 'react'
import * as stubs from './agentview-bridge-stub'

describe('agentview-bridge-stub', () => {
  it('exports the expected count of component stubs', () => {
    const componentKeys = Object.keys(stubs).filter((k) => {
      const v = (stubs as Record<string, unknown>)[k]
      return typeof v === 'function' && k[0] === k[0].toUpperCase()
    })
    // 4.b (12) + 4.c (3) stubs removed — now real components.
    // Remaining: 4.d (4) + 4.e (2) = 6 component stubs
    expect(componentKeys.length).toBeGreaterThanOrEqual(6)
  })

  it.each([
    // 4.d
    'PetWidget',
    'BrowserPreviewOverlay',
    'AutoPreviewPopover',
    'ProviderModelSelector',
    // 4.e chat-surface
    'FeishuNotifyToggle',
    'GitChipsRow',
  ])('%s renders a hidden placeholder with data-stub', (name) => {
    const Comp = (stubs as unknown as Record<string, React.ComponentType>)[name]
    expect(Comp, `${name} should be defined`).toBeDefined()
    const { container } = render(<Comp />)
    const el = container.querySelector(`[data-stub="${name}"]`)
    expect(el, `[data-stub="${name}"] should be in DOM`).not.toBeNull()
  })
})
