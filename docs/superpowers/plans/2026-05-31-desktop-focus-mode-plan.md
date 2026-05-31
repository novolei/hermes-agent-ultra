# App-Shell Stubs — AS.a Focus Mode Cluster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbatim-port the **Focus Mode cluster** — `FocusModeOverlay` + `FloatingIsland` + `GlowIndicator` + `FocusModeButton` + 2 hooks (`useFocusModeHotzone`, `useFocusModeAutoExit`) + `focus-mode-geometry` — then **mount `FocusModeOverlay` in app-shell** and **swap the `focus-mode-button-stub`** (consumed by PreviewHeader) for the real button. First PR of the app-shell quick-wins sub-stack (AS.a Focus Mode → AS.b WelcomeView).

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. The `focus-mode-atoms` are already ported (app-shell wiring PR); all 6 atoms the cluster needs exist. No new third-party deps (motion/lucide-react/jotai present). `FocusModeOverlay` renders `null` when `focusModeAtom === false` (default), so mounting it in app-shell is inert until the user enters focus mode.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. **No new third-party deps. No new IPC stubs** (focus mode is pure local atom state + DOM mouse tracking).

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY import paths per the retarget table, prepend `// Ported verbatim from uclaw <relative source path> — Plan AS.a`.
- **Dest naming:** PascalCase → kebab. Dest dirs: components → `desktop/src/features/chat-agent/components/focus-mode/`; hooks → `desktop/src/features/chat-agent/hooks/`; geometry → `desktop/src/features/chat-agent/lib/focus-mode-geometry.ts`.
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **Baseline:** tsc **19** pre-existing errors; **1139** tests pass. Waves A/B keep tsc 19 + tests green (the ported tests add to the count). Wave C (mount + swap) commits app-shell + preview-header + stub deletion together (green).
- **Verify-not-already-ported:** `ls` each dest before creating (confirmed absent at plan time).
- **Inline `renderWithProviders` shim** (desktop has no `@/test-utils/render`): replace `import { renderWithProviders, screen } from '@/test-utils/render'` with `import { render, screen } from '@testing-library/react'` + `function renderWithProviders(ui, opts?) { return render(<Provider store={opts?.store}><TooltipProvider>{ui}</TooltipProvider></Provider>) }` (import `Provider` from `jotai`, `TooltipProvider` from `@/shared/ui/tooltip`).

### Retarget reference (confirmed)

| uclaw import | desktop retarget |
|---|---|
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `@/lib/focus-mode-geometry` | `@/features/chat-agent/lib/focus-mode-geometry` |
| `@/atoms/focus-mode-atoms` | `@/features/chat-agent/atoms/focus-mode-atoms` |
| `@/atoms/preview-panel-atoms` | `@/features/chat-agent/atoms/preview-panel-atoms` |
| `@/atoms/app-mode` | `@/features/chat-agent/atoms/app-mode` |
| `@/atoms/agent-atoms` | `@/features/chat-agent/atoms/agent-atoms` |
| `@/hooks/useFocusModeHotzone` | `@/features/chat-agent/hooks/use-focus-mode-hotzone` |
| `@/hooks/useFocusModeAutoExit` | `@/features/chat-agent/hooks/use-focus-mode-auto-exit` |
| `@/components/app-shell/LeftSidebar` | `@/features/chat-agent/components/app-shell/left-sidebar` |
| `@/components/app-shell/RightSidePanel` | `@/features/chat-agent/components/app-shell/right-side-panel` |
| `./FloatingIsland` / `./GlowIndicator` | `./floating-island` / `./glow-indicator` |
| `@/test-utils/render` (tests) | inline `renderWithProviders` shim (above) |
| `motion/react`, `lucide-react`, `jotai` | unchanged |

---

## Wave A — Geometry + hooks (leaves)

### Task A1: Port focus-mode-geometry + the 2 hooks (+ their tests)

**Files (create):**
- `lib/focus-mode-geometry.ts` ← uclaw `lib/focus-mode-geometry.ts` (47 LOC) — pure constants (`ISLAND_LEFT_WIDTH`, `ISLAND_RIGHT_WIDTH`, `ISLAND_EDGE_GAP`, `TOP_EXCLUDE`, `HOT_ZONE_WIDTH`) + `isInsideIslandRect` helper. No imports → attribution comment only.
- `hooks/use-focus-mode-hotzone.ts` ← uclaw `hooks/useFocusModeHotzone.ts` (114 LOC) — atoms (focusModeAtom/focusRevealSideAtom/focusRevealPinnedAtom/focusMousePosAtom) + geometry (isInsideIslandRect/HOT_ZONE_WIDTH/TOP_EXCLUDE).
- `hooks/use-focus-mode-hotzone.test.ts` ← `useFocusModeHotzone.test.ts` — retarget atom/geometry imports + any `@/test-utils/render`.
- `hooks/use-focus-mode-auto-exit.ts` ← uclaw `hooks/useFocusModeAutoExit.ts` (27 LOC) — atoms (focusModeAtom/exitFocusModeAction) + previewPanelOpenAtom.
- `hooks/use-focus-mode-auto-exit.test.ts` ← `useFocusModeAutoExit.test.ts` — retarget imports.

- [ ] **Step 1:** Verify none exist. Copy all 5 verbatim with retargets. Prepend attribution comments to source files.
- [ ] **Step 2: Run the 2 hook tests** `npm test -- --reporter=dot use-focus-mode-hotzone use-focus-mode-auto-exit 2>&1 | grep -E "Tests"` → all pass.
- [ ] **Step 3: Verify** tsc `19`; full suite green (record new total).
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/lib/focus-mode-geometry.ts desktop/src/features/chat-agent/hooks/use-focus-mode-hotzone.ts desktop/src/features/chat-agent/hooks/use-focus-mode-hotzone.test.ts desktop/src/features/chat-agent/hooks/use-focus-mode-auto-exit.ts desktop/src/features/chat-agent/hooks/use-focus-mode-auto-exit.test.ts
git commit -m "feat(desktop): port focus-mode-geometry + useFocusModeHotzone/AutoExit hooks (AS.a Wave A1, verbatim)"
git show --stat HEAD
```

## Wave B — Components + tests

### Task B1: Port glow-indicator, floating-island, focus-mode-button, focus-mode-overlay (+ tests)

**Files (create, under `desktop/src/features/chat-agent/components/focus-mode/`):**
- `glow-indicator.tsx` ← `GlowIndicator.tsx` (81) — motion, cn, atoms (focusRevealSideAtom/focusMousePosAtom). + `glow-indicator.test.tsx`.
- `floating-island.tsx` ← `FloatingIsland.tsx` (79) — motion, cn, atom (focusRevealSideAtom), geometry (ISLAND_EDGE_GAP/ISLAND_LEFT_WIDTH/ISLAND_RIGHT_WIDTH). + `floating-island.test.tsx`.
- `focus-mode-button.tsx` ← `FocusModeButton.tsx` (40) — lucide, cn, atoms (focusModeAtom/toggleFocusModeAction). + `focus-mode-button.test.tsx`.
- `focus-mode-overlay.tsx` ← `FocusModeOverlay.tsx` (62) — atoms (focusMode/previewPanelOpen/appMode/currentAgentSessionId), `./use-focus-mode-hotzone`→`@/features/chat-agent/hooks/use-focus-mode-hotzone`, `./use-focus-mode-auto-exit`, LeftSidebar→`@/features/chat-agent/components/app-shell/left-sidebar`, RightSidePanel→`@/features/chat-agent/components/app-shell/right-side-panel`, `./floating-island`, `./glow-indicator`. + `focus-mode-overlay.test.tsx`.

- [ ] **Step 1:** Verify none exist. Copy all 8 verbatim with the retarget table (incl. the `renderWithProviders` shim in each `.test.tsx`). Prepend attribution comments to the 4 source files. (Port glow/island/button first — overlay imports island+glow.)
- [ ] **Step 2: Run the 4 component tests** `npm test -- --reporter=dot glow-indicator floating-island focus-mode-button focus-mode-overlay 2>&1 | grep -E "Tests"` → all pass (they assert testids like `focus-glow-left`).
- [ ] **Step 3: Verify** tsc `19`; full suite green (record new total).
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/focus-mode/glow-indicator.tsx desktop/src/features/chat-agent/components/focus-mode/glow-indicator.test.tsx desktop/src/features/chat-agent/components/focus-mode/floating-island.tsx desktop/src/features/chat-agent/components/focus-mode/floating-island.test.tsx desktop/src/features/chat-agent/components/focus-mode/focus-mode-button.tsx desktop/src/features/chat-agent/components/focus-mode/focus-mode-button.test.tsx desktop/src/features/chat-agent/components/focus-mode/focus-mode-overlay.tsx desktop/src/features/chat-agent/components/focus-mode/focus-mode-overlay.test.tsx
git commit -m "feat(desktop): port focus-mode components — overlay/floating-island/glow/button + tests (AS.a Wave B1, verbatim)"
git show --stat HEAD
```

## Wave C — Mount overlay + swap button stub

> Mounts `FocusModeOverlay` at the app-shell root (renders `null` when `focusModeAtom` is false — default — so inert in existing tests) and swaps PreviewHeader's `FocusModeButton` import from the stub → real, then deletes the stub.

### Task C1: Mount FocusModeOverlay, swap PreviewHeader import, delete button stub

**Files:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx`
- Modify: `desktop/src/features/chat-agent/components/preview/preview-header.tsx`
- Delete: `desktop/src/features/chat-agent/components/focus-mode/focus-mode-button-stub.tsx`

- [ ] **Step 1: Mount FocusModeOverlay in `app-shell.tsx`.** Add `import { FocusModeOverlay } from '@/features/chat-agent/components/focus-mode/focus-mode-overlay'` and render `<FocusModeOverlay />` at the app-shell root alongside the other always-mounted overlays (after `<SettingsDialog />`). Update the file's top doc-comment (FocusModeOverlay is no longer deferred). The overlay reads `focusModeAtom` and returns `null` when off, so it's inert by default.
- [ ] **Step 2: Swap PreviewHeader's button import.** In `preview-header.tsx`, change the `FocusModeButton` import from `'@/features/chat-agent/components/focus-mode/focus-mode-button-stub'` → `'@/features/chat-agent/components/focus-mode/focus-mode-button'` (usage unchanged).
- [ ] **Step 3: Delete the stub** `focus-mode-button-stub.tsx`, then grep: `grep -rn "focus-mode-button-stub" desktop/src` → no output.
- [ ] **Step 4: tsc gate** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.
- [ ] **Step 5: Full suite** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → all pass. Scan for "Unhandled"/"transformCallback": only the 2 pre-existing `channels/statuses is not iterable` allowed.
  - Note: mounting FocusModeOverlay runs `useFocusModeHotzone` + `useFocusModeAutoExit` on every app-shell render (hooks run before the `null` return). These register `window` mousemove listeners + timers (pure DOM, no IPC) — should be inert in jsdom. If an app-shell/left-sidebar test fails (e.g. a focus-glow testid now present, or a listener side-effect), STOP and report for adjudication (do NOT weaken assertions). Recon expectation: no failure, since focusMode defaults false → overlay returns null → no glow/island rendered.
- [ ] **Step 6: Build smoke** `npx vite build 2>&1 | tail -5` → succeeds.
- [ ] **Step 7: Commit (app-shell + preview-header + stub deletion together — green).**

```bash
git add desktop/src/features/chat-agent/components/app-shell/app-shell.tsx desktop/src/features/chat-agent/components/preview/preview-header.tsx desktop/src/features/chat-agent/components/focus-mode/focus-mode-button-stub.tsx
git commit -m "feat(desktop): mount FocusModeOverlay in app-shell + swap PreviewHeader button stub → real; delete stub (AS.a Wave C1)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → 1139 + ported test counts, 0 failing, no NEW unhandled rejections
- [ ] `npx vite build` → succeeds
- [ ] `grep -rn "focus-mode-button-stub" desktop/src` → no output (stub removed)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc + Wave A1 + Wave B1 + Wave C1, all `(AS.a …)`
- [ ] Grep ported files for stale imports: `grep -rn "@/lib/utils\|@/lib/focus-mode-geometry\|@/atoms/\|@/hooks/useFocusMode\|@/components/app-shell/\(LeftSidebar\|RightSidePanel\)\|@/test-utils\|./FloatingIsland\|./GlowIndicator" desktop/src/features/chat-agent/components/focus-mode/ desktop/src/features/chat-agent/hooks/use-focus-mode-*.ts desktop/src/features/chat-agent/lib/focus-mode-geometry.ts` — only retargeted `@/features/...`/`@/shared/...`/kebab-relative allowed.

## Scope boundaries (NOT in AS.a)

- **WelcomeView** — AS.b (swap `welcome-view-stub` in workspace-shell).
- **HomeOfficeView** (pixi.js) + **KaleidoscopeShell** (~4,474 LOC) — separate future plans.
- No new third-party deps, no new IPC stubs.

## Carry-forwards (unchanged)

- AS.b (WelcomeView, ~227 LOC + swap welcome-view-stub).
- HomeOffice scene (pixi.js + sprite assets); Kaleidoscope dashboard (~4,474 LOC); BrowserPanel cluster; Rust backends for all accumulated IPC stubs.
