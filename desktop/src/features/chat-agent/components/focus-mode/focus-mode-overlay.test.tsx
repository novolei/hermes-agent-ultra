// Ported verbatim from uclaw components/focus-mode/FocusModeOverlay.test.tsx — Plan AS.a
import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { MotionConfig } from 'motion/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { FocusModeOverlay } from './focus-mode-overlay'
import { focusModeAtom } from '@/features/chat-agent/atoms/focus-mode-atoms'
import { previewPanelOpenAtom } from '@/features/chat-agent/atoms/preview-panel-atoms'

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

describe('FocusModeOverlay', () => {
  it('renders nothing when focus mode is OFF', () => {
    renderWithProviders(<FocusModeOverlay />)
    expect(screen.queryByTestId('focus-glow-left')).toBeNull()
    expect(screen.queryByTestId('focus-glow-right')).toBeNull()
  })

  it('renders both glow indicators when focus mode is ON and preview is open', () => {
    const store = createStore()
    store.set(previewPanelOpenAtom, true)
    store.set(focusModeAtom, true)
    renderWithProviders(<FocusModeOverlay />, { store })
    expect(screen.queryByTestId('focus-glow-left')).not.toBeNull()
    expect(screen.queryByTestId('focus-glow-right')).not.toBeNull()
  })
})
