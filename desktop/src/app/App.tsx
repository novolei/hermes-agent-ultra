import { AppShell } from '@/features/chat-agent/components/app-shell/app-shell'

// Plan 2b.2.c.4.d — AgentView is the only main-pane renderer. AppShell
// mounts the full navigation spine: LeftSidebar, AgentView, and
// BottomDockHoverRegion. Session ID management lives in AppShell.
//
// Plan 3.1 — Provider moved up to main.tsx so the shared store can be
// initialized with theme atoms before React mounts.

export function App() {
  return <AppShell />
}
