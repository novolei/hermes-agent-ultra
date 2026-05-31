/**
 * AppShell — Hermes navigation spine.
 *
 * Adopts uclaw's top-level surface-switch (workspace ↔ kaleidoscope) and the
 * workspace-surface composition. AgentView is no longer mounted directly here;
 * it renders THROUGH the tab system: MainArea → WorkspaceShell → TabContent
 * routes the active `agent`-type tab to <AgentView sessionId={tab.sessionId}/>.
 *
 * Composes the ported navigation surface:
 *   - <LeftSidebar />        workspace rail + session list + git actions (Plan 3.3 E1)
 *   - <ModeBanner /> + <MainArea />  main pane: tab shell → WorkspaceShell → TabBar
 *                            + TabContent (AgentView/ChatView) + PreviewPanel
 *   - <RightSidePanel />     real Agent right column — files/teams/plan/trajectory tabs
 *                            live (RSP.a/b/c); browser tab still uses browser-viewer stub
 *   - <KaleidoscopeShell />  content-stub — config-flow surface deferred
 *   - <BottomDockHoverRegion /> dock pin row + connection indicator (Plan 3.3 B7)
 *   - <SearchPalette />      global ⌘K palette (Plan 3.5 C1)
 *   - <SettingsDialog />     settings (Plan 3.5.s.a–d)
 *   - <FocusModeOverlay />   focus-mode glow + floating islands (Plan AS.a)
 *
 * Deferred from uclaw's 441-LOC AppShell — stubbed/out of scope here:
 *   - KaleidoscopeShell, WelcomeView, HomeOfficeView
 *     → future ports (content-stubs for now); RightSidePanel's browser tab
 *     still renders the browser-viewer stub (BrowserPanel cluster deferred)
 *   - EscalationModal, MemoryVoiceCapture, QuickCaptureDialog → backlog
 */
import * as React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { LeftSidebar } from './left-sidebar'
import { RightSidePanel } from './right-side-panel'
import { KaleidoscopeShell } from './kaleidoscope-shell-stub'
import { MainArea } from '@/features/chat-agent/components/tabs/main-area'
import { ModeBanner } from '@/features/chat-agent/components/agent/mode-banner'
import { BottomDockHoverRegion } from '@/features/chat-agent/components/dock/bottom-dock-hover-region'
import { SearchPalette } from '@/features/chat-agent/components/search/search-palette'
import { SettingsDialog } from '@/features/chat-agent/components/settings/settings-dialog'
import { FocusModeOverlay } from '@/features/chat-agent/components/focus-mode/focus-mode-overlay'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { bottomDockEnabledAtom } from '@/features/chat-agent/atoms/dock-atoms'
import { refreshWorkspacesAtom, activeWorkspaceIdAtom, selectWorkspaceAtom } from '@/features/chat-agent/atoms/workspace'
import { currentAgentSessionIdAtom, agentSessionsAtom, currentAgentWorkspaceIdAtom, currentSessionSidePanelOpenAtom } from '@/features/chat-agent/atoms/agent-atoms'
import { tabsAtom, activeTabIdAtom, openTab } from '@/features/chat-agent/atoms/tab-atoms'
import { appModeAtom } from '@/features/chat-agent/atoms/app-mode'
import { topLevelViewAtom } from '@/features/chat-agent/atoms/top-level-view'
import { focusModeAtom } from '@/features/chat-agent/atoms/focus-mode-atoms'
import { currentConversationIdAtom } from '@/features/chat-agent/atoms/chat-atoms'
import { settingsOpenAtom, settingsTabAtom } from '@/features/chat-agent/atoms/settings-tab'
import { searchPaletteOpenAtom } from '@/features/chat-agent/atoms/search-atoms'
import { useShortcut } from '@/features/chat-agent/hooks/use-shortcut'
import { useGlobalChatListeners } from '@/features/chat-agent/hooks/use-global-chat-listeners'
import { useWorkspaceArrowSwitch } from '@/features/chat-agent/hooks/use-workspace-swipe'
import type { SearchPaletteProps } from '@/features/chat-agent/components/search/search-palette'

export function AppShell(): React.ReactElement {
  const bottomDockEnabled = useAtomValue(bottomDockEnabledAtom)
  const refreshWorkspaces = useSetAtom(refreshWorkspacesAtom)

  // Surface-switch + workspace-surface derivations (adopted from uclaw AppShell).
  // AgentView's session now comes from `tab.sessionId` (via TabContent), so the
  // shell no longer derives a `?? 'default'` sessionId. currentSessionId is kept
  // because showRightPanel gates the right panel on an active agent session.
  const topLevelView = useAtomValue(topLevelViewAtom)
  const appMode = useAtomValue(appModeAtom)
  const focusMode = useAtomValue(focusModeAtom)
  const isPanelOpen = useAtomValue(currentSessionSidePanelOpenAtom)
  const currentSessionId = useAtomValue(currentAgentSessionIdAtom)
  const showRightPanel = appMode === 'agent' && !!currentSessionId

  // Plan 3.5 C1 — atoms consumed by handleSearchResultSelect
  const [tabs, setTabs] = useAtom(tabsAtom)
  const setActiveTabId = useSetAtom(activeTabIdAtom)
  const setAppMode = useSetAtom(appModeAtom)
  const setCurrentConversationId = useSetAtom(currentConversationIdAtom)
  const setCurrentAgentSessionId = useSetAtom(currentAgentSessionIdAtom)
  const agentSessions = useAtomValue(agentSessionsAtom)
  const setCurrentAgentWorkspaceId = useSetAtom(currentAgentWorkspaceIdAtom)
  const activeWorkspaceId = useAtomValue(activeWorkspaceIdAtom)
  const selectWorkspace = useSetAtom(selectWorkspaceAtom)
  const setSettingsOpen = useSetAtom(settingsOpenAtom)
  const setSettingsTab = useSetAtom(settingsTabAtom)
  const setSearchPaletteOpen = useSetAtom(searchPaletteOpenAtom)

  // Wire Cmd+K (Ctrl+K on non-mac) to open SearchPalette — closes the
  // M2 gap surfaced by the shortcuts-cleanup Group M integration test.
  // The shortcut definition lives in shortcut-defaults.ts as 'global-search'.
  useShortcut({
    id: 'global-search',
    handler: () => setSearchPaletteOpen(true),
  })

  // chat.c Wave C3 — register global chat stream listeners for the app lifetime.
  // In tests, the listeners gracefully no-op (onStreamChunk/etc. return sync cleanup).
  useGlobalChatListeners()

  // Adopt uclaw's keyboard workspace switching (Cmd/Ctrl+Alt+ArrowLeft/Right).
  useWorkspaceArrowSwitch()

  React.useEffect(() => {
    void refreshWorkspaces()
  }, [refreshWorkspaces])

  // Plan 3.5 C1 — ported from uclaw's handleSearchResultSelect.
  // Hermes retargets: no uclaw tab-management API; uses tabsAtom/openTab
  // directly. scroll-to-message event key renamed hermes:scroll-to-message
  // to match Hermes event namespace (uclaw used uclaw:scroll-to-message).
  const handleSearchResultSelect = React.useCallback<NonNullable<SearchPaletteProps['onSelect']>>(
    (payload) => {
      switch (payload.kind) {
        case 'thread': {
          const t = payload.thread
          const tabType = t.kind === 'agent' ? 'agent' : 'chat'
          const ws = t.workspaceId ?? activeWorkspaceId ?? 'default'
          const result = openTab(tabs, { type: tabType, sessionId: t.id, title: '', workspaceId: ws })
          setTabs(result.tabs)
          setActiveTabId(result.activeTabId)
          setAppMode(t.kind === 'agent' ? 'agent' : 'chat')
          if (t.kind === 'agent') setCurrentAgentSessionId(t.id)
          else setCurrentConversationId(t.id)
          setCurrentAgentWorkspaceId(t.workspaceId)
          if (ws !== activeWorkspaceId) {
            void selectWorkspace(ws)
          }
          break
        }
        case 'workspace': {
          setCurrentAgentWorkspaceId(payload.workspace.id)
          break
        }
        case 'settings': {
          if (payload.settings.settingsTab) {
            setSettingsTab(payload.settings.settingsTab)
          }
          setSettingsOpen(true)
          break
        }
        case 'search_hit': {
          const h = payload.hit
          const tabType = (h.source === 'agent_turn' || h.source === 'agent_message') ? 'agent' : 'chat'
          const session = agentSessions.find((s) => s.id === h.sourceId)
          const ws = session?.workspaceId ?? activeWorkspaceId ?? 'default'
          const result = openTab(tabs, { type: tabType, sessionId: h.sourceId, title: '', workspaceId: ws })
          setTabs(result.tabs)
          setActiveTabId(result.activeTabId)
          setAppMode((h.source === 'agent_turn' || h.source === 'agent_message') ? 'agent' : 'chat')
          if ((h.source === 'agent_turn' || h.source === 'agent_message')) setCurrentAgentSessionId(h.sourceId)
          else setCurrentConversationId(h.sourceId)
          if (session?.workspaceId) {
            setCurrentAgentWorkspaceId(session.workspaceId)
          }
          if (ws && ws !== activeWorkspaceId) {
            void selectWorkspace(ws)
          }
          if (h.messageId) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('hermes:scroll-to-message', {
                detail: { sessionId: h.sourceId, messageId: h.messageId },
              }))
            }, 200)
          }
          break
        }
      }
    },
    [
      tabs, setTabs, setActiveTabId, setAppMode,
      setCurrentConversationId, setCurrentAgentSessionId,
      agentSessions, setCurrentAgentWorkspaceId,
      activeWorkspaceId, selectWorkspace,
      setSettingsOpen, setSettingsTab,
    ],
  )

  return (
    <TooltipProvider delayDuration={150}>
      <div
        data-testid="app-shell"
        className={cn('flex h-screen w-screen overflow-hidden bg-background text-foreground')}
      >
        {/* Top-level surface switch (adopted from uclaw AppShell):
            kaleidoscope takes over the whole window (no left/right sidebars);
            workspace restores the standard layout. Always-mounted globals
            (SearchPalette, SettingsDialog, dock) stay outside the switch so they
            work under either surface. */}
        {topLevelView === 'kaleidoscope' ? (
          <div className="relative z-[60] flex flex-1 min-w-0 min-h-0">
            <KaleidoscopeShell />
          </div>
        ) : (
          <>
            {/* Left sidebar — hidden in focus mode (FocusModeOverlay takes over). */}
            {!focusMode && <LeftSidebar />}
            {/* Main panel: ModeBanner + MainArea (tab shell → WorkspaceShell →
                TabBar + TabContent → AgentView/ChatView + PreviewPanel).
                Keeps data-testid="app-shell-main" + flex-1 (tests assert both). */}
            <main data-testid="app-shell-main" className="flex flex-1 flex-col overflow-hidden min-w-0">
              <ModeBanner />
              <MainArea />
            </main>
            {/* Right sidebar (Agent files/teams/plan/trajectory panel) — real
                RightSidePanel as of Plan RSP.c (browser tab still stubbed). Gated
                on an active agent session, hidden in focus mode. The wrapper mirrors
                uclaw's padding-transition (driven by isPanelOpen). */}
            {!focusMode && showRightPanel ? (
              <div className={cn('relative z-[60] transition-[padding] duration-300 ease-in-out', isPanelOpen ? 'p-2 pl-0' : 'p-0')}>
                <RightSidePanel />
              </div>
            ) : null}
          </>
        )}
        {bottomDockEnabled ? (
          // BottomDockHoverRegion has an empty props interface (forwardRef with no
          // data-* spread), so the testid wrapper lives on this div instead.
          <div data-testid="bottom-dock-hover">
            <BottomDockHoverRegion />
          </div>
        ) : null}
        {/* Plan 3.5 C1 — always-mounted; visibility gated by searchPaletteOpenAtom */}
        <SearchPalette onSelect={handleSearchResultSelect} />
        {/* Plan 3.5.s.a — always-mounted; visibility gated by settingsOpenAtom */}
        <SettingsDialog />
        {/* Plan AS.a — always-mounted; mounts the focus-mode hotzone/auto-exit
            hooks and renders null until focusModeAtom (default false) flips on. */}
        <FocusModeOverlay />
      </div>
    </TooltipProvider>
  )
}
