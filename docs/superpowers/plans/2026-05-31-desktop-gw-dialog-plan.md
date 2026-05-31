# Git Workbench — GW.b Pickers + Dialog + Stub Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the git workbench sub-stack — verbatim-port `GitActionsPicker` + `GitWorkbenchDialog` (+ their tests), then **swap the 2 LeftSidebar git stubs** (`git-actions-picker-stub` + `git-workbench-dialog-stub`) → the real components in `sidebar-git-actions.tsx` and delete the stubs. After this PR the chat/agent sidebar's git actions are **live**.

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. Both components consume GW.a's leaves (forms, draft-pr, use-git-workbench) + the git ops in `tauri-bridge-stub.ts`. They compile in Wave A (sidebar still uses stubs), get tests in Wave B, and are swapped in Wave C. **Low swap risk:** GitActionsPicker's `ghAvailable()` is gated on the popover being open, and both render closed by default in `sidebar-git-actions`, so the swap adds no mount-time git IPC to the LeftSidebar tests.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps.**

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY import paths per the retarget table, prepend `// Ported verbatim from uclaw <relative source path> — Plan GW.b`.
- **Dest naming:** PascalCase → kebab. Dest dir: `desktop/src/features/chat-agent/components/chat/git/`.
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1123** tests pass. Waves A/B keep tsc 19 + tests green (components compile, then tests add to the count). Wave C (swap) commits sidebar + stub deletions together (green).
- **Verify-not-already-ported:** `ls` each dest before creating (confirmed absent at plan time).
- **Inline `renderWithProviders` shim** (desktop has no `@/test-utils/render`): `function renderWithProviders(ui, opts?) { return render(<Provider store={opts?.store}><TooltipProvider>{ui}</TooltipProvider></Provider>) }` (import `Provider` from `jotai`, `TooltipProvider` from `@/shared/ui/tooltip`).

### Retarget reference — `git-actions-picker.tsx` (from uclaw `GitActionsPicker.tsx`)

| uclaw import | desktop retarget |
|---|---|
| `@/components/ui/popover` | `@/shared/ui/popover` |
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `@/modules/git/api` (`ghAvailable`, `gitCommit`, `gitCommitPushPr`, `gitCreateBranch`, `gitInitRepo`) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `./GitActionsPickerForms` (`BusyView`, `CommitForm`, `CreateBranchForm`, `ErrorView`, `MenuContent`, `PrForm`, `SuccessView`) | `./git-actions-picker-forms` |
| `./GitActionsPickerDraftPr` (`PrDraftView`) | `./git-actions-picker-draft-pr` |
| `react`, `lucide-react` | unchanged |

### Retarget reference — `git-workbench-dialog.tsx` (from uclaw `GitWorkbenchDialog.tsx`)

| uclaw import | desktop retarget |
|---|---|
| `@/components/ui/dialog` | `@/shared/ui/dialog` |
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `@/modules/git/api` (`gitCheckoutBranch`, `BranchListItem` type) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/components/preview/hooks/useShikiHighlight` | `@/features/chat-agent/components/preview/hooks/use-shiki-highlight` |
| `./useGitWorkbench` (`useGitWorkbench`, `Tab` type, `ViewState` type) | `./use-git-workbench` |
| `react`, `lucide-react`, `sonner` | unchanged |

---

## Wave A — Port the two components

### Task A1: Port git-actions-picker.tsx + git-workbench-dialog.tsx

**Files (create, under `desktop/src/features/chat-agent/components/chat/git/`):**
- `git-actions-picker.tsx` ← uclaw `GitActionsPicker.tsx` (345 LOC) — apply the GitActionsPicker retarget table.
- `git-workbench-dialog.tsx` ← uclaw `GitWorkbenchDialog.tsx` (677 LOC) — apply the GitWorkbenchDialog retarget table. Keep the module-scoped porcelain status parser intact (the GW.b test pins its behavior).

- [ ] **Step 1:** Verify neither exists. Copy both verbatim with the retargets. Prepend attribution comments. (All targets resolve: GW.a leaves [`git-actions-picker-forms`, `git-actions-picker-draft-pr`, `use-git-workbench`], the git ops [GW.a + Plan-3.3], `use-shiki-highlight` [PV.b], `@/shared/ui/{popover,dialog}`, `cn`.)
- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19` (sidebar still imports the stubs; the real components compile but are unmounted); `npm test ... | grep Tests` → `1123 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/chat/git/git-actions-picker.tsx desktop/src/features/chat-agent/components/chat/git/git-workbench-dialog.tsx
git commit -m "feat(desktop): port GitActionsPicker + GitWorkbenchDialog (GW.b Wave A1, verbatim)"
git show --stat HEAD
```

## Wave B — Port the tests

### Task B1: Port git-actions-picker.test.tsx + git-workbench-dialog.test.ts

**Files (create, under `…/chat/git/`):**
- `git-workbench-dialog.test.ts` ← uclaw `GitWorkbenchDialog.test.ts` (~90 LOC) — **self-contained pure-logic test**: it re-implements the porcelain status parser inline and pins per-status-code expectations; it does NOT import the component. Only import is `{ describe, it, expect } from 'vitest'` → **verbatim, no retargets**.
- `git-actions-picker.test.tsx` ← uclaw `GitActionsPicker.test.tsx` (~37 LOC) — retarget: `vi.mock('@/modules/git/api', () => ({...6 git fns...}))` → `vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({...same 6...}))`; `renderWithProviders` from `@/test-utils/render` → the inline shim (above); `./GitActionsPicker` → `./git-actions-picker`.

- [ ] **Step 1:** Verify neither exists. Port both. For `git-actions-picker.test.tsx`: replace the `@/test-utils/render` import with the inline `renderWithProviders` shim (+ the `Provider`/`TooltipProvider` imports it needs), and retarget the `vi.mock` path from `@/modules/git/api` → `@/features/chat-agent/lib/tauri-bridge-stub` (keep the same 6 mocked git fns: `ghAvailable`, `gitCommit`, `gitCommitPushPr`, `gitCreateBranch`, `gitInitRepo`, `ghCreatePr`). For `git-workbench-dialog.test.ts`: copy verbatim.
- [ ] **Step 2: Run the 2 new tests** `npm test -- --reporter=dot git-actions-picker git-workbench-dialog 2>&1 | grep -E "Tests"` → all pass.
- [ ] **Step 3: Full verify** tsc `19`; `npm test ... | grep Tests` → 1123 + the 2 files' test counts (record total), 0 fail.
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/chat/git/git-actions-picker.test.tsx desktop/src/features/chat-agent/components/chat/git/git-workbench-dialog.test.ts
git commit -m "test(desktop): port GitActionsPicker + GitWorkbenchDialog (porcelain parser) tests (GW.b Wave B1, verbatim)"
git show --stat HEAD
```

## Wave C — Stub swap

> Swaps `sidebar-git-actions.tsx` (already ported, already wired into LeftSidebar) from the 2 git stubs → the real components, and deletes the stubs. Low risk: both render closed by default (popover closed / dialog `open=false`), so no mount-time git IPC; the existing LeftSidebar/app-shell test git mocks (`gitIsRepo`/`gitCurrentBranch`, used by sidebar-git-actions' own mount probe) are unaffected.

### Task C1: Swap imports + delete the 2 stubs

**Files:**
- Modify: `desktop/src/features/chat-agent/components/sidebar/sidebar-git-actions.tsx`
- Delete: `desktop/src/features/chat-agent/lib/git-actions-picker-stub.tsx`
- Delete: `desktop/src/features/chat-agent/lib/git-workbench-dialog-stub.tsx`

- [ ] **Step 1: Swap the 2 imports** in `sidebar-git-actions.tsx`:
  - line 22: `'@/features/chat-agent/lib/git-actions-picker-stub'` → `'@/features/chat-agent/components/chat/git/git-actions-picker'`
  - line 23: `'@/features/chat-agent/lib/git-workbench-dialog-stub'` → `'@/features/chat-agent/components/chat/git/git-workbench-dialog'`
  (import names `GitActionsPicker` / `GitWorkbenchDialog` + the `<GitActionsPicker .../>` / `<GitWorkbenchDialog .../>` usages stay; verify the real components accept the same props the stub call-sites pass.)
- [ ] **Step 2: Delete both stubs**, then grep: `grep -rn "git-actions-picker-stub\|git-workbench-dialog-stub" desktop/src` → no output.
- [ ] **Step 3: tsc gate** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`. (Catches a prop-shape mismatch between the stub call-sites and the real components.)
- [ ] **Step 4: Full suite** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → all pass (no regressions in left-sidebar/app-shell tests). Scan for "Unhandled"/"transformCallback": only the 2 pre-existing `channels/statuses is not iterable` allowed.
  - If a LeftSidebar-rendering test fails with `TypeError: <gitFn> is not a function` (i.e. the real picker/dialog reference a git fn the test's mock omits AND something calls it on mount), add that fn to the affected test's tauri-bridge-stub mock with a safe default. (Per recon this should NOT happen — ghAvailable is gated on popover-open — but adjudicate if it does.)
  - If a NON-mock assertion failure appears, STOP and report.
- [ ] **Step 5: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds (GitWorkbenchDialog + GitActionsPicker now in the static graph under LeftSidebar).
- [ ] **Step 6: Commit (sidebar swap + stub deletions together — green).**

```bash
git add desktop/src/features/chat-agent/components/sidebar/sidebar-git-actions.tsx desktop/src/features/chat-agent/lib/git-actions-picker-stub.tsx desktop/src/features/chat-agent/lib/git-workbench-dialog-stub.tsx
git commit -m "feat(desktop): swap git stubs → real GitActionsPicker + GitWorkbenchDialog in sidebar; delete stubs (GW.b Wave C1)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → 1123 + GW.b test counts, 0 failing, no NEW unhandled rejections
- [ ] `npx vite build` → succeeds
- [ ] `grep -rn "git-actions-picker-stub\|git-workbench-dialog-stub" desktop/src` → no output (stubs removed)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc + Wave A1 + Wave B1 + Wave C1, all `(GW.b …)`
- [ ] Grep ported components for stale imports: `grep -rn "@/modules/git\|@/components/ui\|@/lib/utils\|@/components/preview\|./GitActions\|./useGitWorkbench" desktop/src/features/chat-agent/components/chat/git/git-actions-picker.tsx desktop/src/features/chat-agent/components/chat/git/git-workbench-dialog.tsx` — only retargeted `@/features/...`/`@/shared/...` + kebab-relative allowed.

## Scope boundaries (NOT in GW.b)

- **`parseBranchList` / `uncommittedFromStatus`** — the GW.b `git-workbench-dialog.test.ts` is a self-contained pure-logic test (re-implements the parser), so it does NOT require the tauri-bridge-stub `parseBranchList` to be real. Leave both as their existing Plan-3.3 stubs (making them real is a Rust-backend-era concern). If GitWorkbenchDialog's branches tab is exercised at runtime, `gitBranches` throws first (no backend), so `parseBranchList` isn't reached.
- **BrowserPanel cluster** — still deferred (RightSidePanel browser tab keeps its stub).
- **Rust backends** for all git ops — deferred.

## Carry-forwards (updated)

- **Git workbench sub-stack COMPLETE** after this PR — sidebar git actions live (commit/branch/PR-draft pickers + status/diff/branches workbench dialog).
- BrowserPanel cluster (~827 LOC, 8 IPC stubs); real KaleidoscopeShell/WelcomeView/HomeOfficeView/FocusModeOverlay; Rust backends for all accumulated IPC stubs.
