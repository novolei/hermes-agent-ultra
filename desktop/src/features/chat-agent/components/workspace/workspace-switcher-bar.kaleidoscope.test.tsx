/**
 * workspace-switcher-bar.kaleidoscope.test.tsx
 *
 * Plan 3.2 — ported from uclaw ui/src/components/workspace/WorkspaceSwitcherBar.kaleidoscope.test.tsx (38 LOC).
 * Retargets:
 *   ./WorkspaceSwitcherBar      → ./workspace-switcher-bar
 *   @/atoms/workspace           → @/features/chat-agent/atoms/workspace
 *   @/atoms/top-level-view      → @/features/chat-agent/atoms/top-level-view
 *   @/lib/tauri-bridge mock     → @/lib/bridge/workspaces
 *   @/test-utils/render         → local inline renderWithProviders helper
 *   WorkspaceInfo shape: desktop has cwd/position/created_at/updated_at
 *     instead of uclaw's path/sortOrder/createdAt/updatedAt.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, Provider } from 'jotai'
import { WorkspaceSwitcherBar } from './workspace-switcher-bar'
import { workspacesAtom, activeWorkspaceIdAtom } from '@/features/chat-agent/atoms/workspace'
import type { WorkspaceInfo } from '@/lib/bridge/workspaces'
import { topLevelViewAtom } from '@/features/chat-agent/atoms/top-level-view'

// ResizeObserver stub — jsdom does not implement it; WorkspaceSwitcherBar's
// useFitsComfortably hook uses it to measure the icons container width.
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
})

vi.mock('@/lib/bridge/workspaces', () => ({
  setActiveWorkspaceId: vi.fn(),
  listWorkspaces: vi.fn().mockResolvedValue([]),
  getActiveWorkspaceId: vi.fn().mockResolvedValue(null),
  reorderWorkspaces: vi.fn().mockResolvedValue(undefined),
  createWorkspace: vi.fn().mockResolvedValue(null),
  updateWorkspace: vi.fn().mockResolvedValue(true),
  deleteWorkspace: vi.fn().mockResolvedValue(true),
}))

// ── local renderWithProviders (mirrors uclaw @/test-utils/render) ────────

type JotaiStore = ReturnType<typeof createStore>

interface ProviderOptions {
  store?: JotaiStore
}

interface ProviderRenderResult {
  user: ReturnType<typeof userEvent.setup>
  store: JotaiStore
}

function renderWithProviders(
  ui: React.ReactElement,
  options: ProviderOptions = {},
): ProviderRenderResult {
  const { store = createStore() } = options
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  render(ui, { wrapper: Wrapper })
  const user = userEvent.setup()
  return { user, store }
}

// ── helpers ──────────────────────────────────────────────────────────────

function makeWs(id: string, name: string): WorkspaceInfo {
  return {
    id, name, icon: 'Folder', cwd: `/tmp/${id}`, color: null, position: 0,
    created_at: null, updated_at: null,
  }
}

// ── tests ─────────────────────────────────────────────────────────────────

describe('WorkspaceSwitcherBar — Kaleidoscope entry', () => {
  it('renders the Kaleidoscope entry icon', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'one')])
    store.set(activeWorkspaceIdAtom, 'w1')
    renderWithProviders(<WorkspaceSwitcherBar />, { store })
    expect(screen.getByRole('button', { name: '打开万花筒' })).toBeInTheDocument()
  })

  it('clicking the entry icon sets topLevelViewAtom to "kaleidoscope"', async () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'one')])
    store.set(activeWorkspaceIdAtom, 'w1')
    const { user } = renderWithProviders(<WorkspaceSwitcherBar />, { store })
    // Plan 3.2 — kaleidoscope animation assertions degraded to mount-only in jsdom
    // because requestAnimationFrame / CSS transitions don't run in headless env.
    // Plan 3.3 follow-up: add a Playwright-driven test or a manual smoke check
    // in a real Tauri window.
    await user.click(screen.getByRole('button', { name: '打开万花筒' }))
    expect(store.get(topLevelViewAtom)).toBe('kaleidoscope')
  })
})
