# Preview Pane — PV.a Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the dependency/atom/IPC foundation and port the zero-dependency (Layer-0) leaf utilities of uclaw's `components/preview/` cluster into the Tauri desktop app, so subsequent PRs (PV.b renderers, PV.c editors+chips, PV.d composite+root) can be pure component ports.

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. This PR (1/4 of the Preview sub-stack) does three things: (1) installs the new third-party libs the cluster needs, (2) replaces the two **partial atom stubs** (`preview-panel-atoms`, `preview-chip-atoms`) with uclaw's real modules and adds the two missing atom files (`preview-editor-atoms`, `preview-atoms`) + the `use-preview-refresh` hook, and (3) ports the self-contained leaf utilities (code-highlight cache, office parsers, ext classifier, line/col parser, file-type colors, codemirror theme/langs). No preview *component* is rendered yet — all of this is leaf-level infrastructure.

**Tech Stack:** Tauri v2 + React 19 + TypeScript + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm package manager. New libs: `@codemirror/*` (view/state/commands/language + 8 lang packs), `@lezer/highlight`, `jszip`, `@xmldom/xmldom`.

---

## Conventions (apply to every task)

- **Verbatim port:** copy the file byte-for-byte from the uclaw source path, change ONLY the import paths per the retarget table below, and prepend a 1-line attribution comment (`// Ported verbatim from uclaw <relative source path> — Plan PV.a`) where the file is new. When **swapping** an existing stub, overwrite the stub file entirely with the verbatim real content (keep the file path/name).
- **Standardized retargets:**
  - `@/atoms/<X>` → `@/features/chat-agent/atoms/<X>`
  - `@/lib/agent-types` → `@/features/chat-agent/lib/agent-types`
  - `@/lib/utils` (cn) → `@/shared/lib/cn`
  - `@/lib/highlight` → `@/shared/lib/highlight`
  - `@/components/ui/<X>` → `@/shared/ui/<X>`
  - relative intra-preview imports stay relative, kebab-cased to match the renamed dest file (e.g. `./codeHighlightCache` → `./code-highlight-cache`).
- **Dest naming:** PascalCase uclaw files become kebab-case in desktop (`PreviewPanel.tsx` → `preview-panel.tsx`); files already kebab/lowercase keep their name. Atom files keep their (already-kebab) names.
- **Preview cluster dest root:** `desktop/src/features/chat-agent/components/preview/` (mirrors uclaw's `components/preview/` subdir structure: `utils/`, `chips/`, `office-parsers/`, `editors/`).
- **IPC stub marker family for this sub-stack:** `_PV_`. Missing Tauri commands → stubs in `tauri-bridge-stub.ts` throwing `NOT_IMPLEMENTED_IN_PLAN_PV_BACKEND: <snake_case_command>`.
- **Anti-god-file invariant:** `desktop/src/lib/` contains ONLY `bridge/`; all new lib code goes under `desktop/src/features/chat-agent/lib/`.
- **NEVER `git add -A`** — the worktree accumulates `crates/**/*.rs` (stash conflict markers) + `docs/parity/*` pollution. Use targeted `git add <paths>` and verify every commit with `git show --stat HEAD`.
- **pnpm only** (`pnpm-lock.yaml`); never `npm install`. Add deps with `pnpm add`.
- **Baseline:** 1044 tests passing, `npx tsc -b` reports 19 pre-existing errors. Every task must keep tests green and tsc at 19 (no new errors).
- **Verify-not-already-ported:** before creating any file, confirm it does not already exist in desktop (the recon found several "already-ported" surprises in prior plans). If it exists, compare and reconcile rather than blindly overwrite.

### Retarget reference — confirmed external imports per file

| Dest file | Non-trivial external imports (uclaw → desktop) |
|---|---|
| `atoms/preview-editor-atoms.ts` | only `jotai` / `jotai/utils` — no retargets |
| `atoms/preview-atoms.ts` | only `jotai/utils` — no retargets |
| `atoms/preview-panel-atoms.ts` | `jotai/utils`; `./preview-editor-atoms` (relative, unchanged) |
| `atoms/preview-chip-atoms.ts` | `sonner`; `@tauri-apps/api/core`; `./chat-atoms` (relative); `./agent-atoms` (relative); `@/lib/agent-types` → `@/features/chat-agent/lib/agent-types` |
| `hooks/use-preview-refresh.ts` | `jotai`; `@tauri-apps/api/event`; `@/atoms/preview-atoms` → `@/features/chat-agent/atoms/preview-atoms`; `@/atoms/preview-editor-atoms` → `@/features/chat-agent/atoms/preview-editor-atoms` |
| `preview/code-highlight-cache.ts` | none (self-contained) |
| `preview/utils/ext-classifier.ts` | none (self-contained) |
| `preview/chips/line-col-parser.ts` | none (self-contained) |
| `preview/chips/file-type-colors.ts` | none (self-contained) |
| `preview/office-parsers/xlsx.ts` | `jszip`; `./xml-utils` (relative) |
| `preview/office-parsers/pptx.ts` | `jszip`; `./xml-utils` (relative) |
| `preview/office-parsers/xml-utils.ts` | `@xmldom/xmldom`; `jszip` (type only) |
| `preview/office-parsers/docx.ts` | dynamic `import('mammoth')` (NOT `./xml-utils`) — requires `mammoth` dep |
| `preview/editors/codemirror-theme.ts` | `@codemirror/view`; `@codemirror/language`; `@lezer/highlight` |
| `preview/editors/codemirror-langs.ts` | `@codemirror/language`; dynamic `import('@codemirror/lang-*')` for 8 packs |

---

## Wave A — Third-party deps + IPC stub

### Task A1: Install new third-party dependencies

**Files:**
- Modify: `desktop/package.json`, `desktop/pnpm-lock.yaml`

- [ ] **Step 1: Add deps via pnpm (matching uclaw versions)**

Run from `desktop/`:

```bash
pnpm add \
  @codemirror/view@^6.42.1 \
  @codemirror/state@^6.6.0 \
  @codemirror/commands@^6.10.3 \
  @codemirror/language@^6.12.3 \
  @codemirror/lang-javascript@^6.2.5 \
  @codemirror/lang-python@^6.2.1 \
  @codemirror/lang-rust@^6.0.2 \
  @codemirror/lang-go@^6.0.1 \
  @codemirror/lang-html@^6.4.11 \
  @codemirror/lang-css@^6.3.1 \
  @codemirror/lang-json@^6.0.2 \
  @codemirror/lang-markdown@^6.5.0 \
  @lezer/highlight \
  jszip@^3.10.1 \
  @xmldom/xmldom@^0.8.13 \
  mammoth@^1.12.0
```

> `mammoth` is dynamically imported by `office-parsers/docx.ts` (Wave C2) for DOCX→HTML conversion.

> `@lezer/highlight` has no version pin in uclaw's package.json (it resolves transitively via `@codemirror/language`), but `codemirror-theme.ts` imports it directly, so under pnpm's strict `node_modules` it must be a declared dependency. Let pnpm pick the compatible 1.x.
> `pdfjs-dist` (PdfRenderer, PV.b) and the `@tiptap/extension-*` packages (MarkdownRichEditor, PV.c) are intentionally **deferred** to the PRs that consume them.

- [ ] **Step 2: Verify install + baseline unchanged**

Run: `npx tsc -b 2>&1 | grep -c "error TS"`
Expected: `19` (unchanged — no source uses the new libs yet)

Run: `npm test -- --reporter=dot 2>&1 | grep -E "Tests"`
Expected: `Tests  1044 passed (1044)`

- [ ] **Step 3: Commit**

```bash
git add desktop/package.json desktop/pnpm-lock.yaml
git commit -m "build(desktop): add codemirror + jszip + xmldom deps for preview cluster (PV.a Wave A1)"
git show --stat HEAD
```

### Task A2: Add `previewReadBytes` IPC stub

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

- [ ] **Step 1: Append a `=== Plan PV.a additions ===` block to `tauri-bridge-stub.ts`**

The `PreviewBytes` interface is copied verbatim from uclaw `lib/tauri-bridge.ts:2492`. The real `previewReadBytes` (uclaw `lib/tauri-bridge.ts:2509`) invokes `preview_read_bytes` and remaps a snake_case backend payload; in the stub we just throw the standard marker. Append exactly:

```ts
// ─── Plan PV.a additions: preview file IO ──────────────────────────────────
// PreviewBytes copied verbatim from uclaw lib/tauri-bridge.ts:2492.
// The four raw invoke() commands the preview cluster uses later
// (reveal_path_in_file_manager, preview_write_text, approve_preview_write,
// preview_resolve_chips) are called directly via @tauri-apps/api/core invoke()
// — NOT through this bridge — so they need no stub and reject naturally.
export interface PreviewBytes {
  resolvedPath: string
  /** Owned byte buffer for the file content. */
  bytes: Uint8Array
  size: number
  truncated: boolean
  mtimeMs: number
}

export async function previewReadBytes(
  _mountId: string,
  _relPath: string,
  _sessionId: string | null = null,
): Promise<PreviewBytes> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_PV_BACKEND: preview_read_bytes')
}
```

> Match the existing stub-file style for unused params (the file already uses leading-underscore params elsewhere). The hook `components/preview/hooks/useFileBytes.ts` (PV.b) imports `previewReadBytes` from the bridge with the 3-arg `(mountId, relPath, sessionId)` signature.

- [ ] **Step 2: Verify tsc + tests**

Run: `npx tsc -b 2>&1 | grep -c "error TS"` → Expected `19`
Run: `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → Expected `1044 passed`

- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add previewReadBytes IPC stub + PreviewBytes type (PV.a Wave A2)"
git show --stat HEAD
```

---

## Wave B — Atom foundation (swap partial stubs → real)

> Order matters: `preview-editor-atoms` first (real `preview-panel-atoms` imports `dirtyBuffersAtom` from it), then `preview-atoms`, then the two swaps, then `use-preview-refresh`.
>
> **Swap-safety (verified):** uclaw's real `preview-panel-atoms` and `preview-chip-atoms` are strict supersets of the current desktop stubs — every export the stubs expose (`previewTabsAtom`, `activePreviewTabKeyAtom`, `previewPanelOpenAtom`, `autoPreviewEnabledAtom`, `previewTabKey`, `openPreviewTabAction`, the `PreviewTab*`/`PreviewFileTarget` types; and `addPendingAttachmentAction`) reappears by the same name in the real module. Existing desktop consumers — `tool-activity-item.tsx`(+test), `agent/auto-preview-popover.tsx`, `agent/browser-preview-overlay.tsx`, `files-rail/workspace/file-row-menu.tsx`, `lib/preview-chip-stubs.tsx` — must continue to compile and pass unchanged.

### Task B1: Port the two new atom files

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/preview-editor-atoms.ts` (from uclaw `atoms/preview-editor-atoms.ts`, 90 LOC)
- Create: `desktop/src/features/chat-agent/atoms/preview-atoms.ts` (from uclaw `atoms/preview-atoms.ts`, 27 LOC)

- [ ] **Step 1: Verify neither exists in desktop** (`ls` both paths — expect "No such file").
- [ ] **Step 2: Copy `preview-editor-atoms.ts` verbatim.** Only imports are `jotai` / `jotai/utils` — no retargets. Prepend attribution comment.
- [ ] **Step 3: Copy `preview-atoms.ts` verbatim.** Only import is `jotai/utils` — no retargets. Prepend attribution comment.
- [ ] **Step 4: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.
- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/preview-editor-atoms.ts desktop/src/features/chat-agent/atoms/preview-atoms.ts
git commit -m "feat(desktop): port preview-editor-atoms + preview-atoms (PV.a Wave B1, verbatim)"
git show --stat HEAD
```

### Task B2: Swap `preview-panel-atoms` + `preview-chip-atoms` stubs → real

**Files:**
- Modify (overwrite): `desktop/src/features/chat-agent/atoms/preview-panel-atoms.ts` (← uclaw `atoms/preview-panel-atoms.ts`, 361 LOC)
- Modify (overwrite): `desktop/src/features/chat-agent/atoms/preview-chip-atoms.ts` (← uclaw `atoms/preview-chip-atoms.ts`, 147 LOC)

- [ ] **Step 1: Read the current desktop stub of each** to note its exact export list (for the post-swap compile check).
- [ ] **Step 2: Overwrite `preview-panel-atoms.ts` with uclaw's real content verbatim.** Retargets: `atomWithStorage` from `jotai/utils` (unchanged); `dirtyBuffersAtom` from `./preview-editor-atoms` (relative, unchanged). Keep the attribution comment.
- [ ] **Step 3: Overwrite `preview-chip-atoms.ts` with uclaw's real content verbatim.** Retargets: `sonner` (unchanged); `invoke` from `@tauri-apps/api/core` (unchanged); `PendingAttachment`/`pendingAttachmentsAtom` from `./chat-atoms` (relative, unchanged); `agentPendingFilesAtom` from `./agent-atoms` (relative, unchanged); `AgentPendingFile` from `@/lib/agent-types` → `@/features/chat-agent/lib/agent-types`.
- [ ] **Step 4: Verify tsc + full suite** (catches any consumer breakage):

Run: `npx tsc -b 2>&1 | grep -c "error TS"` → Expected `19`
Run: `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → Expected `1044 passed`
If a consumer breaks, do NOT edit the consumer — re-verify the real atom truly exports the same symbol name; the swap is designed to be drop-in.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/preview-panel-atoms.ts desktop/src/features/chat-agent/atoms/preview-chip-atoms.ts
git commit -m "feat(desktop): swap preview-panel-atoms + preview-chip-atoms stubs → real uclaw modules (PV.a Wave B2, verbatim)"
git show --stat HEAD
```

### Task B3: Port `use-preview-refresh` hook

**Files:**
- Create: `desktop/src/features/chat-agent/hooks/use-preview-refresh.ts` (← uclaw `hooks/usePreviewRefresh.ts`)

- [ ] **Step 1: Verify it does not already exist** (`ls` — expect "No such file").
- [ ] **Step 2: Copy verbatim.** Retargets: `@/atoms/preview-atoms` → `@/features/chat-agent/atoms/preview-atoms`; `@/atoms/preview-editor-atoms` → `@/features/chat-agent/atoms/preview-editor-atoms`; `jotai` + `@tauri-apps/api/event` unchanged. Prepend attribution comment.
- [ ] **Step 3: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`.
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/hooks/use-preview-refresh.ts
git commit -m "feat(desktop): port use-preview-refresh hook (PV.a Wave B3, verbatim)"
git show --stat HEAD
```

### Task B4: Port atom test suites (swap validation)

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/preview-atoms.test.ts` (← uclaw `atoms/preview-atoms.test.ts`, 40 LOC)
- Create: `desktop/src/features/chat-agent/atoms/preview-panel-atoms.test.ts` (← uclaw `atoms/preview-panel-atoms.test.ts`, 192 LOC)

- [ ] **Step 1: Read both uclaw test files** and note their import paths.
- [ ] **Step 2: Copy both verbatim**, retargeting any `@/atoms/*` → `@/features/chat-agent/atoms/*`. These are pure jotai-store tests (`createStore` + get/set), no DOM, no Tauri.
- [ ] **Step 3: Run just these two files**

Run: `npm test -- --reporter=dot preview-atoms preview-panel-atoms 2>&1 | grep -E "Tests"`
Expected: all pass. If a test references an atom behavior that differs, the swap is wrong — investigate the atom, not the test.

- [ ] **Step 4: Full suite + tsc**

Run: `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → Expected count = 1044 + (new test count). Record the new total.
Run: `npx tsc -b 2>&1 | grep -c "error TS"` → `19`

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/preview-atoms.test.ts desktop/src/features/chat-agent/atoms/preview-panel-atoms.test.ts
git commit -m "test(desktop): port preview atom suites validating the stub→real swap (PV.a Wave B4, verbatim)"
git show --stat HEAD
```

---

## Wave C — Layer-0 leaf utilities

> All Wave C files are self-contained (no preview-internal deps beyond `./xml-utils` within office-parsers). Order is free; grouped by subdir for clean commits.

### Task C1: Pure-logic leaf utils + tests

**Files:**
- Create: `desktop/src/features/chat-agent/components/preview/code-highlight-cache.ts` (← uclaw `components/preview/codeHighlightCache.ts`, 60 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/code-highlight-cache.test.ts` (← `codeHighlightCache.test.ts`, 84 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/utils/ext-classifier.ts` (← `utils/ext-classifier.ts`, 133 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/utils/ext-classifier.test.ts` (← `utils/ext-classifier.test.ts`, 127 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/chips/line-col-parser.ts` (← `chips/line-col-parser.ts`, 32 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/chips/line-col-parser.test.ts` (← `chips/line-col-parser.test.ts`, 35 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/chips/file-type-colors.ts` (← `chips/file-type-colors.ts`, 57 LOC)

- [ ] **Step 1:** Verify none exist. Copy all 7 files verbatim — **zero external imports**, so the only change is: in `code-highlight-cache.test.ts` retarget the relative import `./codeHighlightCache` → `./code-highlight-cache` (kebab rename). All other relative test imports already match their (unchanged-name) source files. Prepend attribution comment to each non-test source file.
- [ ] **Step 2: Run the three test files**

Run: `npm test -- --reporter=dot code-highlight-cache ext-classifier line-col-parser 2>&1 | grep -E "Tests"`
Expected: all pass.

- [ ] **Step 3: Full suite + tsc** → tests = prior total + new; tsc `19`.
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/code-highlight-cache.ts desktop/src/features/chat-agent/components/preview/code-highlight-cache.test.ts desktop/src/features/chat-agent/components/preview/utils/ desktop/src/features/chat-agent/components/preview/chips/
git commit -m "feat(desktop): port preview leaf utils — code-highlight-cache, ext-classifier, line-col-parser, file-type-colors (PV.a Wave C1, verbatim)"
git show --stat HEAD
```

### Task C2: Office parsers (jszip + xmldom)

**Files:**
- Create: `desktop/src/features/chat-agent/components/preview/office-parsers/xml-utils.ts` (← `office-parsers/xml-utils.ts`, 116 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/office-parsers/xlsx.ts` (← `office-parsers/xlsx.ts`, 267 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/office-parsers/pptx.ts` (← `office-parsers/pptx.ts`, 101 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/office-parsers/docx.ts` (← `office-parsers/docx.ts`, 17 LOC)

- [ ] **Step 1:** Verify none exist. Copy all 4 verbatim. Retargets: `jszip` (unchanged), `@xmldom/xmldom` (unchanged), `./xml-utils` (relative, unchanged). Prepend attribution comments.
- [ ] **Step 2: tsc** → `19` (confirms `jszip` + `@xmldom/xmldom` types resolve).
- [ ] **Step 3: Full suite** → unchanged total (no tests in this dir).
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/office-parsers/
git commit -m "feat(desktop): port preview office-parsers (xlsx/pptx/docx/xml-utils) (PV.a Wave C2, verbatim)"
git show --stat HEAD
```

### Task C3: Codemirror theme + langs

**Files:**
- Create: `desktop/src/features/chat-agent/components/preview/editors/codemirror-theme.ts` (← `editors/codemirror-theme.ts`, 79 LOC)
- Create: `desktop/src/features/chat-agent/components/preview/editors/codemirror-langs.ts` (← `editors/codemirror-langs.ts`, 55 LOC)

- [ ] **Step 1:** Verify neither exists. Copy both verbatim. Retargets: `@codemirror/view`, `@codemirror/language`, `@lezer/highlight`, and the dynamic `import('@codemirror/lang-*')` calls — all unchanged (packages installed in A1). Prepend attribution comments.
- [ ] **Step 2: tsc** → `19` (confirms all `@codemirror/*` + `@lezer/highlight` types resolve, including the 8 dynamically-imported lang packs).
- [ ] **Step 3: Build smoke** (dynamic imports must resolve at bundle time):

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds (no "Failed to resolve import '@codemirror/lang-…'").

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/editors/
git commit -m "feat(desktop): port codemirror theme + langs (PV.a Wave C3, verbatim)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19` (no new errors)
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → 1044 + ported-test count, 0 failing
- [ ] `npm run build` → succeeds
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*` pollution)
- [ ] `git log --oneline origin/main..HEAD` → the plan-doc commit + 8 wave commits, all `(PV.a …)`

## Scope boundaries (explicitly NOT in PV.a)

- **No preview components** rendered (PreviewPanel/Surface/Header/renderers/editors/chips components are PV.b–PV.d).
- **`preview-chip-stubs.tsx` NOT swapped** — the real `FilePathChip`/`useFileChipResolver`/`markdownFileChipPlugin` components land in PV.c. (PV.a only swaps the chip *atoms*, which the stub component file does not conflict with.)
- **`pdfjs-dist`** (PV.b) and **`@tiptap/extension-code-block-lowlight` + `@tiptap/extension-link`** (PV.c) deps deferred to their consuming PRs.
- **No workspace-shell wiring** — mounting `PreviewPanel` is PV.d.

## Carry-forwards (unchanged from prior plans)

- Git workbench cluster (~2,400 LOC).
- Tab shell → app-shell wiring (deferred from FB.c).
- Rust backends for all accumulated chat/FB/settings/preview IPC stubs.
