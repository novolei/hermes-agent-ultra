/**
 * chat-header.test.tsx — smoke test for ChatHeader (chat.c Wave B)
 *
 * Mounts <ChatHeader conversation={...}> and asserts:
 *   1. The conversation title renders.
 *   2. At least one header control (pin or parallel button) renders.
 */

import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatHeader } from './chat-header'
import { ConversationProvider } from '@/features/chat-agent/contexts/session-context'
import type { ConversationMeta } from '@/features/chat-agent/lib/chat-types'

// ─── Mock IPC stubs ──────────────────────────────────────────────────────────
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({
  updateConversationTitle: vi.fn().mockResolvedValue({ id: 'conv-1', title: 'Updated', pinned: false, createdAt: 0, updatedAt: 0 }),
  togglePinConversation: vi.fn().mockResolvedValue({ id: 'conv-1', title: 'Test Conversation', pinned: true, createdAt: 0, updatedAt: 0 }),
  getSystemPromptConfig: vi.fn().mockResolvedValue({ prompts: [], defaultPromptId: null }),
  updateConversationModel: vi.fn().mockResolvedValue({}),
}))

// ─── Inline renderWithProviders ───────────────────────────────────────────────
function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(
    <Provider store={opts?.store}>
      <TooltipProvider>
        <ConversationProvider conversationId="conv-1">
          {ui}
        </ConversationProvider>
      </TooltipProvider>
    </Provider>
  )
}

const mockConversation: ConversationMeta = {
  id: 'conv-1',
  title: 'Test Conversation',
  pinned: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

describe('ChatHeader smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the conversation title', () => {
    const { container } = renderWithProviders(<ChatHeader conversation={mockConversation} />)
    expect(container.textContent).toContain('Test Conversation')
  })

  it('renders at least one header control button', () => {
    const { container } = renderWithProviders(<ChatHeader conversation={mockConversation} />)
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders null when conversation is null', () => {
    const { container } = renderWithProviders(<ChatHeader conversation={null} />)
    expect(container.firstChild).toBeNull()
  })
})
