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
import { atom } from 'jotai'

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

/** Returns a function that throws NOT_IMPLEMENTED on first call */
function makeStubFn(symbol: string, plan: string) {
  return (..._args: unknown[]): never => {
    throw new Error(`NOT_IMPLEMENTED_IN_PLAN_2_B_2_C_4_A:${symbol} (deferred to ${plan})`)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Plan 2b.2.c.4.b — banners + status bar + permission modes + appearance
// ────────────────────────────────────────────────────────────────────────────

/** Heartbeat / stall detection banner shown while agent is streaming */
export const AgentHeartbeatBanner = makeStubComponent('AgentHeartbeatBanner', '4.b')

/** Banner surfaced when agent issues an ask_user tool call */
export const AskUserBanner = makeStubComponent('AskUserBanner', '4.b')

/** Banner shown when agent enters plan mode and awaits user confirmation to exit */
export const ExitPlanModeBanner = makeStubComponent('ExitPlanModeBanner', '4.b')

/** Banner that suggests switching to plan mode when heuristics detect a long task */
export const PlanModeSuggestBanner = makeStubComponent('PlanModeSuggestBanner', '4.b')

/** Banner shown when an automation run is active */
export const AutomationRunBanner = makeStubComponent('AutomationRunBanner', '4.b')

/** Dashed border overlay rendered around the view when plan mode is active */
export const PlanModeDashedBorder = makeStubComponent('PlanModeDashedBorder', '4.b')

/** Banner displayed when agent needs a permission approval */
export const PermissionBanner = makeStubComponent('PermissionBanner', '4.b')

/** Banner shown when messages are queued waiting for the current turn to finish */
export const QueuedMessagesBanner = makeStubComponent('QueuedMessagesBanner', '4.b')

/** Dropdown/selector for switching the agent's permission mode (ask / auto / yolo) */
export const PermissionModeSelector = makeStubComponent('PermissionModeSelector', '4.b')

/** Selector for strategy presets (balanced / thorough / fast) */
export const StrategyPresetSelector = makeStubComponent('StrategyPresetSelector', '4.b')

/** Status bar at the bottom of the agent view showing token/cost metrics */
export const AgentStatusBar = makeStubComponent('AgentStatusBar', '4.b')

/** Popover for adjusting chat appearance settings (font size, theme, etc.) */
export const ChatAppearancePopover = makeStubComponent('ChatAppearancePopover', '4.b')

// ────────────────────────────────────────────────────────────────────────────
// Plan 2b.2.c.4.c — speech-to-text (STT)
// ────────────────────────────────────────────────────────────────────────────

/** Full-screen overlay modal for in-progress STT transcription */
export const SttModal = makeStubComponent('SttModal', '4.c')

/** First-run dialog that prompts users to configure STT on first use */
export const FirstRunDialog = makeStubComponent('FirstRunDialog', '4.c')

/** Mic button that triggers STT recording in the composer toolbar */
export const SpeechButton = makeStubComponent('SpeechButton', '4.c')

/**
 * Jotai atom tracking the STT model download / readiness status.
 * Real implementation lives in `@/atoms/stt-atoms` in the uclaw source.
 * Stub defaults to 'idle' so AgentView renders without crashing.
 */
export const modelStatusAtom = atom<'idle' | 'loading' | 'ready' | 'error'>('idle')

/**
 * Joins a word and its following punctuation, collapsing the space that the
 * STT engine emits between them (e.g. "Hello ," → "Hello,").
 * Real implementation in `@/lib/stt/punctuation`.
 */
export const smartJoin = makeStubFn('smartJoin', '4.c') as (
  word: string,
  punct: string,
) => string

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
