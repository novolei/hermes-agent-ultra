import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { App } from './App'

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
  onStreamComplete: vi.fn().mockReturnValue(() => {}),
  onQueuedConsumed: vi.fn().mockReturnValue(() => {}),
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
  updateSettings: vi.fn().mockResolvedValue(undefined),
  getAgentSessionPath: vi.fn().mockResolvedValue('/mock/path'),
  getAgentSessionMessages: vi.fn().mockResolvedValue([]),
  sendAgentMessage: vi.fn().mockResolvedValue(undefined),
  stopAgent: vi.fn().mockResolvedValue(undefined),
  openFileDialog: vi.fn().mockResolvedValue({ files: [] }),
  getPathForFile: vi.fn().mockReturnValue(null),
  checkPathsType: vi.fn().mockResolvedValue({ directories: [], files: [] }),
  attachSessionDirectory: vi.fn().mockResolvedValue([]),
  estimateSessionContext: vi.fn().mockResolvedValue({}),
  agentSteer: vi.fn().mockResolvedValue(undefined),
  agentFollowUp: vi.fn().mockResolvedValue(undefined),
  forkAgentSession: vi.fn().mockResolvedValue(null),
  rewindSession: vi.fn().mockResolvedValue(null),
  saveFilesToAgentSession: vi.fn().mockResolvedValue(null),
  getSafetyPolicy: vi.fn().mockResolvedValue({ globalMode: 'ask', toolOverrides: {} }),
  setSafetyMode: vi.fn().mockResolvedValue({ globalMode: 'ask', toolOverrides: {} }),
  // chat.c Wave C3 — useGlobalChatListeners fires these on AppShell mount
  onStreamChunk: vi.fn().mockReturnValue(() => {}),
  onStreamReasoning: vi.fn().mockReturnValue(() => {}),
  onStreamError: vi.fn().mockReturnValue(() => {}),
  onStreamToolActivity: vi.fn().mockReturnValue(() => {}),
  generateTitle: vi.fn().mockResolvedValue(''),
}))

describe('App', () => {
  it('mounts AppShell at the root', () => {
    const { container } = render(
      <Provider>
        <App />
      </Provider>
    )
    expect(container.querySelector('[data-testid="app-shell"]')).not.toBeNull()
  })

  it('mounts AppShell without throwing', () => {
    const { container } = render(
      <Provider>
        <App />
      </Provider>
    )
    expect(container.firstChild).toBeTruthy()
  })
})
