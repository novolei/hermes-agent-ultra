import * as React from 'react'
import type { ToolActivity } from '../../atoms/agent-atoms'
import type { ChatToolActivity } from '../../lib/chat-types'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c brings in real tool-renderers/*
 * with per-tool icons, structured output renderers, BashStreamView, etc.
 */

interface ToolActivityListProps {
  activities: ToolActivity[]
  animate?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ToolActivityList({ activities, animate: _animate }: ToolActivityListProps): React.ReactElement | null {
  if (activities.length === 0) return null
  return (
    <ul data-stub="tool-activity-list" className="space-y-1 text-xs text-muted-foreground/70">
      {activities.map((a) => (
        <li key={a.toolUseId} className="flex items-center gap-1">
          <span className="font-mono">{a.toolName}</span>
          <span className="opacity-60">{a.done ? '(done)' : '(running…)'}</span>
        </li>
      ))}
    </ul>
  )
}

interface ChatToolActivityIndicatorProps {
  activities: ChatToolActivity[]
  isStreaming?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ChatToolActivityIndicator({ activities, isStreaming: _isStreaming }: ChatToolActivityIndicatorProps): React.ReactElement | null {
  const running = activities.filter((a) => a.status === 'running')
  if (running.length === 0) return null
  return (
    <span data-stub="chat-tool-activity-indicator" className="text-xs text-muted-foreground/60">
      {running.length} tool{running.length > 1 ? 's' : ''} running
    </span>
  )
}
