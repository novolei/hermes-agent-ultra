# ADR: Hermes-Agent-Ultra Cross-Platform Desktop Framework & UI/UX Reuse Strategy

> Chinese equivalent: [DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md](./DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md)

## Status

Accepted (2026-05-28) — Architectural direction confirmed; implementation proceeds in phases (see "Implementation Path").

## Context

Hermes-Agent-Ultra is a **Rust-first** monorepo (17 crates, `workspace` version 0.14.2, edition 2021, MIT license). Its core is organized around mature trait contracts: `PlatformAdapter` / `LlmProvider` / `ToolHandler` / `MemoryProvider` / `SkillProvider` (see [crates/hermes-core/src/traits.rs](../../crates/hermes-core/src/traits.rs)). The repo already has:

- An Axum HTTP + WebSocket API server ([crates/hermes-http/src/lib.rs](../../crates/hermes-http/src/lib.rs), with an `HttpPlatformAdapter` bridging `AgentLoop`);
- A terminal UI (Rust Ratatui + a React/Ink layer, see [ui-tui/](../../ui-tui/));
- A dashboard plugin system (FastAPI + JS bundles).

**No desktop GUI exists yet** — this is greenfield. Goal: a beautiful, modern, **genuinely interactive, visual, easy-to-use** desktop app for macOS and Windows.

**Reference inputs for this ADR:**
- `hermes-agent-cn-desktop` (local, **also the user's own project**): a Chinese-language Hermes Agent desktop app, Tauri v2 + React 19, **sidecar-subprocess** architecture; its public license is PolyForm Noncommercial, but **since the user holds the copyright, its code can be reused directly at any time**.
- `uclaw` (local `/Users/ryanliu/Documents/uclaw`): **the user's own project**, an AI desktop coworker, Tauri v2 + React 18, **in-process embedded Rust core**, **Apache-2.0 license**.
- `openhuman` (local `/Users/ryanliu/Documents/openhuman`, **also the user's own project**): a Tauri v2 + React 19 + pure-Tailwind desktop app whose **Settings page UI/UX and primitives** serve as the direct reference and reuse source for this project's settings window.

**Pre-confirmed decisions:**
1. Integration = **embed the Rust core in-process** (direct `#[tauri::command]`, not a sidecar);
2. i18n = **bilingual en + zh from day 1**;
3. v1 scope = **broad parity (~14 screens)**, spined on uclaw's workspace + session + message-view;
4. Usage = **personal / non-commercial / not distributed**;
5. Frontend base = **uclaw, high-fidelity reuse** (base/soul); cn-desktop = **direct code source** for Hermes-domain screens (both are the user's own projects).

**New hard constraints added this round (explicit user requirements):**
- **A. Maximize reuse of uclaw's frontend** (it is the user's own work): preserve uclaw's frontend logic and UI/UX as much as possible; make the **Workspace + Session** concept the **guiding theme**; the **Agent message view must be replicated 1:1 ("pixel-for-pixel")** on top of Hermes Ultra's infrastructure.
- **B. No god file (backend *and* frontend)**: must avoid uclaw's **two** monolith anti-patterns — the backend `src-tauri/src/tauri_commands.rs` (**18,069 lines / ~120 commands**) and the frontend `ui/src/lib/tauri-bridge.ts` (**3000+ line bridge monolith**). Tauri commands, the frontend IPC bridge, and the overall UI/UX code must all be **strictly modularized, structured, and well-decoupled** by domain — never pile features into a single file.
- **C. Replicate the left-sidebar workspace management + ARC-browser-style workspace switching.**

## Decision

1. **Desktop framework** = **Tauri v2** + React + TypeScript + Vite. Ultra is Rust-first; Tauri's backend is itself Rust and can depend on Ultra's crates directly. System WebView yields a small ~15–30MB binary.

2. **Integration architecture** = **embed the Rust core in-process, zero sidecar, zero localhost port**. The Tauri backend depends on `hermes-agent` / `hermes-gateway` / `hermes-core`, calling `AgentLoop` directly via `#[tauri::command]`. Deliverable is **one signed binary**.

3. **Frontend base = uclaw, high-fidelity reuse** (Constraint A). Because uclaw is the user's own Apache-2.0 project, the reuse posture is raised from "design system + primitives" to **replicating uclaw's frontend logic and UI/UX as faithfully as possible**; the data layer is **re-pointed from uclaw's Tauri commands to Hermes Ultra's infrastructure** (mechanism in "Frontend-Contract Preservation + Anti-Corruption Layer").

4. **Guiding theme = uclaw's Workspace + Session paradigm** (Constraint A). Workspaces (with ARC-style switching) + sessions/tabs form the application spine, making it a genuinely interactive, visual, easy-to-use desktop app. Reuse the `WorkspaceInfo` / `WorkspaceSession` / `TabItem` data models and their Jotai atoms.

5. **Agent message view replicated 1:1** (Constraint A). The entire message-rendering stack is copied file-by-file, swapping only the data source — achieved via **frontend-contract preservation + a backend anti-corruption layer** (dedicated section).

6. **Replicate left-sidebar workspace management + ARC-style switching** (Constraint C). Copy `LeftSidebar`'s framer-motion `workspaceSlideVariants`, `useWorkspaceSwipe`, `workspaceSwitchDirectionAtom` / `swipeGestureAtom`, and `WorkspaceSwitcherBar`'s icon-density collapse logic (dedicated section).

7. **cn-desktop = direct code source for Hermes-domain screens** (also the user's own project, so its code can be reused directly). Because cn-desktop *is* a Hermes desktop app, its domain screens (skills / memory / cron / mcp / models / profiles / console / health / logs / analytics / IM onboarding) together with their TanStack Query hooks, data models, and API integration already encode the correct Hermes domain logic — **lift these screens and hooks directly**, then do two things: (a) re-point the data layer from its HTTP `api_request` to this project's Tauri commands / anti-corruption layer; (b) **unify the visuals onto uclaw's shadcn/Tailwind design language** (uclaw is the product soul and base). uclaw's app-shell remains the skeleton; these screens are embedded as tabs/routes.
    - **Reskin trade-off (to confirm)**: this ADR defaults to "unify reskin to shadcn" for visual consistency; a faster alternative is "drop in cn-desktop screens with their existing CSS Modules," but that leaves two styling systems coexisting, which conflicts with the "beautiful & unified" goal.

8. **Styling** = **Tailwind CSS + shadcn/ui (Radix)**, inherited with the uclaw base.

9. **State & data** = **Jotai** (client state, from uclaw) + **TanStack Query** (server-side lists/polling) + **Tauri events / Channels** (streaming tokens & tool activity).

10. **i18n** = **i18next + react-i18next**, default `en` + bundled `zh`, from day 1 (an upgrade over both references, which have none).

11. **Anti-god-file: strictly modular Tauri commands** (Constraint B). Split `commands/*.rs` by domain, with **thin commands** (parse args → call service → map result → emit event) + a **trait-based service layer** (anti-corruption, wrapping Hermes crates) + an **aggregating registration module**. Explicitly forbid replicating uclaw's 18K-line monolith (dedicated section).

12. **Type contract** = auto-generate frontend TS types from Rust via **`tauri-specta` / `ts-rs`** for type-safe command signatures across the boundary.

13. **Repo placement** = new top-level **`desktop/`**: `desktop/src-tauri/` (Rust, added to the Cargo workspace) + `desktop/ui/` (React + Vite, pnpm).

14. **Packaging** = macOS **universal DMG** (aarch64 + x86_64) + Windows **NSIS x64**; **`tauri-plugin-updater`** auto-update; macOS notarization + Windows Authenticode signing; extend the existing GitHub Actions matrix.

15. **Multi-theme system reuse** (user requirement): reuse uclaw's 11 themes (`.theme-{name}` CSS variables + `theme.ts` atoms + `applyThemeToDOM` + the `AppearanceSettings` picker), persisted to the desktop `ui_store`, surfaced as the settings window's Appearance page.

16. **Bottom Dock as mode/domain navigation**: reuse uclaw's `BottomDock` (auto-hide, hover-to-reveal, icon magnification, long-press drag-reorder, dynamic pinned items, `motion/react` springs) for high-frequency domains; **coexists** with the left sidebar (workspace/session) — left sidebar = spatial navigation, Dock = mode navigation.

17. **Dock vs. Settings domain split** (decided in this ADR): high-frequency interactive domains go on the Dock; low-frequency config/diagnostic domains go into the settings window (split in "Navigation IA").

18. **App Settings page based on openhuman**: reuse and reference openhuman's settings primitives and IA, **reskinned to shadcn + multi-theme tokens**; for desktop efficiency use a "left category nav + right content" two-pane layout; the Appearance page hosts the theme picker.

19. **Fully replicate the Agent view App Shell** (user requirement, per screenshot): the **right panel** (Files / Teams / Plan / Trajectory / Browser tabs), the Files tab's **workspace file tree / file changes / attached directories**, the **file preview panel** (with file/browser multi-tab paging), the **Focus mode** when a file is opened, and the chat-area **session tab bar** — all replicated 1:1; data sources re-pointed to Hermes (file I/O / file watching / artifact ops / `agent_stop` become this project's Tauri commands). If Ultra lacks a capability for the Teams/Plan/Browser tabs, hide them initially and wire later.

20. **Frontend is also forbidden from god files; modular/structured UI/UX code** (Constraint B extension): uclaw's `ui/src/lib/tauri-bridge.ts` (3000+ lines) and `tauri_commands.rs` (18,069 lines) are **both anti-patterns**. The frontend IPC bridge is split by domain (`lib/bridge/<domain>.ts` + a thin aggregator, types generated by `tauri-specta`), mirroring the backend `commands/<domain>.rs` one-to-one; the overall frontend uses a **feature-based module structure** (components/atoms/hooks/lib layered per domain, file-size caps, minimal public interface via `index.ts` barrels, no cross-feature deep imports).

## Rationale

### Why uclaw base + direct reuse of cn-desktop domain screens

1. **License**: uclaw and cn-desktop are **both the user's own projects**, so both can be reused as code directly; uclaw's Apache-2.0 is naturally compatible with Ultra's MIT. License is no longer the deciding factor for the base — the architecture and design factors below are.
2. **Architectural fit**: the user chose "embed directly." uclaw already *is* that (in-process `uclaw_core` + direct `invoke()`), zero impedance; cn-desktop's HTTP-proxy transport was designed for a sidecar, so reusing its screens requires re-pointing transport to Tauri commands.
3. **More beautiful, faster, richer components**: Tailwind + shadcn/ui; uclaw's ai-elements / app-shell / editors / hooks rate ~8.5/10 for reuse — established as the unified design language.
4. **It is the user's own work**: uclaw's workspace+session+message-view paradigm is exactly the product soul the user wants to carry forward; high-fidelity reuse saves effort and preserves design intent.

### cn-desktop's unique value (now directly reusable as code)

cn-desktop **is itself a Hermes desktop app** — its 14 screens map 1:1 to Ultra's backends. Since it is also the user's own project, it is promoted from "domain IA reference" to a **direct code source for Hermes-domain screens and domain logic (hooks / data models / API integration)** — lift its screens and hooks, re-point transport to Tauri commands, and reskin to uclaw's shadcn design language.

## Frontend-Contract Preservation + Anti-Corruption Layer (the core mechanism for 1:1 reuse)

To achieve a "pixel-for-pixel" message view, **keep the frontend largely untouched** and make the backend speak the frontend's language:

- **Preserve the frontend contract**: reuse uclaw's types (`AgentMessage` / `PrimaChatMessage` / `ContentBlock` / `ToolActivity` / `AgentStreamState`), atoms (the `applyAgentEvent()` pure function in `agent-atoms.ts`, `agentStreamingStatesAtom`, etc.), and the `agent:*` event names + payload shapes.
- **Backend anti-corruption layer**: in Ultra's Tauri command/service layer, use the **same `invoke` command names** and **same `agent:*` event payloads** to drive Hermes's `AgentLoop` / `SessionPersistence`. Hermes's internal types are translated to the uclaw frontend contract here; the frontend never perceives the difference.

### Hermes ↔ uclaw frontend-contract mapping

| uclaw frontend contract | Hermes Ultra infrastructure | Adapter note |
|---|---|---|
| `agent:text-delta` event | `AgentLoop` streaming `StreamChunk` (text delta) | Anti-corruption layer emits StreamChunk text deltas as `agent:text-delta` |
| `agent:thinking` / `agent:thinking-done` | reasoning/thinking deltas (e.g. Anthropic thinking) | Map if present, omit otherwise |
| `agent:tool-start` / `agent:tool-result` | `ToolHandler` execution start/result | Translate tool calls & results into `ToolActivity` payloads |
| `agent:turn_cost` | `hermes-telemetry` usage/token accounting | Map input/output/cache tokens, cost |
| `agent:done` / `agent:error` | turn completion/error | Finalize `AgentStreamState` |
| `ContentBlock` (text/thinking/tool_use/tool_result) | Hermes message content blocks | Pair tool_use ↔ tool_result in original order |
| `WorkspaceSession` (grouped by `spaceId`) | `SessionPersistence` sessions (SQLite+FTS5) | Session body comes from Hermes; desktop adds workspace membership + display metadata |
| `WorkspaceInfo` (workspace concept) | **Hermes has no native workspace concept** | **Workspace is a desktop-owned organizing layer**: create `workspaces` and `workspace_sessions` tables in the desktop SQLite, grouping Hermes sessions by workspace |

> Conclusion: workspace is a **new organizing layer on the desktop side**; the session body remains a Hermes session. This replicates uclaw's paradigm while landing on Ultra's real infrastructure.

## Reuse Manifest — uclaw (Apache-2.0) + cn-desktop (user-owned)

### From uclaw (Apache-2.0)

### Agent message view (1:1 replication target; copy whole directories)
- `ui/src/components/ai-elements/` — `message.tsx` (Message / MessageHeader / MessageContent / MessageResponse / MarkdownLink), `conversation.tsx` (auto-stick-to-bottom scroll container), `reasoning.tsx`, `scroll-minimap.tsx`, `provider-avatar.tsx`, `sticky-user-message.tsx`
- `ui/src/components/agent/` — `AgentMessages.tsx`, `NativeBlockRenderer.tsx` (renders ContentBlock[] in order, pairs tool_use↔tool_result), `ContentBlock.tsx` (collapsible ThinkingBlock), `ToolActivityItem.tsx`, `tool-renderers/` (bash / read / write / edit / screenshot / gbrain / collapsible / default result renderers), `TaskProgressCard.tsx`
- `ui/src/components/chat/` — `ChatMessageItem.tsx`, `ChatMessages.tsx`, `ChatToolBlock.tsx`, `ChatToolActivityIndicator.tsx`
- Types & state — `ui/src/lib/chat-types.ts`, `ui/src/lib/agent-types.ts`, `ui/src/atoms/chat-atoms.ts`, `ui/src/atoms/agent-atoms.ts` (incl. `applyAgentEvent()`)
- Rich rendering — react-markdown + remark-gfm + remarkPreserveBreaks; Shiki code highlighting; `FilePathChip` clickable file-path chips

### Workspace + Session spine
- State/types — `ui/src/atoms/workspace.ts` (`WorkspaceInfo` / `WorkspaceSession` + `workspacesAtom` / `activeWorkspaceIdAtom` / `workspaceSessionsAtom` / `selectWorkspaceAtom` / `reorderWorkspacesAtom`), `ui/src/atoms/tab-atoms.ts` (`TabItem` + per-workspace tab pool `visibleTabsAtom` / `activeTabIdAtom`), `ui/src/lib/workspace-icons.ts` (~56 lucide icons + `getWorkspaceIcon()`)
- Components — `ui/src/components/app-shell/LeftSidebar.tsx`, `ui/src/components/workspace/` (`WorkspaceSwitcherBar.tsx` / `WorkspaceHeader.tsx` / `WorkspaceRail.tsx` / `SessionItem.tsx` / `WorkspaceCreateDialog.tsx` / `IconPicker.tsx`)

> When reusing uclaw, **preserve its `LICENSE` / `NOTICE` attribution** (Apache-2.0 requirement).

### From cn-desktop (user-owned; direct reuse of Hermes-domain screens & logic)
- **Domain screens (lift structure + data wiring, then reskin to shadcn)**: `web/src/routes/` — `models` / `skills` / `memory` / `mcp` / `cron` / `console` / `health` / `logs` / `analytics` / `profiles` / `projects` / `im-onboarding` / `advanced`.
- **Domain hooks (encode the correct Hermes operations — highest value)**: `web/src/hooks/` — `use-sessions` / `use-profiles` / `use-memory` / `use-cron` / `use-gateway` (TanStack Query, originally against the Hermes dashboard REST) — **re-point to this project's Tauri commands to reuse their domain logic**.
- **Data contracts / parsing**: `packages/protocol/` (Zod schemas, `session-log` parsing).
- **Domain settings components & IM onboarding wizard**: `web/src/components/settings/`, the `im-onboarding` flow.
- **Status bar / health indicators**: `app-status-bar` (gateway health, model, tokens, context).

> Reuse rule: **keep cn-desktop's structure and domain logic/data wiring, but unify visuals to uclaw's shadcn/Tailwind**; switch transport from `api_request`-over-HTTP to this project's Tauri commands / anti-corruption layer.

## Left-sidebar workspace management + ARC-style switching (Constraint C, dedicated section)

Port uclaw's implementation verbatim and re-point it to Hermes:

- **Slide animation**: copy `LeftSidebar.tsx`'s framer-motion `workspaceSlideVariants` (`forward`: new panel enters from right +100%, old exits left −100%; `backward`: reversed; pure translate, same slot, parent `relative + overflow:hidden` clipping).
- **Gesture**: reuse `useWorkspaceSwipe` (writes `swipeGestureAtom` live: `offsetPx` / `containerWidth` / `previewWorkspaceId`) + the `GesturePreviewCard` shown during a swipe (icon + name + path preview).
- **Direction state**: `workspaceSwitchDirectionAtom` (`'forward' | 'backward'`) drives entry direction.
- **Icon density**: `WorkspaceSwitcherBar` — ≤5 workspaces show full 24px icons; >5 the active shows a full icon and the rest collapse to 6px dots; a `ResizeObserver` watches container width and flips smoothly.
- **Data re-pointing**: action atoms like `selectWorkspaceAtom` / `reorderWorkspacesAtom` now call the desktop-side `workspace` commands (persisting to the desktop SQLite) instead of uclaw's `set_active_workspace_id` backend.

## Navigation IA — Left Sidebar + Bottom Dock + Settings Window (dedicated section)

The app uses a three-layer navigation, each with a distinct job:

- **Left sidebar (ARC-style) = spatial navigation**: "which workspace, which session am I in" (workspace switching + session rail). See the previous section.
- **Bottom Dock (macOS-style) = mode/domain navigation**: "which high-frequency feature am I using." Reuse uclaw's `BottomDock` (auto-hide, hover-to-reveal at the bottom, icon magnification, long-press drag-reorder, dynamic pinned items, `motion/react` springs).
- **Settings window = low-frequency config/diagnostics**: opened from the Dock's gear item; hosts the less-used domains (see table).

### Dock vs. Settings domain split (decided in this ADR)

| On the **Bottom Dock** (high-frequency, interactive) | In the **Settings window** (low-frequency, config/diagnostics) |
|---|---|
| Chat / Agent workbench | Appearance (multi-theme + density + language) |
| Sessions (history) | Providers & Models (API keys, model routing) |
| Memory | MCP Servers |
| Skills | Scheduled Tasks (Cron) |
| Console (PTY terminal) | Integrations (IM onboarding / messaging channels) |
| ⚙ Settings (opens the settings window) | Profiles |
| + dynamic pinned sessions/workspaces | Diagnostics (Health / Logs / Analytics) |
| | Advanced (advanced/developer, runtime) |
| | About (version / auto-update) |

> Projects fold into the workspace concept (left sidebar), not a separate Dock mode, avoiding redundancy with workspaces.

**Reuse manifest (uclaw Dock)**: `components/dock/` (`BottomDock` / `BottomDockHoverRegion` / `DockItem` / `DockPinnedItem`), `hooks/useDockBounce.ts`, `hooks/useDockLiveness.ts`, `atoms/dock-atoms.ts`.
**Adaptation**: rebuild `MODE_REGISTRY` to map Dock modes to Hermes high-frequency domains (chat/agent/memory/skills/console/settings) and their click-navigation (switch tab/route); re-point `useDockBounce`'s "needs approval" signal to Ultra's tool-approval events; re-point `useDockLiveness`'s streaming/consolidating to `agent:*` streaming and memory state.

## Multi-theme system (reuse uclaw; requirement: reuse multi-theme)

Reuse uclaw's entire multi-theme system (very high portability, ~9/10):

- **Theme definitions**: `styles/globals.css` `@layer base` — each `.theme-{name}` class carries a full set of HSL CSS variables (`--background` / `--foreground` / `--primary` / …), with `.dark` overrides. 11 built-ins: `light` / `dark` / `ocean-light` / `ocean-dark` / `forest-light` / `forest-dark` / `slate-light` / `slate-dark` / `warm-paper` / `qingye` / `black` / `the-finals` (the-finals ships Saira/Poppins fonts + backgrounds).
- **State**: `atoms/theme.ts` — `themeModeAtom` (`light`|`dark`|`system`|`special`), `themeStyleAtom` (theme name), `systemIsDarkAtom`, derived `resolvedThemeAtom`.
- **Application**: `applyThemeToDOM()` toggles `.dark` and `.theme-{name}` classes on `<html>` (only one special theme at a time).
- **Picker UI**: `components/settings/AppearanceSettings.tsx` theme-card grid — surfaced as the settings window's **Appearance** page.
- **Persistence**: `themeMode` / `themeStyle` to localStorage + desktop `ui_store` (rusqlite, via a Tauri command); initialized by `ThemeInitializer` in `main.tsx`.
- **Adaptation**: re-point uclaw's `bridge.getSettings/patchSettings` to this project's `ui_store` commands; move fonts to `desktop/ui/public/themes/`. Hermes brand themes are added as new `.theme-hermes-*` within the same system.

## App Settings page design (based on openhuman, user-owned)

The settings window's approach and UI/UX **reuse and reference openhuman's settings page** (pure Tailwind, desktop-first, clean stone palette with card grouping, row/section primitives, danger zone, modal confirmations), **reskinned to this project's shadcn + multi-theme tokens**.

- **Reused primitives (openhuman, lift then reskin)**: `SettingsMenuItem` (row: icon + title + description + right control, supports `dangerous`), `SettingsHeader` (title + back + breadcrumbs), `PageBackButton`, `useSettingsNavigation` (navigation + auto breadcrumbs), `SettingsSectionPage` (section container); plus its form patterns (toggle rows, grouped cards, danger zone, modal confirmations).
- **Layout decision (for desktop efficiency)**: a **left category nav + right content pane** two-pane layout (classic desktop settings UX — all categories visible at once, fewer clicks), with openhuman's row/section primitives inside the content pane.
  - openhuman's native pattern is "flat list + breadcrumb drill-down"; this ADR switches to two-pane for desktop efficiency, **as a trade-off to confirm** (if you prefer a 1:1 replica of openhuman's flat+breadcrumb, say so to flip it).
- **Pages**: Appearance (theme/density/language), Providers & Models, MCP, Scheduled Tasks, Integrations, Profiles, Diagnostics (Health/Logs/Analytics), Advanced, About.
- **Data / persistence**: each page reads/writes via this project's Tauri commands (models/mcp/cron/profiles → their service; appearance → `ui_store`); reuse openhuman's "local buffer + explicit save / optimistic update" pattern.
- **Reuse manifest (openhuman, user-owned)**: `components/settings/` (`SettingsHome` / `SettingsSectionPage` / `components/SettingsMenuItem` / `SettingsHeader` / `PageBackButton`), `hooks/useSettingsNavigation.ts`, `pages/Settings.tsx` (route structure as a template).

## App Shell replication: Right Panel + File Preview + Focus Mode + Tab System (per screenshot, 1:1 replica)

The three-pane uclaw Agent view in the screenshot must be **fully replicated** here (data sources re-pointed to Hermes). Portability is **~70% pure UI reused directly, ~30% re-pointed Tauri commands**.

### Right panel (`RightSidePanel`, fixed ~400px, slides in/out, per-workspace active tab)

Five tabs `files | teams | plan | trajectory | browser` (`workspaceActiveRightPanelTabMapAtom` stores the active tab per workspace; a `plan:updated` event auto-switches to plan):

| Right-panel tab | uclaw component | Maps to Hermes |
|---|---|---|
| **Files** (workspace files) | `WorkspaceFilesView` → `FilesRail` | Read workspace/session/attached-dir file trees (new `files_service` commands) ✅ direct |
| **Trajectory** | `TrajectoryReel` | Agent step/tool timeline ← `agent:*` events / session trajectory ✅ good fit |
| **Plan** | `PlanViewer` | Agent plan/todo (wire if Ultra exposes it, else hide) ⚠ TBD |
| **Teams** | `AgentTeamsPanel` | Sub-agents / teammates (wire if Ultra is multi-agent, else hide) ⚠ TBD |
| **Browser** | `BrowserViewer` | Browser-tool view (wire if Ultra has a browser tool, else defer) ⚠ TBD |

### Files tab content (workspace files / file changes / attached directories)

- **Sub-tabs** `workspace files / file changes` (`filesRailTabAtom`).
- **File tree**: recursive `FileTreeNode` (lazy-loaded dirs, `FileTypeIcon`, `FileRowMenu` context menu), driven by `useFileTree` + `mountRootsAtomFamily` / `fileTreeAtomFamily` / `expandedPathsAtomFamily`; filesystem watch via `useFilesRailWatcher` (`files:changed:{mountId}` events).
- **Attached directories**: `AttachedDirRow` + `workspaceAttachedDirsMapAtom`; attach via `attachWorkspaceDirectory`.
- **File changes**: `FileChangesPanel` (a stub in uclaw) → wire to Hermes session-produced file changes / git status here.
- **Re-pointing**: `files_rail_list_mounts` / `files_rail_read_dir` / `files_rail_watch_*` → new `files_service` Tauri commands (session working dir + `notify` filesystem watching).

### File preview panel (`PreviewPanel`) + file/browser tab paging

- **Multi-tab pool**: `previewTabsAtom` + `activePreviewTabKeyAtom` (key = `mountId:relPath`); agent-source tabs cluster left (✨), manual-source right, re-opening the same file focuses the existing tab (`PreviewTabBar` / `PreviewTabItem`).
- **Type dispatch**: `PreviewSurface` + `usePreviewRouter` + `useFileBytes` → code (CodeMirror+Shiki) / markdown / diff / image / video / pdf (pdfjs) / docx (mammoth) / xlsx / pptx / fallback. Editable `EditorSurface` + dirty buffers `dirtyBuffersAtom` + write approval `WriteApprovalDialog`.
- **Horizontal split with chat**: `WorkspaceShell` splits chat/preview left-right, `previewPanelSplitRatioAtom` (localStorage, default 0.55), draggable divider.
- **Open triggers**: file-tree click → `openPreviewTabAction({source:'manual'})`; Shift+click → add to context attachments; agent writes a file → `useAutoPreview` auto-previews.
- **Re-pointing**: `preview_read_bytes` / `preview_resolve_path` → new Tauri commands.

### Focus mode (focused UI when a file is open; pure UI, very high portability)

- **Trigger**: Alt+F or opening the preview (`useFocusModeShortcut`); `focusModeAtom` global toggle.
- **Interaction**: when on, the right panel hides; as the mouse nears the left/right screen edge (glow fades in from 160px, peaks at 32px), at the 8px hot zone a **floating island** (`FloatingIsland`, 280px left / 400px right) slides in over 260ms cubic easing carrying LeftSidebar / RightSidePanel; leaving the edge by >32px hides it after 200ms; close the preview or press Esc to exit.
- **Implementation**: `FocusModeOverlay` + `FloatingIsland` + `GlowIndicator` (three-layer glow + Y-trace; mouse position written via ref directly to the DOM to avoid 60Hz re-renders) + `useFocusModeHotzone` (hot-zone state machine) + `lib/focus-mode-geometry.ts` (geometry constants + `isInsideIslandRect`) + `useFocusModeAutoExit`. Animation via framer-motion, easing `[0.32,0.72,0,1]` (consistent with Dock/TabBar/right panel).

### Chat-area session tab bar (`TabBar`) + tab model

- **Components**: `tabs/TabBar` (+`TabBarInner`), `TabBarItem` (type icon chat/agent/browser, streaming pulse dot, × close, middle-click close, hover → `TabPreviewPanel` minimap), `TabBarWorkspaceChip`; direction-aware slide on workspace switch (consistent with ARC).
- **Model**: `tab-atoms.ts` — `TabItem{ type:'chat'|'agent'|'browser'|'symphony', sessionId, title, workspaceId }`; `tabsAtom` (cross-workspace tab pool), `workspaceActiveTabIdMapAtom`, derived `visibleTabsAtom`/`activeTabIdAtom`/`activeTabAtom`, `tabMruAtom`, derived `tabStreamingMapAtom`/`tabIndicatorMapAtom`; helpers `openTab`/`closeTab`/`updateTabTitle`.
- **Content dispatch**: `TabContent` renders `ChatView`/`AgentView`/`BrowserPanel`/`SymphonyCanvas` by `type` (with `TabErrorBoundary`).
- **Close & sync**: `useCloseTab` (agent sessions `agent_stop` first, confirm if streaming); `TabSessionSyncer` syncs sessions↔tabs; `WorkspaceTabCleaner` cleans tabs when a workspace is deleted.
- **Re-pointing**: `agent_stop` etc. → Ultra commands; `AgentView`/`ChatView` consume the "frontend-contract preservation + anti-corruption layer" and `agent:*` streaming above.

**Reuse manifest**: `components/app-shell/RightSidePanel`, `components/agent/{SidePanel,TrajectoryReel,PlanViewer,AgentTeamsPanel,BrowserViewer}`, `components/files-rail/**`, `components/preview/**`, `components/focus-mode/**`, `components/tabs/**`, and related hooks/atoms (`preview-panel-atoms`/`preview-editor-atoms`/`files-rail-atoms`/`focus-mode-atoms`/`tab-atoms`).

## Modular architecture (Constraint B, anti-god-file on both backend and frontend, dedicated section)

### Backend: Tauri commands (Rust)

**Anti-pattern (twofold)**: uclaw's `src-tauri/src/tauri_commands.rs` (**18,069 lines / ~120 commands in one file**, a 300+ line `generate_handler!` in `main.rs`, inline business logic, no service boundary) **and** `ui/src/lib/tauri-bridge.ts` (**3000+ line frontend bridge monolith**) are **both god-file anti-patterns; neither may be replicated**. Backend discipline below; frontend discipline in the "Frontend modular architecture" section.

**Mandatory structure for the Ultra desktop** (`desktop/src-tauri/src/`):

```
src/
  main.rs                  # builder/window/setup only; stays minimal
  state.rs                 # AppState: Arc handles to Hermes services
  events.rs                # agent:* event payload structs + emit helpers
  services/                # trait-based service layer (anti-corruption; unit-testable without Tauri)
    mod.rs
    agent_service.rs       # wraps hermes-agent AgentLoop -> streaming
    session_service.rs     # wraps SessionPersistence
    workspace_service.rs   # desktop-owned workspace store (rusqlite) + session grouping
    model_service.rs       # hermes-config / hermes-intelligence
    skill_service.rs       # hermes-skills
    memory_service.rs      # MemoryProvider
    mcp_service.rs         # hermes-mcp
    cron_service.rs        # hermes-cron
    terminal_service.rs    # portable-pty
    diagnostics_service.rs # telemetry / doctor
  commands/                # thin #[tauri::command], one file per domain
    mod.rs                 # handlers() aggregator -> generate_handler!
    agent.rs   chat.rs   workspace.rs   session.rs   models.rs
    skills.rs  memory.rs  mcp.rs   cron.rs   terminal.rs
    diagnostics.rs   ui_store.rs
```

**Enforced discipline (recorded as acceptance criteria)**:
1. **One domain per command file**; soft cap ~400 lines per file, split when exceeded.
2. A command body does **only four things**: parse input → call service → map result/error → emit event. **No inline business logic.**
3. Business logic lives only in `services/` **trait implementations** (e.g. `trait WorkspaceService { fn list(); fn create(); ... }`), unit-testable without Tauri.
4. Registration is centralized in a `commands/mod.rs` aggregator; `main.rs` carries no long `generate_handler!` list.
5. The service layer is the anti-corruption layer: Hermes internal types are translated to the frontend contract (`agent:*`, `WorkspaceSession`, etc.) here.

## Frontend modular architecture (Constraint B extension: the frontend is anti-god-file too, dedicated section)

uclaw's `ui/src/lib/tauri-bridge.ts` (3000+ lines) is the **frontend god-file anti-pattern**; this project's frontend must be modular, structured, and maintainable.

### Frontend IPC bridge (mirrors backend `commands/`, anti `tauri-bridge.ts` monolith)

```
desktop/ui/src/lib/bridge/
  index.ts        # thin aggregation / re-export, no logic
  client.ts       # thin invoke/listen wrapper + error normalization
  agent.ts  chat.ts  workspace.ts  session.ts  models.ts
  skills.ts memory.ts mcp.ts cron.ts terminal.ts
  files.ts  preview.ts  diagnostics.ts  ui-store.ts
  events.ts       # agent:* etc. event-subscription factories
```

Rules: **one domain per file**, one-to-one with backend `commands/<domain>.rs`; types are **generated** by `tauri-specta`/`ts-rs` (no hand-copied command names); **no `tauri-bridge.ts`-style mega file allowed**.

### Overall frontend structure (feature-based)

```
desktop/ui/src/
  app/                 # routing / shell assembly (minimal)
  shared/
    ui/                # shadcn primitives (design system)
    lib/               # generic utilities
    theme/             # multi-theme (globals.css theme layer + theme atoms)
    i18n/              # i18next + en/zh
  lib/bridge/          # see above (IPC bridge, per domain)
  features/<domain>/   # self-contained per domain: components/ hooks/ atoms/ lib/ index.ts
    chat-agent/        # message view: ai-elements + agent + chat stack
    workspace/         # ARC sidebar + session/tab
    dock/              # bottom Dock
    files/  preview/  focus-mode/  settings/  trajectory/  …
```

**Frontend discipline (recorded as acceptance criteria)**:
1. **Feature self-containment**: each `features/<domain>/` owns its components/hooks/atoms/lib and exposes a **minimal public interface** via an `index.ts` barrel; **no cross-feature deep imports** of another feature's internals (go through its `index.ts` only).
2. **File-size caps**: components ≤ ~300 lines, hook/atom modules ≤ ~200 lines, a bridge domain ≤ ~200 lines; split when exceeded.
3. **Separation of concerns**: presentational components never call `invoke` directly; data access goes through `lib/bridge/*` + hooks (TanStack Query / Jotai); side effects concentrate in hooks.
4. **Shared only sinks down**: cross-feature reusables live in `shared/`, with no horizontal feature-to-feature dependencies.
5. **Single bridge entry**: all IPC goes through `lib/bridge/`; components/atoms never touch `@tauri-apps/api` directly.

> When reusing uclaw components, **re-file them into this structure** (uclaw's `tauri-bridge.ts` call sites become fine-grained functions in `lib/bridge/<domain>`), rather than lifting its bridge as one file.

## Alternatives Considered

### A. Desktop integration architecture

| Option | Pros | Cons | ROI |
|---|---|---|---|
| **In-process embed (chosen)** | Single ~15–30MB binary; no sidecar/port; reuses Ultra crates and uclaw frontend; native perf | Must build the command/streaming bridge; per-OS WebView quirks | **Highest** |
| Sidecar + HTTP/WS (cn-desktop model) | Decouples app/core versions | Subprocess + port mgmt; runtime download/verify complexity; redundant for a Rust shell | Medium |
| Electron + HTTP client | Huge ecosystem | 100MB+; bundled Chromium; still needs a sidecar; abandons Rust-first | Low |
| Native Rust GUI (egui/Dioxus/Slint) | Pure Rust | Can't reuse uclaw UI; weak rich text; far from "beautiful" | Low |

### B. Frontend base

| Option | Pros | Cons | ROI |
|---|---|---|---|
| **uclaw high-fidelity reuse (chosen)** | Apache-2.0; embed-aligned arch; Tailwind+shadcn beauty; workspace+session+message-view ready; the user's own work | Different product domain — some domain atoms/views need re-pointing; large codebase to trim | **Highest** |
| cn-desktop as the whole base | Domain-aligned | Sidecar transport mismatches embed; weaker CSS-Modules ecosystem than shadcn; abandons uclaw's workspace/session soul | Lower |
| Greenfield | Cleanest | Most effort; discards uclaw's ready-made paradigm | Medium |

> **Update (2026-05-28)**: cn-desktop is also the user's own project and is **no longer license-constrained**. Final strategy = **uclaw as base/soul (unified shadcn design language) + cn-desktop as a direct code source for Hermes-domain screens (re-point transport + reskin)**; both are reused as code directly.

### C. Message-view reuse approach

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Preserve frontend contract + backend anti-corruption layer (chosen)** | Frontend stays 1:1; translation centralized in Rust services; satisfies "pixel-for-pixel" | Must write mapping in Rust; Hermes lacks workspace concept (needs desktop store) | **Adopted** |
| Rewrite the frontend data layer to fit Hermes's native API | Zero backend adaptation | Major frontend churn; violates "pixel-for-pixel" | No |

## License Considerations

| Project | License | Impact |
|---|---|---|
| **Ultra (this repo)** | MIT | Keep clean |
| **uclaw** | **Apache-2.0** | ✅ Code reusable (incl. commercial); preserve copyright/NOTICE; MIT-compatible |
| **cn-desktop** | PolyForm Noncommercial 1.0.0 (**but user-owned copyright**) | ✅ As the copyright holder, the user may reuse its code directly at any time. Note: if the Ultra repo is a public MIT repo, merging this effectively re-licenses that portion as MIT — which the owner is entitled to do, but should do knowingly. |

**Decision**: uclaw and cn-desktop are **both the user's own projects**; both can be reused as code directly with no license barrier. Reusing uclaw must retain its `LICENSE` / `NOTICE` (Apache-2.0 requirement); cn-desktop, as the user's own code, can be lifted directly. If the Ultra repo is ever made public, note the re-licensing effect in the table above.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  desktop/ui  (React + Vite + Tailwind + shadcn/ui)                 │
│   ├─ high-fidelity reuse from uclaw:                               │
│   │    • Workspace+Session spine (workspace.ts / tab-atoms.ts)     │
│   │    • LeftSidebar + ARC switching (framer-motion/useWorkspaceSwipe)│
│   │    • full Agent message view (ai-elements/ + agent/ + chat/)    │
│   ├─ i18next (en + zh)                                             │
│   ├─ Jotai (client) + TanStack Query (lists/polling)               │
│   └─ lib/bridge.ts  (types via tauri-specta; preserves agent:* contract)│
└───────────────┬────────────────────────────────┬───────────────────┘
   invoke(cmd)   │                                │  listen('agent:*') / Channel
                 ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│  desktop/src-tauri  (Rust, Tauri v2)                               │
│   commands/*.rs  (thin, one file per domain)                       │
│        │ calls                                                     │
│   services/*.rs  (trait service layer = anti-corruption: Hermes → uclaw contract)│
└───────────────┬────────────────────────────────┬───────────────────┘
                ▼                                ▼
   hermes-agent (AgentLoop, SessionPersistence)   hermes-gateway
   hermes-config / -intelligence / -skills / -mcp / -cron / -telemetry
   + desktop-owned: workspaces / workspace_sessions (rusqlite)
```

## v1 Screen Map (broad parity; spine = uclaw workspace+session+message-view)

> Navigation placement (Dock high-frequency / Settings low-frequency) is in the "Navigation IA" section; the table below focuses on each screen's mapping to an Ultra backend.

| Screen | Ultra backend (exists) | UI source |
|---|---|---|
| **Chat / Agent workbench (message view, 1:1 replica)** | `AgentLoop` streaming | **uclaw ai-elements/ + agent/** |
| **Left-sidebar workspace switch (ARC-style)** | desktop-owned workspace store + `SessionPersistence` | **uclaw LeftSidebar + workspace/** |
| Session history / detail | `SessionPersistence` | uclaw + cn-desktop direct reuse (re-point + reskin) |
| Models / providers | `hermes-config` / `hermes-intelligence` | shadcn forms |
| Skills | `hermes-skills` | cn-desktop direct reuse (re-point + reskin) |
| Memory | `MemoryProvider` | uclaw memory patterns |
| MCP servers | `hermes-mcp` | cn-desktop direct reuse (re-point + reskin) |
| Cron | `hermes-cron` | cn-desktop direct reuse (re-point + reskin) |
| Console (PTY) | `portable-pty` (new command) | xterm.js |
| Health / Logs / Analytics | `hermes-telemetry` / doctor | recharts |
| Projects / Profiles / Advanced | `hermes-config` | uclaw shell |

## Implementation Path

- **Phase 0 — Legal & extraction boundary**: preserve uclaw `LICENSE`/`NOTICE`; define "whole-directory reuse" (ai-elements/agent/chat message stack, workspace/ + app-shell/LeftSidebar, `workspace.ts`/`tab-atoms.ts`/`agent-atoms.ts`/`chat-atoms.ts`, build/style config) vs "needs re-pointing" (data source from uclaw commands → Hermes anti-corruption layer).

- **Phase 1 — Scaffold `desktop/`**: create the Tauri v2 app; add `desktop/src-tauri` to the Cargo workspace; port uclaw build/style/shadcn config; wire i18next (en + zh); **establish the `commands/` + `services/` module skeleton and discipline first** (Constraint B).

- **Phase 2 — Replicate navigation spine (left sidebar + Dock) + multi-theme** (Constraints A/C + multi-theme): copy whole directories `app-shell/LeftSidebar`, `workspace/`, `workspace.ts`/`tab-atoms.ts`/`workspace-icons.ts`, wire `workspace_service`, verify ARC slide/gesture/icon-density; **reuse uclaw's bottom Dock** (`components/dock/` + `dock-atoms`), rebuild `MODE_REGISTRY` for Hermes high-frequency domains; **reuse uclaw's multi-theme system** (`globals.css` theme layer + `theme.ts` + `applyThemeToDOM` + `AppearanceSettings`), with `ThemeInitializer` wired to `ui_store`.

- **Phase 3 — Anti-corruption layer & 1:1 message view** (Constraint A): implement `agent_service` / `session_service`, driving `AgentLoop`/`SessionPersistence` via `agent:*` events + identical command names; copy whole directories `ai-elements/`+`agent/`+`chat/` plus `agent-atoms.ts`; get streaming rendering working end-to-end (text-delta/thinking/tool-start/tool-result/turn_cost/done).

- **Phase 3.5 — App Shell replication (right panel + preview + Focus + tab bar)**: copy whole directories `components/app-shell/RightSidePanel`, `files-rail/**`, `preview/**`, `focus-mode/**`, `tabs/**` and related atoms; re-point file I/O / watching / artifact ops / `agent_stop` to new `files_service` etc. Tauri commands; land Files + Trajectory in the right panel first (Teams/Plan/Browser wired or hidden per Ultra capability).

- **Phase 4 — Directly reuse cn-desktop's Hermes-domain screens**: lift the `web/src/routes/` domain screens and `web/src/hooks/` domain hooks (models/skills/memory/mcp/cron/console/health/logs/analytics/profiles/im-onboarding), (a) **re-point** their data layer from `api_request`-over-HTTP to this project's Tauri commands / anti-corruption layer, and (b) **reskin to shadcn/Tailwind** to unify with the uclaw shell; embed as tabs/routes. Keep TanStack Query for lists/polling.

- **Phase 4.5 — App Settings window (based on openhuman)**: lift openhuman's `SettingsMenuItem` / `SettingsHeader` / `PageBackButton` / `useSettingsNavigation` / `SettingsSectionPage` primitives and reskin to shadcn; two-pane layout (left category nav + right content); land the low-frequency config/diagnostic pages (Appearance/Providers&Models/MCP/Cron/Integrations/Profiles/Diagnostics/Advanced/About), data via each Tauri service / `ui_store`.

- **Phase 5 — i18n / theme branding / visuals**: extract strings to `en.json`+`zh.json`, CJK typography; add Hermes brand themes (`.theme-hermes-*`) on top of the reused multi-theme system; do detailed visuals in a separate design pass (design-consultation / design-shotgun).

- **Phase 6 — Packaging & distribution**: macOS universal DMG + Windows NSIS; `tauri-plugin-updater`; signing/notarization; extend GitHub Actions.

## Consequences

**Positive**
- Single binary, no sidecar/port, no runtime download/verify — simpler ops & distribution.
- High-fidelity reuse of uclaw (incl. the workspace+session+message-view paradigm), saving an estimated ~60–70% of frontend effort while preserving the user's design intent.
- Reuses Ultra's existing backends; the dominant remaining work is the anti-corruption layer + command modularization + i18n + domain screens, not new agent functionality.
- **cn-desktop's domain screens and hooks are directly reusable** (also the user's own project); since they already wire to Hermes's domain logic (sessions/skills/memory/cron/mcp/models/IM onboarding), rebuilding from scratch is avoided — mainly "re-point transport + reskin" remains.
- **Multi-theme system, bottom Dock, and settings page are all highly reusable** (uclaw themes/Dock + openhuman settings primitives, all user-owned), sparing in-house navigation, theming, and settings-framework work.
- Strict command modularization + trait service layer avoids a god file from the start, improving testability and maintainability.
- Clean licensing; no rework needed if commercialized later.

**Negative / Cost**
- uclaw is large (458 TSX / ~338 atoms); requires trimming and domain-neutralization.
- The anti-corruption layer requires writing the Hermes ↔ uclaw contract mapping in Rust; the workspace concept needs a new desktop-side store.
- The command/streaming bridge is built from scratch: uclaw's `tauri-bridge.ts` (3000+ lines) and `tauri_commands.rs` (18K lines) are **both god-file anti-patterns** — reference for functionality only, rewritten per domain, not copied; reused uclaw components must also be re-filed into the feature-based structure.
- Reskinning cn-desktop's domain screens to shadcn costs extra effort (CSS Modules → Tailwind/shadcn); their hooks' transport must be re-pointed from HTTP to Tauri commands.

**Risks**
- Per-OS WebView rendering differences — needs dual-platform QA.
- Fine-grained alignment of `agent:*` events with Hermes streaming semantics (20+ event types: thinking/tool/retry/compact, etc.) must be reconciled item by item.
- The effort to re-point domain atoms is easy to underestimate — discipline: "reuse rendering, re-point data."

## Follow-up / Acceptance Criteria

- [ ] `desktop/` produces a runnable artifact via `tauri build` on both macOS and Windows.
- [ ] **Agent message view matches uclaw's visuals/interactions** (streaming text-delta, collapsible thinking, tool-start/result, turn_cost), with Hermes as the data source.
- [ ] **Left-sidebar workspace management + ARC-style switching** replicated (slide direction, gesture preview, >5 icon collapse).
- [ ] **Bottom Dock** replicated (hover-reveal, magnification, drag-reorder, pinned), with `MODE_REGISTRY` mapped to Hermes high-frequency domains.
- [ ] **Multi-theme system** reused (light/dark/system + uclaw named themes switchable and persisted to `ui_store`).
- [ ] **App Settings window** (built on openhuman primitives, reskinned to shadcn, two-pane layout) hosts the low-frequency config/diagnostic pages; the Appearance page contains the theme picker.
- [ ] **Right panel** five-tab frame in place (Files + Trajectory functional; Teams/Plan/Browser wired or hidden per Ultra capability), active tab remembered per workspace.
- [ ] **Files tab**: workspace file tree (lazy-load/icons/context-menu), file changes, and attached directories functional; filesystem changes refresh live.
- [ ] **File preview panel**: multi-type rendering (code/md/image/pdf/diff…), file multi-tab paging, draggable split with the chat area; agent file writes auto-preview.
- [ ] **Focus mode** replicated (Alt+F, edge glow, floating island slide-in/hide, Esc to exit).
- [ ] **Chat-area session tab bar** replicated (type icons, streaming indicator, hover minimap, close confirmation, workspace-switch slide).
- [ ] Workspace is a desktop-side store; session body comes from `SessionPersistence`; grouping is correct.
- [ ] **No god file (backend)**: one domain per command file, no business logic in command bodies, logic lives in trait services, no long `generate_handler!` in `main.rs`.
- [ ] **No god file (frontend)**: no `tauri-bridge.ts`-style monolith; IPC bridge `lib/bridge/<domain>` mirrors the backend one-to-one; frontend organized as `features/<domain>` with `index.ts`-exposed interfaces, no cross-feature deep imports, files within size caps.
- [ ] All 14 screens have placeholder routes; core screens (chat/agent, workspace, sessions, models, skills) are functional.
- [ ] No hardcoded UI strings; `en`/`zh` switchable and persisted.
- [ ] Files reused from uclaw retain Apache-2.0 attribution; domain screens reused from cn-desktop are **re-pointed to Tauri commands and reskinned to shadcn** (visually unified with the uclaw shell).
- [ ] CI produces a macOS universal DMG and a Windows NSIS installer; auto-update wired.

## Note

This ADR has a Chinese counterpart: [DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md](./DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md). Next, the superpowers `writing-plans` skill can decompose this ADR into an executable implementation plan.
