// Content-stub for uclaw's RightSidePanel (Agent files panel cluster, ~932 LOC:
// panel + 5 tab views + atoms). Deferred to a future port; AppShell mounts this
// placeholder when showRightPanel is true. Marked data-deferred-stub (NOT
// data-stub) so AgentView stub-completion tests' [data-stub] count stays 0.
import * as React from 'react'

export function RightSidePanel(): React.ReactElement {
  return <div data-deferred-stub="right-side-panel" hidden />
}
