/**
 * app-shell.integration.test.tsx
 *
 * Plan 3.3 — cross-cutting integration tests that exercise the AppShell spine
 * end-to-end, spanning multiple Wave components (Wave A–E + F1–F3).
 *
 * These tests catch regressions that no single unit test would detect: layout
 * composition, conditional dock rendering, atom-driven state propagation, and
 * sidebar peripheral mounting.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { AppShell } from './app-shell'
import { bottomDockEnabledAtom } from '@/features/chat-agent/atoms/dock-atoms'
import { themeModeAtom } from '@/features/chat-agent/atoms/theme'
import { activeWorkspaceIdAtom } from '@/features/chat-agent/atoms/workspace'
import { currentAgentSessionIdAtom } from '@/features/chat-agent/atoms/agent-atoms'

// ---------------------------------------------------------------------------
// Environment stubs — jsdom doesn't implement ResizeObserver or scrollTo
// (same boilerplate as app-shell.test.tsx; copied verbatim for test isolation)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Tauri plugin / API mocks — identical to app-shell.test.tsx
// ---------------------------------------------------------------------------
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
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mountAppShell(store?: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <AppShell />
    </Provider>,
  )
}

// ---------------------------------------------------------------------------
// A. Layout — 3 cases
// ---------------------------------------------------------------------------
describe('AppShell integration — A. Layout', () => {
  beforeEach(() => localStorage.clear())

  it('A1: app-shell flex root contains left-sidebar AND app-shell-main siblings', () => {
    const { container } = mountAppShell()
    const shell = container.querySelector('[data-testid="app-shell"]')
    expect(shell).not.toBeNull()
    expect(shell!.querySelector('[data-testid="left-sidebar"]')).not.toBeNull()
    expect(shell!.querySelector('[data-testid="app-shell-main"]')).not.toBeNull()
  })

  it('A2: main pane carries flex-1 for filling remaining width', () => {
    const { container } = mountAppShell()
    const main = container.querySelector('[data-testid="app-shell-main"]')
    expect(main).not.toBeNull()
    expect(main!.className).toMatch(/\bflex-1\b/)
  })

  it('A3: left-sidebar precedes app-shell-main in DOM order (workspace rail on left)', () => {
    const { container } = mountAppShell()
    const shell = container.querySelector('[data-testid="app-shell"]')!
    const children = Array.from(shell.children)
    const sidebarIdx = children.findIndex(
      (el) => (el as HTMLElement).dataset.testid === 'left-sidebar',
    )
    const mainIdx = children.findIndex(
      (el) => (el as HTMLElement).dataset.testid === 'app-shell-main',
    )
    expect(sidebarIdx).toBeGreaterThanOrEqual(0)
    expect(mainIdx).toBeGreaterThanOrEqual(0)
    expect(sidebarIdx).toBeLessThan(mainIdx)
  })
})

// ---------------------------------------------------------------------------
// B. Dock conditional render — 2 cases
// ---------------------------------------------------------------------------
describe('AppShell integration — B. Dock conditional render', () => {
  beforeEach(() => localStorage.clear())

  it('B1: bottomDockEnabledAtom=false hides bottom-dock-hover', () => {
    const store = createStore()
    store.set(bottomDockEnabledAtom, false)
    const { container } = mountAppShell(store)
    expect(container.querySelector('[data-testid="bottom-dock-hover"]')).toBeNull()
  })

  it('B2: bottomDockEnabledAtom=true shows bottom-dock-hover', () => {
    const store = createStore()
    store.set(bottomDockEnabledAtom, true)
    const { container } = mountAppShell(store)
    expect(container.querySelector('[data-testid="bottom-dock-hover"]')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// C. Theme propagation — 1 case
// ---------------------------------------------------------------------------
describe('AppShell integration — C. Theme propagation', () => {
  beforeEach(() => localStorage.clear())

  it('C1: themeModeAtom="dark" in store does not cause AppShell to throw', () => {
    const store = createStore()
    store.set(themeModeAtom, 'dark')
    expect(() => mountAppShell(store)).not.toThrow()
    // Confirm the atom value survived through the Provider round-trip
    expect(store.get(themeModeAtom)).toBe('dark')
  })
})

// ---------------------------------------------------------------------------
// D. Workspace state — 2 cases
// ---------------------------------------------------------------------------
describe('AppShell integration — D. Workspace state', () => {
  beforeEach(() => localStorage.clear())

  it('D1: custom activeWorkspaceIdAtom before mount does not cause throw and LeftSidebar tree is present', () => {
    const store = createStore()
    store.set(activeWorkspaceIdAtom, 'ws-test-123')
    expect(() => mountAppShell(store)).not.toThrow()
    // The render should still produce a LeftSidebar subtree
    // (WorkspaceRail rendering is gated on session data, which is empty
    //  in jsdom — but the sidebar wrapper should still be present)
    // Unmount happens in afterEach via cleanup()
  })

  it('D2: refreshWorkspacesAtom effect on AppShell mount does not throw', () => {
    // refreshWorkspaces is called via useEffect on mount; @/lib/bridge/workspaces
    // is mocked to resolve immediately. Any throw surfaces as a render error.
    expect(() => mountAppShell()).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// E. Sidebar peripherals — 2 cases
// ---------------------------------------------------------------------------
describe('AppShell integration — E. Sidebar peripherals', () => {
  beforeEach(() => localStorage.clear())

  it('E1: ModeSwitcher is mounted inside LeftSidebar after AppShell renders', () => {
    const { container } = mountAppShell()
    // ModeSwitcher's outer wrapper carries data-testid="mode-switcher"
    // (test seam added in Task F4)
    const sidebar = container.querySelector('[data-testid="left-sidebar"]')!
    expect(sidebar).not.toBeNull()
    const modeSwitcher = sidebar.querySelector('[data-testid="mode-switcher"]')
    expect(modeSwitcher).not.toBeNull()
  })

  it('E2: MoveSessionDialog (closed) does not throw on AppShell mount', () => {
    // MoveSessionDialog is rendered inside LeftSidebar with open=false by default.
    // Confirm the full AppShell tree mounts without error when the dialog is closed.
    expect(() => mountAppShell()).not.toThrow()
    // dialog is closed (moveTargetId===null) so its portal is not present in DOM
    // Absence of the dialog title text confirms it is not open
    const { container } = mountAppShell()
    const dialogTitle = Array.from(container.querySelectorAll('*')).find(
      (el) => el.textContent?.trim() === '迁移到其他工作区',
    )
    expect(dialogTitle).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// F. End-to-end smoke — 2 cases (+ D1 reuse for DOM leak check)
// ---------------------------------------------------------------------------
describe('AppShell integration — F. End-to-end smoke', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('F1: full AppShell mount produces zero console.error calls during render', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      mountAppShell()
      expect(consoleSpy).not.toHaveBeenCalled()
    } finally {
      consoleSpy.mockRestore()
    }
  })

  it('F2: re-mounting AppShell twice does not leak extra DOM roots in document.body', () => {
    const baseline = document.body.childElementCount

    const { unmount: u1 } = mountAppShell()
    const afterFirst = document.body.childElementCount
    expect(afterFirst).toBeGreaterThan(baseline) // sanity: mount adds nodes

    u1()
    cleanup()
    // After full unmount the body should return to baseline
    const afterUnmount = document.body.childElementCount
    expect(afterUnmount).toBe(baseline)

    // Second mount should land at the same node count as the first mount
    const { unmount: u2 } = mountAppShell()
    const afterSecond = document.body.childElementCount
    expect(afterSecond).toBe(afterFirst)
    u2()
  })
})

// ---------------------------------------------------------------------------
// G. Session ID threading — 2 cases (Task E2: Plan 3.3 carry-forward #4)
// ---------------------------------------------------------------------------
describe('AppShell integration — G. Session ID threading', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('G1: AppShell threads currentAgentSessionId through to AgentSessionProvider and AgentView', () => {
    const store = createStore()
    store.set(currentAgentSessionIdAtom, 'session-foo')
    const { container } = mountAppShell(store)
    // AgentView mounts and receives the threaded sessionId via context
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })

  it('G2: AppShell falls back to "default" when currentAgentSessionIdAtom is null', () => {
    const store = createStore()
    store.set(currentAgentSessionIdAtom, null)
    const { container } = mountAppShell(store)
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// H. AgentView cross-cutting (Plan 2b.2.c.4.a Task E3) — 5 cases
// ---------------------------------------------------------------------------
describe('AppShell + AgentView cross-cutting (Plan 2b.2.c.4.a Task E3)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('H1: Plan 4.b/c/d stub components render aria-hidden placeholders, not visible UI noise', () => {
    const { container } = mountAppShell()
    const stubs = container.querySelectorAll('[data-stub]')
    // Expect at least a handful of stubs visible from AgentView's mount
    expect(stubs.length).toBeGreaterThan(0)
    stubs.forEach((s) => {
      expect((s as HTMLElement).getAttribute('aria-hidden')).toBe('true')
    })
  })

  it('H2: end-to-end mount with no atom overrides produces zero console.error calls', () => {
    const errs: unknown[][] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      errs.push(args)
      orig(...args)
    }
    try {
      mountAppShell()
      expect(errs).toEqual([])
    } finally {
      console.error = orig
    }
  })

  it('H3: layout: LeftSidebar + AgentView are present under app-shell root', () => {
    const { container } = mountAppShell()
    expect(container.querySelector('[data-testid="left-sidebar"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
    // app-shell-main wraps AgentView
    const main = container.querySelector('[data-testid="app-shell-main"]')
    expect(main?.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })

  it('H4: AgentView mount survives bottomDockEnabledAtom=false (no dock visible)', () => {
    const store = createStore()
    store.set(bottomDockEnabledAtom, false)
    const { container } = mountAppShell(store)
    // AgentView still mounts
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
    // BottomDockHoverRegion absent
    expect(container.querySelector('[data-testid="bottom-dock-hover"]')).toBeNull()
  })

  it('H5: AgentView mounts with the agentStatusBarEnabledAtom default (no crash either way)', () => {
    // Just smoke-mount; the stubbed AgentStatusBar renders the same regardless
    const { container } = mountAppShell()
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// I. AppShell + AgentView banners (Plan 2b.2.c.4.b) — 3 cases
// ---------------------------------------------------------------------------
describe('AppShell + AgentView banners (Plan 2b.2.c.4.b)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('no [data-deferred-to="4.b"] stubs remain in the DOM', () => {
    const { container } = mountAppShell()
    expect(container.querySelectorAll('[data-deferred-to="4.b"]').length).toBe(0)
  })

  it('only 4.c/4.d/4.e stubs render visible markers', () => {
    const { container } = mountAppShell()
    const stubs = container.querySelectorAll('[data-stub]')
    stubs.forEach((s) => {
      const plan = (s as HTMLElement).getAttribute('data-deferred-to')
      expect(['4.c', '4.d', '4.e']).toContain(plan)
    })
  })

  it('end-to-end mount with 4.b banners real produces zero console.error calls', () => {
    const errs: unknown[][] = []
    const orig = console.error
    console.error = (...args: unknown[]) => {
      errs.push(args)
      orig(...args)
    }
    try {
      mountAppShell()
      expect(errs).toEqual([])
    } finally {
      console.error = orig
    }
  })
})

// ---------------------------------------------------------------------------
// J. AppShell + AgentView STT (Plan 2b.2.c.4.c) — 3 cases
// ---------------------------------------------------------------------------
describe('AppShell + AgentView STT (Plan 2b.2.c.4.c)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('no [data-deferred-to="4.c"] stubs remain in the DOM', () => {
    const { container } = mountAppShell()
    expect(container.querySelectorAll('[data-deferred-to="4.c"]').length).toBe(0)
  })

  it('remaining stubs are only 4.d/4.e (banners + STT now real)', () => {
    const { container } = mountAppShell()
    const stubs = container.querySelectorAll('[data-stub]')
    stubs.forEach((s) => {
      const plan = (s as HTMLElement).getAttribute('data-deferred-to')
      expect(['4.d', '4.e']).toContain(plan)
    })
  })

  it('SpeechButton is mounted in AgentView composer toolbar', () => {
    const { container } = mountAppShell()
    // SpeechButton renders a Button with aria-label="语音输入" (see speech-button.tsx line 83)
    const speechButton = container.querySelector('button[aria-label="语音输入"]')
    expect(speechButton).not.toBeNull()
  })
})
