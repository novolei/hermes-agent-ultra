# Preview Pane — PV.c Editors + Chips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verbatim-port the preview cluster's Editors + Chips layer (7 editor files + 1 editor test + 3 chip files + 1 chip test = 12 files, ~1,681 LOC) from uclaw, and **swap the `preview-chip-stubs.tsx` content stub for the real chip components**, retargeting its 2 consumers and deleting the stub. After this PR only the composite/root layer (PreviewHeader/Surface/Panel + workspace wiring) remains for PV.d.

**Architecture:** Verbatim byte-for-byte port from uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/`) with only standardized import retargets + a 1-line attribution comment. Preserve uclaw's internal `components/preview/{editors,chips}/` structure (kebab-cased filenames). The stub swap makes file-path chips render for real (interactive, IPC-resolved) in `content-block.tsx` and `ai-elements/message.tsx`.

**Tech Stack:** Tauri v2 + React 19 + TS + Vite 7 + Vitest 4 + Jotai 2.17.1 + Tailwind v3. pnpm. New libs: `@tiptap/extension-link` + `@tiptap/extension-code-block-lowlight` (MarkdownRichEditor). Already present: `@codemirror/*`, `@tiptap/{react,starter-kit,core,extension-placeholder}`, `lowlight`, `sonner`, `lucide-react`, `unified`, `unist-util-visit`, `@types/mdast`, `@react-symbols/icons`.

---

## Conventions (apply to every task)

- **Verbatim port:** copy byte-for-byte from the uclaw source path, change ONLY the import paths per the retarget table, prepend a 1-line attribution comment (`// Ported verbatim from uclaw <relative source path> — Plan PV.c`).
- **Dest naming:** PascalCase → kebab (`EditorSurface.tsx` → `editor-surface.tsx`, `useDirtyBuffer.ts` → `use-dirty-buffer.ts`, `FilePathChip.tsx` → `file-path-chip.tsx`, `markdownFileChipPlugin.ts` → `markdown-file-chip-plugin.ts`, `useFileChipResolver.ts` → `use-file-chip-resolver.ts`). Dest dirs: `desktop/src/features/chat-agent/components/preview/{editors,chips}/` (already exist).
- **NEVER `git add -A`** — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted `git add <paths>` + verify each commit with `git show --stat HEAD`.
- **pnpm only**; add deps with `pnpm add`.
- **Baseline:** tsc **19** pre-existing errors; **1102** tests pass. Every task keeps tsc at 19 and tests green; the 2 ported test files raise the count.
- **Verify-not-already-ported:** `ls` each dest before creating; if it exists, STOP and reconcile.
- **No new IPC stubs:** the 3 commands (`preview_write_text`, `approve_preview_write`, `preview_resolve_chips`) are raw `invoke()` via `@tauri-apps/api/core` → reject naturally. The `files_rail:change` event is a raw `listen()`. No bridge stub.

### Retarget reference (confirmed against desktop)

| uclaw import | desktop retarget |
|---|---|
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` (desktop has NO `src/lib/utils`; cn lives in shared) |
| `@/components/ui/dialog` | `@/shared/ui/dialog` |
| `@/atoms/preview-editor-atoms` | `@/features/chat-agent/atoms/preview-editor-atoms` |
| `@/atoms/preview-panel-atoms` | `@/features/chat-agent/atoms/preview-panel-atoms` |
| `@/atoms/preview-chip-atoms` | `@/features/chat-agent/atoms/preview-chip-atoms` |
| `@/components/preview/utils/ext-classifier` | `@/features/chat-agent/components/preview/utils/ext-classifier` |
| intra-cluster relative (`./TextEditor`, `./MarkdownEditor`, `./MarkdownRichEditor`, `./EditorToolbar`, `./useDirtyBuffer`, `./codemirror-theme`, `./codemirror-langs`, `./line-col-parser`) | same relative path, kebab-cased target filename |
| `@react-symbols/icons/utils` (`FileIcon`), `@codemirror/*`, `@tiptap/*`, `lowlight`, `sonner`, `lucide-react`, `unified`, `unist-util-visit`, `mdast` (types), `jotai`, `@tauri-apps/api/{core,event}`, `react` | unchanged (third-party) |

---

## Wave A — New third-party deps

### Task A1: Install the two TipTap extensions

**Files:** Modify `desktop/package.json`, `desktop/pnpm-lock.yaml`

- [ ] **Step 1:** From `desktop/`, run (EXACT pins, no caret — to keep the TipTap suite in lockstep; desktop pins all `@tiptap/*` at exactly `3.23.2`, unlike uclaw's `^3.23.2`, deliberately to avoid the `@tiptap/core@3.23.6` peer drift):

```bash
pnpm add @tiptap/extension-link@3.23.2 @tiptap/extension-code-block-lowlight@3.23.2
```

- [ ] **Step 2: Verify baseline** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`; `npm test ... | grep Tests` → `1102 passed`.
- [ ] **Step 3: Commit**

```bash
git add desktop/package.json desktop/pnpm-lock.yaml
git commit -m "build(desktop): add @tiptap/extension-link + extension-code-block-lowlight for preview editors (PV.c Wave A1)"
git show --stat HEAD
```

---

## Wave B — Editor leaves + dirty-buffer hook

### Task B1: Port use-dirty-buffer (+test), editor-toolbar, write-approval-dialog

**Files (create, under `desktop/src/features/chat-agent/components/preview/editors/`):**
- `use-dirty-buffer.ts` ← `editors/useDirtyBuffer.ts` (74) — atoms only (`dirtyBuffersAtom`, `setDirtyBufferAction`, `clearDirtyBufferAction`)
- `use-dirty-buffer.test.ts` ← `editors/useDirtyBuffer.test.ts` (75) — retarget its relative import `./useDirtyBuffer` → `./use-dirty-buffer`
- `editor-toolbar.tsx` ← `editors/EditorToolbar.tsx` (82) — `cn`→`@/shared/lib/cn`; atoms (`markdownEditorModeAtom`, `dirtyBuffersAtom`); `lucide-react`
- `write-approval-dialog.tsx` ← `editors/WriteApprovalDialog.tsx` (85) — `cn`→`@/shared/lib/cn`; `@/components/ui/dialog`→`@/shared/ui/dialog`; raw `invoke('approve_preview_write')` + `listen` (unchanged); `lucide-react`

- [ ] **Step 1:** Verify none exist. Copy verbatim with retargets + attribution comments.
- [ ] **Step 2: Run the dirty-buffer test** `npm test -- --reporter=dot use-dirty-buffer 2>&1 | grep -E "Tests"` → all pass.
- [ ] **Step 3: Verify** tsc `19`; full suite green (record new total).
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/editors/use-dirty-buffer.ts desktop/src/features/chat-agent/components/preview/editors/use-dirty-buffer.test.ts desktop/src/features/chat-agent/components/preview/editors/editor-toolbar.tsx desktop/src/features/chat-agent/components/preview/editors/write-approval-dialog.tsx
git commit -m "feat(desktop): port preview editor leaves — use-dirty-buffer(+test)/editor-toolbar/write-approval-dialog (PV.c Wave B1, verbatim)"
git show --stat HEAD
```

---

## Wave C — Editors (text + markdown + surface)

### Task C1: Port text-editor, markdown-rich-editor, markdown-editor, editor-surface

**Files (create, under `…/preview/editors/`):**
- `text-editor.tsx` ← `TextEditor.tsx` (185) — `./codemirror-theme` + `./codemirror-langs` (relative, kebab unchanged); `@codemirror/{view,state,commands}`
- `markdown-rich-editor.tsx` ← `MarkdownRichEditor.tsx` (180) — `./TextEditor`→`./text-editor` (type import `EditorProps`); atom `tipTapFidelityToastShownAtom`; `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-code-block-lowlight`, `lowlight`, `sonner`
- `markdown-editor.tsx` ← `MarkdownEditor.tsx` (24) — `./TextEditor`→`./text-editor`, `./MarkdownRichEditor`→`./markdown-rich-editor`; atom `markdownEditorModeAtom`
- `editor-surface.tsx` ← `EditorSurface.tsx` (156) — `./TextEditor`→`./text-editor`, `./MarkdownEditor`→`./markdown-editor`, `./EditorToolbar`→`./editor-toolbar`, `./useDirtyBuffer`→`./use-dirty-buffer`; atoms (`clearDirtyBufferAction`, `PreviewFileTarget`); raw `invoke('preview_write_text')`

- [ ] **Step 1:** Verify none exist. Copy verbatim, kebab-casing the relative sibling imports. Apply `cn` retarget where used. Prepend attribution comments.
- [ ] **Step 2: Verify** tsc `19`; full suite green.
- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/editors/text-editor.tsx desktop/src/features/chat-agent/components/preview/editors/markdown-rich-editor.tsx desktop/src/features/chat-agent/components/preview/editors/markdown-editor.tsx desktop/src/features/chat-agent/components/preview/editors/editor-surface.tsx
git commit -m "feat(desktop): port preview editors — text/markdown-rich/markdown/editor-surface (PV.c Wave C1, verbatim)"
git show --stat HEAD
```

---

## Wave D — Real chip components

### Task D1: Port markdown-file-chip-plugin (+test), file-path-chip, use-file-chip-resolver

**Files (create, under `desktop/src/features/chat-agent/components/preview/chips/`):**
- `markdown-file-chip-plugin.ts` ← `chips/markdownFileChipPlugin.ts` (135) — `./line-col-parser` (relative, kebab unchanged); `@/components/preview/utils/ext-classifier`→`@/features/chat-agent/components/preview/utils/ext-classifier`; `unified`, `unist-util-visit`, `mdast` types
- `markdown-file-chip-plugin.test.ts` ← `chips/markdownFileChipPlugin.test.ts` (103) — retarget relative import `./markdownFileChipPlugin`→`./markdown-file-chip-plugin` (+ any `./line-col-parser` stays)
- `file-path-chip.tsx` ← `chips/FilePathChip.tsx` (131) — `cn`→`@/shared/lib/cn`; atoms (`openPreviewTabAction` from preview-panel-atoms, `addPendingAttachmentAction` from preview-chip-atoms); `@react-symbols/icons/utils` (FileIcon, unchanged); exports `ChipState`, `FilePathChipProps`, `FilePathChip`
- `use-file-chip-resolver.ts` ← `chips/useFileChipResolver.ts` (193) — atoms (`chipResolutionCacheAtom`, `setChipResolutionAction`, `ChipResolutionEntry`, `invalidateChipResolutionsAction` from preview-chip-atoms); raw `invoke('preview_resolve_chips')` + `listen('files_rail:change')` (unchanged); exports `useFileChipResolver`, `useChipCacheInvalidator`

- [ ] **Step 1:** Verify none exist. Copy verbatim with retargets + attribution comments.
- [ ] **Step 2: Run the plugin test** `npm test -- --reporter=dot markdown-file-chip-plugin 2>&1 | grep -E "Tests"` → all pass.
- [ ] **Step 3: Verify** tsc `19`; full suite green (record new total).
- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/preview/chips/markdown-file-chip-plugin.ts desktop/src/features/chat-agent/components/preview/chips/markdown-file-chip-plugin.test.ts desktop/src/features/chat-agent/components/preview/chips/file-path-chip.tsx desktop/src/features/chat-agent/components/preview/chips/use-file-chip-resolver.ts
git commit -m "feat(desktop): port real preview chips — markdown-file-chip-plugin(+test)/file-path-chip/use-file-chip-resolver (PV.c Wave D1, verbatim)"
git show --stat HEAD
```

---

## Wave E — Stub swap (retarget consumers + delete stub)

> This makes file-path chips render for real in `content-block.tsx` and `ai-elements/message.tsx`. Both consumers import only VALUE symbols (no types), so the retarget is mechanical. **Swap hazard:** the real `useFileChipResolver` calls `invoke()`/`listen()` on mount; the two consumer test files had their uclaw Tauri mocks REMOVED during the stub era ("stubs don't call Tauri IPC"). Those mocks must be RESTORED.

### Task E1: Retarget consumers, restore test mocks, delete stub

**Files:**
- Modify: `desktop/src/features/chat-agent/components/content-block.tsx`
- Modify: `desktop/src/features/chat-agent/components/ai-elements/message.tsx`
- Modify: `desktop/src/features/chat-agent/components/ai-elements/message.test.tsx` (restore mocks)
- Modify (if its fixtures mount a chip): `desktop/src/features/chat-agent/components/content-block.test.tsx`
- Delete: `desktop/src/features/chat-agent/lib/preview-chip-stubs.tsx`

- [ ] **Step 1: Retarget `content-block.tsx` line 14.** Replace the single stub import with three real-module imports:

```ts
// remove:
import { markdownFileChipPlugin, FilePathChip, useFileChipResolver } from '@/features/chat-agent/lib/preview-chip-stubs'
// add:
import { markdownFileChipPlugin } from '@/features/chat-agent/components/preview/chips/markdown-file-chip-plugin'
import { FilePathChip } from '@/features/chat-agent/components/preview/chips/file-path-chip'
import { useFileChipResolver } from '@/features/chat-agent/components/preview/chips/use-file-chip-resolver'
```

- [ ] **Step 2: Retarget `ai-elements/message.tsx` lines 8–11.** Update the comment + the three imports:

```ts
import { markdownFileChipPlugin } from '@/features/chat-agent/components/preview/chips/markdown-file-chip-plugin'
import { FilePathChip } from '@/features/chat-agent/components/preview/chips/file-path-chip'
import { useFileChipResolver, useChipCacheInvalidator } from '@/features/chat-agent/components/preview/chips/use-file-chip-resolver'
```

- [ ] **Step 3: Delete the stub** `desktop/src/features/chat-agent/lib/preview-chip-stubs.tsx`, then grep to confirm zero remaining importers: `grep -rn "preview-chip-stubs" desktop/src` → no output.

- [ ] **Step 4: tsc gate** `npx tsc -b 2>&1 | grep -c "error TS"` → `19`. (Catches any missed symbol / type that the stub exported but a consumer needs from a different real module.)

- [ ] **Step 5: Restore Tauri mocks in `message.test.tsx`.** The real chip hooks call Tauri IPC, which jsdom lacks. Add (verbatim from uclaw's original, which the desktop port had stripped) AFTER the imports and update the ported-header comment to note the restoration:

```ts
// useChipCacheInvalidator calls listen() from @tauri-apps/api/event (absent in
// jsdom); useFileChipResolver calls invoke() from @tauri-apps/api/core. Restored
// these mocks now that PV.c swapped the Jotai-free/IPC-free stubs for real chips.
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async () => () => {}),
  emit: vi.fn(async () => {}),
}))
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => []),
}))
```

(Add `vi` to the vitest import if not already present.)

- [ ] **Step 6: Run the full suite.** `npm test -- --reporter=dot 2>&1 | grep -E "Tests"`.
  - If `content-block.test.tsx` also throws an unhandled rejection / error from the real chip hooks (i.e. its fixtures mount a chip), add the SAME two `vi.mock` blocks to it (mirroring Step 5). Do NOT change any assertion — only add the Tauri mocks.
  - If a NON-mock test failure appears (e.g. a real chip renders differently than an assertion expects), STOP and report it for adjudication rather than editing assertions. (We confirmed neither consumer test currently asserts chip output, so this is unlikely.)
  - Target: all tests pass, 0 unhandled rejections.

- [ ] **Step 7: Verify** tsc `19`; full suite green.
- [ ] **Step 8: Commit**

```bash
git add desktop/src/features/chat-agent/components/content-block.tsx desktop/src/features/chat-agent/components/ai-elements/message.tsx desktop/src/features/chat-agent/components/ai-elements/message.test.tsx desktop/src/features/chat-agent/lib/preview-chip-stubs.tsx
# add content-block.test.tsx ONLY if Step 6 modified it
git commit -m "feat(desktop): swap preview-chip-stubs → real chip modules in content-block + message; delete stub (PV.c Wave E1)"
git show --stat HEAD
```

---

## Final verification (before finishing the branch)

- [ ] `npx tsc -b 2>&1 | grep -c "error TS"` → `19`
- [ ] `npm test -- --reporter=dot 2>&1 | grep -E "Tests"` → 1102 + (use-dirty-buffer + markdown-file-chip-plugin test counts), 0 failing, 0 unhandled rejections
- [ ] `npx vite build` → succeeds (TipTap extensions + codemirror editors bundle)
- [ ] `grep -rn "preview-chip-stubs" desktop/src` → no output (stub fully removed)
- [ ] `git status --short` → clean (NO `crates/**/*.rs`, NO `docs/parity/*`)
- [ ] `git log --oneline origin/main..HEAD` → plan-doc commit + 5 wave commits, all `(PV.c …)`
- [ ] Grep the 12 ported files for stale imports: `grep -rn "@/lib/\|@/atoms/\|@/components/preview\|@/components/ui" desktop/src/features/chat-agent/components/preview/{editors,chips}/` — every hit must be a retargeted `@/features/...` or `@/shared/...` path.

## Scope boundaries (NOT in PV.c)

- **No composite/root** (PreviewHeader/PreviewSurface/PreviewPanel/PreviewTabBar/PreviewTabItem/PreviewEmpty) — PV.d.
- **No workspace-shell wiring** — PV.d. The editors/chips compile + bundle; editors are not yet mounted (EditorSurface is mounted by PreviewSurface in PV.d), but chips ARE now live in content-block/message via the swap.

## Carry-forwards (unchanged)

- Git workbench cluster (~2,400 LOC); tab shell → app-shell wiring (from FB.c); Rust backends for all accumulated chat/FB/settings/preview IPC stubs.
