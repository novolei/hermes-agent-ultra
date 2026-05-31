// Ported verbatim from uclaw components/focus-mode/GlowIndicator.test.tsx — Plan AS.a
import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { MotionConfig } from 'motion/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { GlowIndicator } from './glow-indicator'

function renderWithProviders(
  ui: React.ReactElement,
  opts?: { store?: ReturnType<typeof createStore> },
) {
  const store = opts?.store ?? createStore()
  const result = render(
    <Provider store={store}>
      <MotionConfig reducedMotion="always">
        <TooltipProvider>{ui}</TooltipProvider>
      </MotionConfig>
    </Provider>,
  )
  return { ...result, user: userEvent.setup(), store }
}

describe('GlowIndicator', () => {
  it('renders the three-layer glow + trace with the correct side classes', () => {
    renderWithProviders(<GlowIndicator side="left" />)
    const wrapper = screen.getByTestId('focus-glow-left')
    expect(wrapper).not.toBeNull()
    // Each of halo / soft / core / trace should be present
    expect(wrapper.querySelector('.focus-glow-halo')).not.toBeNull()
    expect(wrapper.querySelector('.focus-glow-soft')).not.toBeNull()
    expect(wrapper.querySelector('.focus-glow-core')).not.toBeNull()
    expect(wrapper.querySelector('.focus-glow-trace')).not.toBeNull()
  })
})
