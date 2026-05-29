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

// Mock the bridge stubs that PermissionModeSelector now invokes during mount
// (Plan 4.b promoted PermissionModeSelector from a stub to a real component
// in agent-view's JSX). Without these mocks the real getSafetyPolicy stub
// throws NOT_IMPLEMENTED and pollutes the test stderr with unhandled-rejection
// noise — tests still pass because the .catch() fires async, but the noise
// violates the zero-console-error invariant. Returning a sane SafetyPolicy
// shape keeps the selector quiet.
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getSafetyPolicy: vi.fn().mockResolvedValue({
      globalMode: 'ask',
      toolOverrides: {},
      autoApprovedTools: [],
      blockedTools: [],
    }),
    setSafetyMode: vi.fn().mockResolvedValue(undefined),
  }
})

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

  it('zero [data-stub] placeholders remain (Wave D complete — all stubs replaced by real components)', () => {
    const { container } = render(
      <Wrapper>
        <AgentView sessionId="test-session" />
      </Wrapper>,
    )
    const stubs = container.querySelectorAll('[data-stub]')
    expect(stubs.length).toBe(0)
  })
})
