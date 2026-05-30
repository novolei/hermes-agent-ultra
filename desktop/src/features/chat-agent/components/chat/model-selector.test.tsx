/**
 * model-selector.test.tsx — mount smoke test for ModelSelector
 *
 * Verifies that ModelSelector renders its trigger button (showing "选择模型"
 * when no model is selected and channels are empty).
 *
 * Wave D1 — chat.a.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { ModelSelector } from './model-selector'

// Mock tauri-bridge-stub: listChannels → [], updateConversationModel → resolves
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({
  listChannels: vi.fn(async () => []),
  updateConversationModel: vi.fn(async () => ({})),
}))

// Mock session-context so useConversationIdOptional returns null
// (outside a ConversationProvider the selector still mounts in "global" mode)
vi.mock('@/features/chat-agent/contexts/session-context', () => ({
  useConversationIdOptional: vi.fn(() => null),
  useConversationId: vi.fn(() => 'test-conv-id'),
}))

function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}>{ui}</Provider>)
}

describe('ModelSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the trigger button showing 选择模型 when no model is selected', () => {
    const store = createStore()
    renderWithProviders(<ModelSelector />, { store })

    // The trigger button shows "选择模型" when displayModelInfo is null
    const trigger = screen.getByRole('button', { name: /选择模型/i })
    expect(trigger).toBeInTheDocument()
  })

  it('trigger button is a plain button (not disabled by default)', () => {
    const store = createStore()
    renderWithProviders(<ModelSelector />, { store })

    const trigger = screen.getByRole('button', { name: /选择模型/i })
    expect(trigger).not.toBeDisabled()
  })
})
