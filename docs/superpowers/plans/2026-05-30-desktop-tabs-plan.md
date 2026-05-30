# Plan FB.c — Desktop tabs Cluster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Third and FINAL PR of the "workspace files + tabs" sub-stack (FB.a ✅ #24 → FB.b ✅ #25 → FB.c). Port the uclaw `tabs/` cluster verbatim: the tab bar (TabBar/TabBarItem/TabBarWorkspaceChip), Ctrl+Tab quick switcher (TabSwitcher), hover preview (TabPreviewPanel), close-confirm dialog, error boundary, content router (TabContent), and main-area wrapper (MainArea). Plus 2 supporting hooks (`useCloseTab`, `useWindowDragOnMove`).

**Architecture:** Verbatim port discipline (PRs #18–#25). Byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/components/tabs/` with standardized retargets. `TabContent` routes tab-type → real `AgentView` (ported) for agent tabs, and **content-STUBS** for the not-yet-ported clusters (`ChatView`, `BrowserPanel`, `SymphonyCanvas`, plus `Panel`/`WorkspaceShell` for `MainArea`) — placeholder components rendering a deferred marker, following the established stub discipline. The tabs cluster is ported + self-tested but **NOT wired into app-shell** in this PR (wiring the tabs shell now would regress the working app — the main view would show stub placeholders instead of the real `AgentView`). Wiring is a carry-forward, consistent with FB.a/FB.b.

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 · Tailwind v3 · motion/react · react-markdown · lucide-react. Package manager **pnpm**. **No new npm deps** (`@tauri-apps/api/window` is part of the installed `@tauri-apps/api`).

---

## Closure summary

| Group | Files | LOC |
|---|---|---|
| Hooks | use-close-tab, use-window-drag-on-move | ~217 |
| Content stubs (5) | chat-view, browser-panel, symphony-canvas component, panel, workspace-shell | ~60 |
| IPC stubs | getActiveWorkspaceId, setActiveWorkspaceId | ~10 |
| Leaf tab components | TabErrorBoundary, TabPreviewPanel, TabBarWorkspaceChip(+test) | ~247 + 60 |
| Core tab components | TabBarItem, TabCloseConfirmDialog, TabBar(+test) | ~590 + 97 |
| Routers | TabSwitcher, TabContent, MainArea | ~408 |
| Barrel | index.ts | ~8 |
| **Total** | **~22 files** | **~1,540 + tests** |

Smaller than FB.b. The whole tab-shell UI in one PR (final of the sub-stack).

---

## File Structure

### New files
```
desktop/src/features/chat-agent/
├── hooks/
│   ├── use-close-tab.ts                          # NEW (Wave A1, 121 LOC — exports useCloseTab + pendingCloseTabIdAtom)
│   └── use-window-drag-on-move.ts                # NEW (Wave A1, 96 LOC — @tauri-apps/api/window)
├── components/
│   ├── chat/chat-view-stub.tsx                   # NEW (Wave A2, content stub)
│   ├── browser/browser-panel-stub.tsx            # NEW (Wave A2, content stub)
│   ├── app-shell/panel-stub.tsx                  # NEW (Wave A2, simple layout wrapper)
│   ├── workspace/workspace-shell-stub.tsx        # NEW (Wave A2, content stub)
│   └── tabs/
│       ├── tab-error-boundary.tsx                # NEW (Wave B, 60 LOC)
│       ├── tab-preview-panel.tsx                 # NEW (Wave B, 122 LOC)
│       ├── tab-bar-workspace-chip.tsx            # NEW (Wave B, 65 LOC) + .test.tsx (60)
│       ├── tab-bar-item.tsx                      # NEW (Wave C, 279 LOC)
│       ├── tab-close-confirm-dialog.tsx          # NEW (Wave C, 69 LOC)
│       ├── tab-bar.tsx                            # NEW (Wave C, 242 LOC) + .test.tsx (97)
│       ├── tab-switcher.tsx                       # NEW (Wave D, 318 LOC)
│       ├── tab-content.tsx                        # NEW (Wave D, 69 LOC)
│       ├── main-area.tsx                          # NEW (Wave D, 21 LOC)
│       └── index.ts                               # NEW (Wave D, barrel)
```

### Modified files
```
desktop/src/features/chat-agent/lib/
├── symphony-canvas-stub.ts                        # MODIFY (Wave A2: add SymphonyCanvas component export)
└── tauri-bridge-stub.ts                           # MODIFY (Wave A3: add getActiveWorkspaceId + setActiveWorkspaceId)
```

### Existing prereqs (verified — DO NOT re-port)
- ✅ ALL tab-atoms symbols (tabsAtom, visibleTabsAtom, activeTabIdAtom, tabMruAtom, tabIndicatorMapAtom, tabMinimapCacheAtom, workspaceActiveTabIdMapAtom, TabItem, TabType, TabMinimapItem, openTab, closeTab) — `atoms/tab-atoms.ts`
- ✅ agent-atoms (agentSessionsAtom, currentAgentSessionIdAtom, currentAgentWorkspaceIdAtom, unviewedCompletedSessionIdsAtom, agentRunningSessionIdsAtom, agentSidePanelOpenMapAtom, workingDoneSessionIdsAtom, SessionIndicatorStatus), workspace (workspacesAtom, activeWorkspaceIdAtom, workspaceSwitchDirectionAtom), app-mode (appModeAtom), chat-atoms (currentConversationIdAtom, conversationModelsAtom, conversationContextLengthAtom, conversationThinkingEnabledAtom, conversationParallelModeAtom), system-prompt-atoms (conversationPromptIdAtom)
- ✅ lib: `cn` (`@/shared/lib/cn`), `getModelLogo`, `getWorkspaceIcon`, `imChannelDisplay`
- ✅ components: `AgentView` (agent/agent-view), `UserAvatar` (components/user-avatar)
- ✅ primitives: `alert-dialog`, `tooltip` (`@/shared/ui/`)
- ✅ hooks: `useSyncActiveTabSideEffects` (`hooks/use-sync-active-tab-side-effects.ts`)
- ✅ `listSpaces` (tauri-bridge-stub); `stop_agent_session` is raw `invoke` (no wrapper — stays verbatim)
- ✅ `motion/react`, `react-markdown`, `remark-gfm` installed; `@tauri-apps/api/window` available

---

## Standard Retargets Table

| uclaw import | hermes retarget |
|---|---|
| `@/components/ui/<x>` | `@/shared/ui/<x>` |
| `@/components/tabs/<X>` (sibling) | relative `./<kebab>` |
| `@/components/agent/AgentView` | `@/features/chat-agent/components/agent/agent-view` |
| `@/components/chat/UserAvatar` | `@/features/chat-agent/components/user-avatar` |
| `@/components/chat/ChatView` | `@/features/chat-agent/components/chat/chat-view-stub` ← **CONTENT STUB** |
| `@/components/browser/BrowserPanel` | `@/features/chat-agent/components/browser/browser-panel-stub` ← **CONTENT STUB** |
| `@/components/symphony_graph` (SymphonyCanvas) | `@/features/chat-agent/lib/symphony-canvas-stub` ← **extended STUB** |
| `@/components/app-shell/Panel` | `@/features/chat-agent/components/app-shell/panel-stub` ← **layout STUB** |
| `@/views/Workspace/WorkspaceShell` | `@/features/chat-agent/components/workspace/workspace-shell-stub` ← **CONTENT STUB** |
| `@/hooks/useCloseTab` | `@/features/chat-agent/hooks/use-close-tab` |
| `@/hooks/useWindowDragOnMove` | `@/features/chat-agent/hooks/use-window-drag-on-move` |
| `@/hooks/useSyncActiveTabSideEffects` | `@/features/chat-agent/hooks/use-sync-active-tab-side-effects` |
| `@/atoms/<x>` | `@/features/chat-agent/atoms/<x>` |
| `@/lib/utils` (cn) | `@/shared/lib/cn` |
| `@/lib/<model-logo\|workspace-icons\|im-channel-display>` | `@/features/chat-agent/lib/<x>` |
| `@/lib/tauri-bridge` | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@tauri-apps/api/core` (raw invoke), `@tauri-apps/api/window`, `motion/react` | unchanged |

**Canonical NOT_IMPLEMENTED marker:** `NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: <snake_case>` (files+tabs family).

**Content-stub marker:** each content stub renders a `data-deferred-stub="<Name>"` element with a short Chinese placeholder — see Wave A2 for the exact shape. This mirrors the established stub discipline (settings-bridge-stub, file-type-icon-stub).

**Anti-god-file:** `desktop/src/lib/` contains ONLY `bridge/`.

**Git hygiene:** NEVER `git add -A` — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted adds; verify each commit with `git show --stat HEAD`.

**Test shim:** inline `renderWithProviders` (no `@/test-utils/render`). uclaw's helper wraps `<Provider store={store}><TooltipProvider>...`. Match it:
```tsx
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}><TooltipProvider>{ui}</TooltipProvider></Provider>)
}
```

---

## Wave A — Foundation: hooks + content stubs + IPC stubs

### Task A1: Port the 2 hooks

**Files:**
- Sources: `/Users/ryanliu/Documents/uclaw/ui/src/hooks/useCloseTab.ts` (121), `hooks/useWindowDragOnMove.ts` (96)
- Creates: `desktop/src/features/chat-agent/hooks/use-close-tab.ts`, `hooks/use-window-drag-on-move.ts`

- [ ] **Step 1: Read both uclaw sources + audit imports**
```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/hooks/useCloseTab.ts
cat /Users/ryanliu/Documents/uclaw/ui/src/hooks/useWindowDragOnMove.ts
```

- [ ] **Step 2: Port `use-close-tab.ts` verbatim**

Exports `useCloseTab()` + `pendingCloseTabIdAtom`. Retargets: `@/atoms/tab-atoms`→`@/features/chat-agent/atoms/tab-atoms` (tabsAtom, activeTabIdAtom, closeTab), `@/atoms/agent-atoms`/`chat-atoms`/`system-prompt-atoms`→`@/features/chat-agent/atoms/<x>`, `@/hooks/useSyncActiveTabSideEffects`→`@/features/chat-agent/hooks/use-sync-active-tab-side-effects`. Raw `invoke('stop_agent_session', { conversation_id })` from `@tauri-apps/api/core` stays verbatim. Add attribution.

- [ ] **Step 3: Port `use-window-drag-on-move.ts` verbatim**

Uses `getCurrentWindow().startDragging()` from `@tauri-apps/api/window` (unchanged). Pure React + the window API, no atoms. The startDragging call is wrapped in try/catch (verbatim). Add attribution.

- [ ] **Step 4: tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tabs/desktop
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4
```

- [ ] **Step 5: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tabs
git add desktop/src/features/chat-agent/hooks/use-close-tab.ts desktop/src/features/chat-agent/hooks/use-window-drag-on-move.ts
git commit -m "feat(desktop): port useCloseTab + useWindowDragOnMove hooks (FB.c Wave A1, verbatim)"
git show --stat HEAD | head -4
```

### Task A2: Create 5 content stubs

**Files:** Create 4 new stub files; extend 1 existing.

The 4 new content stubs each follow this shape (adjust name + Chinese label per component). These are placeholder components for not-yet-ported clusters — they let `TabContent`/`MainArea` compile + render a visible "deferred" marker:

- [ ] **Step 1: `components/chat/chat-view-stub.tsx`**
```tsx
// Content stub for uclaw's chat/ChatView (~3.5 KLOC cluster, not yet ported).
// TabContent routes 'chat' tabs here until the real chat-rendering cluster lands.
import * as React from 'react'
export function ChatView(_props: { conversationId?: string; [key: string]: unknown }): React.ReactElement {
  return (
    <div data-deferred-stub="ChatView" className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      聊天视图将在后续 PR 中接入。
    </div>
  )
}
```
**Read the real `TabContent.tsx`** to confirm the exact props `ChatView` is called with (e.g. `conversationId`), and make the stub's prop signature accept them (a permissive `[key: string]: unknown` index signature + the named props TabContent passes). Same for the others below.

- [ ] **Step 2: `components/browser/browser-panel-stub.tsx`** — same shape, `export function BrowserPanel`, label `浏览器面板将在后续 PR 中接入。`, `data-deferred-stub="BrowserPanel"`. Match props from TabContent.

- [ ] **Step 3: `components/workspace/workspace-shell-stub.tsx`** — same shape, `export function WorkspaceShell`, label `工作区外壳将在后续 PR 中接入。`, `data-deferred-stub="WorkspaceShell"`. Match props from MainArea.

- [ ] **Step 4: `components/app-shell/panel-stub.tsx`** — a SIMPLE layout wrapper (NOT a deferred placeholder — MainArea needs it to actually lay out). Read uclaw `@/components/app-shell/Panel.tsx` to get the prop shape (`variant`, `className`, `children`), then:
```tsx
// Layout-wrapper stub for uclaw's app-shell/Panel. The real Panel has variants;
// MainArea only uses it as a flex container. Minimal faithful wrapper.
import * as React from 'react'
import { cn } from '@/shared/lib/cn'
interface PanelProps { children?: React.ReactNode; variant?: string; className?: string; [key: string]: unknown }
export function Panel({ children, className }: PanelProps): React.ReactElement {
  return <div className={cn('flex flex-col', className)}>{children}</div>
}
```
Confirm the prop names against uclaw `Panel.tsx` (esp. whether MainArea passes `variant="grow"` — keep the prop in the interface even if unused, `_`-prefix the destructure if tsc complains).

- [ ] **Step 5: Extend `lib/symphony-canvas-stub.ts`** — currently only exports `SYMPHONY_NEW_TAB_SENTINEL`. Add a `SymphonyCanvas` component export (deferred placeholder) so `TabContent`'s symphony route compiles:
```tsx
// (append to symphony-canvas-stub — change file to .tsx if it has JSX now)
import * as React from 'react'
export function SymphonyCanvas(_props: { [key: string]: unknown }): React.ReactElement {
  return (
    <div data-deferred-stub="SymphonyCanvas" className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      Symphony 画布将在后续 PR 中接入。
    </div>
  )
}
```
**Note:** if the file is currently `.ts` (no JSX), rename to `.tsx` (and update any importers of the constant — `grep -rn "symphony-canvas-stub" desktop/src`). Keep the `SYMPHONY_NEW_TAB_SENTINEL` export intact.

- [ ] **Step 6: tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tabs/desktop
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4
```

- [ ] **Step 7: Commit (targeted)** — add the 5 stub files (+ any importer touched by the symphony rename):
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tabs
git add desktop/src/features/chat-agent/components/chat/chat-view-stub.tsx desktop/src/features/chat-agent/components/browser/browser-panel-stub.tsx desktop/src/features/chat-agent/components/workspace/workspace-shell-stub.tsx desktop/src/features/chat-agent/components/app-shell/panel-stub.tsx desktop/src/features/chat-agent/lib/symphony-canvas-stub.tsx
# git rm the old .ts if renamed; git add any importer updated
git commit -m "feat(desktop): add 5 tab-content stubs (ChatView/BrowserPanel/WorkspaceShell/Panel/SymphonyCanvas) (FB.c Wave A2)"
git show --stat HEAD | head -8
```

### Task A3: Add getActiveWorkspaceId + setActiveWorkspaceId IPC stubs

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

No tabs COMPONENT imports these directly (verified), but the 2 ported tests `vi.mock` the bridge module providing them, and they're part of the workspace IPC surface. Add them for fidelity + test-mock resolvability.

- [ ] **Step 1: grep to confirm absent, then append**
```bash
grep -nE "getActiveWorkspaceId|setActiveWorkspaceId" desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts || echo "absent — add them"
```
Append to the `=== Plan FB.b additions ===` group (or a new `=== Plan FB.c additions ===` group at the end):
```ts
// === Plan FB.c additions ===
// ─── workspace activation IPC stubs ───────────────────────────────────────────
// Consumed transitively by workspace atoms (the tabs tests mock these). Signatures
// from uclaw lib/tauri-bridge.ts:484-487.
export async function getActiveWorkspaceId(): Promise<string | null> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: get_active_workspace_id')
}
export async function setActiveWorkspaceId(_id: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: set_active_workspace_id')
}
```

- [ ] **Step 2: tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tabs/desktop
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4
```

- [ ] **Step 3: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tabs
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add getActiveWorkspaceId + setActiveWorkspaceId stubs (FB.c Wave A3)"
git show --stat HEAD | head -4
```

---

## Wave B — Leaf tab components (+ 1 test)

Port each verbatim with the retarget table + attribution. Sources under `/Users/ryanliu/Documents/uclaw/ui/src/components/tabs/`. Destinations under `desktop/src/features/chat-agent/components/tabs/`.

### Task B1: `TabErrorBoundary.tsx` (60) → `tab-error-boundary.tsx`
Self-contained class component (lucide icons only). Commit `feat(desktop): port tab-error-boundary (FB.c Wave B1, verbatim)`.

### Task B2: `TabPreviewPanel.tsx` (122) → `tab-preview-panel.tsx`
Retargets: cn, UserAvatar (`@/features/chat-agent/components/user-avatar`), model-logo, tab-atoms (TabMinimapItem); react-markdown/remark-gfm unchanged. Commit `feat(desktop): port tab-preview-panel (FB.c Wave B2, verbatim)`.

### Task B3: `TabBarWorkspaceChip.tsx` (65) + test (60) → `tab-bar-workspace-chip.tsx` + `.test.tsx`
Retargets: workspace atoms, getWorkspaceIcon. Test: retarget `vi.mock('@/lib/tauri-bridge', ...)` → `vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => ({ ...(await importOriginal()), setActiveWorkspaceId: vi.fn(), listSpaces: vi.fn().mockResolvedValue([]), getActiveWorkspaceId: vi.fn().mockResolvedValue(null) }))` (use `importOriginal` SPREAD so transitively-imported bridge symbols aren't nulled), + inline renderWithProviders shim. Commit `feat(desktop): port tab-bar-workspace-chip + test (FB.c Wave B3, verbatim)`.

After each: test + tsc (expect 28) + targeted commit + `git show --stat`.

---

## Wave C — Core tab components (+ 1 test)

### Task C1: `TabBarItem.tsx` (279) → `tab-bar-item.tsx`
Retargets: cn, im-channel-display, `./tab-preview-panel`, `@/features/chat-agent/hooks/use-window-drag-on-move`, tab-atoms (tabMinimapCacheAtom), agent-atoms (SessionIndicatorStatus); lucide + motion unchanged. Commit `feat(desktop): port tab-bar-item (FB.c Wave C1, verbatim)`.

### Task C2: `TabCloseConfirmDialog.tsx` (69) → `tab-close-confirm-dialog.tsx`
Retargets: tab-atoms (visibleTabsAtom), `@/features/chat-agent/hooks/use-close-tab` (useCloseTab + pendingCloseTabIdAtom), `@/shared/ui/alert-dialog`. Commit `feat(desktop): port tab-close-confirm-dialog (FB.c Wave C2, verbatim)`.

### Task C3: `TabBar.tsx` (242) + test (97) → `tab-bar.tsx` + `.test.tsx`
Retargets: `./tab-bar-item`, `./tab-bar-workspace-chip`, `./tab-close-confirm-dialog`, `@/features/chat-agent/hooks/use-close-tab`, tab/agent/workspace/chat/app-mode atoms; motion unchanged. Test: same mock-retarget pattern as B3 (`importOriginal` spread for `listSpaces`/`getActiveWorkspaceId`) + inline shim. Commit `feat(desktop): port tab-bar + test (FB.c Wave C3, verbatim)`.

After each: test + tsc + targeted commit + `git show --stat`.

---

## Wave D — Routers + barrel

### Task D1: `TabSwitcher.tsx` (318) → `tab-switcher.tsx`
Independent Ctrl+Tab cycler. Retargets: cn, tab-atoms (tabMruAtom etc.), agent/chat/app-mode atoms; lucide unchanged. Commit `feat(desktop): port tab-switcher (FB.c Wave D1, verbatim)`.

### Task D2: `TabContent.tsx` (69) → `tab-content.tsx`
The content router. Retargets: tab-atoms (visibleTabsAtom), `./tab-error-boundary`, `@/features/chat-agent/components/agent/agent-view` (AgentView — REAL), and the 3 content stubs: `@/features/chat-agent/components/chat/chat-view-stub` (ChatView), `@/features/chat-agent/components/browser/browser-panel-stub` (BrowserPanel), `@/features/chat-agent/lib/symphony-canvas-stub` (SymphonyCanvas). Confirm the import names match the stub exports. Commit `feat(desktop): port tab-content (FB.c Wave D2, verbatim — content stubs for ChatView/BrowserPanel/SymphonyCanvas)`.

### Task D3: `MainArea.tsx` (21) → `main-area.tsx`
Retargets: `@/features/chat-agent/components/app-shell/panel-stub` (Panel), `@/features/chat-agent/components/workspace/workspace-shell-stub` (WorkspaceShell). Commit `feat(desktop): port main-area (FB.c Wave D3, verbatim — Panel/WorkspaceShell stubs)`.

### Task D4: `index.ts` (8) → `index.ts` barrel
Re-export the public tab components (read uclaw `tabs/index.ts` for the exact exports; retarget kebab paths). Commit `feat(desktop): add tabs barrel (FB.c Wave D4, verbatim)`.

### Task D5: TabContent mount smoke test
Write `components/tabs/tab-content.test.tsx` — render `<TabContent>` with a store seeded so `visibleTabsAtom` has one agent tab + one chat tab; assert the agent tab renders real AgentView content (or at least mounts without throwing) and a chat tab renders the `data-deferred-stub="ChatView"` marker. Use the inline shim + mock any IPC the AgentView mount fires (read agent-view to see; mock minimally). Keep ≥2 meaningful assertions. Commit `feat(desktop): add tab-content smoke test (FB.c Wave D5)`.

After each: test + tsc + targeted commit + `git show --stat`.

---

## Wave E — Final sweep

- [ ] **Step 1: Anti-god-file** — `find desktop/src/lib -type f -not -path '*/bridge/*'` → empty.
- [ ] **Step 2: Storage-key audit** — `git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/chat-agent/components/tabs/ desktop/src/features/chat-agent/hooks/use-close-tab* desktop/src/features/chat-agent/hooks/use-window-drag* || echo clean`.
- [ ] **Step 3: Branch pollution** — `git diff main..HEAD --name-only | grep -vE "^desktop/|^docs/superpowers/" || echo "clean"`. If any `crates/`/`docs/parity/` appears, `git restore` it.
- [ ] **Step 4: Un-retargeted scan** — `grep -rn "@/components/tabs\|@/hooks/useCloseTab\|@/hooks/useWindowDragOnMove\|@/test-utils/render\|@/components/chat/ChatView\|@/components/browser/BrowserPanel\|@/views/Workspace" desktop/src/features/chat-agent/components/tabs/ desktop/src/features/chat-agent/hooks/use-close-tab* || echo "all retargeted"`.
- [ ] **Step 5: tsc + final tests** — `cd desktop && npx tsc -b 2>&1 | grep -c "error TS"` (expect 28); `npm test -- --reporter=dot 2>&1 | tail -10` (expect ~1025, 0 failing).
- [ ] **Step 6: Commit only if a fixable issue surfaced** — targeted; `chore(desktop): Plan FB.c final sweep`.

---

## Final Self-Review Checklist

- [ ] Wave A: 2 hooks + 5 content stubs + 2 IPC stubs
- [ ] Wave B: TabErrorBoundary + TabPreviewPanel + TabBarWorkspaceChip(+test)
- [ ] Wave C: TabBarItem + TabCloseConfirmDialog + TabBar(+test)
- [ ] Wave D: TabSwitcher + TabContent + MainArea + barrel + smoke test
- [ ] Anti-god-file: `desktop/src/lib/` only `bridge/`
- [ ] Test count up by ≥4 (1021 → ≥1025: tab-bar-workspace-chip + tab-bar + tab-content smoke; uclaw tests carry their own case counts)
- [ ] tsc residual stable at 28
- [ ] No branch pollution; every commit verified via `git show --stat`
- [ ] Canonical `NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND` for the 2 new IPC stubs
- [ ] Content stubs render `data-deferred-stub` markers; no un-retargeted uclaw paths
- [ ] Tabs cluster ported + self-tested but NOT wired into app-shell (carry-forward documented)

---

## Carry-Forward Follow-ups

After FB.c merges, the **files+tabs sub-stack is structurally complete** (file-browser + files-rail + tabs all ported). Remaining:
1. **Wire the tab shell into app-shell** — replace/wrap the current `<AgentView sessionId={sessionId} />` in `app-shell.tsx` with `TabBar` + `TabSwitcher` + `MainArea`/`TabContent`. Deferred because the content clusters (ChatView, BrowserPanel, WorkspaceShell) are stubs — wiring now would regress the working AgentView main view. Wire once those clusters are ported (or wire incrementally, keeping AgentView as the agent-tab content via TabContent's real AgentView route).
2. **Port the deferred content clusters** the tab stubs stand in for: `chat/ChatView` (~3.5 KLOC), `browser/BrowserPanel` (~2 KLOC), `symphony_graph/SymphonyCanvas`, `views/Workspace/WorkspaceShell` (~1.2 KLOC), `app-shell/Panel`. Each replaces its FB.c stub.
3. **Rust backends** for the FB IPC stubs (incl. `get/set_active_workspace_id`, `stop_agent_session` if not already real) + the FB.a/FB.b stubs.
4. **Also wire FileBrowser (FB.a) + FilesRail (FB.b)** into their rail/sidebar slots (still deferred from those PRs).
