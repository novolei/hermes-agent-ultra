/**
 * AgentView Bridge Stub — Plan 2b.2.c.4.a
 *
 * Placeholder symbols for the AgentView verbatim port (D2, 1926 LOC).
 * Every export here is scheduled for a real port in 4.b / 4.c / 4.d.
 *
 * Components render an inert hidden DOM node (debuggable in `pnpm tauri dev`
 * without being silently blank). Functions throw NOT_IMPLEMENTED at call time
 * so accidental invocations surface loudly.
 *
 * Symbols grouped by destination plan:
 *   4.b — banners + status bar + permission modes + appearance
 *   4.c — STT (speech-to-text) modal + first-run + speech button + atom + fn
 *   4.d — pet widget + browser preview + auto-preview popover + model selector
 *   chat  — FeishuNotifyToggle + GitChipsRow (chat-surface, deferred to Plan 4.e)
 */

import * as React from 'react'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Renders a hidden placeholder; debuggable via `[data-stub="..."]` selector */
function makeStubComponent(symbol: string, plan: string) {
  function StubComponent(_props: Record<string, unknown>): React.ReactElement {
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
  StubComponent.displayName = `Stub(${symbol})`
  return StubComponent
}

// ────────────────────────────────────────────────────────────────────────────
// Plan 2b.2.c.4.d — pet widget + browser preview + model selector
// ────────────────────────────────────────────────────────────────────────────

/** Animated pet/mascot widget rendered in the agent view bottom corner */
export const PetWidget = makeStubComponent('PetWidget', '4.d')

/** Overlay that shows a live browser preview while the agent browses */
export const BrowserPreviewOverlay = makeStubComponent('BrowserPreviewOverlay', '4.d')

/** Popover toggle for enabling/disabling automatic browser preview */
export const AutoPreviewPopover = makeStubComponent('AutoPreviewPopover', '4.d')

/** Provider + model selector used in the agent composer toolbar */
export const ProviderModelSelector = makeStubComponent('ProviderModelSelector', '4.d')

// ────────────────────────────────────────────────────────────────────────────
// Plan 2b.2.c.4.e — chat-surface components (IM + git)
//
// FeishuNotifyToggle: three-state Feishu notification mode toggle (auto /
//   always / off). Commented-out in AgentView JSX as of 2026-05 but the
//   import is still live; stub prevents the verbatim port from breaking.
//
// GitChipsRow: composer-footer branch picker row. Reads
//   activeWorkspaceCwdAtom; renders nothing when no workspace dir attached.
//   Per CLAUDE.md dual-composer rule this is imported in both ChatInput and
//   AgentView so the stub must be present until the real port lands.
// ────────────────────────────────────────────────────────────────────────────

/** Feishu notification mode toggle button (three-state: auto / always / off) */
export const FeishuNotifyToggle = makeStubComponent('FeishuNotifyToggle', '4.e')

/** Branch-picker row rendered in the composer footer when a workspace dir is attached */
export const GitChipsRow = makeStubComponent('GitChipsRow', '4.e')
