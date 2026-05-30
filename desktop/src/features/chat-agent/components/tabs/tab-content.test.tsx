// Plan FB.c Wave D5 — TabContent smoke test
// Verifies: chat tab renders ChatView stub marker; component mounts without throwing.
import { describe, it, expect, beforeAll, vi } from 'vitest'
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { TabContent } from './tab-content'
import { tabsAtom, workspaceActiveTabIdMapAtom } from '@/features/chat-agent/atoms/tab-atoms'
import { activeWorkspaceIdAtom } from '@/features/chat-agent/atoms/workspace'

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

// Mock Tauri IPC so invoke() calls don't throw in jsdom.
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn().mockResolvedValue({}) }))
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

// Mock tauri-bridge-stub (AgentView triggers getSafetyPolicy on mount).
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = (await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>())
  return {
    ...actual,
    getSafetyPolicy: vi.fn().mockResolvedValue({
      globalMode: 'ask',
      toolOverrides: {},
      autoApprovedTools: [],
      blockedTools: [],
    }),
    setSafetyMode: vi.fn().mockResolvedValue(undefined),
    setActiveWorkspaceId: vi.fn(),
    listSpaces: vi.fn().mockResolvedValue([]),
    getActiveWorkspaceId: vi.fn().mockResolvedValue(null),
  }
})

function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}><TooltipProvider>{ui}</TooltipProvider></Provider>)
}

describe('TabContent smoke test', () => {
  it('renders ChatView deferred-stub marker for a chat tab', () => {
    const store = createStore()
    store.set(tabsAtom, [
      { id: 'chat-1', type: 'chat', sessionId: 'chat-1', title: 'Chat 1', workspaceId: 'ws-1' },
    ])
    store.set(workspaceActiveTabIdMapAtom, new Map([['ws-1', 'chat-1']]))
    store.set(activeWorkspaceIdAtom, 'ws-1')

    renderWithProviders(<TabContent tabId="chat-1" />, { store })

    // ChatView is a deferred stub — it renders data-deferred-stub="ChatView"
    const stub = document.querySelector('[data-deferred-stub="ChatView"]')
    expect(stub).not.toBeNull()
    expect(stub?.textContent).toContain('聊天视图')
  })

  it('renders "标签页不存在" message when tabId is not found', () => {
    const store = createStore()
    store.set(tabsAtom, [])
    store.set(activeWorkspaceIdAtom, 'ws-1')

    renderWithProviders(<TabContent tabId="nonexistent-tab" />, { store })

    expect(screen.getByText('标签页不存在')).toBeInTheDocument()
  })
})
