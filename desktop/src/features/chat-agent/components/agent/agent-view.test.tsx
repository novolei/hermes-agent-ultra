import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AgentView } from './agent-view'
import { AgentSessionProvider } from '@/features/chat-agent/contexts/session-context'
import { TooltipProvider } from '@/shared/ui/tooltip'

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

// Mock Tauri core so invoke() calls don't throw in jsdom.
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue({}) }))

// Mock @tauri-apps/api/event so listen() resolves with a no-op unlisten.
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <TooltipProvider>
        <AgentSessionProvider sessionId="test-session">
          {children}
        </AgentSessionProvider>
      </TooltipProvider>
    </Provider>
  )
}

describe('AgentView', () => {
  it('mounts without throwing', () => {
    const { container } = render(
      <Wrapper>
        <AgentView sessionId="test-session" />
      </Wrapper>,
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('renders the data-testid="agent-view" wrapper', () => {
    const { container } = render(
      <Wrapper>
        <AgentView sessionId="test-session" />
      </Wrapper>,
    )
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })

  it('stubbed banners render hidden placeholders (aria-hidden)', () => {
    const { container } = render(
      <Wrapper>
        <AgentView sessionId="test-session" />
      </Wrapper>,
    )
    const stubs = container.querySelectorAll('[data-stub]')
    expect(stubs.length).toBeGreaterThan(0)
    stubs.forEach((s) => expect((s as HTMLElement).getAttribute('aria-hidden')).toBe('true'))
  })
})
