/**
 * AppShell — Hermes slim navigation spine.
 *
 * Composes the ported navigation surface:
 *   - <LeftSidebar />        workspace rail + session list + git actions (Plan 3.3 E1)
 *   - <AgentView />          main pane (Plan 2b.2.c.4.a)
 *   - <BottomDockHoverRegion /> dock pin row + connection indicator (Plan 3.3 B7)
 *
 * NOTE: The slim ChatAgentView (Plan 2b.2.c.3) stays in
 * desktop/src/features/chat-agent/components/chat-agent-view.tsx as a
 * rollback target until Plan 2b.2.c.4.d retires it.
 *
 * Deferred from uclaw's 441-LOC AppShell — out of scope for Plan 3.3:
 *   - RightSidePanel, MainArea tabs       → Plan 2b.2.c.4
 *   - SettingsDialog, SearchPalette       → Plan 3.5
 *   - EscalationModal, KaleidoscopeShell  → Plan 4
 *   - FocusModeOverlay, MemoryVoiceCapture, QuickCaptureDialog → backlog
 */
import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { LeftSidebar } from './left-sidebar'
import { AgentView } from '@/features/chat-agent/components/agent/agent-view'
import { AgentSessionProvider } from '@/features/chat-agent/contexts/session-context'
import { BottomDockHoverRegion } from '@/features/chat-agent/components/dock/bottom-dock-hover-region'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { bottomDockEnabledAtom } from '@/features/chat-agent/atoms/dock-atoms'
import { refreshWorkspacesAtom } from '@/features/chat-agent/atoms/workspace'

// SESSION_ID will be replaced with currentAgentSessionIdAtom in Task E2
// (driven by workspace atom changes once session selection is dispatched).
const SESSION_ID = 'default'

export function AppShell(): React.ReactElement {
  const bottomDockEnabled = useAtomValue(bottomDockEnabledAtom)
  const refreshWorkspaces = useSetAtom(refreshWorkspacesAtom)

  React.useEffect(() => {
    void refreshWorkspaces()
  }, [refreshWorkspaces])

  return (
    <TooltipProvider delayDuration={150}>
      <div
        data-testid="app-shell"
        className={cn('flex h-screen w-screen overflow-hidden bg-background text-foreground')}
      >
        <LeftSidebar />
        <main data-testid="app-shell-main" className="flex flex-1 flex-col overflow-hidden">
          <AgentSessionProvider sessionId={SESSION_ID}>
            <AgentView sessionId={SESSION_ID} />
          </AgentSessionProvider>
        </main>
        {bottomDockEnabled ? (
          // BottomDockHoverRegion has an empty props interface (forwardRef with no
          // data-* spread), so the testid wrapper lives on this div instead.
          <div data-testid="bottom-dock-hover">
            <BottomDockHoverRegion />
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
