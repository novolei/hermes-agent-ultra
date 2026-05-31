# Preview Pane — PV.d Composite + Root + WorkspaceShell Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Preview pane sub-stack — verbatim-port the 6 composite/root preview components (PreviewEmpty/TabItem/TabBar/Header/Surface/Panel + the TabBar test) and the real `WorkspaceShell` that mounts `PreviewPanel`, then swap `workspace-shell-stub` → the real `WorkspaceShell`. After this PR the preview cluster is structurally complete and PreviewPanel is mounted inside `main-area`'s tree.

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. The real `WorkspaceShell` pulls in 3 not-yet-ported deps (`WelcomeView`, `HomeOfficeView`, `FocusModeButton`); each gets a trivial content-stub (the established deferred-cluster pattern) since all three take **no props**. `BrowserPanel` already has a stub (reuse). The remaining preview-reachability step — mounting `main-area` into `app-shell` (RightSidePanel etc., Plan 2b.2.c.4) — stays deferred.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps** (all preview deps installed in PV.a–c; the 6 root files + WorkspaceShell use only already-present libs: lucide-react, sonner, jotai, @tauri-apps/api/core).

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY the import paths per the retarget table, prepend a 1-line attribution comment (`// Ported verbatim from uclaw <relative source path> — Plan PV.d`).
- **Dest naming:** PascalCase → kebab (`PreviewPanel.tsx` → `preview-panel.tsx`, `WorkspaceShell.tsx` → `workspace-shell.tsx`). Dest dir for the 6 root files + test: `desktop/src/features/chat-agent/components/preview/`. WorkspaceShell → `desktop/src/features/chat-agent/components/workspace/workspace-shell.tsx`.
- **Content-stub pattern:** a deferred dep gets a minimal component rendering a `data-deferred-stub` marker, exporting the exact same symbol shape (default vs named) as the real one, accepting the same (here: zero) props.
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1116** tests pass. Every task keeps tsc at 19 and tests green; the ported TabBar test raises the count.
- **Verify-not-already-ported:** `ls` each dest before creating; if it exists, STOP and reconcile.
- **No new IPC stubs:** PreviewHeader's `invoke('reveal_path_in_file_manager')` is a raw `@tauri-apps/api/core` call (rejects naturally; production Rust impl later). No bridge stub.

### Retarget reference (confirmed against desktop)

| uclaw import | desktop retarget |
|---|---|
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `@/atoms/preview-panel-atoms` | `@/features/chat-agent/atoms/preview-panel-atoms` |
| `@/atoms/tab-atoms` | `@/features/chat-agent/atoms/tab-atoms` |
| `@/atoms/agent-atoms` | `@/features/chat-agent/atoms/agent-atoms` |
| `@/atoms/home-office-atoms` | `@/features/chat-agent/atoms/home-office-atoms` |
| `@/components/file-browser/FileTypeIcon` | `@/features/chat-agent/components/file-browser/file-type-icon` |
| `@/hooks/useWindowDragOnMove` | `@/features/chat-agent/hooks/use-window-drag-on-move` |
| `@/hooks/usePreviewRefresh` | `@/features/chat-agent/hooks/use-preview-refresh` |
| `@/components/preview/hooks/<x>` | `@/features/chat-agent/components/preview/hooks/<kebab>` |
| `./renderers/<X>` / `./editors/<X>` / `./PreviewHeader` etc. | same relative path, kebab-cased target |
| `@/components/browser/BrowserPanel` | `@/features/chat-agent/components/browser/browser-panel-stub` (existing stub) |
| `@/components/focus-mode/FocusModeButton` | `@/features/chat-agent/components/focus-mode/focus-mode-button-stub` (NEW stub, Wave A) |
| `@/views/WelcomeView` (default import) | `@/features/chat-agent/components/workspace/welcome-view-stub` (NEW stub, Wave A) |
| `@/components/home-office/HomeOfficeView` | `@/features/chat-agent/components/home-office/home-office-view-stub` (NEW stub, Wave A) |
| `@/components/tabs/TabBar` | `@/features/chat-agent/components/tabs/tab-bar` |
| `@/components/tabs/TabContent` | `@/features/chat-agent/components/tabs/tab-content` |
| `@/components/preview/PreviewPanel` | `@/features/chat-agent/components/preview/preview-panel` |
| `lucide-react`, `sonner`, `jotai`, `@tauri-apps/api/core` | unchanged |

---

## Wave A — Content-stubs for WorkspaceShell's 3 unported deps

### Task A1: Create focus-mode-button-stub, home-office-view-stub, welcome-view-stub

**Files (create):**
- `desktop/src/features/chat-agent/components/focus-mode/focus-mode-button-stub.tsx` — `export function FocusModeButton(): React.ReactElement` (named; PreviewHeader uses `<FocusModeButton />`, no props)
- `desktop/src/features/chat-agent/components/home-office/home-office-view-stub.tsx` — `export function HomeOfficeView(): React.ReactElement` (named; `<HomeOfficeView />`, no props)
- `desktop/src/features/chat-agent/components/workspace/welcome-view-stub.tsx` — `export default function WelcomeView(): React.ReactElement` (DEFAULT export; `<WelcomeView />`, no props)

- [ ] **Step 1:** Verify none exist. Create each as a minimal content-stub matching the established pattern, e.g.:

```tsx
// Content stub for uclaw <real path> — deferred to a later plan (Plan PV.d).
import * as React from 'react'

export function FocusModeButton(): React.ReactElement {
  return <span data-deferred-stub="focus-mode-button" hidden />
}
```

For `welcome-view-stub.tsx` use `export default function WelcomeView(...)` and `data-deferred-stub="welcome-view"`; for home-office use `export function HomeOfficeView(...)` and `data-deferred-stub="home-office-view"`. Each must export the EXACT symbol name + binding kind (default vs named) the consumer imports.

- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1116 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/focus-mode/focus-mode-button-stub.tsx desktop/src/features/chat-agent/components/home-office/home-office-view-stub.tsx desktop/src/features/chat-agent/components/workspace/welcome-view-stub.tsx
git commit -m "feat(desktop): add focus-mode-button / home-office-view / welcome-view content stubs for WorkspaceShell (PV.d Wave A1)"
git show --stat HEAD
```

---

## Wave B — Composite leaves (Empty / TabItem / TabBar + test)

### Task B1: Port preview-empty, preview-tab-item, preview-tab-bar (+ test)

**Files (create, under `desktop/src/features/chat-agent/components/preview/`):**
- `preview-empty.tsx` ← `PreviewEmpty.tsx` (97) — `cn`→`@/shared/lib/cn`; `lucide-react`
- `preview-tab-item.tsx` ← `PreviewTabItem.tsx` (90) — `cn`→`@/shared/lib/cn`; `PreviewTabItem` type from preview-panel-atoms; `FileTypeIcon`→`@/features/chat-agent/components/file-browser/file-type-icon`; `useWindowDragOnMove`→`@/features/chat-agent/hooks/use-window-drag-on-move`; `lucide-react`
- `preview-tab-bar.tsx` ← `PreviewTabBar.tsx` (41) — `./PreviewTabItem`→`./preview-tab-item`; atoms (`previewTabsAtom`, `activePreviewTabKeyAtom`, `closePreviewTabAction`, `previewTabKey`); `jotai`
- `preview-tab-bar.test.tsx` ← `PreviewTabBar.test.tsx` (111) — retarget its `./PreviewTabBar`→`./preview-tab-bar`; its `vi.mock('@/components/file-browser/FileTypeIcon')` → `vi.mock('@/features/chat-agent/components/file-browser/file-type-icon')`; atoms retarget

- [ ] **Step 1:** Verify none exist. Copy verbatim with retargets + attribution comments. Note the test mocks FileTypeIcon — retarget the mock path to the desktop module.
- [ ] **Step 2: Run the TabBar test** `npm test -- --reporter=dot preview-tab-bar 2>&1 | grep -E "Tests"` → all pass.
- [ ] **Step 3: Verify** tsc `19`; full suite green (record new total).
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/preview-empty.tsx desktop/src/features/chat-agent/components/preview/preview-tab-item.tsx desktop/src/features/chat-agent/components/preview/preview-tab-bar.tsx desktop/src/features/chat-agent/components/preview/preview-tab-bar.test.tsx
git commit -m "feat(desktop): port preview composite leaves — preview-empty/tab-item/tab-bar(+test) (PV.d Wave B1, verbatim)"
git show --stat HEAD
```

---

## Wave C — Header + Surface

### Task C1: Port preview-header, preview-surface

**Files (create, under `…/preview/`):**
- `preview-header.tsx` ← `PreviewHeader.tsx` (220) — `cn`→`@/shared/lib/cn`; atoms (`closePreviewAction`, `pendingWriteToolsAtom`, `PreviewFileTarget`); `FileTypeIcon`→desktop path; `FocusModeButton`→`@/features/chat-agent/components/focus-mode/focus-mode-button-stub`; raw `invoke('reveal_path_in_file_manager')`; `lucide-react`, `sonner`
- `preview-surface.tsx` ← `PreviewSurface.tsx` (121) — the dispatcher: `useFileBytes`/`usePreviewRouter` from `@/features/chat-agent/components/preview/hooks/*`; `usePreviewRefresh`→feature hook; `PreviewFileTarget` atom; `./PreviewEmpty`→`./preview-empty`; `./renderers/<X>`→`./renderers/<kebab>` (code/markdown/image/video/binary/pdf/docx/xlsx/pptx/legacy-office-hint + `./renderers/diff/diff-renderer`); `./editors/EditorSurface`→`./editors/editor-surface`, `./editors/WriteApprovalDialog`→`./editors/write-approval-dialog`

- [ ] **Step 1:** Verify neither exists. Copy verbatim, kebab-casing every relative renderer/editor import. Prepend attribution comments. (All renderer/editor/hook targets were ported in PV.a–c — verify each resolves.)
- [ ] **Step 2: Verify** tsc `19`; full suite green.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/preview-header.tsx desktop/src/features/chat-agent/components/preview/preview-surface.tsx
git commit -m "feat(desktop): port preview-header + preview-surface dispatcher (PV.d Wave C1, verbatim)"
git show --stat HEAD
```

---

## Wave D — Root PreviewPanel

### Task D1: Port preview-panel

**Files (create, under `…/preview/`):**
- `preview-panel.tsx` ← `PreviewPanel.tsx` (60) — `./PreviewHeader`→`./preview-header`, `./PreviewSurface`→`./preview-surface`, `./PreviewTabBar`→`./preview-tab-bar`; `usePreviewState` from `@/features/chat-agent/components/preview/hooks/use-preview-state`; atoms (`closePreviewAction`, `previewTabsAtom`, `activePreviewTabKeyAtom`, `previewTabKey`); `@/components/browser/BrowserPanel`→`@/features/chat-agent/components/browser/browser-panel-stub`; `jotai`

- [ ] **Step 1:** Verify it doesn't exist. Copy verbatim with retargets (note: BrowserPanel → the existing browser-panel-stub). Prepend attribution comment.
- [ ] **Step 2: Verify** tsc `19`; full suite green.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/preview-panel.tsx
git commit -m "feat(desktop): port root preview-panel (PV.d Wave D1, verbatim)"
git show --stat HEAD
```

---

## Wave E — Real WorkspaceShell + swap

> Ports the real `WorkspaceShell` (179 LOC) verbatim and swaps `workspace-shell-stub` → real in `main-area.tsx`, mounting `PreviewPanel` inside main-area's tree. `main-area` itself is not yet mounted in app-shell (deferred, Plan 2b.2.c.4) — so this is structural completion, not runtime visibility.

### Task E1: Port workspace-shell, swap main-area import, delete stub

**Files:**
- Create: `desktop/src/features/chat-agent/components/workspace/workspace-shell.tsx` ← uclaw `views/Workspace/WorkspaceShell.tsx` (179)
- Modify: `desktop/src/features/chat-agent/components/tabs/main-area.tsx`
- Delete: `desktop/src/features/chat-agent/components/workspace/workspace-shell-stub.tsx`

- [ ] **Step 1: Port `workspace-shell.tsx` verbatim.** Apply retargets: tab-atoms, preview-panel-atoms (`previewPanelOpenAtom`/`previewPanelSplitRatioAtom`/`clearAllPreviewTabsAction`), agent-atoms (`currentAgentWorkspaceIdAtom`), home-office-atoms; `PreviewPanel`→`./../preview/preview-panel` (i.e. `@/features/chat-agent/components/preview/preview-panel`); `WelcomeView`→`./welcome-view-stub` (default import); `TabBar`→`@/features/chat-agent/components/tabs/tab-bar`; `TabContent`→`@/features/chat-agent/components/tabs/tab-content`; `HomeOfficeView`→`@/features/chat-agent/components/home-office/home-office-view-stub`. Keep the body byte-faithful (including any `console.warn` debug lines uclaw has — verbatim). Prepend attribution comment.

- [ ] **Step 2: Swap `main-area.tsx` import.** Change line 13 from `workspace-shell-stub` → the real module:

```ts
import { WorkspaceShell } from '@/features/chat-agent/components/workspace/workspace-shell'
```

(Leave the `Panel` import on `panel-stub` untouched — Panel is a separate deferred stub, out of scope.)

- [ ] **Step 3: Delete the stub** `desktop/src/features/chat-agent/components/workspace/workspace-shell-stub.tsx`, then grep: `grep -rn "workspace-shell-stub" desktop/src` → no output.

- [ ] **Step 4: tsc gate** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.

- [ ] **Step 5: Full suite** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"`. Watch for unhandled rejections: the real WorkspaceShell mounts TabBar/TabContent/PreviewPanel; if any test that renders `main-area` (none currently exist) or a broad smoke surfaces a raw-Tauri rejection from the now-real tree, report it. Target: all pass, 0 NEW unhandled rejections beyond the 2 pre-existing `im-channels` ones. If a NON-trivial failure appears, STOP and report for adjudication.

- [ ] **Step 6: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds, no "Failed to resolve". (Now that WorkspaceShell→PreviewPanel→PreviewSurface→all renderers form a static graph, this is the first build where pdfjs/codemirror/tiptap/office-parser chunks actually enter the bundle — confirm no resolution failure.)

- [ ] **Step 7: Commit**

```bash
git add desktop/src/features/chat-agent/components/workspace/workspace-shell.tsx desktop/src/features/chat-agent/components/tabs/main-area.tsx desktop/src/features/chat-agent/components/workspace/workspace-shell-stub.tsx
git commit -m "feat(desktop): port real WorkspaceShell + swap workspace-shell-stub; mount PreviewPanel in main-area (PV.d Wave E1)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → 1116 + preview-tab-bar test count, 0 failing, no NEW unhandled rejections
- [ ] `npx vite build` → succeeds (the full preview render graph now bundles end-to-end)
- [ ] `grep -rn "workspace-shell-stub" desktop/src` → no output (stub removed)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc commit + 5 wave commits, all `(PV.d …)`
- [ ] Grep the 7 ported preview files + workspace-shell for stale imports: `grep -rn "@/lib/\|@/atoms/\|@/hooks/\|@/components/\(preview\|tabs\|browser\|focus-mode\|home-office\|file-browser\)\|@/views/" desktop/src/features/chat-agent/components/preview/*.tsx desktop/src/features/chat-agent/components/workspace/workspace-shell.tsx` — every hit must be a retargeted `@/features/...` or `@/shared/...` path; zero bare uclaw-style paths remain.

## Scope boundaries (NOT in PV.d)

- **`main-area` → `app-shell` wiring** (RightSidePanel, mounting the tab shell in the running app — Plan 2b.2.c.4) stays deferred. PreviewPanel is mounted inside `main-area`'s component tree but `main-area` is not yet rendered by `app-shell`, so the preview is not yet runtime-visible. This is the only remaining preview-reachability step.
- **Real WelcomeView / HomeOfficeView / FocusModeButton** — stubbed here; their real clusters are separate future ports.

## Carry-forwards (updated)

- **main-area → app-shell wiring** (Plan 2b.2.c.4) — now the single step to make preview runtime-visible.
- Git workbench cluster (~2,400 LOC); real WelcomeView, HomeOfficeView, FocusModeButton clusters; Rust backends for all accumulated chat/FB/settings/preview IPC stubs.
