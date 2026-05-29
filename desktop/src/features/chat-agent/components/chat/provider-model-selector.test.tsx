import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider as JotaiProvider } from 'jotai'
import { settingsOpenAtom, settingsTabAtom } from '@/features/chat-agent/atoms/settings-tab'
import { ProviderModelSelector } from './provider-model-selector'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({
  getAllConfiguredModels: vi.fn(async () => []),
  getActiveModel: vi.fn(async () => null),
  setActiveModel: vi.fn(),
  setRoleModel: vi.fn(),
}))

// active-model atom reads from localStorage; silence any side-effects
vi.mock('@/features/chat-agent/atoms/active-model', () => ({
  activeProviderModelAtom: { init: null, read: () => null, write: () => {} },
}))

// ── renderWithProviders helper ────────────────────────────────────────────────

type JotaiStore = ReturnType<typeof createStore>

interface ProviderRenderResult {
  store: JotaiStore
  user: ReturnType<typeof userEvent.setup>
}

function renderWithProviders(
  ui: React.ReactElement,
  { store = createStore() }: { store?: JotaiStore } = {},
): ProviderRenderResult {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <JotaiProvider store={store}>
      {children}
    </JotaiProvider>
  )
  render(ui, { wrapper: Wrapper })
  const user = userEvent.setup()
  return { store, user }
}

describe('ProviderModelSelector empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the 配置服务商 button when no models are configured', async () => {
    const store = createStore()
    const { user } = renderWithProviders(<ProviderModelSelector />, { store })

    // Open the popover by clicking the trigger button
    await user.click(screen.getByRole('button', { name: /选择模型/i }))

    // The empty-state "配置服务商" button should appear
    const cfgBtn = await screen.findByRole('button', { name: /配置服务商/ })
    expect(cfgBtn).toBeInTheDocument()
  })

  it('configure-providers button opens settings to connectivity tab', async () => {
    const store = createStore()
    const { user } = renderWithProviders(<ProviderModelSelector />, { store })

    // Open the popover
    await user.click(screen.getByRole('button', { name: /选择模型/i }))

    // Click the empty-state action button
    const cfgBtn = await screen.findByRole('button', { name: /配置服务商/ })
    await user.click(cfgBtn)

    await waitFor(() => {
      expect(store.get(settingsOpenAtom)).toBe(true)
      expect(store.get(settingsTabAtom)).toBe('connectivity')
    })
  })

  it('clicking 配置服务商 closes the popover', async () => {
    const store = createStore()
    const { user } = renderWithProviders(<ProviderModelSelector />, { store })

    // Open the popover
    await user.click(screen.getByRole('button', { name: /选择模型/i }))
    const cfgBtn = await screen.findByRole('button', { name: /配置服务商/ })

    await user.click(cfgBtn)

    // Popover should be gone (the 配置服务商 button is no longer in the DOM)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /配置服务商/ })).not.toBeInTheDocument()
    })
  })
})
