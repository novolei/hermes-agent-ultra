# AppShell → MainArea Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the ported `MainArea` (tab shell → WorkspaceShell → TabBar + TabContent + PreviewPanel) into the desktop `AppShell`, adopting uclaw's surface-switch (workspace ↔ kaleidoscope) layout — making the **preview pane + tab UI runtime-visible** (the payoff for the completed Preview sub-stack). The still-unported conditionally-rendered pieces (RightSidePanel, KaleidoscopeShell) get content-stubs; focus-mode atoms are ported verbatim.

**Architecture:** `AppShell` is a **curated desktop shell** (a trimmed adaptation of uclaw's 441-LOC `AppShell`, with explicit "→ Plan 2b.2.c.4" deferral comments) — NOT a verbatim port. This plan extends it toward uclaw's structure: replace the direct `<AgentView sessionId>` mount with the surface-switch + workspace-surface composition that renders `<MainArea>`. AgentView now renders **through** the tab system (`MainArea → WorkspaceShell → TabContent` routes `agent`-type tabs to `<AgentView>`). Newly-ported atoms (`focus-mode-atoms`) are byte-verbatim; the shell edit uses the desktop's existing Tailwind conventions + preserves all `data-testid`s.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps.**

---

## Conventions (apply to every task)

- **Verbatim where porting a uclaw file** (focus-mode-atoms): byte-for-byte + standardized retargets + 1-line attribution comment. **Curated edit** for `app-shell.tsx` (adopt uclaw structure/logic, desktop styling).
- **Content-stub pattern:** new stubs render a `data-deferred-stub="<name>"` marker (NOT `data-stub` — existing AgentView stub-completion tests count `[data-stub]`, which must stay 0). Export the exact symbol the consumer imports.
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1123** tests pass. Every committed task keeps tsc at 19 and the FULL suite green (0 fail). Because the shell restructure breaks the app-shell tests until they're reworked, Wave B commits the shell edit + test rework **together** (one green commit).
- **Verify-not-already-ported:** `ls` each new dest before creating.
- **No new IPC stubs.**

### Confirmed facts (verified against the repo)

- Already ported/available: `MainArea` (`components/tabs/main-area.tsx`), `ModeBanner` (`components/agent/mode-banner.tsx`, export `ModeBanner`), `topLevelViewAtom` (`atoms/top-level-view.ts`, default `'workspace'`), `currentSessionSidePanelOpenAtom` (`atoms/agent-atoms.ts`), `useWorkspaceArrowSwitch` (`hooks/use-workspace-swipe.ts`), `appModeAtom` (`atoms/app-mode.ts`, default `'agent'`).
- Missing → this plan adds: `focus-mode-atoms.ts` (port verbatim from uclaw `atoms/focus-mode-atoms.ts`, 35 LOC, exports `focusModeAtom` (atom false) + focusReveal*/actions; only `jotai` deps), `right-side-panel-stub.tsx`, `kaleidoscope-shell-stub.tsx`.
- `WorkspaceShell` render logic (already ported): `homeOfficeOpen` → `<HomeOfficeView/>` (stub); else renders `<TabBar/>` + (`tabs.length === 0` ? `<WelcomeView/>` (stub) : `<TabContent tabId={activeTabId}/>`) + PreviewPanel when `previewPanelOpenAtom`. `visibleTabsAtom` = `tabsAtom` filtered by `activeWorkspaceIdAtom`; returns `[]` if no active workspace.
- `TabContent` routes: `chat`→`<ChatView>`, `browser`→stub, `symphony`→stub, default(`agent`)→`<AgentView sessionId={tab.sessionId}>`.
- **Test impact:** 7 `agent-view` assertions (1 in `app-shell.test.tsx`, 6 in `app-shell.integration.test.tsx`) + ~6 stub/SpeechButton assertions all relied on AppShell directly mounting AgentView. Fix centrally by seeding an active agent tab so AgentView renders through the shell.

---

## Wave A — Foundation (focus-mode atoms + 2 content-stubs)

### Task A1: Port focus-mode-atoms; create right-side-panel + kaleidoscope-shell stubs

**Files (create):**
- `desktop/src/features/chat-agent/atoms/focus-mode-atoms.ts` ← uclaw `atoms/focus-mode-atoms.ts` (35 LOC, verbatim — only `jotai` imports, no retargets needed)
- `desktop/src/features/chat-agent/components/app-shell/right-side-panel-stub.tsx` — `export function RightSidePanel(): React.ReactElement` rendering `<div data-deferred-stub="right-side-panel" hidden />`
- `desktop/src/features/chat-agent/components/app-shell/kaleidoscope-shell-stub.tsx` — `export function KaleidoscopeShell(): React.ReactElement` rendering `<div data-deferred-stub="kaleidoscope-shell" hidden />`

- [ ] **Step 1:** Verify none exist. Port `focus-mode-atoms.ts` verbatim (attribution comment). Create the 2 stubs (each a no-prop component with a `data-deferred-stub` marker + a 1-line comment naming the deferred uclaw source).
- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1123 passed` (nothing imports these yet — neutral).
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/focus-mode-atoms.ts desktop/src/features/chat-agent/components/app-shell/right-side-panel-stub.tsx desktop/src/features/chat-agent/components/app-shell/kaleidoscope-shell-stub.tsx
git commit -m "feat(desktop): add focus-mode-atoms + right-side-panel/kaleidoscope-shell stubs for AppShell wiring (Wave A1)"
git show --stat HEAD
```

---

## Wave B — AppShell restructure + test rework (one green commit)

### Task B1: Adopt uclaw surface-switch, mount MainArea, rework app-shell tests

**Files (modify):**
- `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx`
- `desktop/src/features/chat-agent/components/app-shell/app-shell.test.tsx`
- `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

- [ ] **Step 1: Restructure `app-shell.tsx`.** Adopt uclaw `AppShell` (lines 334–376) surface-switch structure, using desktop Tailwind conventions:
  - **Add imports:** `MainArea` (`@/features/chat-agent/components/tabs/main-area`), `ModeBanner` (`@/features/chat-agent/components/agent/mode-banner`), `RightSidePanel` (`./right-side-panel-stub`), `KaleidoscopeShell` (`./kaleidoscope-shell-stub`), `topLevelViewAtom` (`@/features/chat-agent/atoms/top-level-view`), `focusModeAtom` (`@/features/chat-agent/atoms/focus-mode-atoms`), `currentSessionSidePanelOpenAtom` (`@/features/chat-agent/atoms/agent-atoms`), `useWorkspaceArrowSwitch` (`@/features/chat-agent/hooks/use-workspace-swipe`).
  - **Remove:** the `AgentView` import + the direct `<main><AgentView sessionId={sessionId}/></main>` block. (Keep `currentSessionId` from `currentAgentSessionIdAtom` — still needed for `showRightPanel`; the `?? 'default'` sessionId derivation can be dropped since AgentView's session now comes from `tab.sessionId`.)
  - **Add derivations** (inside `AppShell()`): `const topLevelView = useAtomValue(topLevelViewAtom)`; `const appMode = useAtomValue(appModeAtom)`; `const focusMode = useAtomValue(focusModeAtom)`; `const isPanelOpen = useAtomValue(currentSessionSidePanelOpenAtom)`; `const showRightPanel = appMode === 'agent' && !!currentSessionId`. Call `useWorkspaceArrowSwitch()` (alongside the existing hooks).
  - **New render tree** (keep the root `<TooltipProvider>` + the `data-testid="app-shell"` root div with its existing classes). Replace the inner content with the surface-switch:
    ```tsx
    {topLevelView === 'kaleidoscope' ? (
      <div className="relative z-[60] flex flex-1 min-w-0 min-h-0">
        <KaleidoscopeShell />
      </div>
    ) : (
      <>
        {!focusMode && <LeftSidebar />}
        {/* main-panel: KEEP data-testid="app-shell-main" + flex-1 here (tests assert both) */}
        <main data-testid="app-shell-main" className="flex flex-1 flex-col overflow-hidden min-w-0">
          <ModeBanner />
          <MainArea />
        </main>
        {!focusMode && showRightPanel ? <RightSidePanel /> : null}
      </>
    )}
    {bottomDockEnabled ? (<div data-testid="bottom-dock-hover"><BottomDockHoverRegion /></div>) : null}
    <SearchPalette onSelect={handleSearchResultSelect} />
    <SettingsDialog />
    ```
    Preserve: `data-testid="app-shell"` (root), `data-testid="app-shell-main"` (on the main-panel — must keep `flex-1` in its className), `data-testid="left-sidebar"` (inside LeftSidebar, unchanged), `data-testid="bottom-dock-hover"`. Keep `handleSearchResultSelect`, `useGlobalChatListeners()`, `useShortcut(...)`, the `refreshWorkspaces` effect, and all existing atom wiring used by the search handler. Update the file's top doc-comment (the "Deferred from uclaw" list) to reflect that MainArea/surface-switch are now wired and RightSidePanel/Kaleidoscope are stubbed.

- [ ] **Step 2: Verify tsc** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`. (Tests will be red until Step 4 — that's expected; do not commit yet.)

- [ ] **Step 3: Add a tab-seeding helper to `app-shell.integration.test.tsx`.** AgentView now renders only via an active `agent` tab. Add near the existing `mountAppShell` helper:
  ```tsx
  import { tabsAtom, activeTabIdAtom, openTab } from '@/features/chat-agent/atoms/tab-atoms'
  import { activeWorkspaceIdAtom } from '@/features/chat-agent/atoms/workspace'
  // (currentAgentSessionIdAtom already imported)

  function seedAgentTab(store: ReturnType<typeof createStore>, sessionId = 'default', wsId = 'default') {
    store.set(activeWorkspaceIdAtom, wsId)
    const { tabs, activeTabId } = openTab([], { type: 'agent', sessionId, title: '', workspaceId: wsId })
    store.set(tabsAtom, tabs)
    store.set(activeTabIdAtom, activeTabId)
    store.set(currentAgentSessionIdAtom, sessionId)
  }
  ```
  Update `mountAppShell` so the default path seeds an agent tab (so the ~11 `mountAppShell()` AgentView/stub/SpeechButton assertions render AgentView through the shell):
  ```tsx
  function mountAppShell(store: ReturnType<typeof createStore> = createStore()) {
    seedAgentTab(store)
    return render(<Provider store={store}><AppShell /></Provider>)
  }
  ```
  (Tests that pass their own store now get the tab seeded into it too — they only set unrelated atoms like dock/theme, so no conflict.)

- [ ] **Step 4: Reframe the 2 obsolete session-threading tests (G1, G2).** AgentView's session now comes from `tab.sessionId`, not the AppShell prop. Update:
  - **G1** → assert that, with a seeded agent tab (sessionId `'session-foo'`), AgentView renders through the tab shell: `seedAgentTab(store, 'session-foo')` then assert `[data-testid="agent-view"]` present. Rename to reflect "AgentView renders via the active agent tab".
  - **G2** ("falls back to default when currentAgentSessionIdAtom is null") → either retire or reframe to "AgentView renders for an agent tab whose sessionId is 'default'": `seedAgentTab(store, 'default')`, assert agent-view present. (The app-shell-level `?? 'default'` fallback no longer exists; the tab always carries a sessionId.)
  Leave all other A/H/stub/N assertions unchanged — they pass via the seeded helper.

- [ ] **Step 5: Fix the one `app-shell.test.tsx` AgentView test.** Its "main pane mounts AgentView" case uses plain `render(<Provider><AppShell/></Provider>)` (no helper). Seed an agent tab inline (mirror `seedAgentTab` using a `createStore()` + `<Provider store>`), then keep the `agent-view` assertion. The structural tests in this file ("renders LeftSidebar + main pane", "main pane uses flex-1") pass unchanged once `app-shell-main` + `flex-1` are preserved on the main-panel (Step 1).

- [ ] **Step 6: Run the FULL suite + tsc + build.**
  - `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
  - `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → all pass (count = 1123 ± any G2 retire; record). Scan for "Unhandled"/"transformCallback": only the 2 pre-existing `channels/statuses is not iterable` allowed — no NEW ones. If a NON-obvious failure appears (e.g. a stub-count assertion trips because a new `data-deferred-stub` leaked into a `[data-stub]` query, or rendering the tab tree surfaces a rejection), STOP and report for adjudication.
  - `npx vite build 2>&1 | tail -5` → succeeds.

- [ ] **Step 7: Commit (shell + tests together — green).**

```bash
git add desktop/src/features/chat-agent/components/app-shell/app-shell.tsx desktop/src/features/chat-agent/components/app-shell/app-shell.test.tsx desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "feat(desktop): wire MainArea into AppShell via surface-switch; AgentView now renders through the tab shell (Wave B1)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → all pass, 0 fail, no NEW unhandled rejections
- [ ] `npx vite build` → succeeds (the workspace + preview tree now mounts under AppShell)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc commit + Wave A1 + Wave B1
- [ ] Manual reasoning check: with an active agent tab → AppShell renders LeftSidebar + MainArea(→WorkspaceShell→TabBar+TabContent→AgentView) + RightSidePanel-stub; with no tabs → WelcomeView-stub; `topLevelView==='kaleidoscope'` → KaleidoscopeShell-stub. All `data-deferred-stub` markers (not `data-stub`).

## Behavioral notes / scope boundaries

- **Empty-tabs state** now shows the `welcome-view-stub` placeholder (faithful to uclaw; WelcomeView deferred). AgentView is reachable by opening/activating an agent tab (the search palette + session-load paths already do this via `openTab`).
- **RightSidePanel + KaleidoscopeShell** render as `data-deferred-stub` placeholders — their real clusters are future ports.
- **`main-area` → `app-shell`** is now DONE; the preview pane is runtime-visible when a preview tab/`previewPanelOpenAtom` is active. The Preview sub-stack's reachability goal is met.

## Carry-forwards (updated)

- Real RightSidePanel cluster (~932 LOC: panel + 5 tab views + atoms); real KaleidoscopeShell, WelcomeView, HomeOfficeView, FocusModeOverlay.
- Git workbench cluster (~2,400 LOC); Rust backends for all accumulated IPC stubs.
