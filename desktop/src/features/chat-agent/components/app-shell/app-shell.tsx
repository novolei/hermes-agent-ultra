/**
 * AppShell — Hermes slim navigation spine.
 *
 * Composes the ported navigation surface:
 *   - <LeftSidebar />        workspace rail + session list + git actions (Plan 3.3 E1)
 *   - <AgentView />          main pane (Plan 2b.2.c.4.a)
 *   - <BottomDockHoverRegion /> dock pin row + connection indicator (Plan 3.3 B7)
 *   - <SearchPalette />      global ⌘K palette (Plan 3.5 C1)
 *
 * Deferred from uclaw's 441-LOC AppShell — out of scope for Plan 3.3:
 *   - RightSidePanel, MainArea tabs       → Plan 2b.2.c.4
 *   - EscalationModal, KaleidoscopeShell  → Plan 4
 *   - FocusModeOverlay, MemoryVoiceCapture, QuickCaptureDialog → backlog
 */
import * as React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { LeftSidebar } from './left-sidebar'
import { AgentView } from '@/features/chat-agent/components/agent/agent-view'
import { BottomDockHoverRegion } from '@/features/chat-agent/components/dock/bottom-dock-hover-region'
import { SearchPalette } from '@/features/chat-agent/components/search/search-palette'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { bottomDockEnabledAtom } from '@/features/chat-agent/atoms/dock-atoms'
import { refreshWorkspacesAtom, activeWorkspaceIdAtom, selectWorkspaceAtom } from '@/features/chat-agent/atoms/workspace'
import { currentAgentSessionIdAtom, agentSessionsAtom, currentAgentWorkspaceIdAtom } from '@/features/chat-agent/atoms/agent-atoms'
import { tabsAtom, activeTabIdAtom, openTab } from '@/features/chat-agent/atoms/tab-atoms'
import { appModeAtom } from '@/features/chat-agent/atoms/app-mode'
import { currentConversationIdAtom } from '@/features/chat-agent/atoms/chat-atoms'
import { settingsOpenAtom, settingsTabAtom } from '@/features/chat-agent/atoms/settings-tab'
import type { SearchPaletteProps } from '@/features/chat-agent/components/search/search-palette'

export function AppShell(): React.ReactElement {
  const bottomDockEnabled = useAtomValue(bottomDockEnabledAtom)
  const refreshWorkspaces = useSetAtom(refreshWorkspacesAtom)

  // Closes Plan 3.3 carry-forward #4: derive sessionId from the active
  // workspace's currentAgentSessionIdAtom rather than the hardcoded
  // 'default' placeholder. Falls back to 'default' when no session is
  // active (first launch / pre-onboarding state).
  const currentSessionId = useAtomValue(currentAgentSessionIdAtom)
  const sessionId = currentSessionId ?? 'default'

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
        <LeftSidebar />
        <main data-testid="app-shell-main" className="flex flex-1 flex-col overflow-hidden">
          {/*
            NOTE: AgentView internally mounts its own AgentSessionProvider with
            the sessionId prop. AppShell threads sessionId in as a prop only —
            no need for an outer Provider here. (Plan 2b.2.c.4.a code review.)
          */}
          <AgentView sessionId={sessionId} />
        </main>
        {bottomDockEnabled ? (
          // BottomDockHoverRegion has an empty props interface (forwardRef with no
          // data-* spread), so the testid wrapper lives on this div instead.
          <div data-testid="bottom-dock-hover">
            <BottomDockHoverRegion />
          </div>
        ) : null}
        {/* Plan 3.5 C1 — always-mounted; visibility gated by searchPaletteOpenAtom */}
        <SearchPalette onSelect={handleSearchResultSelect} />
      </div>
    </TooltipProvider>
  )
}
