/**
 * PromptSettings — mount smoke tests.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import { PromptSettings } from './prompt-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getSystemPromptConfig: vi.fn(async () => ({
      prompts: [
        { id: 'builtin-default', name: '默认提示词', content: '内置默认提示词内容', isBuiltin: true, createdAt: 0, updatedAt: 0 },
      ],
      defaultPromptId: 'builtin-default',
    })),
    createSystemPrompt: vi.fn(async (input) => ({ id: 'new-id', ...input, isBuiltin: false, createdAt: 0, updatedAt: 0 })),
    updateSystemPrompt: vi.fn(async (id, input) => ({ id, ...input, isBuiltin: false, createdAt: 0, updatedAt: 0 })),
    deleteSystemPrompt: vi.fn(async () => {}),
    setDefaultPrompt: vi.fn(async () => {}),
    getSystemPromptVersions: vi.fn(async () => []),
  }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('PromptSettings', () => {
  it('shows loading spinner initially then renders prompt list', async () => {
    render(
      <Provider>
        <PromptSettings />
      </Provider>,
    )
    // After loading, the prompt header should appear
    await waitFor(() => {
      expect(screen.getByText('系统提示词')).toBeInTheDocument()
    })
  })

  it('renders the builtin default prompt after loading', async () => {
    render(
      <Provider>
        <PromptSettings />
      </Provider>,
    )
    await waitFor(() => {
      expect(screen.getByText('默认提示词')).toBeInTheDocument()
    })
  })

  it('renders 新建 button', async () => {
    render(
      <Provider>
        <PromptSettings />
      </Provider>,
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /新建/ })).toBeInTheDocument()
    })
  })
})
