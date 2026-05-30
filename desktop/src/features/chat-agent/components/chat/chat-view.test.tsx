/**
 * chat-view.test.tsx — smoke test for ChatView (chat.c Wave C1)
 *
 * Mounts <ChatView conversationId="conv-1"> and asserts:
 *   1. ChatInput renders (data-input-mode="chat").
 *   2. No unhandled rejection from mount-time IPC calls.
 */

import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatView } from './chat-view'

// ─── Mock IPC stubs ──────────────────────────────────────────────────────────
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({
  // Message-lifecycle stubs that mount-effects call
  getRecentMessages: vi.fn().mockResolvedValue({ messages: [], hasMore: false }),
  getConversationMessages: vi.fn().mockResolvedValue([]),
  sendMessage: vi.fn().mockResolvedValue({ messageId: 'm1', conversationId: 'conv-1', response: '' }),
  stopGeneration: vi.fn().mockResolvedValue(undefined),
  updateContextDividers: vi.fn().mockResolvedValue(undefined),
  saveAttachment: vi.fn().mockResolvedValue({ attachment: {} }),
  deleteAttachment: vi.fn().mockResolvedValue(undefined),
  deleteMessage: vi.fn().mockResolvedValue([]),
  truncateMessagesFrom: vi.fn().mockResolvedValue([]),
  generateTitle: vi.fn().mockResolvedValue(''),
  // Stream listeners
  onStreamChunk: vi.fn().mockReturnValue(() => {}),
  onStreamReasoning: vi.fn().mockReturnValue(() => {}),
  onStreamComplete: vi.fn().mockReturnValue(() => {}),
  onStreamError: vi.fn().mockReturnValue(() => {}),
  onStreamToolActivity: vi.fn().mockReturnValue(() => {}),
  // Conversation IPC
  listConversations: vi.fn().mockResolvedValue([]),
  updateConversationTitle: vi.fn().mockResolvedValue({ id: 'conv-1', title: 'Test', pinned: false, createdAt: 0, updatedAt: 0 }),
  togglePinConversation: vi.fn().mockResolvedValue({ id: 'conv-1', title: 'Test', pinned: true, createdAt: 0, updatedAt: 0 }),
  // System prompt + tools
  getSystemPromptConfig: vi.fn().mockResolvedValue({ prompts: [], defaultPromptId: null }),
  getChatTools: vi.fn().mockResolvedValue([]),
  listChannels: vi.fn().mockResolvedValue([]),
  getAllConfiguredModels: vi.fn().mockResolvedValue([]),
  updateConversationModel: vi.fn().mockResolvedValue({}),
  migrateChatToAgent: vi.fn().mockResolvedValue(undefined),
  updateChatToolState: vi.fn().mockResolvedValue(undefined),
  updateAppendSetting: vi.fn().mockResolvedValue(undefined),
  // Skills
  listSkills: vi.fn().mockResolvedValue([]),
  listLearnedSkills: vi.fn().mockResolvedValue([]),
  readAttachment: vi.fn().mockResolvedValue(''),
}))

// Mock raw Tauri APIs that sub-components (AgentRecommendBanner, etc.) call on
// mount — without these jsdom throws `transformCallback is undefined` unhandled
// rejections (Tauri runtime absent in tests).
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}))

// ─── Inline renderWithProviders ───────────────────────────────────────────────
function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}><TooltipProvider>{ui}</TooltipProvider></Provider>)
}

describe('ChatView smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ChatInput (data-input-mode="chat")', async () => {
    const { container } = renderWithProviders(<ChatView conversationId="conv-1" />)
    // ChatInput sets data-input-mode="chat" on its root element
    const chatInput = container.querySelector('[data-input-mode="chat"]')
    expect(chatInput).not.toBeNull()
  })

  it('renders without throwing (no unhandled rejection)', () => {
    expect(() => renderWithProviders(<ChatView conversationId="conv-1" />)).not.toThrow()
  })
})
