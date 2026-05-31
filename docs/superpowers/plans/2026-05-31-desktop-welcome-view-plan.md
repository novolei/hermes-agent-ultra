# App-Shell Stubs — AS.b WelcomeView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbatim-port uclaw's `WelcomeView` (the empty-workspace session-launch screen) and **swap `welcome-view-stub`** for it in `workspace-shell.tsx`. Final PR of the app-shell quick-wins sub-stack (AS.a Focus Mode ✓ → AS.b WelcomeView). After this PR, opening a workspace with no tabs shows the real welcome screen (task input + recent-session list + workspace switcher).

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. All deps are already ported (workspace/agent/active-view atoms, `WorkspaceCreateDialog`, `useOpenSession`, `createAgentSession` bridge stub, `AgentSessionMeta` type). Single file, no new deps, no new IPC. **Swap is safe:** WelcomeView's mount effects are pure DOM (textarea auto-resize + auto-focus); its only IPC (`createAgentSession`/`refreshWorkspaces`) is in click handlers, not mount — so the unseeded app-shell tests that render `WorkspaceShell` (no tabs → WelcomeView) mount it cleanly.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps. No new IPC stubs.**

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from uclaw `views/WelcomeView.tsx`, change ONLY import paths per the retarget table, prepend `// Ported verbatim from uclaw views/WelcomeView.tsx — Plan AS.b`. Keep the default export (`export default function WelcomeView`).
- **Dest:** `desktop/src/features/chat-agent/components/workspace/welcome-view.tsx`.
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1159** tests pass. Wave A keeps tsc 19 + tests 1159 (component compiles, still using stub). Wave B (swap) keeps them green.
- **Verify-not-already-ported:** `ls` the dest before creating (confirmed absent at plan time).

### Retarget reference (confirmed — all targets exist)

| uclaw import | desktop retarget |
|---|---|
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `@/atoms/workspace` (`workspacesAtom`, `activeWorkspaceIdAtom`, `refreshWorkspacesAtom`) | `@/features/chat-agent/atoms/workspace` |
| `@/atoms/agent-atoms` (`agentSessionsAtom`, `agentChannelIdAtom`, `agentModelIdAtom`, `agentSessionChannelMapAtom`, `agentSessionModelMapAtom`, `currentAgentWorkspaceIdAtom`) | `@/features/chat-agent/atoms/agent-atoms` |
| `@/atoms/active-view` (`activeViewAtom`) | `@/features/chat-agent/atoms/active-view` |
| `@/components/workspace/WorkspaceCreateDialog` | `@/features/chat-agent/components/workspace/workspace-create-dialog` |
| `@/hooks/useOpenSession` | `@/features/chat-agent/hooks/use-open-session` |
| `@/lib/tauri-bridge` (`createAgentSession`) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/lib/agent-types` (`AgentSessionMeta` type) | `@/features/chat-agent/lib/agent-types` |
| `react`, `jotai`, `lucide-react` | unchanged |

> No uclaw test exists for WelcomeView — none is ported. It's exercised at runtime via WorkspaceShell (empty-tabs state).

---

## Wave A — Port WelcomeView

### Task A1: Port welcome-view.tsx

**Files:** Create `desktop/src/features/chat-agent/components/workspace/welcome-view.tsx` (← uclaw `views/WelcomeView.tsx`, 227 LOC).

- [ ] **Step 1:** Verify it doesn't exist. Copy verbatim with the retarget table. Keep the `export default function WelcomeView`. Prepend attribution comment.
- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19` (workspace-shell still imports the stub; the real view compiles but is unmounted); `npm test ... | grep Tests` → `1159 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/workspace/welcome-view.tsx
git commit -m "feat(desktop): port WelcomeView (empty-workspace session launcher) (AS.b Wave A1, verbatim)"
git show --stat HEAD
```

## Wave B — Swap the stub

> Swaps `workspace-shell.tsx`'s default import from `./welcome-view-stub` → `./welcome-view` and deletes the stub. WorkspaceShell renders WelcomeView when `tabs.length === 0`; the unseeded app-shell tests hit this path and will now mount the real view (mount is pure-DOM, no IPC — safe).

### Task B1: Swap workspace-shell import + delete stub

**Files:**
- Modify: `desktop/src/features/chat-agent/components/workspace/workspace-shell.tsx`
- Delete: `desktop/src/features/chat-agent/components/workspace/welcome-view-stub.tsx`

- [ ] **Step 1: Swap the import** in `workspace-shell.tsx` line 25: `import WelcomeView from './welcome-view-stub'` → `import WelcomeView from './welcome-view'` (default import; usage at the `tabs.length === 0` branch unchanged).
- [ ] **Step 2: Delete the stub** `welcome-view-stub.tsx`, then grep: `grep -rn "welcome-view-stub" desktop/src` → no output.
- [ ] **Step 3: tsc gate** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.
- [ ] **Step 4: Full suite** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1159 passed`, 0 fail. Scan for "Unhandled"/"transformCallback": only the 2 pre-existing `channels/statuses is not iterable` allowed.
  - The unseeded app-shell tests (`app-shell.test.tsx` + any rendering AppShell→WorkspaceShell with no tabs) now mount the real WelcomeView instead of the stub. Mount is pure-DOM (textarea auto-resize + auto-focus); its IPC (`createAgentSession`/`refreshWorkspaces`) is click-handler-only, and `app-shell.test.tsx` already mocks `@/lib/bridge/workspaces` `listWorkspaces`. Expected: green, no new rejections. If a test fails with a missing-mock `TypeError` from WelcomeView's tree, add the fn to the affected test's mock (note which). If a NON-mock assertion failure appears (e.g. a test asserted the welcome-stub marker — recon found none), STOP and report.
- [ ] **Step 5: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds.
- [ ] **Step 6: Commit (swap + stub deletion together — green).**

```bash
git add desktop/src/features/chat-agent/components/workspace/workspace-shell.tsx desktop/src/features/chat-agent/components/workspace/welcome-view-stub.tsx
git commit -m "feat(desktop): swap welcome-view-stub → real WelcomeView in workspace-shell; delete stub (AS.b Wave B1)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1159 passed`, 0 failing, no NEW unhandled rejections
- [ ] `npx vite build` → succeeds
- [ ] `grep -rn "welcome-view-stub" desktop/src` → no output (stub removed)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc + Wave A1 + Wave B1, all `(AS.b …)`
- [ ] Grep welcome-view.tsx for stale imports: `grep -nE "@/lib/utils\|@/atoms/\|@/components/workspace/WorkspaceCreateDialog\|@/hooks/useOpenSession\|@/lib/tauri-bridge\|@/lib/agent-types" desktop/src/features/chat-agent/components/workspace/welcome-view.tsx` — only retargeted `@/features/...`/`@/shared/...` allowed.

## Scope boundaries (NOT in AS.b)

- HomeOfficeView (pixi.js) + KaleidoscopeShell (~4,474 LOC) — separate future plans (the remaining 2 app-shell stubs).
- `useFocusModeShortcut` (keyboard entry to focus mode) — follow-up from AS.a.
- No new deps / IPC stubs.

## Carry-forwards (updated)

- **App-shell quick-wins sub-stack COMPLETE** after this PR (FocusMode + WelcomeView live).
- HomeOffice scene (pixi.js + sprite assets); Kaleidoscope dashboard (~4,474 LOC); BrowserPanel cluster (~827 LOC); `useFocusModeShortcut`; Rust backends for all accumulated IPC stubs.
