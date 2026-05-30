/**
 * Smoke test: mount <FilesRail> and assert the tab bar + panels render
 * without throwing.
 *
 * FB.b Wave E3
 */
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the tauri-bridge-stub so filesRailListMounts does not throw on mount.
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    filesRailListMounts: vi.fn().mockResolvedValue([]),
    filesRailWatchStart: vi.fn().mockResolvedValue(undefined),
    filesRailWatchStop: vi.fn().mockResolvedValue(undefined),
  }
})

// Mock @tauri-apps/api/core to avoid real IPC in tests.
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}))

// Mock @tauri-apps/api/event to avoid real event listener in tests.
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => undefined),
}))

// Mock @tauri-apps/plugin-dialog (resolved via vite alias in app; vi.mock here for tests).
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue(null),
}))

import { TooltipProvider } from '@/shared/ui/tooltip'
import { FilesRail } from './index'

function renderWithProviders(
  ui: React.ReactElement,
  opts?: { store?: ReturnType<typeof createStore> },
) {
  return render(
    <Provider store={opts?.store}>
      <TooltipProvider>{ui}</TooltipProvider>
    </Provider>,
  )
}

describe('FilesRail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the workspace tab button', () => {
    renderWithProviders(<FilesRail sessionId={null} />)
    // The tab bar has a button with role=tab for '工作区文件'
    expect(screen.getByRole('tab', { name: '工作区文件' })).toBeTruthy()
  })

  it('renders the changes tab button', () => {
    renderWithProviders(<FilesRail sessionId={null} />)
    expect(screen.getByRole('tab', { name: '文件改动' })).toBeTruthy()
  })

  it('renders both tab buttons in a tablist', () => {
    renderWithProviders(<FilesRail sessionId={null} />)
    const tablist = screen.getByRole('tablist')
    expect(tablist).toBeTruthy()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
  })
})
