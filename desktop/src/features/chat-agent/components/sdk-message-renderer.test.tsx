/**
 * SDKMessageRenderer.test.tsx
 *
 * Ported from uclaw/ui/src/components/agent/SDKMessageRenderer.test.tsx
 * Retargets:
 *   ./SDKMessageRenderer               → ./sdk-message-renderer
 *   @/atoms/settings-tab               → @/features/chat-agent/lib/peripheral-stubs
 *   @/test-utils/render renderWithProviders → local inline helper (jotai Provider + store)
 *   @/lib/tauri-bridge mock            → @/features/chat-agent/lib/peripheral-stubs mock
 */

import { describe, expect, it, vi, beforeAll } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider as JotaiProvider } from 'jotai'
import { TooltipProvider } from '@/shared/ui/tooltip'
import {
  settingsOpenAtom,
  settingsTabAtom,
} from '@/features/chat-agent/lib/peripheral-stubs'
import {
  MessageGroupRenderer,
  SDKMessageRenderer,
  type MessageGroup,
  type SDKMessage,
} from './sdk-message-renderer'

// ── ResizeObserver stub (for ScrollMinimap / message components that use it) ──
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
})

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

vi.mock('@/features/chat-agent/lib/peripheral-stubs', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/features/chat-agent/lib/peripheral-stubs')>()
  return {
    ...original,
    readAttachment: vi.fn(),
    saveImageAs: vi.fn(),
    openExternal: vi.fn(),
  }
})

// ── renderWithProviders helper ────────────────────────────────────────────────

type JotaiStore = ReturnType<typeof createStore>

interface ProviderRenderResult {
  store: JotaiStore
  user: ReturnType<typeof userEvent.setup>
}

function renderWithProviders(
  ui: React.ReactElement,
  store = createStore(),
): ProviderRenderResult {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <JotaiProvider store={store}>
      <TooltipProvider>{children}</TooltipProvider>
    </JotaiProvider>
  )
  render(ui, { wrapper: Wrapper })
  const user = userEvent.setup()
  return { store, user }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

type AssistantErrorMessage = Extract<MessageGroup, { type: 'assistant-turn' }>['assistantMessages'][number]

function browserRuntimeErrorMessage(
  action = 'open_browser_runtime_settings',
  label = 'Open Browser Runtime Settings',
): SDKMessage {
  return {
    type: 'assistant',
    uuid: 'browser-runtime-error',
    error: { message: 'Browser runtime is unavailable' },
    message: {
      content: [
        {
          type: 'text',
          text: 'Browser runtime is unavailable. Open settings to inspect repair options.',
        },
      ],
    },
    _errorTitle: 'Browser runtime unavailable',
    _errorActions: [
      {
        action,
        label,
      },
    ],
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SDKMessageRenderer browser runtime recovery actions', () => {
  it('opens Browser Runtime settings from direct assistant error recovery actions', async () => {
    const message = browserRuntimeErrorMessage()
    const { store, user } = renderWithProviders(
      <SDKMessageRenderer message={message} allMessages={[message]} />,
    )

    await user.click(screen.getByRole('button', { name: 'Open Browser Runtime Settings' }))

    expect(store.get(settingsTabAtom)).toBe('browserRuntime')
    expect(store.get(settingsOpenAtom)).toBe(true)
  })

  it('opens Browser Runtime settings from grouped assistant-turn error recovery actions', async () => {
    const message = browserRuntimeErrorMessage()
    const group: MessageGroup = {
      type: 'assistant-turn',
      assistantMessages: [message as AssistantErrorMessage],
      turnMessages: [message],
      model: 'test-model',
      createdAt: 1,
    }

    const { store, user } = renderWithProviders(
      <MessageGroupRenderer group={group} allMessages={[message]} />,
    )

    await user.click(screen.getByRole('button', { name: 'Open Browser Runtime Settings' }))

    expect(store.get(settingsTabAtom)).toBe('browserRuntime')
    expect(store.get(settingsOpenAtom)).toBe(true)
  })

  it('keeps generic settings recovery actions on the current settings tab', async () => {
    const message = browserRuntimeErrorMessage('settings', 'Open Settings')
    const { store, user } = renderWithProviders(
      <SDKMessageRenderer message={message} allMessages={[message]} />,
    )

    await user.click(screen.getByRole('button', { name: 'Open Settings' }))

    // 'settings' action calls setSettingsOpen(true) but does NOT change the tab
    // So tab stays at the atom's default value ('connectivity')
    expect(store.get(settingsTabAtom)).toBe('connectivity')
    expect(store.get(settingsOpenAtom)).toBe(true)
  })
})
