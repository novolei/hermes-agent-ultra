// Plan FB.c Wave D5 — TabContent smoke test
// Updated in chat.c Wave C2: real ChatView replaces the deferred stub.
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

// Mock tauri-bridge-stub — includes message IPCs needed by the real ChatView.
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
    // chat.c Wave C2 — message IPCs needed by the real ChatView on mount
    getRecentMessages: vi.fn().mockResolvedValue({ messages: [], hasMore: false }),
    getConversationMessages: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue({ messageId: 'm1', conversationId: 'chat-1', response: '' }),
    stopGeneration: vi.fn().mockResolvedValue(undefined),
    updateContextDividers: vi.fn().mockResolvedValue(undefined),
    saveAttachment: vi.fn().mockResolvedValue({ attachment: {} }),
    deleteAttachment: vi.fn().mockResolvedValue(undefined),
    deleteMessage: vi.fn().mockResolvedValue([]),
    truncateMessagesFrom: vi.fn().mockResolvedValue([]),
    generateTitle: vi.fn().mockResolvedValue(''),
    onStreamChunk: vi.fn().mockReturnValue(() => {}),
    onStreamReasoning: vi.fn().mockReturnValue(() => {}),
    onStreamComplete: vi.fn().mockReturnValue(() => {}),
    onStreamError: vi.fn().mockReturnValue(() => {}),
    onStreamToolActivity: vi.fn().mockReturnValue(() => {}),
    listConversations: vi.fn().mockResolvedValue([]),
    updateConversationTitle: vi.fn().mockResolvedValue({ id: 'chat-1', title: 'Chat 1', pinned: false, createdAt: 0, updatedAt: 0 }),
    togglePinConversation: vi.fn().mockResolvedValue({ id: 'chat-1', title: 'Chat 1', pinned: true, createdAt: 0, updatedAt: 0 }),
    getSystemPromptConfig: vi.fn().mockResolvedValue({ prompts: [], defaultPromptId: null }),
    getChatTools: vi.fn().mockResolvedValue([]),
    listChannels: vi.fn().mockResolvedValue([]),
    getAllConfiguredModels: vi.fn().mockResolvedValue([]),
    updateConversationModel: vi.fn().mockResolvedValue({}),
    migrateChatToAgent: vi.fn().mockResolvedValue(undefined),
    updateChatToolState: vi.fn().mockResolvedValue(undefined),
    updateAppendSetting: vi.fn().mockResolvedValue(undefined),
    listSkills: vi.fn().mockResolvedValue([]),
    listLearnedSkills: vi.fn().mockResolvedValue([]),
    readAttachment: vi.fn().mockResolvedValue(''),
  }
})

function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}><TooltipProvider>{ui}</TooltipProvider></Provider>)
}

describe('TabContent smoke test', () => {
  it('renders the real ChatView (data-input-mode="chat") for a chat tab', () => {
    const store = createStore()
    store.set(tabsAtom, [
      { id: 'chat-1', type: 'chat', sessionId: 'chat-1', title: 'Chat 1', workspaceId: 'ws-1' },
    ])
    store.set(workspaceActiveTabIdMapAtom, new Map([['ws-1', 'chat-1']]))
    store.set(activeWorkspaceIdAtom, 'ws-1')

    renderWithProviders(<TabContent tabId="chat-1" />, { store })

    // Real ChatView renders ChatInput with data-input-mode="chat"
    const chatInput = document.querySelector('[data-input-mode="chat"]')
    expect(chatInput).not.toBeNull()
    // Confirm the old stub marker is gone
    const stub = document.querySelector('[data-deferred-stub="ChatView"]')
    expect(stub).toBeNull()
  })

  it('renders "标签页不存在" message when tabId is not found', () => {
    const store = createStore()
    store.set(tabsAtom, [])
    store.set(activeWorkspaceIdAtom, 'ws-1')

    renderWithProviders(<TabContent tabId="nonexistent-tab" />, { store })

    expect(screen.getByText('标签页不存在')).toBeInTheDocument()
  })
})
