// Plan 2b.2.c.3 — slim container above AgentMessages + RichTextInput,
// wired to the Plan 2b.1 listenAgent → applyAgentEvent pipeline via the
// Plan 2b.2.a bridge adapter. Plan 2b.2.c.4 will replace this file with
// the full uclaw AgentView.tsx port once Plan 3 ships the workspace +
// permission/plan-mode atoms.

import * as React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { agentBridge, listenAgent } from '@/lib/bridge'
import type { AgentEventMap } from '@/lib/bridge/events'
import { AgentMessages } from './agent-messages'
import { RichTextInput } from './ai-elements/rich-text-input'
import { Button } from '@/shared/ui/button'
import {
  agentStreamingStatesAtom,
  currentAgentMessagesAtom,
  applyAgentEvent,
  type AgentStreamState,
} from '@/features/chat-agent/atoms/agent-atoms'
import { createBridgeAdapter } from '@/features/chat-agent/bridge-adapter'
import type { AgentMessage } from '@/features/chat-agent/lib/agent-types'

interface ChatAgentViewProps {
  sessionId: string
}

function createEmptyState(): AgentStreamState {
  return {
    running: true,
    content: '',
    reasoning: '',
    toolActivities: [],
    teammates: [],
  } as AgentStreamState
}

export function ChatAgentView({ sessionId }: ChatAgentViewProps): React.ReactElement {
  const messages = useAtomValue(currentAgentMessagesAtom)
  const [streamingStates, setStreamingStates] = useAtom(agentStreamingStatesAtom)
  const setMessages = useSetAtom(currentAgentMessagesAtom)
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)

  const adapterRef = React.useRef(createBridgeAdapter())

  const streamState: AgentStreamState | undefined = streamingStates.get(sessionId)

  // Subscribe to all 9 agent:* Tauri events; route via the bridge adapter to
  // the reducer.
  React.useEffect(() => {
    const unlisteners: Array<() => void> = []
    let cancelled = false

    void (async () => {
      const eventNames: Array<keyof AgentEventMap> = [
        'agent:text-delta',
        'agent:thinking-delta',
        'agent:tool-call-delta',
        'agent:tool-start',
        'agent:tool-result',
        'agent:done',
        'agent:error',
        'agent:status',
        'agent:usage',
      ]

      for (const name of eventNames) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unlisten = await (listenAgent as (n: string, cb: (payload: any) => void) => Promise<() => void>)(
          name,
          (payload: { session_id?: string }) => {
            if (payload.session_id !== sessionId) return
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = adapterRef.current.translate(name as any, payload as any)
            if (event == null) return
            setStreamingStates((prev) => {
              const current = prev.get(sessionId) ?? createEmptyState()
              const next = applyAgentEvent(current, event)
              const updated = new Map(prev)
              updated.set(sessionId, next)
              return updated
            })
          },
        )
        if (cancelled) {
          unlisten()
          return
        }
        unlisteners.push(unlisten)
      }
    })()

    return () => {
      cancelled = true
      unlisteners.forEach((u) => u())
    }
  }, [sessionId, setStreamingStates])

  // When streaming completes (running === false), drain the final assistant
  // content into the persistent messages array. Plan 4 (real session
  // persistence) replaces this with a backend round-trip.
  const prevRunningRef = React.useRef<boolean | undefined>(undefined)
  React.useEffect(() => {
    const wasRunning = prevRunningRef.current
    const isRunning = streamState?.running

    if (wasRunning === true && isRunning === false && streamState?.content) {
      const msg: AgentMessage = {
        id: `local-${Date.now()}`,
        role: 'assistant',
        content: streamState.content,
        createdAt: Date.now(),
        model: streamState.model,
      }
      setMessages((prev) => [...prev, msg])
      // Remove the now-drained streaming state.
      setStreamingStates((prev) => {
        const updated = new Map(prev)
        updated.delete(sessionId)
        return updated
      })
    }
    prevRunningRef.current = isRunning
  }, [streamState, sessionId, setMessages, setStreamingStates])

  const handleSubmit = React.useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    try {
      await agentBridge.agentSendMessage(sessionId, text)
    } catch (e) {
      console.error('agentSendMessage failed', e)
    } finally {
      setSending(false)
    }
  }, [input, sending, sessionId, setMessages])

  return (
    <main className="flex h-screen flex-col">
      <AgentMessages
        sessionId={sessionId}
        messages={messages}
        messagesLoaded={true}
        streaming={streamState?.running ?? false}
        streamState={streamState}
      />
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="flex-1">
            <RichTextInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              disabled={sending}
              placeholder="Type a message…"
            />
          </div>
          <Button onClick={handleSubmit} disabled={sending || !input.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </main>
  )
}
