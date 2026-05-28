import * as React from 'react'
import type { ChatToolActivity } from '../../lib/chat-types'

/**
 * Plan 2b.2.b.2 stub. Plan 2b.2.c.2 brings the real implementation with
 * per-tool icons, collapsible result cards, BashStreamView, etc.
 */

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
