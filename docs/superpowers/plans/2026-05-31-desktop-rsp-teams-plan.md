# RightSidePanel — RSP.b Agent Teams Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbatim-port the RightSidePanel **Teams tab** — the `agent-teams` atoms + `AgentTeamsPanel` + `TeamNode` + `ChannelFeed` — from uclaw, plus the `TeamChannelMessage` bridge type they need. Second PR of the RightSidePanel sub-stack (RSP.a Plan/Trajectory ✓ → RSP.b teams → RSP.c root + stub swap).

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. The `agent-teams` atoms hold the team-run state (`activeTeamAtom`, `appendTeamMessageAtom`, `updateTeamNodeAtom`, `teamsPanelOpenAtom`) **and `activePlanAtom`** (which RSP.c's RightSidePanel root will consume). The 3 view components compile + bundle but are **not mounted yet** — RightSidePanel (RSP.c) renders `AgentTeamsPanel` in the teams tab.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps.**

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY import paths per the retarget table, prepend `// Ported verbatim from uclaw <relative source path> — Plan RSP.b`.
- **Dest naming:** PascalCase → kebab (`AgentTeamsPanel.tsx` → `agent-teams-panel.tsx`, `TeamNode.tsx` → `team-node.tsx`, `ChannelFeed.tsx` → `channel-feed.tsx`). Dest dir for views: `desktop/src/features/chat-agent/components/agent/`. Atoms → `desktop/src/features/chat-agent/atoms/agent-teams.ts`.
- **IPC stub marker family:** `_RSP_`. (No new invoke commands in this PR — the only IPC is the raw event listener `agent:team-message` via `@tauri-apps/api/event`, which needs no stub.)
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1123** tests pass. Every task keeps tsc at 19 and tests green. (No uclaw tests exist for these files; none added — they compile + bundle, mounted/tested via RSP.c.)
- **Verify-not-already-ported:** `ls` each dest before creating (confirmed absent at plan time).

### Retarget reference (confirmed)

| uclaw import | desktop retarget |
|---|---|
| `@/lib/tauri-bridge` (`TeamChannelMessage` type) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/atoms/agent-teams` (`activeTeamAtom`, `appendTeamMessageAtom`, `TeamNode` type, `NodeStatus` type) | `@/features/chat-agent/atoms/agent-teams` |
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `./TeamNode` (in AgentTeamsPanel) | `./team-node` |
| `./ChannelFeed` (in AgentTeamsPanel) | `./channel-feed` |
| `react`, `jotai`, `@tauri-apps/api/event` (`listen`) | unchanged |

---

## Wave A — TeamChannelMessage type + agent-teams atoms

### Task A1: Add `TeamChannelMessage` to the bridge stub; port `agent-teams.ts` atoms

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`
- Create: `desktop/src/features/chat-agent/atoms/agent-teams.ts` (← uclaw `atoms/agent-teams.ts`, 61 LOC)

- [ ] **Step 1: Add `TeamChannelMessage`** to `tauri-bridge-stub.ts`. Confirm it's not already exported (grep), then append (verbatim from uclaw `lib/tauri-bridge.ts:1872`) under the existing `=== Plan RSP.a additions ===` block (or a new `=== Plan RSP.b additions ===` block):

```ts
// ─── Plan RSP.b additions: team channel message ────────────────────────────
// TeamChannelMessage copied verbatim from uclaw lib/tauri-bridge.ts:1872.
export interface TeamChannelMessage {
  id: string
  fromRole: string
  toRole: string | null
  message: string
  createdAt: number
}
```

- [ ] **Step 2: Port `agent-teams.ts` verbatim.** Confirm it doesn't exist. Copy byte-for-byte, retargeting ONLY the type import: `import type { TeamChannelMessage } from '@/lib/tauri-bridge'` → `from '@/features/chat-agent/lib/tauri-bridge-stub'`. Everything else (jotai `atom`, the `NodeStatus`/`TeamNode`/`TeamState` types, `activeTeamAtom`, `teamsPanelOpenAtom`, `updateTeamNodeAtom`, `appendTeamMessageAtom`, `activePlanAtom`, the `import.meta.env.DEV` warn) stays identical. Prepend attribution comment.

- [ ] **Step 3: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1123 passed`.
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts desktop/src/features/chat-agent/atoms/agent-teams.ts
git commit -m "feat(desktop): add TeamChannelMessage type + port agent-teams atoms (RSP.b Wave A1, verbatim)"
git show --stat HEAD
```

---

## Wave B — Teams view components

### Task B1: Port team-node, channel-feed, agent-teams-panel

**Files (create, under `desktop/src/features/chat-agent/components/agent/`):**
- `team-node.tsx` ← uclaw `TeamNode.tsx` (47 LOC) — `cn` → `@/shared/lib/cn`; `TeamNode`/`NodeStatus` types → `@/features/chat-agent/atoms/agent-teams`. Pure visual node.
- `channel-feed.tsx` ← uclaw `ChannelFeed.tsx` (40 LOC) — `TeamChannelMessage` type → `@/features/chat-agent/lib/tauri-bridge-stub`. Scroll-to-bottom message list.
- `agent-teams-panel.tsx` ← uclaw `AgentTeamsPanel.tsx` (67 LOC) — `activeTeamAtom`/`appendTeamMessageAtom` → `@/features/chat-agent/atoms/agent-teams`; `TeamChannelMessage` type → bridge-stub; `./TeamNode` → `./team-node`; `./ChannelFeed` → `./channel-feed`; raw `listen('agent:team-message')` (unchanged).

- [ ] **Step 1:** Verify none exist. Copy all 3 verbatim with the retargets above (port `team-node.tsx` + `channel-feed.tsx` first since `agent-teams-panel.tsx` imports them — single commit is fine). Prepend attribution comments.
- [ ] **Step 2: Verify tsc** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.
- [ ] **Step 3: Verify tests** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1123 passed` (unchanged — no tests added, no consumers yet).
- [ ] **Step 4: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/team-node.tsx desktop/src/features/chat-agent/components/agent/channel-feed.tsx desktop/src/features/chat-agent/components/agent/agent-teams-panel.tsx
git commit -m "feat(desktop): port Agent Teams tab — agent-teams-panel + team-node + channel-feed (RSP.b Wave B1, verbatim)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → `1123 passed`, 0 failing
- [ ] `npx vite build` → succeeds
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc commit + Wave A1 + Wave B1, all `(RSP.b …)`
- [ ] Grep the ported files for stale imports: `grep -rn "@/lib/\|@/atoms/agent-teams\b\|@/components/agent/TeamNode\|@/components/agent/ChannelFeed" desktop/src/features/chat-agent/components/agent/{team-node,channel-feed,agent-teams-panel}.tsx desktop/src/features/chat-agent/atoms/agent-teams.ts` — only retargeted `@/features/...`/`@/shared/...` paths allowed.

## Scope boundaries (NOT in RSP.b)

- **No RightSidePanel root, no WorkspaceFilesView wrapper, no stub swap** — RSP.c. `activePlanAtom` is ported here (in agent-teams.ts) but its consumer (RightSidePanel) lands in RSP.c.
- **No BrowserPanel cluster** — deferred (browser tab keeps the existing `browser-viewer` stub).
- The 3 Teams components compile + bundle but are NOT mounted yet (RightSidePanel mounts `AgentTeamsPanel` in RSP.c).

## Carry-forwards (unchanged)

- RSP.c (RightSidePanel root + WorkspaceFilesView wrapper + swap `right-side-panel-stub` + app-shell retarget).
- BrowserPanel cluster (~827 LOC, 8 IPC stubs); real KaleidoscopeShell/WelcomeView/HomeOfficeView/FocusModeOverlay; Git workbench cluster; Rust backends for all accumulated IPC stubs.
