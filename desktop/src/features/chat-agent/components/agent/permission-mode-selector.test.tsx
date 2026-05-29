import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import * as React from 'react'
import { PermissionModeSelector } from './permission-mode-selector'
import { safetyModeAtom } from '@/features/chat-agent/atoms/safety-atoms'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({
  getSafetyPolicy: vi.fn().mockResolvedValue({
    globalMode: 'supervised',
    toolOverrides: {},
    autoApprovedTools: [],
    blockedTools: [],
  }),
  setSafetyMode: vi.fn().mockResolvedValue({
    globalMode: 'ask',
    toolOverrides: {},
    autoApprovedTools: [],
    blockedTools: [],
  }),
}))

describe('PermissionModeSelector', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('mounts without crashing', async () => {
    const store = createStore()
    store.set(safetyModeAtom, 'supervised')
    render(
      <Provider store={store}>
        <PermissionModeSelector />
      </Provider>,
    )
    // Wait for getSafetyPolicy to resolve and hydrate
    await waitFor(() => {
      expect(store.get(safetyModeAtom)).toBeDefined()
    })
  })

  it('renders trigger button with current mode icon', async () => {
    const store = createStore()
    store.set(safetyModeAtom, 'supervised')
    render(
      <Provider store={store}>
        <PermissionModeSelector />
      </Provider>,
    )
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('opens popover on trigger button click', async () => {
    const store = createStore()
    store.set(safetyModeAtom, 'supervised')
    render(
      <Provider store={store}>
        <PermissionModeSelector />
      </Provider>,
    )
    await waitFor(() => {
      const button = screen.getByRole('button')
      fireEvent.click(button)
    })
    // Check if menu items become visible
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })
  })

  it('accepts sessionId prop for compat', () => {
    const store = createStore()
    store.set(safetyModeAtom, 'supervised')
    const { container } = render(
      <Provider store={store}>
        <PermissionModeSelector sessionId="test-session" />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
