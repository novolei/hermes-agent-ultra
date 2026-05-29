# Plan 3.5.s.a — Desktop SettingsDialog Shell + Core 3 Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First PR of the SettingsDialog sub-stack (3.5.s.a). Port uclaw's `SettingsDialog` shell + 3 core tabs (General + Connectivity + Tools) verbatim. The shell's 14-branch tab switch renders the 3 real tabs we ship + 11 stubs for deferred tabs (Intelligence, MemoryRecall, LearnedProfile, ImChannels, Stt, Shortcuts, Pet, Proxy, BrowserRuntime, System, About — future sub-PRs 3.5.s.b/c/d).

After 3.5.s.a merges, clicking the settings cog in LeftSidebar (already wired via `settingsOpenAtom` from Plan 3.3) opens the dialog. The 3 core tabs are functional (or as functional as the underlying Tauri stubs allow — most settings persist through the bridge stubs that return NOT_IMPLEMENTED). The 11 deferred tabs render visible placeholder panels with `data-deferred-to="3.5.s.b"` / `data-deferred-to="3.5.s.c"` markers.

**Architecture:** Verbatim port from `uclaw/ui/src/components/settings/` following Hermes conventions (kebab-case filenames, `desktop/src/features/chat-agent/` layout, anti-god-file invariant, stub discipline). The settings stubs follow the AgentView bridge-stub pattern from Plan 4.a D1 — same `makeStubComponent` helper, same `data-stub`/`data-deferred-to` test seams.

**Tech Stack:** React 19 + Jotai 2.17.1 + Vitest + jsdom. shadcn primitives (Dialog, ScrollArea, Tabs, Button) already in `desktop/src/shared/ui/`. `motion/react` already in deps. Existing `settingsOpenAtom`, `settingsTabAtom`, `SettingsTab` type already in `atoms/settings-tab.ts`.

**Scope baseline (committed in `main` at `092833c74` after PR #19 merge):**
- All plans through the shortcuts-cleanup PR
- `settings-tab.ts` already exports `settingsTabAtom`, `settingsOpenAtom`, `SettingsTab` type, `channelFormDirtyAtom`, `settingsCloseRequestedAtom`
- `searchPaletteOpenAtom` (3.5-slim) wired via Cmd+K
- AgentView fully real (zero `[data-stub]` in DOM); after 3.5.s.a, ~11 `[data-deferred-to="3.5.s.*"]` stubs appear (these are SCOPED to SettingsDialog when open — they don't pollute the closed-state DOM)

**3.5.s.a port targets:**

| Bucket | Items | LOC |
|---|---|---|
| Settings bridge stub file (NEW) | `settings-bridge-stub.tsx` with 11 deferred-tab component stubs + helpers | ~150 |
| Likely new IPC stubs in `tauri-bridge-stub.ts` | ~20 functions surfaced during sub-component ports (model config, channel CRUD, usage stats, tool config, permissions CRUD) | ~250 |
| Likely new atom files | `channel-atoms.ts`, `usage-atoms.ts`, `permissions-atoms.ts`, `prompt-atoms.ts` — sized TBD per recon during execution | ~300 |
| Shell components | SettingsDialog (56) + SettingsPanel (112) + SettingsBreadcrumb (79) + SettingsNav (154) | 401 |
| GeneralTab + closure | GeneralTab (23) + GeneralSettings (76) + PromptSettings (378) + AppearanceSettings (297) | 774 |
| ConnectivityTab + closure | ConnectivityTab (24) + ChannelSettings (455) + UsageSettings (393) | 872 |
| ToolsTab + closure | ToolsTab (22) + ToolSettings (116) + PermissionsSettings (328) | 466 |
| AppShell wiring | Mount `<SettingsDialog />` always-on; verify settings cog in LeftSidebar already dispatches `settingsOpenAtom = true` | ~20 |
| Integration tests | Group N: `settingsOpenAtom=true` opens dialog; 3 tabs are real; 11 stubs render | ~150 |
| **Total** | | **~3,400 LOC** |

**Tests target:** 838 → ≥880 (+42 minimum).

**Manual launch gate:** `cd desktop && pnpm tauri dev` opens a window where clicking the settings cog (already in LeftSidebar) opens SettingsDialog. The 3 core tabs render real content (GeneralSettings + PromptSettings + AppearanceSettings; ChannelSettings + UsageSettings; ToolSettings + PermissionsSettings). Switching to any of the 11 deferred tabs (via SettingsNav clicks) shows a visible "this tab is deferred to Plan 3.5.s.b/c" placeholder with `data-deferred-to` attribute. No console errors.

---

## File Structure

```
desktop/src/features/chat-agent/
├── lib/
│   ├── settings-bridge-stub.tsx        # NEW (Wave A1 — 11 deferred-tab stubs + makeStubTab helper)
│   ├── settings-bridge-stub.test.tsx   # NEW smoke test
│   └── tauri-bridge-stub.ts            # MODIFY (Wave A2 — ~20 new IPC stubs surfaced per port)
├── atoms/
│   ├── channel-atoms.ts                # NEW (Wave A3 — surfaced by ChannelSettings)
│   ├── usage-atoms.ts                  # NEW (Wave A3 — surfaced by UsageSettings)
│   ├── permissions-atoms.ts            # NEW (Wave A3 — surfaced by PermissionsSettings)
│   └── *.test.ts                       # smoke tests
├── components/
│   ├── settings/                       # NEW directory
│   │   ├── settings-dialog.tsx         # NEW (Wave B1, 56 LOC)
│   │   ├── settings-dialog.test.tsx
│   │   ├── settings-panel.tsx          # NEW (Wave B1, 112 LOC)
│   │   ├── settings-panel.test.tsx
│   │   ├── settings-breadcrumb.tsx     # NEW (Wave B1, 79 LOC)
│   │   ├── settings-breadcrumb.test.tsx
│   │   ├── settings-nav.tsx            # NEW (Wave B1, 154 LOC)
│   │   ├── settings-nav.test.tsx
│   │   ├── general-tab.tsx             # NEW (Wave C1, 23 LOC)
│   │   ├── general-tab.test.tsx
│   │   ├── general-settings.tsx        # NEW (Wave C2, 76 LOC)
│   │   ├── prompt-settings.tsx         # NEW (Wave C3, 378 LOC)
│   │   ├── appearance-settings.tsx     # NEW (Wave C4, 297 LOC)
│   │   ├── connectivity-tab.tsx        # NEW (Wave D1, 24 LOC)
│   │   ├── channel-settings.tsx        # NEW (Wave D2, 455 LOC)
│   │   ├── usage-settings.tsx          # NEW (Wave D3, 393 LOC)
│   │   ├── tools-tab.tsx               # NEW (Wave E1, 22 LOC)
│   │   ├── tool-settings.tsx           # NEW (Wave E2, 116 LOC)
│   │   ├── permissions-settings.tsx    # NEW (Wave E3, 328 LOC)
│   │   └── *.test.tsx                  # mount tests per file (port uclaw's where they ship)
│   └── app-shell/
│       ├── app-shell.tsx               # MODIFY (Wave F1 — mount <SettingsDialog />)
│       └── app-shell.integration.test.tsx  # MODIFY (Wave F2 — Group N assertions)
```

---

## Wave A — Bridge stubs + new atom files

### Task A1: Create `settings-bridge-stub.tsx` for the 11 deferred tabs

**File:**
- Create: `desktop/src/features/chat-agent/lib/settings-bridge-stub.tsx`
- Create: `desktop/src/features/chat-agent/lib/settings-bridge-stub.test.tsx`

The 11 deferred-tab stubs are: `IntelligenceTab`, `MemoryRecallTab`, `LearnedProfileTab`, `ImChannelsSettings`, `SttSettings`, `ShortcutSettings`, `PetSettings`, `ProxySetting`, `BrowserRuntimeSettings`, `SystemTab`, `AboutSettings`.

Plus likely re-export the deferred-plan attribution so `data-deferred-to` strings are correct:

| Symbol | Destination |
|---|---|
| IntelligenceTab | 3.5.s.b |
| MemoryRecallTab | 3.5.s.b |
| LearnedProfileTab | 3.5.s.b |
| ShortcutSettings | 3.5.s.b |
| SttSettings | 3.5.s.c |
| ImChannelsSettings | 3.5.s.c |
| PetSettings | 3.5.s.c |
| BrowserRuntimeSettings | 3.5.s.c |
| ProxySetting | 3.5.s.d |
| SystemTab | 3.5.s.d |
| AboutSettings | 3.5.s.d |

ADJUST groupings if the orchestrator's later sub-stack breakdown changes.

- [ ] **Step 1: Write the stub file**

Pattern same as Plan 4.a `agentview-bridge-stub.tsx` (since deleted). The `makeStubTab` helper renders a visible "deferred" placeholder (so user can SEE which tab is missing when they click it), not a hidden `display:none`:

```typescript
// desktop/src/features/chat-agent/lib/settings-bridge-stub.tsx
import * as React from 'react'

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

// Plan 3.5.s.b — intelligence + memory + shortcuts
export const IntelligenceTab = makeStubTab('IntelligenceTab', '3.5.s.b')
export const MemoryRecallTab = makeStubTab('MemoryRecallTab', '3.5.s.b')
export const LearnedProfileTab = makeStubTab('LearnedProfileTab', '3.5.s.b')
export const ShortcutSettings = makeStubTab('ShortcutSettings', '3.5.s.b')

// Plan 3.5.s.c — provider integrations + STT settings + pet + browser runtime
export const SttSettings = makeStubTab('SttSettings', '3.5.s.c')
export const ImChannelsSettings = makeStubTab('ImChannelsSettings', '3.5.s.c')
export const PetSettings = makeStubTab('PetSettings', '3.5.s.c')
export const BrowserRuntimeSettings = makeStubTab('BrowserRuntimeSettings', '3.5.s.c')

// Plan 3.5.s.d — advanced + system
export const ProxySetting = makeStubTab('ProxySetting', '3.5.s.d')
export const SystemTab = makeStubTab('SystemTab', '3.5.s.d')
export const AboutSettings = makeStubTab('AboutSettings', '3.5.s.d')
```

- [ ] **Step 2: Write the smoke test**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as stubs from './settings-bridge-stub'

describe('settings-bridge-stub', () => {
  it('exports 11 deferred-tab stub components', () => {
    const exportedFunctions = Object.values(stubs).filter((v) => typeof v === 'function')
    expect(exportedFunctions.length).toBe(11)
  })

  it.each([
    ['IntelligenceTab', '3.5.s.b'],
    ['SttSettings', '3.5.s.c'],
    ['AboutSettings', '3.5.s.d'],
  ])('%s renders with data-stub + data-deferred-to=%s', (name, plan) => {
    const Comp = (stubs as Record<string, React.ComponentType>)[name]
    const { container } = render(<Comp />)
    const stub = container.querySelector(`[data-stub="${name}"]`)
    expect(stub).not.toBeNull()
    expect(stub?.getAttribute('data-deferred-to')).toBe(plan)
  })
})
```

- [ ] **Step 3: Run + commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-dialog/desktop
pnpm vitest run src/features/chat-agent/lib/settings-bridge-stub.test.tsx

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-dialog
git add desktop/src/features/chat-agent/lib/settings-bridge-stub.{tsx,test.tsx}
git commit -m "feat(desktop): create settings-bridge-stub.tsx for 11 deferred settings tabs"
```

### Task A2: Add IPC stubs surfaced by sub-components (iterative — run during Waves C/D/E)

**File:** `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

This task is interleaved with Waves C/D/E. Each sub-component port (PromptSettings, ChannelSettings, UsageSettings, ToolSettings, PermissionsSettings, AppearanceSettings) may surface new IPC functions the component calls via `invoke()` or typed wrappers. For each unanticipated symbol:
- Add a typed NOT_IMPLEMENTED stub
- Add any type aliases its signature needs (port from uclaw's `tauri-bridge.ts` if not already in our `agent-types.ts`)
- Commit each batch with the sub-component it unblocks

**Per-commit pattern:**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add <N> IPC stubs surfaced by <sub-component> port"
```

### Task A3: Port missing atom files (iterative — run during Waves C/D/E)

**Files:** `desktop/src/features/chat-agent/atoms/<name>.ts`

Likely candidates per sub-component imports:
- `prompt-atoms.ts` (PromptSettings)
- `channel-atoms.ts` (ChannelSettings)
- `usage-atoms.ts` (UsageSettings)
- `permissions-atoms.ts` (PermissionsSettings)

For each, port verbatim with retargets per the standard table (per Plans 4.b A1/A2 pattern). Storage-key rebrand. Smoke test with `createStore` from `jotai/vanilla`.

---

## Wave B — Shell components

### Task B1: Port `SettingsDialog` + `SettingsPanel` + `SettingsBreadcrumb` + `SettingsNav`

Recipe: verbatim port each with standard retargets:
- `@/atoms/settings-tab` → `@/features/chat-agent/atoms/settings-tab`
- `@/atoms/updater` → `@/features/chat-agent/atoms/updater`
- `@/atoms/stt-atoms` → `@/features/chat-agent/atoms/stt-atoms`
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- `./ToolsTab` etc. → kebab-case sibling paths under `components/settings/`
- For the 11 deferred-tab imports in SettingsPanel: retarget to `@/features/chat-agent/lib/settings-bridge-stub`

Each component gets a minimal mount smoke test (or port uclaw's if shipped).

For `SettingsDialog`, add `data-settings-dialog` to the outer wrapper for the F2 integration test seam.

```bash
# Commit per file or batched depending on cleanliness
git add desktop/src/features/chat-agent/components/settings/settings-dialog.{tsx,test.tsx} \
        desktop/src/features/chat-agent/components/settings/settings-panel.{tsx,test.tsx} \
        desktop/src/features/chat-agent/components/settings/settings-breadcrumb.{tsx,test.tsx} \
        desktop/src/features/chat-agent/components/settings/settings-nav.{tsx,test.tsx}
git commit -m "feat(desktop): port SettingsDialog shell — SettingsPanel + SettingsBreadcrumb + SettingsNav (verbatim)"
```

---

## Wave C — General tab (PromptSettings + AppearanceSettings + GeneralSettings)

### Task C1: Port `GeneralTab.tsx` wrapper (23 LOC trivial)

```bash
git add desktop/src/features/chat-agent/components/settings/general-tab.{tsx,test.tsx}
git commit -m "feat(desktop): port general-tab wrapper (verbatim)"
```

### Task C2: Port `GeneralSettings.tsx` (76 LOC)

Standard recipe. If new IPC or atoms surface, port as A2/A3 prereq commits.

### Task C3: Port `PromptSettings.tsx` (378 LOC)

The biggest General-tab dep. Likely surfaces `prompt-atoms.ts` and several `system_prompt_*` IPC stubs. Port as a single verbatim commit + prereq commits as needed.

### Task C4: Port `AppearanceSettings.tsx` (297 LOC)

Likely depends on `theme-atoms` (already in our tree from Plan 3.1) + chat-appearance atoms (already in our tree from Plan 4.b C5). Standard recipe.

---

## Wave D — Connectivity tab (ChannelSettings + UsageSettings)

### Task D1: Port `ConnectivityTab.tsx` wrapper (24 LOC)

### Task D2: Port `ChannelSettings.tsx` (455 LOC — biggest single sub-component)

Surfaces `channel-atoms.ts` + many channel-CRUD IPC stubs. Port as a Wave A3 prereq for the atoms + Wave A2 prereq commits for IPC stubs.

### Task D3: Port `UsageSettings.tsx` (393 LOC)

Surfaces `usage-atoms.ts` + usage-data IPC stubs (`getUsageBudget`, `setUsageBudget`, etc.).

---

## Wave E — Tools tab (ToolSettings + PermissionsSettings)

### Task E1: Port `ToolsTab.tsx` wrapper (22 LOC)

### Task E2: Port `ToolSettings.tsx` (116 LOC)

Likely depends on tool-config atoms (may need new file) + tool-CRUD IPC stubs.

### Task E3: Port `PermissionsSettings.tsx` (328 LOC)

Surfaces `permissions-atoms.ts` (likely overlaps `safety-atoms.ts` from Plan 4.b A1 — verify which is the actual import target) + permission-CRUD IPC stubs.

---

## Wave F — AppShell wiring + integration tests + final sweep

### Task F1: Mount `<SettingsDialog />` in AppShell

**File:** `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx`

Add the import + always-mount the dialog. Visibility is controlled internally by `settingsOpenAtom`:

```typescript
import { SettingsDialog } from '@/features/chat-agent/components/settings/settings-dialog'

// ... inside AppShell JSX, alongside SearchPalette:
<SettingsDialog />
```

Verify the existing LeftSidebar settings cog click handler already dispatches `setSettingsOpen(true)` (Plan 3.3 wired this; just verify the wiring still resolves).

### Task F2: Group N integration tests

**File:** `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

Add a group N after M:

```typescript
describe('AppShell + SettingsDialog (Plan 3.5.s.a)', () => {
  it('N1: SettingsDialog mounts in AppShell tree (initially closed)', () => {
    const { container } = mountAppShell()
    // Dialog is always-mounted; visibility internal via settingsOpenAtom
    expect(container.querySelector('[data-settings-dialog]')).not.toBeNull()
  })

  it('N2: settingsOpenAtom=true opens the dialog with 3 real tabs', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    const { container } = render(<Provider store={store}><AppShell /></Provider>)
    // SettingsPanel renders the active tab (default: connectivity)
    // 3 real tabs are GeneralTab + ConnectivityTab + ToolsTab; verify their content reachable
    expect(container.querySelector('[data-settings-section]')).not.toBeNull()
  })

  it('N3: deferred tabs show data-deferred-to placeholders', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'intelligence')  // deferred to 3.5.s.b
    const { container } = render(<Provider store={store}><AppShell /></Provider>)
    expect(container.querySelector('[data-deferred-to="3.5.s.b"]')).not.toBeNull()
  })

  it('N4: M/L/K assertions still pass (no regression from Settings mounts)', () => {
    const { container } = mountAppShell()
    // K assertion: zero unscoped [data-stub] in DOM (SearchPalette wiring assertion)
    // Settings stubs only render when dialog is OPEN, so closed-state DOM should still have 0
    expect(container.querySelectorAll('[data-stub]').length).toBe(0)
  })
})
```

Adjust selectors based on what the real ports render.

### Task F3: Final automated sweep

Same recipe as Plan 3.5-slim C3:

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-dialog
ls desktop/src/lib/                                                          # only bridge/
git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/
cd desktop && pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | grep -c "error TS"  # expect: stays at ~31 (no NEW errors)
cd ..
cargo fmt --all --check
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3

git status
git add -A
git commit -m "chore(desktop): Plan 3.5.s.a final sweep" 2>/dev/null || true
git log --oneline -10
```

---

## Final Self-Review Checklist (orchestrator-side, before opening PR)

- [ ] Wave A: settings-bridge-stub.tsx with 11 stubs; new IPC stubs in tauri-bridge-stub.ts; new atom files ported
- [ ] Wave B: shell (4 files) ported
- [ ] Wave C: GeneralTab + 3 sub-components ported
- [ ] Wave D: ConnectivityTab + 2 sub-components ported
- [ ] Wave E: ToolsTab + 2 sub-components ported
- [ ] Wave F: AppShell mounts SettingsDialog; Group N integration tests pass; final sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] Storage-key audit: zero `'uclaw[:-]'` in any new file
- [ ] Test count up by ≥42 (was 838 → ≥880)
- [ ] tsc residual errors stable (~31; no NEW from 3.5.s.a)
- [ ] Manual `pnpm tauri dev` launch — settings cog opens dialog with 3 real tabs + 11 deferred placeholders
- [ ] All commits use conventional-commit prefixes

---

## Carry-Forward Follow-ups

After 3.5.s.a merges:

1. **Plan 3.5.s.b** — IntelligenceTab + MemoryRecallTab + LearnedProfileTab + ShortcutSettings (~3,000 LOC across 4 stubs replaced)
2. **Plan 3.5.s.c** — Provider tabs (ImChannelsSettings + FeishuSettings + WeChatSettings + BotHubSettings + WechatIlinkBindingPanel) + SttSettings + PetSettings + BrowserRuntimeSettings (~3,500 LOC)
3. **Plan 3.5.s.d** — ProxySetting + SystemTab + AboutSettings + ReleaseNotesViewer + DeveloperOptionsSection + FoldDeltaThresholdSection + WorkspaceSkillTagsEditor + PersonaBondTimeline (~3,000 LOC)
4. **Rust backends** — all the new IPC stubs added during Waves C/D/E need Rust implementations eventually
5. **Pre-existing carry-forwards** (rolled over) — 31 residual tsc errors, ~30 NOT_IMPLEMENTED stubs from earlier plans, verbatim bug in `shortcut-defaults.ts` (uncovered by shortcuts-cleanup PR), agentview Rust backends
