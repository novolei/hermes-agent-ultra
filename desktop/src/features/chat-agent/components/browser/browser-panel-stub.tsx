// Content stub for uclaw's browser/BrowserPanel (~2 KLOC cluster, not yet ported).
// TabContent routes 'browser' tabs here until the real browser-panel cluster lands.
import * as React from 'react'
export function BrowserPanel(_props: { agentSessionId?: string; [key: string]: unknown }): React.ReactElement {
  return (
    <div data-deferred-stub="BrowserPanel" className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      浏览器面板将在后续 PR 中接入。
    </div>
  )
}
