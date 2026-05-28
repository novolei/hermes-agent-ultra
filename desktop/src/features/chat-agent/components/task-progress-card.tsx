/**
 * TaskProgressCard — stub for uclaw's TaskProgressCard.
 *
 * ToolActivityItem aggregates TaskCreate / TaskUpdate / TodoWrite activities
 * into this card. The full implementation is a Plan 2b.2.c follow-on.
 * This stub renders nothing (returns null) so ToolActivityList compiles and
 * renders without requiring the full task-progress card implementation.
 *
 * TASK_TOOL_NAMES is the shared set used by ToolActivityList to route
 * task-type activities to this card. Mirror uclaw exactly.
 */

import * as React from 'react'
import type { ToolActivity } from '@/features/chat-agent/atoms/agent-atoms'

/** Tool names aggregated by TaskProgressCard.
 * Mirrors uclaw: new Set(['TaskCreate', 'TaskUpdate', 'TodoWrite']) */
export const TASK_TOOL_NAMES = new Set(['TaskCreate', 'TaskUpdate', 'TodoWrite'])

interface TaskProgressCardProps {
  activities: ToolActivity[]
  animate?: boolean
  streamEnded?: boolean
  historicalTaskSubjects?: Map<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TaskProgressCard({ activities: _activities, animate: _animate, streamEnded: _streamEnded, historicalTaskSubjects: _historicalTaskSubjects }: TaskProgressCardProps): React.ReactElement | null {
  // Stub: renders nothing. Plan 2b.2.c ports the full implementation.
  return null
}
