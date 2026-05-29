# Plan 2b.2.c.4.b — Desktop AgentView Banners Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real ports for the 11 banner / status / permission-mode component stubs in `agentview-bridge-stub.tsx`. After 4.b merges, the AgentView main pane renders functional banners (heartbeat, ask-user, exit-plan, plan-mode-suggest, automation-run, plan-mode-dashed-border, permission, queued-messages), real header controls (PermissionModeSelector + StrategyPresetSelector), the bottom AgentStatusBar, AND the chat-side ChatAppearancePopover.

**Architecture:** Verbatim port from `uclaw/ui/src/components/{agent,chat}/` following the conventions established through Plans 2b.2.c.2 → 3.3 → 4.a:
- kebab-case filenames, PascalCase exports
- `desktop/src/features/chat-agent/components/agent/` directory (existing from 4.a)
- Storage keys rebranded `'uclaw-*'` → `'hermes-*'`
- Anti-god-file invariant: `desktop/src/lib/` contains ONLY `bridge/`
- Stub discipline (Plan 3.3 C1 lesson): NEVER inline missing symbols, always create a stub file
- Pre-existing verbatim-ported files NEVER modified to add convenience exports (Plan 3.3 B2 lesson — port new symbols in NEW files)

**Tech Stack:** React 19 + Jotai 2.17.1 + atomWithStorage + Vitest + jsdom. Verbatim TypeScript ports from `/Users/ryanliu/Documents/uclaw/ui/src/`. shadcn primitives (`button`, `tooltip`, `popover`, `switch`) already in `desktop/src/shared/ui/` from Plans 2b.2.c.2 + 3.3 + 4.a.

**Scope baseline (committed in `main` at `a7aadae55` after PR #14 merge):**
- All of Plan 4.a (full AgentView shell mounted in AppShell, agentview-bridge-stub.tsx with 21 typed stubs grouped by 4.b/4.c/4.d/4.e)
- Plan 3.3 navigation spine (Dock + LeftSidebar + AppShell)
- All atoms needed for banners are already in our tree: `agent-atoms` (already exports the symbols banners import: `agentSessionStrategyMapAtom`, `AgentStrategy`, `agentStreamingStatesAtom`, `AgentStreamState`, `allPendingAskUserRequestsAtom`, `allPendingPermissionRequestsAtom`, `finalizeStreamingActivities`), `ui-preferences` (has `planModeSuggestEnabledAtom`), `agent-queue-messages` (`QueuedAgentMessage` type)

**4.b port targets:**

| Bucket | Items | LOC |
|---|---|---|
| Missing atoms | `safety-atoms.ts`, `plan-mode-suggest-atoms.ts` | ~50-100 |
| Banner components | 12 agent banners + 1 chat-side popover | ~2,558 |
| Tests | uclaw ships 5 (`AgentStatusBar`, `AutomationRunBanner`, `ModeBanner`, `PlanModeSuggestBanner`, `StrategyPresetSelector`) + 8 new minimal mount tests | ~600 |
| Bridge stubs (new) | ~9 NOT_IMPLEMENTED stubs in `tauri-bridge-stub.ts` (`respondExitPlanMode`, `respondAskUser`, `respondPermission`, `respondPlanModeSuggest`, `getSafetyPolicy`, `setSafetyMode`) + type aliases (`AskUserQuestion`, `DangerLevel`, `SafetyModeWire`) | ~150 |
| `agentview-bridge-stub.tsx` cleanup | DELETE 12 banner stub exports + their test cases | -180 |
| `agent-view.tsx` import retarget | Switch ~11 imports from `agentview-bridge-stub` to real component paths | ~20 |
| Integration tests | extend `app-shell.integration.test.tsx` with banner mount assertions | ~150 |
| **Total** | | **~3,500** |

**Tests target:** 670 → ≥705 (+35 minimum).

**Manual launch gate (4.b PR acceptance):** `cd desktop && pnpm tauri dev` opens a window where AgentView's banners are now functional:
- Heartbeat banner appears when stream stalls (or visible test-mode placeholder)
- Permission/AskUser/ExitPlan banners render with their action buttons (clicking → throws NOT_IMPLEMENTED on the backend respond* call, which is the expected stub behavior until Plan 4.x ships the Tauri commands)
- PermissionModeSelector + StrategyPresetSelector visible in the header
- AgentStatusBar visible at the bottom of the message stream (gated on `agentStatusBarEnabledAtom`)
- No `data-stub` divs remain for any 4.b symbol (verifiable via DevTools `document.querySelectorAll('[data-deferred-to="4.b"]').length === 0`)

---

## File Structure

```
desktop/src/features/chat-agent/
├── atoms/
│   ├── safety-atoms.ts                 # NEW (Wave A)
│   ├── safety-atoms.test.ts            # NEW smoke test
│   ├── plan-mode-suggest-atoms.ts      # NEW (Wave A)
│   └── plan-mode-suggest-atoms.test.ts # NEW smoke test
├── components/
│   ├── agent/
│   │   ├── agent-heartbeat-banner.tsx           # NEW (Wave B, 462 LOC)
│   │   ├── ask-user-banner.tsx                  # NEW (Wave B, 467 LOC)
│   │   ├── exit-plan-mode-banner.tsx            # NEW (Wave B, 281 LOC)
│   │   ├── plan-mode-suggest-banner.tsx         # NEW (Wave B, 133 LOC)
│   │   ├── automation-run-banner.tsx            # NEW (Wave B, 44 LOC)
│   │   ├── plan-mode-dashed-border.tsx          # NEW (Wave B, 70 LOC)
│   │   ├── permission-banner.tsx                # NEW (Wave B, 220 LOC)
│   │   ├── queued-messages-banner.tsx           # NEW (Wave B, 279 LOC)
│   │   ├── permission-mode-selector.tsx         # NEW (Wave C, 91 LOC)
│   │   ├── strategy-preset-selector.tsx         # NEW (Wave C, 96 LOC)
│   │   ├── agent-status-bar.tsx                 # NEW (Wave C, 254 LOC)
│   │   ├── mode-banner.tsx                      # NEW (Wave C, 41 LOC — bonus port, ships now)
│   │   └── *.test.tsx                            # NEW or ported from uclaw
│   └── chat/
│       ├── chat-appearance-popover.tsx          # NEW (Wave C, 120 LOC)
│       └── chat-appearance-popover.test.tsx     # NEW smoke test
├── lib/
│   ├── agent-types.ts                  # MODIFY: extend with AskUserQuestion + DangerLevel + SafetyModeWire (Wave A)
│   ├── tauri-bridge-stub.ts            # MODIFY: add 6 respond/safety NOT_IMPLEMENTED stubs (Wave A)
│   └── agentview-bridge-stub.tsx       # MODIFY: REMOVE 12 banner exports + their tests (Wave E)
├── desktop/src/features/chat-agent/components/agent/
│   └── agent-view.tsx                  # MODIFY: retarget 12 banner imports from stub to real (Wave E)
└── desktop/src/features/chat-agent/components/app-shell/
    └── app-shell.integration.test.tsx  # MODIFY: extend with banner mount assertions (Wave E)
```

---

## Wave A — Missing atoms + types + bridge stubs

### Task A1: Port `safety-atoms` + extend `agent-types.ts`

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/safety-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/safety-atoms.test.ts`
- Modify: `desktop/src/features/chat-agent/lib/agent-types.ts` (add `DangerLevel`, `SafetyModeWire`, `AskUserQuestion` types if not present)

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src
cat $UC/atoms/safety-atoms.ts
grep -nE "DangerLevel|SafetyModeWire|AskUserQuestion" $UC/lib/agent-types.ts | head -10
```

- [ ] **Step 2: Port `safety-atoms.ts` verbatim**

Apply retargets:
- `@/atoms/<name>` → `@/features/chat-agent/atoms/<name>` (or `./<name>`)
- `@/lib/agent-types` → `@/features/chat-agent/lib/agent-types` (or `../lib/agent-types`)
- Storage-key rebrand on every `atomWithStorage` call

- [ ] **Step 3: Extend `agent-types.ts` with missing type exports**

DO NOT replace the file. Surgically add the missing type aliases / interfaces (`DangerLevel`, `SafetyModeWire`, `AskUserQuestion`) from uclaw's `agent-types.ts`. Match the verbatim shapes exactly.

- [ ] **Step 4: Write smoke test for safety-atoms**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { safetyModeAtom } from './safety-atoms'

describe('safety-atoms', () => {
  beforeEach(() => localStorage.clear())

  it('safetyModeAtom has a deterministic default', () => {
    const store = createStore()
    const v = store.get(safetyModeAtom)
    expect(v).toBeDefined()
  })

  it('persists writes with hermes namespace', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')
    const store = createStore()
    // adjust to whatever shape safetyModeAtom expects
    store.set(safetyModeAtom, 'strict' as never)
    const hermesCall = setSpy.mock.calls.find(([k]) => typeof k === 'string' && k.startsWith('hermes-'))
    expect(hermesCall).toBeDefined()
    expect(hermesCall![0]).not.toContain('uclaw')
  })
})
```

Adjust if `safetyModeAtom` is plain `atom()` (not persistent) — drop the persistence test.

- [ ] **Step 5: Run tests + storage-key audit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-banners/desktop
pnpm vitest run src/features/chat-agent/atoms/safety-atoms.test.ts

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-banners
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/atoms/safety-atoms.ts
```
Expected: tests pass, grep EMPTY.

- [ ] **Step 6: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/safety-atoms.ts \
        desktop/src/features/chat-agent/atoms/safety-atoms.test.ts \
        desktop/src/features/chat-agent/lib/agent-types.ts
git commit -m "feat(desktop): port safety-atoms + extend agent-types with DangerLevel/SafetyModeWire/AskUserQuestion (verbatim)"
```

### Task A2: Port `plan-mode-suggest-atoms`

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/plan-mode-suggest-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/plan-mode-suggest-atoms.test.ts`

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/atoms/plan-mode-suggest-atoms.ts
```

- [ ] **Step 2: Port verbatim with retargets**

- [ ] **Step 3: Smoke test**

```typescript
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { silencedPlanModeSessionsAtom } from './plan-mode-suggest-atoms'

describe('plan-mode-suggest-atoms', () => {
  it('silencedPlanModeSessionsAtom is a Set or array with a stable initial value', () => {
    const store = createStore()
    const v = store.get(silencedPlanModeSessionsAtom)
    expect(v).toBeDefined()
  })
})
```

- [ ] **Step 4: Run + audit + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/atoms/plan-mode-suggest-atoms.test.ts
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/atoms/plan-mode-suggest-atoms.ts
git add desktop/src/features/chat-agent/atoms/plan-mode-suggest-atoms.{ts,test.ts}
git commit -m "feat(desktop): port plan-mode-suggest-atoms (verbatim)"
```

### Task A3: Extend `tauri-bridge-stub.ts` with banner IPC stubs

**File:**
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

Add 6 NOT_IMPLEMENTED stubs for the bridge symbols banner components consume:

```typescript
// ─── Plan 2b.2.c.4.b — banner IPC stubs ──────────────────────────────────
// All throw NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND until the Rust agent-session
// backend ships the corresponding Tauri commands.

import type { DangerLevel, SafetyModeWire } from './agent-types'

export async function respondExitPlanMode(_sessionId: string, _accept: boolean): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondExitPlanMode')
}

export async function respondAskUser(_sessionId: string, _requestId: string, _answer: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondAskUser')
}

export async function respondPermission(
  _sessionId: string,
  _requestId: string,
  _decision: 'allow' | 'deny',
  _scope?: 'once' | 'session' | 'always',
): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondPermission')
}

export async function respondPlanModeSuggest(_sessionId: string, _accept: boolean): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: respondPlanModeSuggest')
}

export async function getSafetyPolicy(): Promise<{ mode: SafetyModeWire }> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: getSafetyPolicy')
}

export async function setSafetyMode(_mode: SafetyModeWire): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND: setSafetyMode')
}
```

ADJUST the type signatures to match the verbatim uclaw `@/lib/tauri-bridge` exports (read uclaw's tauri-bridge.ts for the exact shapes — look for `respondExitPlanMode`, `respondAskUser`, etc.). If a signature differs, the verbatim wins.

- [ ] **Step 1: Read uclaw signatures**

```bash
grep -nA3 "export.*function (respondExitPlanMode|respondAskUser|respondPermission|respondPlanModeSuggest|getSafetyPolicy|setSafetyMode)" /Users/ryanliu/Documents/uclaw/ui/src/lib/tauri-bridge.ts | head -40
```

- [ ] **Step 2: Add stubs matching exact signatures**

- [ ] **Step 3: Verify tsc**

```bash
cd desktop && pnpm tsc -b 2>&1 | grep -E "tauri-bridge-stub|safety-atoms|plan-mode-suggest|agent-types" | head
```
Expected: no NEW errors from these files (pre-existing errors elsewhere are OK).

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add 6 banner IPC stubs (respondExitPlanMode/respondAskUser/respondPermission/respondPlanModeSuggest/getSafetyPolicy/setSafetyMode)"
```

---

## Wave B — 8 banner components (real ports)

Each task: read uclaw source → port verbatim with retargets → write mount test → run + audit + commit.

**Established retargets (same as 4.a):**
- `@/atoms/<name>` → `@/features/chat-agent/atoms/<name>`
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- `@/lib/utils` → `@/shared/lib/cn`
- `@/lib/agent-types` → `@/features/chat-agent/lib/agent-types`
- `@/lib/tauri-bridge` (stub symbols, including the 6 new ones from A3) → `@/features/chat-agent/lib/tauri-bridge-stub`
- `@/contexts/session-context` → `@/features/chat-agent/contexts/session-context`
- `@tauri-apps/api/core` (invoke), `@tauri-apps/api/event` (listen) — keep as-is

**Verbatim rule:** copy bytes; never inline; if a missing symbol surfaces, classify and stub.

### Task B1: Port `AutomationRunBanner` (44 LOC — smallest, warm-up)

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/automation-run-banner.tsx`
- Test: `desktop/src/features/chat-agent/components/agent/automation-run-banner.test.tsx` (port uclaw's existing test)

- [ ] **Step 1: Read source + test**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src/components/agent
cat $UC/AutomationRunBanner.tsx $UC/AutomationRunBanner.test.tsx
```

- [ ] **Step 2: Port both verbatim + retargets**

- [ ] **Step 3: Run tests + audit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-banners/desktop
pnpm vitest run src/features/chat-agent/components/agent/automation-run-banner.test.tsx

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-banners
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent/automation-run-banner.{tsx,test.tsx}
```
Expected: pass + EMPTY.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/automation-run-banner.{tsx,test.tsx}
git commit -m "feat(desktop): port automation-run-banner (verbatim)"
```

### Task B2: Port `PlanModeDashedBorder` (70 LOC)

Same recipe as B1. Source: `PlanModeDashedBorder.tsx`. No uclaw test exists → write a minimal mount smoke test.

### Task B3: Port `PlanModeSuggestBanner` (133 LOC + uclaw test)

Same recipe as B1. Source: `PlanModeSuggestBanner.tsx` + `PlanModeSuggestBanner.test.tsx`. Verbatim port of both.

### Task B4: Port `PermissionBanner` (220 LOC)

Same recipe as B1. Source: `PermissionBanner.tsx`. No uclaw test → write minimal mount smoke test.

### Task B5: Port `QueuedMessagesBanner` (279 LOC)

Same recipe as B1. Source: `QueuedMessagesBanner.tsx`. No uclaw test → write minimal mount smoke test.

### Task B6: Port `ExitPlanModeBanner` (281 LOC)

Same recipe as B1. Source: `ExitPlanModeBanner.tsx`. No uclaw test → write minimal mount smoke test.

### Task B7: Port `AgentHeartbeatBanner` (462 LOC — large)

Same recipe as B1. Source: `AgentHeartbeatBanner.tsx`. No uclaw test → write minimal mount smoke test.

### Task B8: Port `AskUserBanner` (467 LOC — largest)

Same recipe as B1. Source: `AskUserBanner.tsx`. No uclaw test → write minimal mount smoke test.

---

## Wave C — 4 controls (real ports)

### Task C1: Port `PermissionModeSelector` (91 LOC)

Same recipe. No uclaw test → minimal mount smoke test.

### Task C2: Port `StrategyPresetSelector` (96 LOC + uclaw test)

Same recipe. Port uclaw's test verbatim.

### Task C3: Port `AgentStatusBar` (254 LOC + uclaw test)

Same recipe. Port uclaw's test verbatim.

### Task C4: Port `ModeBanner` (41 LOC + uclaw test)

Same recipe. Port uclaw's test verbatim. **Note:** Plan 4.a's `agentview-bridge-stub.tsx` did NOT stub ModeBanner because uclaw's AgentView doesn't import it directly — it's imported by AppShell in uclaw. We port it here as a bonus so it's available when AppShell adds the import.

### Task C5: Port `ChatAppearancePopover` (120 LOC)

Same recipe. This is the only chat-side port in 4.b. Source: `chat/ChatAppearancePopover.tsx`. Target: `desktop/src/features/chat-agent/components/chat/chat-appearance-popover.tsx` (the `components/chat/` dir already exists from Plan 4.a B1).

---

## Wave D — Bridge stub cleanup + AgentView import retargets

### Task D1: Remove the 12 banner stubs from `agentview-bridge-stub.tsx`

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx`
- Modify: `desktop/src/features/chat-agent/lib/agentview-bridge-stub.test.tsx`

- [ ] **Step 1: Identify the 12 symbols to remove**

```bash
grep -nE "'4\.b'\)" desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx
```

Expected list (per Plan 4.a D1's grouping):
- `AgentHeartbeatBanner`, `AskUserBanner`, `ExitPlanModeBanner`, `PlanModeSuggestBanner`, `AutomationRunBanner`, `PlanModeDashedBorder`, `PermissionBanner`, `QueuedMessagesBanner`
- `PermissionModeSelector`, `StrategyPresetSelector`, `AgentStatusBar`
- `ChatAppearancePopover`

- [ ] **Step 2: Delete those 12 stub export lines**

DO NOT delete the helper functions (`makeStubComponent`, `makeStubFn`) — they're still used by the remaining 4.c/4.d/4.e stubs.

Also remove the "Plan 2b.2.c.4.b" section comment header since the entire section is now empty.

- [ ] **Step 3: Update the test file**

In `agentview-bridge-stub.test.tsx`, remove the 12 banner symbols from the `it.each` array. Update the "expects ≥18 component stubs" assertion to whatever the new count is (probably ≥9 if the 4.c/4.d/4.e stubs remain).

- [ ] **Step 4: Run tests + audit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/lib/agentview-bridge-stub.test.tsx
```
Expected: pass with the reduced stub count.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/lib/agentview-bridge-stub.{tsx,test.tsx}
git commit -m "refactor(desktop): remove 12 banner stubs from agentview-bridge-stub (now real in 4.b)"
```

### Task D2: Retarget AgentView's 12 banner imports

**File:**
- Modify: `desktop/src/features/chat-agent/components/agent/agent-view.tsx`

- [ ] **Step 1: Locate the stub imports**

```bash
grep -nE "from '@/features/chat-agent/lib/agentview-bridge-stub'" desktop/src/features/chat-agent/components/agent/agent-view.tsx
```

The current import line(s) pull all banner stubs from `agentview-bridge-stub`. Split into:
- 4.b real imports (12 symbols, see D1) — retarget to their new real paths
- 4.c/4.d/4.e stubs (remaining symbols) — keep on `agentview-bridge-stub`

- [ ] **Step 2: Apply the retargets**

```typescript
// BEFORE (single import line):
import {
  AgentHeartbeatBanner, AskUserBanner, ExitPlanModeBanner, PlanModeSuggestBanner,
  AutomationRunBanner, PlanModeDashedBorder, PermissionBanner, QueuedMessagesBanner,
  PermissionModeSelector, StrategyPresetSelector, AgentStatusBar, ChatAppearancePopover,
  // 4.c/4.d/4.e symbols stay:
  SttModal, FirstRunDialog, SpeechButton, modelStatusAtom, smartJoin,
  PetWidget, BrowserPreviewOverlay, AutoPreviewPopover, ProviderModelSelector,
  FeishuNotifyToggle, GitChipsRow,
} from '@/features/chat-agent/lib/agentview-bridge-stub'

// AFTER (split into real imports + reduced stub):
import { AgentHeartbeatBanner } from '@/features/chat-agent/components/agent/agent-heartbeat-banner'
import { AskUserBanner } from '@/features/chat-agent/components/agent/ask-user-banner'
import { ExitPlanModeBanner } from '@/features/chat-agent/components/agent/exit-plan-mode-banner'
import { PlanModeSuggestBanner } from '@/features/chat-agent/components/agent/plan-mode-suggest-banner'
import { AutomationRunBanner } from '@/features/chat-agent/components/agent/automation-run-banner'
import { PlanModeDashedBorder } from '@/features/chat-agent/components/agent/plan-mode-dashed-border'
import { PermissionBanner } from '@/features/chat-agent/components/agent/permission-banner'
import { QueuedMessagesBanner } from '@/features/chat-agent/components/agent/queued-messages-banner'
import { PermissionModeSelector } from '@/features/chat-agent/components/agent/permission-mode-selector'
import { StrategyPresetSelector } from '@/features/chat-agent/components/agent/strategy-preset-selector'
import { AgentStatusBar } from '@/features/chat-agent/components/agent/agent-status-bar'
import { ChatAppearancePopover } from '@/features/chat-agent/components/chat/chat-appearance-popover'
import {
  // remaining stubs:
  SttModal, FirstRunDialog, SpeechButton, modelStatusAtom, smartJoin,
  PetWidget, BrowserPreviewOverlay, AutoPreviewPopover, ProviderModelSelector,
  FeishuNotifyToggle, GitChipsRow,
} from '@/features/chat-agent/lib/agentview-bridge-stub'
```

- [ ] **Step 3: Run AgentView tests**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/agent/agent-view.test.tsx
```
Expected: pass. The `[data-stub]` assertion in `agent-view.test.tsx:third test` previously expected SOME stubs — should still pass because 4.c/4.d/4.e stubs remain visible.

- [ ] **Step 4: Run full suite**

```bash
cd desktop && pnpm vitest run 2>&1 | tail -5
```
Expected: 705+ tests pass.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/agent-view.tsx
git commit -m "feat(desktop): retarget AgentView's 12 banner imports from stubs to real components (Plan 4.b)"
```

---

## Wave E — Integration tests + final sweep

### Task E1: Extend AppShell integration tests with banner assertions

**File:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

Add a new test group (I):

```typescript
describe('AppShell + AgentView banners (Plan 2b.2.c.4.b)', () => {
  it('no [data-deferred-to="4.b"] stubs remain in the DOM', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    expect(container.querySelectorAll('[data-deferred-to="4.b"]').length).toBe(0)
  })

  it('only 4.c/4.d/4.e stubs remain visible (data-deferred-to)', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    const stubs = container.querySelectorAll('[data-stub]')
    stubs.forEach((s) => {
      const plan = (s as HTMLElement).getAttribute('data-deferred-to')
      expect(['4.c', '4.d', '4.e']).toContain(plan)
    })
  })

  it('AgentStatusBar renders when agentStatusBarEnabledAtom is true', () => {
    const store = createStore()
    store.set(agentStatusBarEnabledAtom, true)
    const { container } = render(<Provider store={store}><AppShell /></Provider>)
    // expect the status bar to be findable — adjust selector to whatever AgentStatusBar renders
    // it may have a data-testid in uclaw; check the verbatim source
    expect(container.querySelector('[data-agent-status-bar], [aria-label*="status"], footer')).not.toBeNull()
  })
})
```

If `agentStatusBarEnabledAtom` isn't already imported, add the import. If the assertion selectors don't match AgentStatusBar's actual DOM, adjust based on the verbatim source.

- [ ] **Step 1: Add the test group**

- [ ] **Step 2: Run + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
cd ..
git add desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "test(desktop): extend AppShell integration suite for Plan 4.b banner real-ports"
```

### Task E2: Final automated sweep + manual launch gate

- [ ] **Step 1: Frontend full sweep**

```bash
cd desktop
pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | grep -v "vite.config.ts\|updater.ts.*Cannot find\|left-sidebar\|bottom-dock\|connection-indicator\|dock-item\|use-dock-bounce" | tail -10
```
Expected: 705+ tests pass; no NEW tsc errors in 4.b-touched files.

- [ ] **Step 2: Backend sweep (defensive — no Rust changes in 4.b)**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-banners
cargo fmt --all --check
cargo test --workspace 2>&1 | tail -10
```
Expected: clean (no Rust changes; just verify no accidental regressions).

- [ ] **Step 3: Anti-god-file + storage-key audit**

```bash
ls desktop/src/lib/
# Expected: only `bridge/`

git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/ desktop/src/lib/
# Expected: only JSDoc rebrand notes
```

- [ ] **Step 4: Parity governance**

```bash
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 5: Manual launch gate**

```bash
cd desktop && pnpm tauri dev
```
Expected:
- Window opens
- AgentView mounts with banners visible (or correctly hidden by their internal state)
- DevTools `document.querySelectorAll('[data-deferred-to="4.b"]').length` returns `0`
- No red console errors

- [ ] **Step 6: Commit any fmt/clippy fixes**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-banners
git status
git add -A
git commit -m "chore(desktop): Plan 2b.2.c.4.b final sweep" 2>/dev/null || true
git log --oneline -5
```

---

## Final Self-Review Checklist (orchestrator-side, before opening PR)

- [ ] Wave A: safety-atoms + plan-mode-suggest-atoms ported with tests; agent-types extended; 6 banner IPC stubs added to tauri-bridge-stub
- [ ] Wave B: 8 banner components ported with tests (AutomationRunBanner, PlanModeDashedBorder, PlanModeSuggestBanner, PermissionBanner, QueuedMessagesBanner, ExitPlanModeBanner, AgentHeartbeatBanner, AskUserBanner)
- [ ] Wave C: 5 controls ported with tests (PermissionModeSelector, StrategyPresetSelector, AgentStatusBar, ModeBanner, ChatAppearancePopover)
- [ ] Wave D: 12 banner stubs removed from agentview-bridge-stub; AgentView import retargeted to real component paths
- [ ] Wave E: integration tests asserting no 4.b stubs remain; full sweep green; manual launch passes
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] Storage-key audit: zero `'uclaw[:-]'` in any new file
- [ ] Test count up by ≥35 (was 670 → ≥705)
- [ ] All commits use conventional-commit prefixes
- [ ] PR carry-forward closures documented:
  - Plan 4.a carry-forward #2 (proma:stop-generation / proma:focus-input dead listeners) — should this PR include the shortcut-registry real implementation? Probably defer to a separate plan since it's unrelated to banner ports.

---

## Carry-Forward Follow-ups (for Plan 4.c / 4.d / later)

1. **STT module** — SttModal + FirstRunDialog + SpeechButton + stt-atoms + lib/stt/punctuation + modelStatusAtom + smartJoin → Plan 4.c
2. **Pet + browser preview + model selector + chat surface** — PetWidget + BrowserPreviewOverlay + AutoPreviewPopover + ProviderModelSelector + FeishuNotifyToggle + GitChipsRow → Plan 4.d (and possibly 4.e for chat-surface)
3. **agentview-bridge-stub.tsx retirement** — after 4.d/4.e ship, the file should be empty and deletable
4. **Slim ChatAgentView retirement** — `desktop/src/features/chat-agent/components/chat-agent-view.tsx` should be deleted in 4.d once the full AgentView has shipped end-to-end
5. **Plan 4.a Important carry-forward #4 (dead `proma:` listeners)** — needs a real `shortcut-registry` + event-dispatcher implementation; defer to a focused PR since it touches keyboard accelerator infra, not banner UI
6. **agent-messages.tsx catch-up** — 162 LOC delta vs current uclaw 1,267 LOC source; 4.b banners don't depend on the missing 162 LOC, but should be addressed before 4.c (STT integration touches the message stream)
