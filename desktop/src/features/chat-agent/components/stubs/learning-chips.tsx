// desktop/src/features/chat-agent/components/stubs/learning-chips.tsx
import * as React from 'react'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c upgrades to the real chip components.
 *
 * Placeholder types ProactiveLearningEvent / MemoryRecallEvent mirror
 * uclaw's shape; Plan 2b.2.c imports the real types.
 */

export type ProactiveLearningEvent = unknown
export type MemoryRecallEvent = unknown

interface ProactiveLearningChipProps {
  event: ProactiveLearningEvent
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProactiveLearningChip({ event: _event, className }: ProactiveLearningChipProps): React.ReactElement {
  return (
    <span data-stub="proactive-learning-chip" className={className ?? 'text-xs text-muted-foreground/60'}>
      💡 learning
    </span>
  )
}

interface MemoryRecallChipProps {
  event: MemoryRecallEvent
  inline?: boolean
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MemoryRecallChip({ event: _event, inline: _inline, className }: MemoryRecallChipProps): React.ReactElement {
  return (
    <span data-stub="memory-recall-chip" className={className ?? 'text-xs text-muted-foreground/60'}>
      🧠 recall
    </span>
  )
}
