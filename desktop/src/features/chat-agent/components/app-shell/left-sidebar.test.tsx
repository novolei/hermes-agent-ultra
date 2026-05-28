import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { LeftSidebar } from './left-sidebar'

// ResizeObserver stub — jsdom does not implement it; WorkspaceSwitcherBar
// (rendered inside LeftSidebar in agent mode) uses it to measure container width.
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
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

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      <TooltipProvider>{children}</TooltipProvider>
    </Provider>
  )
}

describe('LeftSidebar', () => {
  it('mounts without throwing', () => {
    const { container } = render(<LeftSidebar />, { wrapper: Wrapper })
    expect(container.firstChild).toBeTruthy()
  })

  it('renders a workspace rail / sidebar region', () => {
    const { container } = render(<LeftSidebar />, { wrapper: Wrapper })
    // try multiple selectors — at least one must match
    const seam =
      container.querySelector('[data-testid="left-sidebar"]') ||
      container.querySelector('[data-testid="workspace-rail"]') ||
      container.querySelector('aside') ||
      container.querySelector('nav')
    expect(seam).not.toBeNull()
  })
})
