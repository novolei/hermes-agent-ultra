# RightSidePanel — RSP.a Plan + Trajectory Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbatim-port the two independent, self-contained RightSidePanel tab views — **PlanViewer** (plan tab) and **TrajectoryReel** + **SessionEvalBadge** (trajectory tab) — from uclaw, plus the `getSessionTrajectory` IPC stub + `TurnRecord` type they need. First PR of the RightSidePanel sub-stack (RSP.a → RSP.b teams → RSP.c root + stub swap). Browser tab deferred (keeps the existing `browser-viewer` stub).

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. These 3 components are leaf views (no intra-cluster deps; PlanViewer takes content via props, TrajectoryReel fetches via the bridge). They compile + bundle but are **not mounted yet** — RightSidePanel (RSP.c) renders them. The `agent-teams` atoms are NOT in this PR (none of these 3 views import them; they land in RSP.b with the teams views).

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps** (react, `@tauri-apps/api/event`, lucide-react all present).

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY import paths per the retarget table, prepend `// Ported verbatim from uclaw <relative source path> — Plan RSP.a`.
- **Dest naming:** PascalCase → kebab (`PlanViewer.tsx` → `plan-viewer.tsx`). Dest dir: `desktop/src/features/chat-agent/components/agent/`.
- **IPC stub marker family for this sub-stack:** `_RSP_`. Missing commands → throwing stubs in `tauri-bridge-stub.ts`: `NOT_IMPLEMENTED_IN_PLAN_RSP_BACKEND: <snake_case_command>`.
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1123** tests pass. Every task keeps tsc at 19 and tests green. (No uclaw tests exist for these 3 components; none are added — they compile + bundle, mounted in RSP.c.)
- **Verify-not-already-ported:** `ls` each dest before creating.

### Retarget reference (confirmed)

| uclaw import | desktop retarget |
|---|---|
| `@/lib/tauri-bridge` (`getSessionTrajectory`, `TurnRecord`) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `./SessionEvalBadge` (in TrajectoryReel) | `./session-eval-badge` |
| `react`, `@tauri-apps/api/event` (`listen`), `lucide-react` (`AlertTriangle`, `Star`) | unchanged |

> PlanViewer + SessionEvalBadge have NO `@/` imports (only react / `@tauri-apps/api/event` / lucide-react) — they need only the attribution comment.

---

## Wave A — Bridge additions

### Task A1: Add `TurnRecord` type + `getSessionTrajectory` stub

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

- [ ] **Step 1:** Confirm `getSessionTrajectory`/`TurnRecord` are not already exported (grep). Append a `=== Plan RSP.a additions ===` block at the END of the file with the `TurnRecord` interface (verbatim from uclaw `lib/tauri-bridge.ts:437`) + a throwing stub:

```ts
// ─── Plan RSP.a additions: session trajectory ──────────────────────────────
// TurnRecord copied verbatim from uclaw lib/tauri-bridge.ts:437.
export interface TurnRecord {
  id: string
  sessionId: string
  turnIndex: number
  role: string
  content?: string
  toolName?: string
  toolArgs?: string
  toolResult?: string
  reasoning?: string
  isError: boolean
  durationMs: number
  createdAt: number
}

export const getSessionTrajectory = (_sessionId: string): Promise<TurnRecord[]> => {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_RSP_BACKEND: get_session_trajectory')
}
```

> TrajectoryReel calls `getSessionTrajectory(sessionId).then(...).catch((err) => setError(msg))` — it catches the rejection and renders a "Failed to load trajectory: …" state. So throwing is graceful (the expected stub UX until the Rust backend lands), consistent with the `_RSP_` discipline.

- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1123 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add getSessionTrajectory stub + TurnRecord type (RSP.a Wave A1)"
git show --stat HEAD
```

---

## Wave B — Plan + Trajectory view components

### Task B1: Port session-eval-badge, trajectory-reel, plan-viewer

**Files (create, under `desktop/src/features/chat-agent/components/agent/`):**
- `session-eval-badge.tsx` ← uclaw `components/agent/SessionEvalBadge.tsx` (123 LOC) — React + `listen` (events `session:eval-complete`, `session:eval-warning`) + lucide-react. No `@/` imports → attribution comment only.
- `trajectory-reel.tsx` ← uclaw `components/agent/TrajectoryReel.tsx` (137 LOC) — retarget `@/lib/tauri-bridge` (`getSessionTrajectory`, `TurnRecord`) → `@/features/chat-agent/lib/tauri-bridge-stub`; `./SessionEvalBadge` → `./session-eval-badge`.
- `plan-viewer.tsx` ← uclaw `components/agent/PlanViewer.tsx` (201 LOC) — React + `listen` (event `plan:updated`) only; includes the `parsePlanMarkdown` utility. No `@/` imports → attribution comment only.

- [ ] **Step 1:** Verify none exist (`ls` each dest). Copy all 3 verbatim with the retargets above. Prepend attribution comments. (Port `session-eval-badge.tsx` first since `trajectory-reel.tsx` imports it — but a single commit is fine.)
- [ ] **Step 2: Verify tsc** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.
- [ ] **Step 3: Verify tests** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1123 passed` (unchanged — no tests added, no consumers yet).
- [ ] **Step 4: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds (these compile + bundle even though unmounted).
- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/session-eval-badge.tsx desktop/src/features/chat-agent/components/agent/trajectory-reel.tsx desktop/src/features/chat-agent/components/agent/plan-viewer.tsx
git commit -m "feat(desktop): port preview RightSidePanel views — plan-viewer + trajectory-reel + session-eval-badge (RSP.a Wave B1, verbatim)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1123 passed`, 0 failing
- [ ] `npx vite build` → succeeds
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc commit + Wave A1 + Wave B1, all `(RSP.a …)`
- [ ] Grep the 3 ported files for stale imports: `grep -rn "@/lib/\|@/atoms/\|@/components/agent/SessionEvalBadge" desktop/src/features/chat-agent/components/agent/{plan-viewer,trajectory-reel,session-eval-badge}.tsx` — only retargeted `@/features/...` paths allowed.

## Scope boundaries (NOT in RSP.a)

- **No `agent-teams` atoms** — none of these 3 views import them; they land in RSP.b (first consumers: the teams views).
- **No AgentTeamsPanel/TeamNode/ChannelFeed** — RSP.b.
- **No RightSidePanel root, no WorkspaceFilesView wrapper, no stub swap** — RSP.c.
- **No BrowserPanel cluster** — deferred (browser tab keeps the existing `browser-viewer` stub).
- These 3 components compile + bundle but are NOT mounted yet (RightSidePanel mounts them in RSP.c).

## Carry-forwards (unchanged)

- RSP.b (agent-teams atoms + Teams views), RSP.c (RightSidePanel root + files wrapper + stub swap).
- BrowserPanel cluster (~827 LOC, 8 IPC stubs); real KaleidoscopeShell/WelcomeView/HomeOfficeView/FocusModeOverlay; Git workbench cluster; Rust backends for all accumulated IPC stubs.
