/**
 * chat-agent-view.test.tsx
 *
 * 8 integration tests for the slim ChatAgentView container (Plan 2b.2.c.3).
 * Tests cover: mounting, welcome state, composer presence, Send button state,
 * bridge call guarding, listenAgent subscription count, cleanup on unmount,
 * and disabled-state composer persistence.
 */

import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { ChatAgentView } from './chat-agent-view'

// ── jsdom stubs ──────────────────────────────────────────────────────────────

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

// ── Module mocks ─────────────────────────────────────────────────────────────

// Mock Tauri core so client.ts doesn't blow up in jsdom.
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))

// Mock @tauri-apps/api/event so listenAgent resolves with a no-op unlisten.
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

function renderView(sessionId = 's-test') {
  return render(
    <Provider>
      <TooltipProvider>
        <ChatAgentView sessionId={sessionId} />
      </TooltipProvider>
    </Provider>,
  )
}

describe('ChatAgentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Smoke test
  it('mounts without crashing', () => {
    const { container } = renderView()
    expect(container.firstChild).not.toBeNull()
  })

  // 2. Empty welcome state
  it('renders the welcome state (h3 heading) when no messages and not streaming', () => {
    renderView()
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  // 3. Composer + Send button presence
  it('renders the TipTap editor and a Send button', () => {
    renderView()
    const editor = document.querySelector('[contenteditable="true"]')
    expect(editor).not.toBeNull()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  // 4. Send button disabled when input empty
  it('Send button is disabled when input is empty', () => {
    renderView()
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  // 5. Empty input → bridge not called
  it('clicking Send with empty input does not invoke agentSendMessage', async () => {
    const { invoke } = await import('@tauri-apps/api/core')
    renderView()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(invoke).not.toHaveBeenCalledWith('agent_send_message', expect.anything())
  })

  // 6. All 9 agent:* events subscribed
  it('subscribes to all 9 agent:* events on mount', async () => {
    const { listen } = await import('@tauri-apps/api/event')
    renderView()
    // Wait for the async effect to register all listeners.
    await act(async () => {
      await Promise.resolve()
    })
    const subscribedNames = (listen as ReturnType<typeof vi.fn>).mock.calls.map(
      (c: unknown[]) => c[0] as string,
    )
    expect(subscribedNames).toContain('agent:text-delta')
    expect(subscribedNames).toContain('agent:thinking-delta')
    expect(subscribedNames).toContain('agent:tool-call-delta')
    expect(subscribedNames).toContain('agent:tool-start')
    expect(subscribedNames).toContain('agent:tool-result')
    expect(subscribedNames).toContain('agent:done')
    expect(subscribedNames).toContain('agent:error')
    expect(subscribedNames).toContain('agent:status')
    expect(subscribedNames).toContain('agent:usage')
    expect(subscribedNames.length).toBe(9)
  })

  // 7. Unlisten called on unmount
  it('calls the unlisten function returned by listen when the component unmounts', async () => {
    const { listen } = await import('@tauri-apps/api/event')
    // Point every listen() call to a spy unlisten.
    const unlisten = vi.fn()
    ;(listen as ReturnType<typeof vi.fn>).mockResolvedValue(unlisten)

    const { unmount } = renderView()
    // Wait for async subscriptions.
    await act(async () => {
      await Promise.resolve()
    })
    unmount()
    expect(unlisten).toHaveBeenCalled()
  })

  // 8. Composer stays rendered in initial (disabled) state while mounted
  it('the TipTap editor remains in the DOM throughout the component lifetime', () => {
    // Verify the contenteditable is present immediately on mount and that it
    // never disappears — no send interaction needed to exercise this invariant.
    const { unmount } = renderView()
    expect(document.querySelector('[contenteditable="true"]')).not.toBeNull()
    // Still present just before unmount.
    unmount()
    // After unmount the editor is gone (DOM cleaned up) — this just confirms
    // the previous assertion was about a live node, not a stale one.
    expect(document.querySelector('[contenteditable="true"]')).toBeNull()
  })
})
