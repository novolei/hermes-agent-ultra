/**
 * PromptsSettings — ported from uclaw PromptsSettings.test.tsx.
 * Retargets: renderWithProviders → render+Provider, @/lib/tauri-bridge → tauri-bridge-stub.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import { PromptsSettings } from './prompts-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    readWorkspaceUclawMd: vi.fn(async () => '# my project\nuse rust 2021'),
    writeWorkspaceUclawMd: vi.fn(async () => {}),
    readDefaultPrompts: vi.fn(async () => ({
      baseline: 'BASELINE_TEXT',
      modeAsk: 'ASK_TEXT',
      modeAcceptEdits: 'ACCEPT_EDITS_TEXT',
      modePlan: 'PLAN_TEXT',
      modeBypass: 'BYPASS_TEXT',
    })),
    openWorkspaceUclawMdExternally: vi.fn(async () => {}),
  }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('PromptsSettings', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('loads existing uclaw.md into the textarea', async () => {
    render(
      <Provider>
        <PromptsSettings />
      </Provider>,
    )
    await waitFor(() => {
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toContain('# my project')
    })
  })

  it('Save button calls writeWorkspaceUclawMd with edited content', async () => {
    const user = userEvent.setup()
    const bridge = await import('@/features/chat-agent/lib/tauri-bridge-stub')
    render(
      <Provider>
        <PromptsSettings />
      </Provider>,
    )
    const textarea = await waitFor(() => {
      const el = screen.getByRole('textbox') as HTMLTextAreaElement
      if (!el.value.includes('# my project')) throw new Error('not loaded')
      return el
    })
    await user.clear(textarea)
    await user.type(textarea, '# edited content')
    const save = screen.getByRole('button', { name: /保存/ })
    await user.click(save)
    await waitFor(() => {
      expect(bridge.writeWorkspaceUclawMd).toHaveBeenCalledWith('# edited content')
    })
  })

  it('expanding 内置行为护栏 shows baseline + mode prompt', async () => {
    const user = userEvent.setup()
    render(
      <Provider>
        <PromptsSettings />
      </Provider>,
    )
    await waitFor(() => screen.getByText(/内置行为护栏/i))
    const toggle = screen.getByText(/内置行为护栏/i)
    await user.click(toggle)
    await waitFor(() => {
      expect(screen.getByText('BASELINE_TEXT')).toBeInTheDocument()
    })
  })
})
