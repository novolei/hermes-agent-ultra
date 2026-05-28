# Desktop Navigation Spine — Design Spec (Plan 3 family)

**Status:** Approved in brainstorming (2026-05-28)
**Stacked on:** main at `b886ec1` (post-merge of Plan 2b.2.c.3)
**Branches produced:** `feat/desktop-multi-theme` (3.1), `feat/desktop-workspace` (3.2), `feat/desktop-appshell` (3.3)

---

## 1. Goal

Wrap `ChatAgentView` (from Plan 2b.2.c.3) in uclaw's full navigation spine so the desktop app's chrome matches uclaw's look: multi-theme system + workspace management + bottom Dock + left sidebar. After Plan 3.3 ships, `pnpm tauri dev` opens a window with workspace rail on the left, theme switcher reachable, dock at the bottom, and ChatAgentView in the main pane.

## 2. Non-goals

- Full uclaw `AgentView.tsx` port (1,926 LOC + 16 sibling components) → **Plan 2b.2.c.4**, unblocked after Plan 3.3 lands
- Settings UI (real `settingsTabAtom`-driven panel) → **Plan 3.5**
- File preview window + focus mode → **Plan 3.5**
- cn-desktop domain screens (Hermes 领域屏幕) → **Plan 4** (requires the cn-desktop repo to be locally available; not the case as of 2026-05-28)
- Packaging + distribution + bundle-size audit → **Plan 7**

## 3. Three-plan family

uclaw's spine transitively covers ~8,300 LOC across 4 subsystems. Split into three stacked plans (each shipping working software):

### 3.1 Plan 3.1 — Multi-theme tokens + theme atoms + theme picker UI (~2,000 LOC effective)

**Branch:** `feat/desktop-multi-theme`

**Ports:**
- `atoms/theme.ts` (187 LOC) — `themeModeAtom`, `themeStyleAtom`, `systemIsDarkAtom`, `resolvedThemeAtom` (derived), `applyThemeToDOM`, `initializeTheme`, `updateThemeMode`, `updateThemeStyle`
- `styles/themes.css` — 10 named theme blocks ported from uclaw's `globals.css` (~1,500 LOC of CSS variables): `ocean-light`, `ocean-dark`, `forest-light`, `forest-dark`, `slate-light`, `slate-dark`, `warm-paper`, `qingye`, `black`, `the-finals`
- A small theme picker dropdown component (~150 LOC NEW) — exposed for Plan 3.3's Dock to mount. For 3.1 we ship a modal-triggered picker that any consumer can mount.

**Modifications:**
- Replace existing `themeAtom` (Plan 2b.2.b.1) with the richer `themeModeAtom` / `themeStyleAtom` / `resolvedThemeAtom` trio
- `pierre-theme.ts` (Plan 2b.2.c.1) — repoint `themeAtom` consumer to `resolvedThemeAtom` (1-line change, same `light | dark` union)
- `tailwind.config.js` — extend `darkMode` to cover the new selectors (`[data-theme="dark"]` already covered; new `[class*="theme-"]` covers named-theme dark variants)
- `lib/bridge/` — IF persisting theme via Tauri command, add `set_theme_mode` / `set_theme_style` Rust commands. Otherwise rely on localStorage (uclaw's pattern with `THEME_CACHE_KEY`).

**What stays the same:**
- All ported components automatically inherit theme switching via CSS variables; no component changes required.

**Closes:** Plan 2b.2.b.1 ADR theme decision (multi-theme deferred — finally lands).

**Target tests:** ≥10 new tests (theme atom defaults, applyThemeToDOM idempotence, named-theme selectors, picker UI interaction, resolvedThemeAtom system-tracking).

### 3.2 Plan 3.2 — Workspace atoms + workspace components (~2,800 LOC)

**Branch:** `feat/desktop-workspace`

**Ports (verbatim from uclaw):**
- `atoms/workspace.ts` (253 LOC) — REPLACES the c.3 dormant stub. Real workspaces list, active workspace, persistence atoms.
- `components/workspace/IconPicker.tsx`
- `components/workspace/SessionItem.tsx` + `SessionItem.test.tsx`
- `components/workspace/WorkspaceCreateDialog.tsx` + test
- `components/workspace/WorkspaceHeader.tsx` + test
- `components/workspace/WorkspaceRail.tsx` + 2 tests (filter + main)
- `components/workspace/WorkspaceSwitcherBar.tsx` + test

**Real Tauri backend (Rust + SQLite, extends existing session store):**
- `commands/workspaces.rs` — `list_workspaces`, `create_workspace`, `set_active_workspace`, `delete_workspace`, `rename_workspace`
- `desktop/src-tauri/migrations/<n>_workspaces.sql` — new SQLite table mirroring the session-store pattern from Plan 1
- `lib/bridge/workspaces.ts` — typed wrappers via tauri-specta

**Closes:** Plan 2b.2.c.2 follow-up #4 (workspace stub fully replaced with real implementation).

**Target tests:** ≥15 new tests (workspace atom defaults + actions, 5 workspace components × ~3 each, Rust integration tests for CRUD).

### 3.3 Plan 3.3 — Dock + LeftSidebar + AppShell + App.tsx integration (~3,300 LOC)

**Branch:** `feat/desktop-appshell`

**Ports:**
- `components/dock/DockItem.tsx` + test
- `components/dock/DockPinnedItem.tsx` + test
- `components/dock/DockDragHandle.tsx` + test
- `components/agent/MoveSessionDialog.tsx` (200 LOC, used by LeftSidebar; not previously ported)
- `components/app-shell/LeftSidebar.tsx` (1,261 LOC, transitively pulls in only the workspace module from 3.2 + MoveSessionDialog above)

**New (invented for desktop):**
- `components/app-shell/AppShell.tsx` (~150 LOC NEW) — top-level layout composing `<LeftSidebar />` + `<ChatAgentView />` + `<Dock />`. NOT a verbatim port (uclaw's equivalent lives inside `AgentView.tsx` which we slim-portionally skip until Plan 2b.2.c.4).
- The Dock's contents in 3.3: chat-mode icon, agent-mode icon (active), theme picker (mounted from 3.1's picker), settings icon (opens c.2 stubbed `settingsOpenAtom` modal — still inert until Plan 3.5).

**Modifications:**
- `App.tsx` — replace `<ChatAgentView />` with `<AppShell />`. Second App.tsx change since Plan 1 (Plan 2b.2.c.3 was first).
- `chat-agent-view.tsx` — minor adjustment to fit inside AppShell's main pane (remove its own `h-screen` if AppShell provides the flex container).

**Closes:** ADR navigation-spine deliverable; unblocks Plan 2b.2.c.4 (full uclaw AgentView port now has workspace atoms + permission/plan-mode atoms — wait, permission atoms are NOT in 3.x scope, those still need a separate plan or 3.5).

**Target tests:** ≥15 integration tests covering AppShell layout, LeftSidebar workspace selection, Dock pin/drag, theme switching from Dock, end-to-end (workspace switch → session list updates → ChatAgentView re-renders).

## 4. Architectural principles across 3.1 / 3.2 / 3.3

1. **Anti-god-file:**
   - One component per file under `components/workspace/`, `components/dock/`, `components/app-shell/`
   - Theme tokens in `styles/themes.css` (separate from base `styles/index.css`)
   - `desktop/src/lib/` stays at `bridge/` only
   - No barrel re-exporters
   - `AppShell.tsx` ≤200 LOC (it's an invented composition shell, not a bag of features)

2. **Verbatim-port discipline:** Every real component is a verbatim copy of uclaw with import retargets + TS strict-mode tweaks. Storage keys rebrand `uclaw-*` → `hermes-*` per the established Plan 2b.2.c.2 precedent.

3. **Stub-replacement protocol:**
   - 3.1: `themeAtom` (Plan 2b.2.b.1 simple atom) → real `themeModeAtom` + `themeStyleAtom` + `resolvedThemeAtom` trio
   - 3.2: `activeWorkspaceIdAtom` + `workspacesAtom` (Plan 2b.2.c.3 dormant stubs) → real backed-by-SQLite atoms
   - 3.3: Mounts everything; no stub deletions but `<AppShell>` replaces `<ChatAgentView>` in App.tsx

4. **Backend invariants:**
   - 3.1: No Rust changes (localStorage persistence per uclaw pattern)
   - 3.2: New Rust commands + SQLite migration; cumulative ≥27 Rust tests
   - 3.3: No additional Rust changes (or minor `move_session_to_workspace` if MoveSessionDialog needs it)

5. **`App.tsx` change accounting:**
   - Plan 1 → initial MVP composer
   - Plan 2b.2.c.3 → `<ChatAgentView />`
   - Plan 3.3 → `<AppShell />`
   - **3 changes total** when this family is done; each well-motivated.

## 5. Cumulative test growth target

| Plan | Target frontend tests | Target Rust tests |
|---|---|---|
| Plan 2b.2.c.3 (current main) | 448 | 23 |
| Plan 3.1 | ≥458 (+10) | 23 unchanged |
| Plan 3.2 | ≥473 (+15) | ≥27 (+4 workspace CRUD) |
| Plan 3.3 | ≥488 (+15) | ≥27 unchanged |

## 6. Acceptance criteria summary

### 3.1 ships when:
- 10 named themes selectable via the picker; existing components inherit; resolvedThemeAtom tracks system-dark
- ≥10 new tests pass + cumulative ≥458
- Build clean
- `themeAtom` replaced cleanly (pierre-theme retargets)
- Final reviewer: APPROVED or APPROVED_WITH_FOLLOWUPS

### 3.2 ships when:
- Workspace CRUD works end-to-end (Rust commands + frontend rail UI)
- `atoms/workspace.ts` from c.3 dormant stub fully replaced
- ≥15 new tests + cumulative ≥473
- ≥4 new Rust tests + cumulative ≥27
- Build clean
- `App.tsx` still mounts `<ChatAgentView />` (AppShell deferred to 3.3)
- Final reviewer: APPROVED or APPROVED_WITH_FOLLOWUPS

### 3.3 ships when:
- App.tsx mounts `<AppShell />` with LeftSidebar + Dock + ChatAgentView
- Manual launch: `pnpm tauri dev` opens a fully-chromed window — workspace rail visible on left, dock at bottom, theme picker reachable, ChatAgentView in main pane
- ≥15 new integration tests + cumulative ≥488
- Build clean
- Final reviewer: APPROVED or APPROVED_WITH_FOLLOWUPS

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Multi-theme CSS introduces specificity conflicts with existing components | Port verbatim; CSS variables are isolated per `data-theme=` and `.theme-*` selectors. Existing components consume HSL vars — works seamlessly. |
| Theme picker UI location (Dock vs standalone) deferred to 3.3 | 3.1 exports a `ThemePicker` component that can be mounted anywhere. Plan 3.3 chooses the location. |
| Workspace SQLite migration breaks existing sessions | Use additive-only migration (new table, no ALTER on existing); test against a populated DB. |
| `LeftSidebar.tsx` (1,261 LOC) pulls in unported deps beyond workspace + MoveSessionDialog | 3.3 Task 1 recon enumerates the full import surface before any port commits (established pattern). |
| `AppShell.tsx` invents a new component above ported infrastructure | AppShell is small (≤200 LOC) and documented as invented. Plan 2b.2.c.4 will swap to full uclaw AgentView, replacing AppShell entirely. |
| Bundle-size jump from theme tokens + workspace + dock + LeftSidebar | Verify in 3.3 smoke. Plan 7 owns the audit. |

## 8. Decision log (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Scope split | 3-way: 3.1 theme / 3.2 workspace / 3.3 dock+sidebar | ~8,300 LOC transitive; matches the 2b.2.c family's 3-way split precedent |
| Multi-theme scope | All 10 named themes (verbatim port of uclaw's tokens) | Plan 3.1 has the breathing room; reduces follow-up overhead later |
| Workspace persistence | Real Tauri commands + SQLite (Plan 3.2) | Workspace switching is core UX; localStorage-only would feel cheap |
| AppShell composition | Invented `AppShell.tsx` (~150 LOC NEW) | uclaw's equivalent is buried in AgentView.tsx (1,926 LOC); we slim until 2b.2.c.4 |
| Theme picker location | Defer to Plan 3.3 (Dock) | Plan 3.1 exports the component; consumer location is a 3.3 concern |
| Settings UI in Dock | Inert button (opens existing `settingsOpenAtom`) | Real panel is Plan 3.5 |
| cn-desktop screens | Out of scope (Plan 4) | cn-desktop repo not locally available; Plan 4 will require either cloning or fresh-design based on openhuman + uclaw patterns |

## 9. Next plans (post-Plan 3 family)

- **Plan 2b.2.c.4** — Full uclaw AgentView shell port (~7,000 LOC) — needs workspace atoms (now provided by 3.2) + permission/plan-mode atoms (need a separate small plan, OR fold into 3.5)
- **Plan 3.5** — App Shell: right panel + file preview + focus mode + real settings UI
- **Plan 4** — cn-desktop domain screens + real skill registry backend
- **Plan 7** — Packaging + distribution + bundle-size audit
