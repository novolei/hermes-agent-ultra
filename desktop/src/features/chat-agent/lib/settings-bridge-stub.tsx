import * as React from 'react'

// All deferred-tab stubs have been replaced by real ports as of Plan 3.5.s.d.
// The factory is retained for reference / any future deferral.
function makeStubTab(symbol: string, plan: string) {
  return function StubSettingsTab(): React.ReactElement {
    return (
      <div
        data-stub={symbol}
        data-deferred-to={plan}
        className="p-8 text-center text-muted-foreground"
      >
        <div className="text-lg font-medium mb-2">{symbol}</div>
        <p className="text-sm">This settings tab is deferred to Plan {plan}.</p>
      </div>
    )
  }
}
