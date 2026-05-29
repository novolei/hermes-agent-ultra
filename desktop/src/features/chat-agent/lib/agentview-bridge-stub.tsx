/**
 * AgentView Bridge Stub — Plan 2b.2.c.4.a
 *
 * Placeholder symbols for the AgentView verbatim port.
 * Every export here is scheduled for a real port in 4.b / 4.c / 4.d.
 *
 * Components render a visible inert placeholder DOM node (so the UI is
 * debuggable in `pnpm tauri dev`, not silently blank). Functions throw
 * NOT_IMPLEMENTED at call time so accidental invocations surface loudly.
 */

import * as React from 'react'

// Helper for component stubs — renders a debug-visible placeholder
function makeStubComponent(symbol: string, plan: string) {
  return function StubComponent(_props: Record<string, unknown>): React.ReactElement {
    return (
      <div
        data-stub={symbol}
        data-deferred-to={plan}
        className="hermes-stub"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    )
  }
}

function makeStubFn(symbol: string, plan: string) {
  return (..._args: unknown[]): never => {
    throw new Error(`NOT_IMPLEMENTED_IN_PLAN_2_B_2_C_4_A:${symbol} (deferred to ${plan})`)
  }
}

// Plan 4.b — Chat Appearance & Settings
export const ChatAppearancePopover = makeStubComponent('ChatAppearancePopover', '4.b')
