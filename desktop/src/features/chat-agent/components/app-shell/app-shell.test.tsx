import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { AppShell } from './app-shell'
import { bottomDockEnabledAtom } from '@/features/chat-agent/atoms/dock-atoms'

// ResizeObserver stub — jsdom doesn't implement it; LeftSidebar's
// WorkspaceSwitcherBar uses it to measure container width.
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = function () {}
  }
})

// Mock Tauri plugin modules that don't exist in test environment
vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn().mockResolvedValue(null),
}))

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(null),
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
  emit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/bridge/workspaces', () => ({
  listWorkspaces: vi.fn().mockResolvedValue([]),
  getActiveWorkspaceId: vi.fn().mockResolvedValue(null),
  setActiveWorkspaceId: vi.fn().mockResolvedValue(true),
  createWorkspace: vi.fn().mockResolvedValue(null),
  updateWorkspace: vi.fn().mockResolvedValue(true),
  deleteWorkspace: vi.fn().mockResolvedValue(true),
  reorderWorkspaces: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({
  togglePinAgentSession: vi.fn().mockResolvedValue(null),
  toggleArchiveAgentSession: vi.fn().mockResolvedValue(null),
  deleteAgentSession: vi.fn().mockResolvedValue(true),
  onAskUserRequest: vi.fn().mockResolvedValue(() => {}),
  onExitPlanRequest: vi.fn().mockResolvedValue(() => {}),
  onNeedApproval: vi.fn().mockResolvedValue(() => {}),
  listConversations: vi.fn().mockResolvedValue([]),
  createConversation: vi.fn().mockResolvedValue(null),
  updateConversationTitle: vi.fn().mockResolvedValue(null),
  togglePinConversation: vi.fn().mockResolvedValue(null),
  toggleArchiveConversation: vi.fn().mockResolvedValue(null),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
  getUserProfile: vi.fn().mockResolvedValue({ userName: 'Test User', avatar: '' }),
  listAgentSessions: vi.fn().mockResolvedValue([]),
  createAgentSession: vi.fn().mockResolvedValue(null),
  updateAgentSessionTitle: vi.fn().mockResolvedValue(null),
  toggleManualWorkingAgentSession: vi.fn().mockResolvedValue(null),
  getWorkspaceCapabilities: vi.fn().mockResolvedValue(null),
  gitIsRepo: vi.fn().mockResolvedValue(false),
  gitCurrentBranch: vi.fn().mockResolvedValue('main'),
  moveAgentSessionToWorkspace: vi.fn().mockResolvedValue(null),
}))

describe('AppShell', () => {
  beforeEach(() => localStorage.clear())

  it('mounts without throwing', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders LeftSidebar + main pane', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    expect(container.querySelector('[data-testid="app-shell"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="left-sidebar"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="app-shell-main"]')).not.toBeNull()
  })

  it('hides BottomDockHoverRegion when bottomDockEnabledAtom is false', () => {
    const store = createStore()
    store.set(bottomDockEnabledAtom, false)
    const { container } = render(<Provider store={store}><AppShell /></Provider>)
    expect(container.querySelector('[data-testid="bottom-dock-hover"]')).toBeNull()
  })

  it('shows BottomDockHoverRegion when bottomDockEnabledAtom is true', () => {
    const store = createStore()
    store.set(bottomDockEnabledAtom, true)
    const { container } = render(<Provider store={store}><AppShell /></Provider>)
    expect(container.querySelector('[data-testid="bottom-dock-hover"]')).not.toBeNull()
  })

  it('main pane uses flex-1 for filling remaining width', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    const main = container.querySelector('[data-testid="app-shell-main"]')
    expect(main?.className).toMatch(/flex-1/)
  })
})
