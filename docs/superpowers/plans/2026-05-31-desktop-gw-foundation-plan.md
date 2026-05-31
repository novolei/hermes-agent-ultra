# Git Workbench — GW.a Git IPC + Leaf Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the foundation for the git workbench sub-cluster — add the 7 missing git IPC stubs + 2 DTOs to `tauri-bridge-stub.ts`, and verbatim-port the 3 leaf files (`GitActionsPickerForms`, `GitActionsPickerDraftPr`, `useGitWorkbench`). First PR of the git workbench sub-stack (GW.a → GW.b pickers+dialog+swap). The composer-side git (BranchPicker / GitChipsRow / useBranchPicker) is **already ported** (Plan 2b.2.c.4.e) — out of scope.

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. The desktop's established git layer is `tauri-bridge-stub.ts` (the already-ported BranchPicker imports git ops from there), so the missing git ops are added there as throwing stubs (NOT a separate `git-api.ts` module). The 3 leaf files compile + bundle but are **not mounted yet** — GitActionsPicker / GitWorkbenchDialog (GW.b) consume them.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps.**

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY import paths per the retarget table, prepend `// Ported verbatim from uclaw <relative source path> — Plan GW.a`.
- **Dest naming:** PascalCase → kebab (`GitActionsPickerForms.tsx` → `git-actions-picker-forms.tsx`, `useGitWorkbench.ts` → `use-git-workbench.ts`). Dest dir: `desktop/src/features/chat-agent/components/chat/git/`.
- **IPC stub marker family for this sub-stack:** `_GW_`. Missing commands → throwing stubs in `tauri-bridge-stub.ts`: `NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: <snake_case_command>`. (The existing 7 git stubs from Plan 3.3 keep their `_3_3` markers — leave them untouched.)
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1123** tests pass. Every task keeps tsc at 19 and tests green. (No uclaw tests for these 3 leaves; none added — they compile + bundle, mounted/tested via GW.b.)
- **Verify-not-already-ported:** `ls` each dest before creating (confirmed absent at plan time); also confirm `CommitOutcome`/`CreatePrResponse`/`gitDiff`/etc. are not already in `tauri-bridge-stub.ts` (grep).

### Retarget reference (confirmed)

| uclaw import | desktop retarget |
|---|---|
| `@/modules/git/api` (`gitBranches`, `gitDiff`, `gitStatus`, `parseBranchList`, `BranchListItem` type) — in `useGitWorkbench` | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `./GitActionsPickerDraftPr` (`GhMissingBanner`) — in `GitActionsPickerForms` | `./git-actions-picker-draft-pr` |
| `react`, `lucide-react` | unchanged |

> `git-actions-picker-draft-pr.tsx` has NO `@/` imports (react + lucide-react only) — attribution comment only.

---

## Wave A — Missing git IPC stubs + DTOs

### Task A1: Add the 7 missing git ops + `CommitOutcome`/`CreatePrResponse` to `tauri-bridge-stub.ts`

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

- [ ] **Step 1:** Confirm none of these already exist (grep `gitDiff|gitDefaultBranch|gitCommit|gitCommitPushPr|ghAvailable|ghCreatePr|ghCreateIssue|CommitOutcome|CreatePrResponse`). Append a `=== Plan GW.a additions ===` block at the END of the file. DTOs are copied verbatim from uclaw `modules/git/api.ts:27` (CommitOutcome) and `:37` (CreatePrResponse); each fn is a throwing stub matching the uclaw signature:

```ts
// ─── Plan GW.a additions: git workbench IPC ────────────────────────────────
// CommitOutcome + CreatePrResponse copied verbatim from uclaw modules/git/api.ts.
export interface CommitOutcome {
  status: 'created' | 'skipped'
  message: string
}
export interface CreatePrResponse {
  url: string
  wasExisting: boolean
  base: string
}

export async function gitDiff(_cwd: string, _opts?: { full?: boolean }): Promise<string | null> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: git_diff')
}
export async function gitDefaultBranch(_cwd: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: git_default_branch')
}
export async function gitCommit(_cwd: string, _message: string): Promise<CommitOutcome> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: git_commit')
}
export async function gitCommitPushPr(_args: { cwd: string; title: string; body: string; branchHint?: string }): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: git_commit_push_pr')
}
export async function ghAvailable(): Promise<boolean> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: gh_available')
}
export async function ghCreatePr(_args: { cwd: string; title: string; body: string; base?: string }): Promise<CreatePrResponse> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: gh_create_pr')
}
export async function ghCreateIssue(_args: { cwd: string; title: string; body: string }): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_GW_BACKEND: gh_create_issue')
}
```

> These match the uclaw `modules/git/api.ts` signatures exactly (param shapes verified). The existing Plan-3.3 git stubs (`gitIsRepo`, `gitCurrentBranch`, `gitBranches`, `gitStatus`, `gitCheckoutBranch`, `gitCreateBranch`, `gitInitRepo`, `parseBranchList`, `uncommittedFromStatus`, `BranchListItem`) are NOT touched here.

- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1123 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add 7 missing git workbench IPC stubs + CommitOutcome/CreatePrResponse (GW.a Wave A1)"
git show --stat HEAD
```

---

## Wave B — Leaf components

### Task B1: Port git-actions-picker-draft-pr, git-actions-picker-forms, use-git-workbench

**Files (create, under `desktop/src/features/chat-agent/components/chat/git/`):**
- `git-actions-picker-draft-pr.tsx` ← uclaw `components/chat/git/GitActionsPickerDraftPr.tsx` (136 LOC) — React + lucide-react only. Exports `PrDraftView` + `GhMissingBanner`. No `@/` imports → attribution comment only.
- `git-actions-picker-forms.tsx` ← uclaw `GitActionsPickerForms.tsx` (339 LOC) — React + lucide-react + `./GitActionsPickerDraftPr` (`GhMissingBanner`) → `./git-actions-picker-draft-pr`. (Exports the form/ActionItem primitives GitActionsPicker uses.)
- `use-git-workbench.ts` ← uclaw `useGitWorkbench.ts` (139 LOC) — retarget `@/modules/git/api` → `@/features/chat-agent/lib/tauri-bridge-stub` (imports `gitBranches`, `gitDiff`, `gitStatus`, `parseBranchList`, `BranchListItem` type — all now present in the stub). Exports the `Tab` type + the workbench-state hook.

- [ ] **Step 1:** Verify none exist. Copy all 3 verbatim with the retargets (port `git-actions-picker-draft-pr.tsx` first since `git-actions-picker-forms.tsx` imports it — single commit is fine). Prepend attribution comments.
- [ ] **Step 2: Verify tsc** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.
- [ ] **Step 3: Verify tests** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1123 passed` (unchanged — no tests added, no consumers yet).
- [ ] **Step 4: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/chat/git/git-actions-picker-draft-pr.tsx desktop/src/features/chat-agent/components/chat/git/git-actions-picker-forms.tsx desktop/src/features/chat-agent/components/chat/git/use-git-workbench.ts
git commit -m "feat(desktop): port git workbench leaves — git-actions-picker-forms/draft-pr + use-git-workbench (GW.a Wave B1, verbatim)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1123 passed`, 0 failing
- [ ] `npx vite build` → succeeds
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc commit + Wave A1 + Wave B1, all `(GW.a …)`
- [ ] Grep the 3 ported files for stale imports: `grep -rn "@/modules/git\|@/lib/\|./GitActionsPickerDraftPr" desktop/src/features/chat-agent/components/chat/git/{git-actions-picker-forms,git-actions-picker-draft-pr,use-git-workbench}.*` — only retargeted `@/features/...` / kebab-relative paths allowed.

## Scope boundaries (NOT in GW.a)

- **No GitActionsPicker / GitWorkbenchDialog** — GW.b (they consume these 3 leaves + the git IPC).
- **No stub swap** — GW.b swaps `git-actions-picker-stub` + `git-workbench-dialog-stub` in `sidebar-git-actions.tsx` + deletes them.
- **No git-api.ts file** — git ops consolidated in `tauri-bridge-stub.ts` (matches the desktop's existing git layer; the already-ported BranchPicker uses it).
- **parseBranchList / uncommittedFromStatus** left as their existing Plan-3.3 stubs (GW.b makes them real if GitWorkbenchDialog's branches-tab test needs it).
- These 3 leaves compile + bundle but are NOT mounted (GW.b mounts them via GitActionsPicker/GitWorkbenchDialog).

## Carry-forwards (unchanged)

- GW.b (GitActionsPicker + GitWorkbenchDialog + tests + swap the 2 LeftSidebar git stubs + delete).
- BrowserPanel cluster (~827 LOC, 8 IPC stubs); real KaleidoscopeShell/WelcomeView/HomeOfficeView/FocusModeOverlay; Rust backends for all accumulated IPC stubs (incl. these git ops).
