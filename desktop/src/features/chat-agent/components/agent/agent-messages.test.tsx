/**
 * agent-messages.test.tsx — smoke tests for the components/agent/ barrel.
 *
 * Plan C1 of Plan 2b.2.c.4.a: verifies the re-export barrel resolves
 * correctly and the component renders the WelcomeEmptyState for an
 * empty session.
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { AgentMessages } from './agent-messages'
import type { AgentMessagesProps } from './agent-messages'

// useChipCacheInvalidator calls listen() from @tauri-apps/api/event (absent in
// jsdom); useFileChipResolver calls invoke() from @tauri-apps/api/core. Restored
// these mocks now that PV.c swapped the Jotai-free/IPC-free stubs for real chips.
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async () => () => {}),
  emit: vi.fn(async () => {}),
}))
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => []),
}))

// ResizeObserver stub — ScrollMinimap uses it
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = function () {}
  }
})

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

function renderAM(propsOverride: Partial<AgentMessagesProps> = {}) {
  const props: AgentMessagesProps = {
    sessionId: 'test-session',
    messages: [],
    messagesLoaded: true,
    streaming: false,
    ...propsOverride,
  }
  return render(
    <Provider>
      <TooltipProvider>
        <AgentMessages {...props} />
      </TooltipProvider>
    </Provider>,
  )
}

describe('AgentMessages (components/agent/ barrel)', () => {
  it('renders without throwing when messages list is empty', () => {
    const { container } = renderAM()
    expect(container.firstChild).toBeTruthy()
  })

  it('mounts WelcomeEmptyState when message list is empty and not streaming', () => {
    renderAM()
    // welcome-empty-state data-testid added as Plan 3.3 carry-forward test seam
    expect(screen.getByTestId('welcome-empty-state')).not.toBeNull()
  })

  it('does NOT render WelcomeEmptyState when streaming is true', () => {
    renderAM({
      messages: [],
      streaming: true,
      streamState: {
        running: true,
        content: 'thinking...',
        toolActivities: [],
        teammates: [],
      },
    })
    expect(screen.queryByTestId('welcome-empty-state')).toBeNull()
  })

  it('re-exports DurationBadge from the barrel', async () => {
    const mod = await import('./agent-messages')
    expect(typeof mod.DurationBadge).toBe('function')
  })

  it('re-exports formatDuration from the barrel', async () => {
    const mod = await import('./agent-messages')
    expect(typeof mod.formatDuration).toBe('function')
  })
})
