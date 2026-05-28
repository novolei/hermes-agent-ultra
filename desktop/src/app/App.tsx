import { ChatAgentView } from '@/features/chat-agent/components/chat-agent-view'

// Plan 2b.2.c.3 — first App.tsx change since Plan 1. Replaces the MVP
// composer (kept inert from Plan 1 through Plan 2b.2.c.2) with the slim
// ChatAgentView container that mounts AgentMessages + RichTextInput wired
// to the Plan 2b.1 backend bridge. Plan 2b.2.c.4 will replace ChatAgentView
// with the full uclaw AgentView once Plan 3 ships the workspace atoms.
//
// Plan 3.1 — Provider moved up to main.tsx so the shared store can be
// initialized with theme atoms before React mounts.

const SESSION_ID = 'default'

export function App() {
  return <ChatAgentView sessionId={SESSION_ID} />
}
