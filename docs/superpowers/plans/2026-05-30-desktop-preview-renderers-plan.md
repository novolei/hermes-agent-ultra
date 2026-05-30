# Preview Pane — PV.b Hooks + Renderers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbatim-port the preview cluster's Hooks + Renderers layer (4 hooks + 10 renderers + 4 diff files + 1 diff test = 19 files, ~1,533 LOC) from uclaw into the Tauri desktop app, on top of PV.a's foundation. After this PR the preview cluster can render every supported file type; PV.c (editors + chips) and PV.d (composite + root + wiring) follow.

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. Preserve uclaw's internal directory structure exactly under `components/preview/` (`hooks/`, `renderers/`, `renderers/diff/`) so relative/absolute intra-cluster import paths stay byte-faithful (just kebab-cased). No components are mounted yet (PreviewPanel + workspace wiring is PV.d) — these files only need to compile + bundle.

**Tech Stack:** Tauri v2 + React 19 + TypeScript + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. New libs: `pdfjs-dist` (PdfRenderer), `diff` + `@types/diff` (useDiffHunks). Already present (PV.a / earlier): `@codemirror/*`, `jszip`, `@xmldom/xmldom`, `mammoth`, `react-markdown`, `remark-gfm`, `shiki`, `sonner`, `lucide-react`.

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY the import paths per the retarget table, and prepend a 1-line attribution comment (`// Ported verbatim from uclaw <relative source path> — Plan PV.b`).
- **Dest naming:** PascalCase uclaw files → kebab-case (`CodeRenderer.tsx` → `code-renderer.tsx`, `useFileBytes.ts` → `use-file-bytes.ts`). Preserve uclaw's subdir layout under `desktop/src/features/chat-agent/components/preview/`.
- **NEVER `git add -A`** — the worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Use targeted `git add <paths>` and verify each commit with `git show --stat HEAD`.
- **pnpm only**; add deps with `pnpm add`.
- **Baseline:** tsc reports **19** pre-existing errors; **1096** tests pass. Every task keeps tsc at 19 (no new errors) and tests green. The diff test (Wave D) adds to the test count.
- **Verify-not-already-ported:** before creating any file, `ls` the dest path; if it exists, STOP and reconcile.
- **No new IPC stubs needed:** `previewReadBytes` exists (PV.a); `reveal_path_in_file_manager` (VideoRenderer) is a raw `invoke()` via `@tauri-apps/api/core` that rejects naturally — no bridge stub.

### Retarget reference (absolute `@/…` imports — confirmed against desktop)

| uclaw import | desktop retarget |
|---|---|
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `@/lib/highlight` (`highlightCode`, `getShikiThemeForCurrentApp`, `escapeHtml`) | `@/shared/lib/highlight` |
| `@/lib/tauri-bridge` (`previewReadBytes`) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/hooks/usePreviewRefresh` | `@/features/chat-agent/hooks/use-preview-refresh` |
| `@/atoms/preview-panel-atoms` / `preview-atoms` / `preview-editor-atoms` | `@/features/chat-agent/atoms/preview-*` |
| `@/components/preview/codeHighlightCache` | `@/features/chat-agent/components/preview/code-highlight-cache` |
| `@/components/preview/utils/ext-classifier` | `@/features/chat-agent/components/preview/utils/ext-classifier` |
| `@/components/preview/office-parsers/<x>` | `@/features/chat-agent/components/preview/office-parsers/<x>` |
| `@/components/preview/hooks/useShikiHighlight` (etc.) | `@/features/chat-agent/components/preview/hooks/use-shiki-highlight` (kebab) |
| `@/components/preview/renderers/diff/useDiffHunks` | `@/features/chat-agent/components/preview/renderers/diff/use-diff-hunks` |
| `@tauri-apps/api/core` (`convertFileSrc`, `invoke`), `react`, `lucide-react`, `sonner`, `react-markdown`, `remark-gfm`, `diff`, `jotai` | unchanged (third-party) |

> Dynamic imports stay verbatim: `await import('pdfjs-dist')` + `await import('pdfjs-dist/build/pdf.worker.min.mjs?url')` (PdfRenderer); `await import('@/components/preview/office-parsers/<x>')` becomes `await import('@/features/chat-agent/components/preview/office-parsers/<x>')` (office renderers); `await import('mammoth')` is inside `office-parsers/docx.ts` (already ported).

---

## Wave A — New third-party deps

### Task A1: Install pdfjs-dist + diff

**Files:** Modify `desktop/package.json`, `desktop/pnpm-lock.yaml`

- [ ] **Step 1:** From `desktop/`, run:

```bash
pnpm add pdfjs-dist@^4.10.38 diff@^9.0.0 @types/diff@^7.0.2
```

> Versions match uclaw's source-of-truth `package.json`. `diff@9` ships its own types, but uclaw also declares `@types/diff@^7.0.2`; include it for pin parity (TS resolves diff's bundled types first, so it's harmless). If tsc later errors on a `diff` type mismatch, the resolution is to DROP `@types/diff`, not edit the verbatim source.

- [ ] **Step 2: Verify baseline unchanged**

Run: `npx tsc -b 2>&1 | grep -c "error TS"` → Expected `19`
Run: `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → Expected `1096 passed`

- [ ] **Step 3: Commit**

```bash
git add desktop/package.json desktop/pnpm-lock.yaml
git commit -m "build(desktop): add pdfjs-dist + diff deps for preview renderers (PV.b Wave A1)"
git show --stat HEAD
```

---

## Wave B — Preview hooks (4 files)

### Task B1: Port the 4 preview hooks

**Files (create, all under `desktop/src/features/chat-agent/components/preview/hooks/`):**
- `use-preview-state.ts` ← uclaw `components/preview/hooks/usePreviewState.ts` (28 LOC) — imports atoms only
- `use-preview-router.ts` ← `usePreviewRouter.ts` (24 LOC) — imports `../utils/ext-classifier` (relative, kebab unchanged)
- `use-shiki-highlight.ts` ← `useShikiHighlight.ts` (102 LOC) — imports `../code-highlight-cache` (relative) + `@/lib/highlight`→`@/shared/lib/highlight`
- `use-file-bytes.ts` ← `useFileBytes.ts` (101 LOC) — imports `previewReadBytes` (→ tauri-bridge-stub), `usePreviewRefresh` (→ feature hook), preview atoms

- [ ] **Step 1:** Verify none exist (`ls` the dest dir — expect absent). Copy all 4 verbatim, applying the retarget table. Note: `use-shiki-highlight.ts` relative import `../codeHighlightCache` → `../code-highlight-cache` (kebab); `use-preview-router.ts` relative `../utils/ext-classifier` (name already kebab). Prepend attribution comments.
- [ ] **Step 2: Verify** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1096 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/hooks/
git commit -m "feat(desktop): port preview hooks — use-preview-state/router/shiki-highlight/file-bytes (PV.b Wave B1, verbatim)"
git show --stat HEAD
```

---

## Wave C — Renderers

### Task C1: Leaf renderers (5 files)

**Files (create, under `desktop/src/features/chat-agent/components/preview/renderers/`):**
- `binary-fallback.tsx` ← `BinaryFallback.tsx` (35 LOC)
- `legacy-office-hint.tsx` ← `LegacyOfficeHint.tsx` (48 LOC)
- `image-renderer.tsx` ← `ImageRenderer.tsx` (71 LOC) — `convertFileSrc` from `@tauri-apps/api/core`
- `video-renderer.tsx` ← `VideoRenderer.tsx` (88 LOC) — `convertFileSrc` + `invoke('reveal_path_in_file_manager')` (raw, unchanged)
- `markdown-renderer.tsx` ← `MarkdownRenderer.tsx` (52 LOC) — `react-markdown` + `remark-gfm`

- [ ] **Step 1:** Verify none exist. Copy verbatim with retargets (`cn`→`@/shared/lib/cn` where used). Prepend attribution comments.
- [ ] **Step 2: Verify** tsc `19`; tests `1096 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/renderers/binary-fallback.tsx desktop/src/features/chat-agent/components/preview/renderers/legacy-office-hint.tsx desktop/src/features/chat-agent/components/preview/renderers/image-renderer.tsx desktop/src/features/chat-agent/components/preview/renderers/video-renderer.tsx desktop/src/features/chat-agent/components/preview/renderers/markdown-renderer.tsx
git commit -m "feat(desktop): port preview leaf renderers — binary/legacy-office/image/video/markdown (PV.b Wave C1, verbatim)"
git show --stat HEAD
```

### Task C2: Office renderers (3 files)

**Files (create, under `…/preview/renderers/`):**
- `docx-renderer.tsx` ← `DocxRenderer.tsx` (61 LOC) — dynamic `import('…/office-parsers/docx')`
- `xlsx-renderer.tsx` ← `XlsxRenderer.tsx` (61 LOC) — dynamic `import('…/office-parsers/xlsx')`
- `pptx-renderer.tsx` ← `PptxRenderer.tsx` (60 LOC) — dynamic `import('…/office-parsers/pptx')`

- [ ] **Step 1:** Verify none exist. Copy verbatim. The dynamic `await import('@/components/preview/office-parsers/<x>')` → `await import('@/features/chat-agent/components/preview/office-parsers/<x>')` (the office-parser targets were ported in PV.a). Apply `cn` retarget if used. Prepend attribution comments.
- [ ] **Step 2: Verify** tsc `19`; tests `1096 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/renderers/docx-renderer.tsx desktop/src/features/chat-agent/components/preview/renderers/xlsx-renderer.tsx desktop/src/features/chat-agent/components/preview/renderers/pptx-renderer.tsx
git commit -m "feat(desktop): port preview office renderers — docx/xlsx/pptx (PV.b Wave C2, verbatim)"
git show --stat HEAD
```

---

## Wave D — Diff sub-renderer (4 files + 1 test)

### Task D1: Port the diff sub-cluster

**Files (create, under `desktop/src/features/chat-agent/components/preview/renderers/diff/`):**
- `use-diff-hunks.ts` ← `renderers/diff/useDiffHunks.ts` (111 LOC) — `import { structuredPatch } from 'diff'`
- `use-diff-hunks.test.ts` ← `renderers/diff/useDiffHunks.test.ts` (44 LOC) — retarget its relative import `./useDiffHunks` → `./use-diff-hunks`
- `diff-density-cells.tsx` ← `DiffDensityCells.tsx` (40 LOC) — pure component
- `diff-line-row.tsx` ← `DiffLineRow.tsx` (42 LOC)
- `diff-renderer.tsx` ← `DiffRenderer.tsx` (163 LOC) — composes `./use-diff-hunks` + `./diff-line-row` + `./diff-density-cells` (relative imports, kebab-cased)

- [ ] **Step 1:** Verify none exist. Copy all 5 verbatim. Kebab-case the relative sibling imports inside `diff-renderer.tsx` and the test (`./useDiffHunks`→`./use-diff-hunks`, `./DiffLineRow`→`./diff-line-row`, `./DiffDensityCells`→`./diff-density-cells`). Apply `cn` retarget where used. Prepend attribution comments (non-test files).
- [ ] **Step 2: Run the diff test first**

Run: `npm test -- --reporter=dot use-diff-hunks 2>&1 | grep -E "Tests"`
Expected: all pass (pure-logic test, no DOM/Tauri).

- [ ] **Step 3: Full verify** tsc `19`; `npm test ... | grep Tests` → `1096 + <diff test count>` passing, 0 fail (record new total).
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/renderers/diff/
git commit -m "feat(desktop): port preview diff sub-renderer — use-diff-hunks(+test)/diff-renderer/diff-line-row/diff-density-cells (PV.b Wave D1, verbatim)"
git show --stat HEAD
```

---

## Wave E — Code + PDF renderers (2 files)

### Task E1: Port code-renderer + pdf-renderer

**Files (create, under `…/preview/renderers/`):**
- `code-renderer.tsx` ← `CodeRenderer.tsx` (158 LOC) — imports `@/components/preview/hooks/useShikiHighlight` → `@/features/chat-agent/components/preview/hooks/use-shiki-highlight`; `cn`→`@/shared/lib/cn`
- `pdf-renderer.tsx` ← `PdfRenderer.tsx` (200 LOC) — dynamic `await import('pdfjs-dist')` + `await import('pdfjs-dist/build/pdf.worker.min.mjs?url')` (verbatim, unchanged)

- [ ] **Step 1:** Verify neither exists. Copy verbatim with retargets. Prepend attribution comments.
- [ ] **Step 2: Verify** tsc `19`; tests unchanged total, 0 fail.
- [ ] **Step 3: Build smoke (CRITICAL — pdfjs `?url` worker + all dynamic imports must resolve at bundle time):**

Run: `npx vite build 2>&1 | tail -5`
Expected: build succeeds; NO "Failed to resolve import 'pdfjs-dist…'" or office-parser/shiki resolution errors.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/renderers/code-renderer.tsx desktop/src/features/chat-agent/components/preview/renderers/pdf-renderer.tsx
git commit -m "feat(desktop): port code-renderer + pdf-renderer (PV.b Wave E1, verbatim)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19` (no new errors)
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → 1096 + diff-test count, 0 failing
- [ ] `npx vite build` → succeeds (confirms pdfjs `?url`, dynamic office-parser, and shiki/codemirror imports all bundle)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc commit + 6 wave commits, all `(PV.b …)`
- [ ] Grep the 19 ported files for stale imports: `grep -rn "@/lib/\|@/atoms/\|@/hooks/\|@/components/preview" desktop/src/features/chat-agent/components/preview/{hooks,renderers}/` — every hit must be a retargeted `@/features/...` or `@/shared/...` path; zero bare `@/lib/`/`@/atoms/`/`@/hooks/`/`@/components/preview` (un-retargeted) remain.

## Scope boundaries (NOT in PV.b)

- **No editors** (TextEditor/MarkdownEditor/EditorSurface/etc.) — PV.c.
- **No chips** (FilePathChip/useFileChipResolver/markdownFileChipPlugin) — PV.c; `preview-chip-stubs.tsx` stays untouched.
- **No composite/root** (PreviewHeader/PreviewSurface/PreviewPanel/PreviewTabBar) — PV.d.
- **No workspace-shell wiring** — PV.d. Renderers are not yet reachable at runtime; they only compile + bundle.

## Carry-forwards (unchanged)

- Git workbench cluster (~2,400 LOC); tab shell → app-shell wiring (from FB.c); Rust backends for all accumulated chat/FB/settings/preview IPC stubs.
