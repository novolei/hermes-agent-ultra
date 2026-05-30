// Plan 3.3 C1 stub — re-exports the SYMPHONY_NEW_TAB_SENTINEL constant from
// uclaw's @/components/symphony_graph/SymphonyCanvas. The full SymphonyCanvas
// component is out of scope until a future Symphony plan; ModeSwitcher only
// reaches this constant when "Symphony" mode is selected with zero workflows.
//
// Plan FB.c Wave A2 addition — SymphonyCanvas component stub.
// TabContent routes 'symphony' tabs here until the real symphony cluster lands.

import * as React from 'react'

export const SYMPHONY_NEW_TAB_SENTINEL = '__symphony_new__'

export function SymphonyCanvas(_props: { [key: string]: unknown }): React.ReactElement {
  return (
    <div data-deferred-stub="SymphonyCanvas" className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      Symphony 画布将在后续 PR 中接入。
    </div>
  )
}
