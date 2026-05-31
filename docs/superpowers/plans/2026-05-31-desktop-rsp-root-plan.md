# RightSidePanel — RSP.c Root + Files Wrapper + Stub Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the RightSidePanel sub-stack — verbatim-port the **WorkspaceFilesView** wrapper (uclaw `SidePanel.tsx`, wraps the already-ported FilesRail) + the **RightSidePanel root** (drives the files/teams/plan/trajectory/browser tabs), then **swap `right-side-panel-stub` → the real RightSidePanel** in `app-shell.tsx` and delete the stub. After this PR the agent workspace **right column is live** (files/teams/plan/trajectory tabs real; browser tab keeps its `browser-viewer` stub).

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. RightSidePanel composes the RSP.a views (PlanViewer, TrajectoryReel), the RSP.b view (AgentTeamsPanel), the new WorkspaceFilesView wrapper (→ FilesRail), and the existing `browser-viewer` stub. The stub swap mounts the real panel into `app-shell` (it renders when `showRightPanel = appMode === 'agent' && !!currentSessionId`).

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps** (motion, lucide-react, jotai all present). **No new IPC stubs** (RightSidePanel uses raw `listen('plan:updated')`; FilesRail's bridge fns already exist).

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY import paths per the retarget table, prepend `// Ported verbatim from uclaw <relative source path> — Plan RSP.c`.
- **Dest naming:** `SidePanel.tsx` → `components/agent/workspace-files-view.tsx`; `RightSidePanel.tsx` → `components/app-shell/right-side-panel.tsx` (replaces the stub's location).
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1123** tests pass. Waves A/B keep tsc 19 + tests 1123 (components compile, not yet mounted). Wave C (the swap) commits app-shell + test-mock changes TOGETHER (green).
- **Verify-not-already-ported:** `ls` each new dest before creating (confirmed absent at plan time).

### Retarget reference — `workspace-files-view.tsx` (from uclaw `SidePanel.tsx`)

| uclaw import | desktop retarget |
|---|---|
| `@/components/files-rail` (`FilesRail`) | `@/features/chat-agent/components/files-rail` |
| `@/atoms/files-rail-atoms` (`MountRoot` type) | `@/features/chat-agent/atoms/files-rail-atoms` |
| `@/atoms/preview-panel-atoms` (`openPreviewTabAction`) | `@/features/chat-agent/atoms/preview-panel-atoms` |
| `@/atoms/preview-chip-atoms` (`addPendingAttachmentAction`) | `@/features/chat-agent/atoms/preview-chip-atoms` |
| `@/components/files-rail/utils/tree-patch` (`TreeNode` type) | `@/features/chat-agent/utils/tree-patch` ⚠️ NOT under files-rail — desktop moved it to `utils/` |
| `@/atoms/agent-atoms` (`agentSidePanelOpenMapAtom`, `workspaceFilesVersionAtom`, `agentSessionsAtom`, `currentAgentWorkspaceIdAtom`) | `@/features/chat-agent/atoms/agent-atoms` |

### Retarget reference — `right-side-panel.tsx` (from uclaw `RightSidePanel.tsx`)

| uclaw import | desktop retarget |
|---|---|
| `@/atoms/app-mode` (`appModeAtom`) | `@/features/chat-agent/atoms/app-mode` |
| `@/atoms/agent-atoms` (`currentAgentSessionIdAtom`, `agentSessionPathMapAtom`, `workspaceActiveRightPanelTabMapAtom`, `agentSessionsAtom`) | `@/features/chat-agent/atoms/agent-atoms` |
| `@/components/workspace/WorkspaceRail` (`isAutomationSession`) | `@/features/chat-agent/components/workspace/workspace-rail` |
| `@/atoms/workspace` (`activeWorkspaceIdAtom`, `workspaceSwitchDirectionAtom`) | `@/features/chat-agent/atoms/workspace` |
| `@/atoms/agent-teams` (`activePlanAtom`) | `@/features/chat-agent/atoms/agent-teams` |
| `@/components/agent/SidePanel` (`WorkspaceFilesView`) | `@/features/chat-agent/components/agent/workspace-files-view` |
| `@/components/agent/AgentTeamsPanel` | `@/features/chat-agent/components/agent/agent-teams-panel` |
| `@/components/agent/PlanViewer` | `@/features/chat-agent/components/agent/plan-viewer` |
| `@/components/agent/TrajectoryReel` | `@/features/chat-agent/components/agent/trajectory-reel` |
| `@/components/agent/BrowserViewer` | `@/features/chat-agent/components/agent/browser-viewer` (existing stub) |
| `@/hooks/useWindowDragOnMove` | `@/features/chat-agent/hooks/use-window-drag-on-move` |
| `motion/react`, `jotai`, `@tauri-apps/api/event` (`listen`), `lucide-react` | unchanged |

---

## Wave A — WorkspaceFilesView wrapper

### Task A1: Port `workspace-files-view.tsx`

**Files:** Create `desktop/src/features/chat-agent/components/agent/workspace-files-view.tsx` (← uclaw `components/agent/SidePanel.tsx`, 103 LOC)

- [ ] **Step 1:** Verify it doesn't exist. Copy verbatim, applying the WorkspaceFilesView retarget table. **Watch the `tree-patch` gotcha:** `@/components/files-rail/utils/tree-patch` → `@/features/chat-agent/utils/tree-patch` (desktop keeps `TreeNode` under `utils/`, not under `files-rail/`). Prepend attribution comment. Export name stays `WorkspaceFilesView`.
- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1123 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/workspace-files-view.tsx
git commit -m "feat(desktop): port WorkspaceFilesView wrapper around FilesRail (RSP.c Wave A1, verbatim)"
git show --stat HEAD
```

## Wave B — RightSidePanel root

### Task B1: Port `right-side-panel.tsx`

**Files:** Create `desktop/src/features/chat-agent/components/app-shell/right-side-panel.tsx` (← uclaw `components/app-shell/RightSidePanel.tsx`, 252 LOC)

- [ ] **Step 1:** Verify it doesn't exist (the STUB is `right-side-panel-stub.tsx` — leave it until Wave C). Copy verbatim, applying the RightSidePanel retarget table. Keep the verbatim body intact: the `ActiveTab` type, the automation-session tab filtering (`isAutomationSession` → `['files','plan','trajectory']` vs the full 5), the `listen('plan:updated')` effect (switches to plan tab + sets `activePlanAtom`), the `motion`/`AnimatePresence` transitions, any inline `PlanUpdatedPayload`/`Variants` definitions (lines 17–28). Prepend attribution comment.
- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19` (app-shell still imports the stub; the real panel compiles but is unmounted); `npm test ... | grep Tests` → `1123 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/app-shell/right-side-panel.tsx
git commit -m "feat(desktop): port RightSidePanel root (files/teams/plan/trajectory/browser tabs) (RSP.c Wave B1, verbatim)"
git show --stat HEAD
```

## Wave C — Stub swap + test-mock extension

> Swaps `app-shell.tsx` to the real RightSidePanel and deletes the stub. **Critical:** the real panel defaults to the **files** tab → mounts `WorkspaceFilesView → FilesRail`, which calls `filesRailListMounts()` on mount. The app-shell tests render the shell with a seeded agent tab (→ `showRightPanel` true → RightSidePanel mounts), but their `tauri-bridge-stub` mock factories do NOT include the files-rail fns. So both app-shell test mocks must be extended (mirroring `files-rail/index.test.tsx:13-19`) or FilesRail throws on mount.

### Task C1: Swap the stub, extend test mocks, delete stub

**Files (modify/delete):**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx`
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.test.tsx`
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`
- Delete: `desktop/src/features/chat-agent/components/app-shell/right-side-panel-stub.tsx`

- [ ] **Step 1: Swap `app-shell.tsx` import.** Change line 27 from `'./right-side-panel-stub'` → `'./right-side-panel'` (the import name `RightSidePanel` and the `<RightSidePanel />` usage stay). Update the file's top doc-comment: RightSidePanel is now the real cluster (not a stub); browser tab still deferred (uses `browser-viewer` stub).

- [ ] **Step 2: Extend BOTH app-shell test bridge mocks.** In `app-shell.test.tsx` and `app-shell.integration.test.tsx`, add to the `vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({ … }))` factory object these keys (mirroring `files-rail/index.test.tsx:17-19`, which exist so FilesRail doesn't throw on mount):

```ts
  filesRailListMounts: vi.fn().mockResolvedValue([]),
  filesRailWatchStart: vi.fn().mockResolvedValue(undefined),
  filesRailWatchStop: vi.fn().mockResolvedValue(undefined),
```

(If a factory already provides some of these, don't duplicate.)

- [ ] **Step 3: Delete the stub** `right-side-panel-stub.tsx`, then grep: `grep -rn "right-side-panel-stub" desktop/src` → no output.

- [ ] **Step 4: tsc gate** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.

- [ ] **Step 5: Run the FULL suite.** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → all pass (1123). Scan for "Unhandled"/"transformCallback": only the 2 pre-existing `channels/statuses is not iterable` allowed.
  - If a test fails with a `TypeError: <fn> is not a function` / undefined-bridge-fn from the now-mounted FilesRail/RightSidePanel tree, add that fn to BOTH mock factories with a safe default (`vi.fn().mockResolvedValue(...)`), mirroring the files-rail pattern. Common candidates beyond the 3 above: none expected on mount (rename/move/delete/openFolderDialog are user-action-triggered), but add if they surface.
  - If a NON-mock failure appears (an assertion that genuinely changed meaning), STOP and report for adjudication. (Recon confirmed NO app-shell test asserts the `right-side-panel` stub marker, so the swap should not break assertions.)

- [ ] **Step 6: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds (RightSidePanel + all 5 tab views now in the static graph under app-shell).

- [ ] **Step 7: Commit (app-shell + tests + stub deletion together — green).**

```bash
git add desktop/src/features/chat-agent/components/app-shell/app-shell.tsx desktop/src/features/chat-agent/components/app-shell/app-shell.test.tsx desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx desktop/src/features/chat-agent/components/app-shell/right-side-panel-stub.tsx
git commit -m "feat(desktop): swap right-side-panel-stub → real RightSidePanel; mount agent right column in app-shell (RSP.c Wave C1)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → all pass (1123), 0 failing, no NEW unhandled rejections
- [ ] `npx vite build` → succeeds
- [ ] `grep -rn "right-side-panel-stub" desktop/src` → no output (stub removed)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc + Wave A1 + Wave B1 + Wave C1, all `(RSP.c …)`
- [ ] Grep ported files for stale imports: `grep -rn "@/lib/\|@/atoms/\|@/components/\(agent\|workspace\|files-rail\)\|@/hooks/" desktop/src/features/chat-agent/components/app-shell/right-side-panel.tsx desktop/src/features/chat-agent/components/agent/workspace-files-view.tsx` — only retargeted `@/features/...`/`@/shared/...` allowed (relative `./` ok).

## Scope boundaries (NOT in RSP.c)

- **BrowserPanel cluster** — deferred; RightSidePanel's browser tab renders the existing `browser-viewer` stub. (Real BrowserPanel is a future ~827-LOC port + 8 IPC stubs.)
- Real KaleidoscopeShell / WelcomeView / HomeOfficeView / FocusModeOverlay — still stubbed.

## Carry-forwards (updated)

- **RightSidePanel sub-stack COMPLETE** after this PR (files/teams/plan/trajectory tabs live; browser tab stubbed).
- BrowserPanel cluster (~827 LOC, 8 IPC stubs); Git workbench cluster (~2,400 LOC); Rust backends for all accumulated IPC stubs.
