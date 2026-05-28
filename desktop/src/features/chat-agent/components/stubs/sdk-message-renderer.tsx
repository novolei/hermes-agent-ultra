import * as React from 'react'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c ports the real compaction UI from
 * uclaw's components/agent/SDKMessageRenderer.tsx.
 */

export function CompactingIndicator(): React.ReactElement {
  return (
    <div data-stub="compacting-indicator" className="text-xs text-muted-foreground/60">
      ⌬ compacting…
    </div>
  )
}

interface CompactBoundaryDividerProps {
  removed?: number
  remaining?: number
}

export function CompactBoundaryDivider({ removed, remaining }: CompactBoundaryDividerProps): React.ReactElement {
  return (
    <div
      data-stub="compact-boundary-divider"
      role="separator"
      className="my-3 border-t border-dashed border-muted/30 text-xs text-muted-foreground/40 text-center"
    >
      {removed != null && remaining != null && (
        <span> compacted {removed} · {remaining} kept </span>
      )}
    </div>
  )
}
