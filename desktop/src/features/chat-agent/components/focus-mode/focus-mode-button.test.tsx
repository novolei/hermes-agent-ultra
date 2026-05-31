// Ported verbatim from uclaw components/focus-mode/FocusModeButton.test.tsx — Plan AS.a
import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { MotionConfig } from 'motion/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { FocusModeButton } from './focus-mode-button'
import { focusModeAtom } from '@/features/chat-agent/atoms/focus-mode-atoms'

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

describe('FocusModeButton', () => {
  it('renders the enter-focus title when focus mode is OFF', () => {
    renderWithProviders(<FocusModeButton />)
    const btn = screen.getByRole('button', { name: /进入专注模式/ })
    expect(btn).not.toBeNull()
  })

  it('flips title to exit-focus when focus mode is ON, and click toggles the atom', async () => {
    const { store, user } = renderWithProviders(<FocusModeButton />)
    expect(store.get(focusModeAtom)).toBe(false)
    await user.click(screen.getByRole('button', { name: /进入专注模式/ }))
    expect(store.get(focusModeAtom)).toBe(true)
    // After toggle, the button's aria-label updates
    expect(screen.getByRole('button', { name: /退出专注模式/ })).not.toBeNull()
  })
})
