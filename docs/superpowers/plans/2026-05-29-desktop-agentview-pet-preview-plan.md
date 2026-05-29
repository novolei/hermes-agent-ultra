# Plan 2b.2.c.4.d — Desktop AgentView Pet + Preview + Model Selector + Chat-surface Retirement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Final PR of the 4-PR AgentView stack. Real ports for the 4 stubs in `agentview-bridge-stub.tsx`'s 4.d section AND the 2 stubs in the 4.e section (PetWidget + BrowserPreviewOverlay + AutoPreviewPopover + ProviderModelSelector from 4.d; FeishuNotifyToggle + GitChipsRow from 4.e — rolled into this PR since 4.e is only 161 LOC and absorbing it lets us delete `agentview-bridge-stub.tsx` entirely). Also retires the slim `chat-agent-view.tsx` from Plan 2b.2.c.3 (rollback target since 4.a).

After 4.d merges:
- AgentView mounts ALL real components (zero stubs in `agentview-bridge-stub.tsx`)
- `desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx` is DELETED
- `desktop/src/features/chat-agent/components/chat-agent-view.tsx` (the slim shell from Plan 2b.2.c.3) is DELETED
- The full AgentView is the only main-pane renderer
- The 4-PR AgentView stack is COMPLETE

**Architecture:** Verbatim port from `uclaw/ui/src/{atoms,hooks,components}/` following the established Hermes conventions (kebab-case filenames, `desktop/src/features/chat-agent/` layout, anti-god-file invariant, stub discipline). Bridge stubs route through `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` for symbols whose Rust backends aren't shipping in this PR.

**Tech Stack:** React 19 + Jotai 2.17.1 + atomWithStorage + Vitest + jsdom. Verbatim TypeScript ports. shadcn primitives already in `desktop/src/shared/ui/`. PetWidget ships with its own CSS file (verbatim copy). The `@tauri-apps/api/event.listen` + `@tauri-apps/api/core.invoke` calls stay as-is — they'll throw at runtime when called against unimplemented Rust commands, which is the expected stub behavior for backends not yet wired.

**Scope baseline (committed in `main` at `d68b70b01` after PR #16 merge):**
- All of Plan 4.c (full STT real ports + agent-messages catch-up)
- All of Plan 4.b (12 banner real ports)
- All of Plan 4.a (full AgentView shell + slim ChatAgentView preserved as rollback)
- `agentview-bridge-stub.tsx` currently has these 6 deferred symbols:
  - **4.d** (this PR): `PetWidget`, `BrowserPreviewOverlay`, `AutoPreviewPopover`, `ProviderModelSelector`
  - **4.e** (rolled into this PR): `FeishuNotifyToggle`, `GitChipsRow`

**4.d port targets:**

| Bucket | Items | LOC |
|---|---|---|
| Atoms (new) | `browser-atoms.ts`, `feishu-atoms.ts`, `preview-panel-atoms.ts` extension if `autoPreviewEnabledAtom` missing | ~80 |
| Hooks (new) | `use-pet-hover.ts`, `use-pet-state-sync.ts`, `use-browser-screencast.ts` | ~200 |
| 4.d components | PetWidget (73 + test + CSS), BrowserPreviewOverlay (171), BrowserViewer (16 — dep of overlay), AutoPreviewPopover (73), ProviderModelSelector (187 + test) | ~520 + ~150 tests |
| 4.e components | FeishuNotifyToggle (86) + GitChipsRow (75) + BranchPicker (dep of GitChipsRow, size TBD) | ~161 + ~50 BranchPicker |
| Bridge stubs (new) | `getAllConfiguredModels`, `setActiveModel`, `setRoleModel`, `openExternal`, `setFeishuSessionNotify` in `tauri-bridge-stub.ts` (likely already have `openExternal`?) | ~80 |
| `agentview-bridge-stub.tsx` retirement | DELETE the file (and its test) — all 6 stubs migrated to real | -210 |
| `agent-view.tsx` import retarget | Switch 6 imports from `agentview-bridge-stub` to real component paths | ~20 |
| Slim ChatAgentView retirement | DELETE `chat-agent-view.tsx` + its test; remove documentation references in `App.tsx` + `app-shell.tsx` | -190 |
| Integration tests | extend `app-shell.integration.test.tsx` with `[data-stub].length === 0` final assertion (Group K) | ~80 |
| **Total** | | **~1,200** |

**Tests target:** 761 → ≥800 (+39 minimum).

**Manual launch gate (4.d PR acceptance):** `cd desktop && pnpm tauri dev` opens a window where AgentView's final surfaces are functional:
- PetWidget visible in the bottom-right of the message area (or wherever uclaw positions it), with hover interactions
- AutoPreviewPopover accessible from header (toggle that opens a popover with Switch)
- ProviderModelSelector visible in the composer toolbar (dropdown for picking provider + model)
- FeishuNotifyToggle visible in the composer footer (toggle button)
- GitChipsRow visible in the composer footer when active workspace is a git repo
- DevTools assertion: `document.querySelectorAll('[data-stub]').length === 0` — ZERO stubs remain
- No red console errors during initial render

---

## File Structure

```
desktop/src/features/chat-agent/
├── atoms/
│   ├── browser-atoms.ts                # NEW (Wave A)
│   ├── browser-atoms.test.ts           # NEW smoke test
│   ├── feishu-atoms.ts                 # NEW (Wave A)
│   ├── feishu-atoms.test.ts            # NEW smoke test
│   └── preview-panel-atoms.ts          # MODIFY (Wave A): add autoPreviewEnabledAtom if missing
├── hooks/
│   ├── use-pet-hover.ts                # NEW (Wave A)
│   ├── use-pet-state-sync.ts           # NEW (Wave A — used by App.tsx in uclaw)
│   ├── use-browser-screencast.ts       # NEW (Wave A)
│   └── *.test.ts                       # smoke tests for each
├── components/
│   ├── agent/
│   │   ├── pet-widget.tsx              # NEW (Wave B, 73 LOC + uclaw test)
│   │   ├── pet-widget.test.tsx
│   │   ├── pet-widget.css              # NEW (verbatim copy)
│   │   ├── browser-preview-overlay.tsx # NEW (Wave B, 171 LOC)
│   │   ├── browser-viewer.tsx          # NEW (Wave B, 16 LOC — dep)
│   │   ├── auto-preview-popover.tsx    # NEW (Wave B, 73 LOC)
│   │   └── *.test.tsx                  # smoke tests
│   └── chat/
│       ├── provider-model-selector.tsx       # NEW (Wave B, 187 LOC + uclaw test)
│       ├── provider-model-selector.test.tsx
│       ├── feishu-notify-toggle.tsx          # NEW (Wave C — 4.e rollup, 86 LOC)
│       ├── feishu-notify-toggle.test.tsx     # NEW smoke test
│       └── git/
│           ├── git-chips-row.tsx             # NEW (Wave C, 75 LOC)
│           ├── git-chips-row.test.tsx        # NEW smoke test
│           ├── branch-picker.tsx             # NEW (Wave C — dep of GitChipsRow)
│           └── branch-picker.test.tsx        # NEW smoke test
├── lib/
│   └── tauri-bridge-stub.ts                  # MODIFY (Wave A): add 5 new IPC stubs
└── chat-agent-view.tsx                       # DELETE (Wave E — retirement)
└── chat-agent-view.test.tsx                  # DELETE (Wave E)
└── agentview-bridge-stub.tsx                 # DELETE (Wave E — all stubs migrated)
└── agentview-bridge-stub.test.tsx            # DELETE (Wave E)

desktop/src/app/
└── App.tsx                                   # MODIFY (Wave E): remove ChatAgentView comments
```

---

## Wave A — Atoms + hooks + bridge stubs

### Task A1: Port `browser-atoms` + extension to `preview-panel-atoms` if needed

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/browser-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/browser-atoms.test.ts`
- POSSIBLY MODIFY: `desktop/src/features/chat-agent/atoms/preview-panel-atoms.ts` (add `autoPreviewEnabledAtom` if not present)

- [ ] **Step 1: Read sources + audit our existing preview-panel-atoms**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src
cat $UC/atoms/browser-atoms.ts
diff -u desktop/src/features/chat-agent/atoms/preview-panel-atoms.ts $UC/atoms/preview-panel-atoms.ts | head -40
```

- [ ] **Step 2: Port `browser-atoms.ts` verbatim + retargets**

Standard retargets. Storage-key rebrand if any `'uclaw-...'` keys present.

- [ ] **Step 3: Surgically extend `preview-panel-atoms.ts` with `autoPreviewEnabledAtom` if missing**

DO NOT replace the file — surgical addition only.

- [ ] **Step 4: Smoke test browser-atoms**

```typescript
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { browserScreencastFrameAtom } from './browser-atoms'

describe('browser-atoms', () => {
  it('browserScreencastFrameAtom has a deterministic default', () => {
    const store = createStore()
    expect(store.get(browserScreencastFrameAtom)).toBeDefined()
  })
})
```

Adjust assertions to match actual exports.

- [ ] **Step 5: Run + audit + commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-pet-preview/desktop
pnpm vitest run src/features/chat-agent/atoms/browser-atoms.test.ts

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-pet-preview
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/atoms/browser-atoms.ts

git add desktop/src/features/chat-agent/atoms/browser-atoms.{ts,test.ts} \
        desktop/src/features/chat-agent/atoms/preview-panel-atoms.ts 2>/dev/null
git commit -m "feat(desktop): port browser-atoms (verbatim) + extend preview-panel-atoms if needed"
```

### Task A2: Port `feishu-atoms`

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/feishu-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/feishu-atoms.test.ts`

Same pattern as A1.

### Task A3: Port 3 hooks (use-pet-hover, use-pet-state-sync, use-browser-screencast)

**Files:**
- Create: `desktop/src/features/chat-agent/hooks/use-pet-hover.ts` (+ test if uclaw ships)
- Create: `desktop/src/features/chat-agent/hooks/use-pet-state-sync.ts` (+ test — uclaw ships `usePetStateSync.test.tsx`)
- Create: `desktop/src/features/chat-agent/hooks/use-browser-screencast.ts` (+ test if uclaw ships)

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src/hooks
find "$UC" -name "usePet*.ts*" -o -name "useBrowserScreencast*.ts*"
cat $UC/usePetHover.ts $UC/usePetStateSync.ts $UC/useBrowserScreencast.ts 2>/dev/null
```

- [ ] **Step 2: Port all 3 hooks verbatim**

If any hook has an imports we don't have yet, port the dep as a sub-task.

- [ ] **Step 3: Run tests + audit + commit per hook OR batched**

```bash
git add desktop/src/features/chat-agent/hooks/
git commit -m "feat(desktop): port pet + browser-screencast hooks (verbatim)"
```

### Task A4: Add bridge stubs for 4.d/4.e components

**File:**
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

Add stubs (NOT_IMPLEMENTED_IN_PLAN_4_X_BACKEND) for:
- `getAllConfiguredModels`, `setActiveModel`, `setRoleModel` (ProviderModelSelector)
- `openExternal` (BrowserPreviewOverlay — may already exist; check first)
- `setFeishuSessionNotify` (FeishuNotifyToggle)

Plus type aliases the bridge stubs need (`FeishuNotifyMode` etc.) — port from uclaw's `agent-types.ts` if missing.

- [ ] **Step 1: Audit current stub surface**

```bash
grep -nE "^export (async )?function (getAllConfiguredModels|setActiveModel|setRoleModel|openExternal|setFeishuSessionNotify)" desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
```

- [ ] **Step 2: Add missing stubs with proper types from uclaw**

- [ ] **Step 3: Run tsc to verify clean**

```bash
cd desktop && pnpm tsc -b 2>&1 | grep tauri-bridge-stub | head
```

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add bridge stubs for ProviderModelSelector + BrowserPreview + FeishuToggle"
```

---

## Wave B — 4.d component real ports

### Task B1: Port `AutoPreviewPopover` (73 LOC, smallest)

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/auto-preview-popover.tsx`
- Test: `desktop/src/features/chat-agent/components/agent/auto-preview-popover.test.tsx` (NEW minimal mount test)

Same recipe as previous waves. Standard retargets. Verbatim copy.

### Task B2: Port `BrowserViewer` + `BrowserPreviewOverlay`

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/browser-viewer.tsx` (16 LOC, dep)
- Create: `desktop/src/features/chat-agent/components/agent/browser-preview-overlay.tsx` (171 LOC)
- Tests: minimal mount smoke tests (uclaw doesn't ship tests for either)

Note: BrowserPreviewOverlay imports BrowserViewer — port BrowserViewer first, then overlay.

### Task B3: Port `PetWidget` + CSS

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/pet-widget.tsx` (73 LOC)
- Create: `desktop/src/features/chat-agent/components/agent/pet-widget.css` (byte-identical copy)
- Test: `desktop/src/features/chat-agent/components/agent/pet-widget.test.tsx` (port from uclaw)

CSS import: `import './pet-widget.css'` (filename change).

### Task B4: Port `ProviderModelSelector`

**Files:**
- Create: `desktop/src/features/chat-agent/components/chat/provider-model-selector.tsx` (187 LOC)
- Test: `desktop/src/features/chat-agent/components/chat/provider-model-selector.test.tsx` (port from uclaw)

Standard retargets. Bridge calls go through Wave A4 stubs.

---

## Wave C — 4.e rollup (FeishuNotifyToggle + GitChipsRow + BranchPicker)

### Task C1: Port `FeishuNotifyToggle`

**Files:**
- Create: `desktop/src/features/chat-agent/components/chat/feishu-notify-toggle.tsx` (86 LOC)
- Test: minimal mount smoke test

Bridge call: `setFeishuSessionNotify` (Wave A4 stub).

### Task C2: Port `BranchPicker` then `GitChipsRow`

**Files:**
- Create: `desktop/src/features/chat-agent/components/chat/git/branch-picker.tsx` (port first — dep)
- Create: `desktop/src/features/chat-agent/components/chat/git/git-chips-row.tsx` (75 LOC)
- Tests: minimal mount smoke tests for both

Bridge call: `gitIsRepo`, `gitCurrentBranch` — these are already in `tauri-bridge-stub.ts` from Plan 3.3 C2. The uclaw import is `from '@/modules/git/api'` — retarget to `from '@/features/chat-agent/lib/tauri-bridge-stub'`.

---

## Wave D — Bridge stub retirement + AgentView import retargets

### Task D1: Retarget AgentView's 6 stub imports + DELETE the stub file

**Files:**
- Modify: `desktop/src/features/chat-agent/components/agent/agent-view.tsx` (split the import block)
- DELETE: `desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx`
- DELETE: `desktop/src/features/chat-agent/lib/agentview-bridge-stub.test.tsx`

- [ ] **Step 1: Confirm agentview-bridge-stub.tsx will be empty after all 6 retargets**

```bash
grep -nE "makeStubComponent|makeStubFn|^export" desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx
```

After retargeting all 6 symbols (PetWidget, BrowserPreviewOverlay, AutoPreviewPopover, ProviderModelSelector, FeishuNotifyToggle, GitChipsRow), the file should only have the `makeStubComponent`/`makeStubFn` helpers + their imports. The helpers are no longer used — delete them too.

- [ ] **Step 2: Update agent-view.tsx imports**

Replace the stub import block with 6 real imports:
```typescript
import { PetWidget } from '@/features/chat-agent/components/agent/pet-widget'
import { BrowserPreviewOverlay } from '@/features/chat-agent/components/agent/browser-preview-overlay'
import { AutoPreviewPopover } from '@/features/chat-agent/components/agent/auto-preview-popover'
import { ProviderModelSelector } from '@/features/chat-agent/components/chat/provider-model-selector'
import { FeishuNotifyToggle } from '@/features/chat-agent/components/chat/feishu-notify-toggle'
import { GitChipsRow } from '@/features/chat-agent/components/chat/git/git-chips-row'
```

- [ ] **Step 3: DELETE agentview-bridge-stub.tsx and its test**

```bash
git rm desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx
git rm desktop/src/features/chat-agent/lib/agentview-bridge-stub.test.tsx
```

- [ ] **Step 4: Run AgentView tests + full suite**

Expected: agent-view tests still pass; full suite count goes UP (kept tests for new components, lost 6 stub tests but the deletion is intentional).

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/agent-view.tsx \
        desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx \
        desktop/src/features/chat-agent/lib/agentview-bridge-stub.test.tsx
git commit -m "refactor(desktop): retire agentview-bridge-stub.tsx (all 6 stubs now real)"
```

---

## Wave E — Slim ChatAgentView retirement + integration tests + final sweep

### Task E1: Retire slim ChatAgentView

**Files:**
- DELETE: `desktop/src/features/chat-agent/components/chat-agent-view.tsx`
- DELETE: `desktop/src/features/chat-agent/components/chat-agent-view.test.tsx`
- MODIFY: `desktop/src/app/App.tsx` (remove ChatAgentView documentation references)
- MODIFY: `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx` (remove rollback-target comment)

- [ ] **Step 1: Verify nothing imports ChatAgentView**

```bash
grep -rn "from.*chat-agent-view\|ChatAgentView" desktop/src/ 2>/dev/null
```

Expected: only documentation comments + the slim file itself. If any real import exists, BLOCKED.

- [ ] **Step 2: Delete the slim files**

```bash
git rm desktop/src/features/chat-agent/components/chat-agent-view.tsx
git rm desktop/src/features/chat-agent/components/chat-agent-view.test.tsx
```

- [ ] **Step 3: Clean up comments in App.tsx + app-shell.tsx**

Remove the rollback-target documentation that referenced the slim shell.

- [ ] **Step 4: Run + commit**

```bash
cd desktop && pnpm vitest run 2>&1 | tail -5
cd ..
git add desktop/src/app/App.tsx \
        desktop/src/features/chat-agent/components/app-shell/app-shell.tsx
git commit -m "refactor(desktop): retire slim ChatAgentView (replaced by full AgentView in 4.a)"
```

### Task E2: Extend integration tests + final sweep

- [ ] **Step 1: Add the final-state assertion to app-shell.integration.test.tsx**

```typescript
describe('AppShell + AgentView final state (Plan 2b.2.c.4.d)', () => {
  it('zero [data-stub] elements remain — AgentView is fully real', () => {
    const { container } = mountAppShell()
    expect(container.querySelectorAll('[data-stub]').length).toBe(0)
  })
})
```

This is the closing assertion of the entire 4-PR AgentView stack.

- [ ] **Step 2: Anti-god-file check**

```bash
ls desktop/src/lib/
```
Expected: ONLY `bridge`.

- [ ] **Step 3: Storage-key sweep**

```bash
git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/ desktop/src/lib/ desktop/src/test-utils/
```
Expected: ONLY JSDoc rebrand-history comments.

- [ ] **Step 4: Frontend full sweep**

```bash
cd desktop && pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | tail -30
```
Expected: 800+ tests pass; no NEW tsc errors in 4.d files.

- [ ] **Step 5: Cargo fmt**

```bash
cargo fmt --all --check
```

- [ ] **Step 6: Parity governance**

```bash
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3
```

- [ ] **Step 7: Final sweep commit**

```bash
git status
git add -A
git commit -m "chore(desktop): Plan 2b.2.c.4.d final sweep (AgentView stack complete)" 2>/dev/null || true
git log --oneline -5
```

---

## Final Self-Review Checklist (orchestrator-side, before opening PR)

- [ ] Wave A: browser-atoms + feishu-atoms + 3 hooks + bridge stubs all ported
- [ ] Wave B: AutoPreviewPopover + BrowserViewer + BrowserPreviewOverlay + PetWidget (+ CSS) + ProviderModelSelector all ported
- [ ] Wave C: FeishuNotifyToggle + BranchPicker + GitChipsRow all ported (4.e rolled into 4.d)
- [ ] Wave D: AgentView's 6 stub imports retargeted; agentview-bridge-stub.tsx DELETED; agentview-bridge-stub.test.tsx DELETED
- [ ] Wave E: chat-agent-view.tsx + test DELETED; App.tsx + app-shell.tsx documentation cleaned; integration test asserts `[data-stub].length === 0`; full sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] Storage-key audit: zero `'uclaw[:-]'` in any new file
- [ ] Test count up by ≥39 (was 761 → ≥800)
- [ ] Manual `pnpm tauri dev` launch passes — ZERO `[data-stub]` elements in DOM
- [ ] All commits use conventional-commit prefixes
- [ ] PR description celebrates the closure of the AgentView stack

---

## Carry-Forward Follow-ups (post-4.d)

After 4.d merges, the AgentView 4-PR stack is COMPLETE. The remaining open items from earlier PR carry-forwards:

1. **Rust STT backend** (Plan 4.c FU #1) — `stt_download_model`, `stt_transcribe`, `stt:openflow-download-progress`. Documented in `tauri-bridge-stub.ts`. Next plan: backend implementation when audio capture pipeline is wired.
2. **Plan 4.a #2** — `proma:stop-generation` / `proma:focus-input` dead listeners. Still deferred to a focused shortcut-registry PR.
3. **Plan 4.b #3** — `agent-heartbeat-banner.test.tsx` Tauri-listen-in-jsdom unhandled-rejection warnings. Tests pass but stderr noise should be silenced; low priority cleanup.
4. **Plan 4.c FU #2** — `useShortcut.ts` full implementation, deferred until keybinding system is wired.
5. **`stt_*` Rust commands + 4.d new commands** — `getAllConfiguredModels`, `setActiveModel`, `setRoleModel`, `setFeishuSessionNotify`, browser-screencast Tauri command. All documented as NOT_IMPLEMENTED stubs; real backend lands when the relevant domain ships.

The next major plan after 4.d is **Plan 3.5 — Settings dialog + Search palette** (from the navigation-spine spec doc, originally mentioned as a sibling to Plan 3.3). After 3.5 ships, the AppShell has all of its top-level UI surfaces: LeftSidebar, AgentView, BottomDock, Settings, Search.
