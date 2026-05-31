// Ported verbatim from uclaw components/focus-mode/FloatingIsland.test.tsx — Plan AS.a
import * as React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { MotionConfig } from 'motion/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { FloatingIsland } from './floating-island'
import {
  focusRevealSideAtom,
  focusRevealPinnedAtom,
} from '@/features/chat-agent/atoms/focus-mode-atoms'

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

describe('FloatingIsland', () => {
  it('renders children when reveal matches its side', () => {
    const store = createStore()
    store.set(focusRevealSideAtom, 'left')
    renderWithProviders(
      <FloatingIsland side="left">
        <div>left-children</div>
      </FloatingIsland>,
      { store },
    )
    expect(screen.queryByText('left-children')).not.toBeNull()
  })

  it('does NOT render children when reveal is the other side', () => {
    const store = createStore()
    store.set(focusRevealSideAtom, 'right')
    renderWithProviders(
      <FloatingIsland side="left">
        <div>left-children</div>
      </FloatingIsland>,
      { store },
    )
    expect(screen.queryByText('left-children')).toBeNull()
  })

  it('clicking inside the island does NOT auto-pin (2026-05-13 fix)', async () => {
    // Previous behaviour: clicking any element inside the island set
    // focusRevealPinnedAtom = true, which then froze the hotzone leave
    // timer and the island stuck on screen until clicked outside.
    // New behaviour: plain clicks do not pin. Hotzone's 200ms leave timer
    // fires the moment the mouse exits the island region — the user can
    // click a session row and then drift the mouse back to the preview
    // and the island will auto-hide.
    const store = createStore()
    store.set(focusRevealSideAtom, 'left')
    const { user } = renderWithProviders(
      <FloatingIsland side="left">
        <button>inside-button</button>
      </FloatingIsland>,
      { store },
    )
    expect(store.get(focusRevealPinnedAtom)).toBe(false)
    await user.click(screen.getByText('inside-button'))
    expect(store.get(focusRevealPinnedAtom)).toBe(false)
  })
})
