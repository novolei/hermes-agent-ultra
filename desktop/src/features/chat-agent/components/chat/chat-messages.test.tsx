/**
 * Smoke test for ChatMessages — chat.b Wave B4
 */
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { describe, it, expect, vi } from 'vitest'
import { ChatMessages } from './chat-messages'
import type { ChatMessage } from '@/features/chat-agent/lib/chat-types'
import { ConversationProvider } from '@/features/chat-agent/contexts/session-context'

function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore>; conversationId?: string }) {
  const convId = opts?.conversationId ?? 'conv-1'
  return render(
    <Provider store={opts?.store}>
      <TooltipProvider>
        <ConversationProvider conversationId={convId}>
          {ui}
        </ConversationProvider>
      </TooltipProvider>
    </Provider>
  )
}

// Minimal mocks for tauri + tauri-bridge-stub (IPC stubs)
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockRejectedValue(new Error('not implemented')),
}))

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    listSkills: vi.fn().mockResolvedValue([]),
    listLearnedSkills: vi.fn().mockResolvedValue([]),
  }
})

const SEED_MESSAGE: ChatMessage = {
  id: 'msg-1',
  role: 'user',
  content: 'Hello test message',
  createdAt: Date.now(),
  model: undefined,
  attachments: [],
}

describe('ChatMessages smoke', () => {
  it('renders a seeded user message', () => {
    const { getByText } = renderWithProviders(
      <ChatMessages
        conversationId="conv-1"
        messages={[SEED_MESSAGE]}
        messagesLoaded={true}
        streaming={false}
        streamingContent=""
        streamingReasoning=""
        streamingModel={null}
        toolActivities={[]}
        contextDividers={[]}
        hasMore={false}
      />
    )
    expect(getByText('Hello test message')).toBeTruthy()
  })

  it('renders the welcome empty state when messages is empty and not streaming', () => {
    const { getByTestId } = renderWithProviders(
      <ChatMessages
        conversationId="conv-empty"
        messages={[]}
        messagesLoaded={true}
        streaming={false}
        streamingContent=""
        streamingReasoning=""
        streamingModel={null}
        toolActivities={[]}
        contextDividers={[]}
        hasMore={false}
      />
    )
    expect(getByTestId('welcome-empty-state')).toBeTruthy()
  })
})
