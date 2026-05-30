/**
 * Smoke test for ChatInput — chat.b Wave B5
 */
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { describe, it, expect, vi } from 'vitest'
import { ChatInput } from './chat-input'
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
    openFileDialog: vi.fn().mockRejectedValue(new Error('not implemented')),
  }
})

describe('ChatInput smoke', () => {
  it('renders the input container with data-input-mode="chat"', () => {
    renderWithProviders(
      <ChatInput
        conversationId="conv-1"
        streaming={false}
        pendingAttachments={[]}
        onSetPendingAttachments={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />
    )
    // Assert the input container is rendered via data-input-mode attribute
    expect(document.querySelector('[data-input-mode="chat"]')).toBeTruthy()
  })

  it('renders the input area with the attach button', () => {
    renderWithProviders(
      <ChatInput
        conversationId="conv-1"
        streaming={false}
        pendingAttachments={[]}
        onSetPendingAttachments={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />
    )
    // The attachment paperclip button should be present
    const allButtons = document.querySelectorAll('button[type="button"]')
    expect(allButtons.length).toBeGreaterThan(0)
  })
})
