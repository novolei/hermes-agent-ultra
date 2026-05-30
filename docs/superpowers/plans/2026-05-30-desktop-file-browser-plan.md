# Plan FB.a — Desktop file-browser Cluster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First PR of the "workspace files + tabs" sub-stack (FB.a → FB.b → FB.c). Port the uclaw `file-browser/` cluster verbatim: the real VS-Code-style `FileTypeIcon`, `FileDropZone`, and `FileBrowser` directory-tree viewer. Replace the existing `file-type-icon-stub.tsx` placeholder with the real component (its prop API already matches exactly).

**Architecture:** Verbatim port discipline established across PRs #18–#23. Each file is copied byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/` with only standardized import retargets + IPC-stub substitution. One new npm dep (`@react-symbols/icons`, the VS-Code glyph set `FileTypeIcon` needs) and one new IPC stub (`listDirectoryEntries`). The existing `file-type-icon-stub.tsx` is deleted and its single consumer (`attachment-preview-item.tsx`) retargeted to the real component.

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 · Tailwind v3 · lucide-react · `@react-symbols/icons@^1.3.1` (NEW). Package manager is **pnpm** (`pnpm-lock.yaml`; use `pnpm add`, never `npm install`).

---

## Closure summary

| File | uclaw LOC | Notes |
|---|---|---|
| `FileTypeIcon.tsx` | 56 | Real VS-Code glyphs via `@react-symbols/icons/utils` — replaces existing stub |
| `FileDropZone.tsx` | 92 | No sibling deps (cn + lucide only) |
| `FileBrowser.tsx` | 253 | Imports FileTypeIcon + `listDirectoryEntries` IPC + `FileEntry` type (exists) |
| `index.tsx` | — | uclaw's is a `[PLACEHOLDER]` barrel; we write a REAL barrel re-exporting the 3 above (documented divergence) |
| **Total** | **~401** | + 1 npm dep + 1 IPC stub + 1 stub deletion + 1 consumer retarget |

This is the smallest of the 3 files+tabs PRs — self-contained, unblocks nothing else (the files-rail foundation lands in FB.b where it's consumed).

---

## File Structure

### New files
```
desktop/src/features/chat-agent/components/file-browser/
├── file-type-icon.tsx          # NEW (Wave B, 56 LOC verbatim — real @react-symbols glyphs)
├── file-drop-zone.tsx          # NEW (Wave C1, 92 LOC verbatim)
├── file-browser.tsx            # NEW (Wave C2, 253 LOC verbatim)
├── file-browser.test.tsx       # NEW (Wave C2, mount smoke test — uclaw ships none)
└── index.ts                    # NEW (Wave C3, real barrel re-exporting the 3 components)
```

### Modified files
```
desktop/
├── package.json                                                    # MODIFY (Wave A1: add @react-symbols/icons)
└── src/features/chat-agent/
    ├── lib/tauri-bridge-stub.ts                                    # MODIFY (Wave A2: add listDirectoryEntries stub)
    └── components/chat/attachment-preview-item.tsx                 # MODIFY (Wave B: retarget FileTypeIcon import)
```

### Deleted files
```
desktop/src/features/chat-agent/lib/file-type-icon-stub.tsx        # DELETE (Wave B: replaced by real component)
```

### Existing prereqs (verified — DO NOT re-port)
- ✅ `FileEntry` type — `desktop/src/features/chat-agent/lib/chat-types.ts:252`
- ✅ `cn` — `@/shared/lib/cn`
- ✅ lucide-react icons (ChevronRight, RefreshCw, FolderOpen, Plus, Trash2, Upload) — all available
- ✅ `@react-symbols/icons@1.3.1` confirmed available on npm

---

## Standard Retargets Table

| uclaw import | hermes retarget |
|---|---|
| `@/lib/utils` (cn) | `@/shared/lib/cn` |
| `@/lib/chat-types` (FileEntry) | `@/features/chat-agent/lib/chat-types` |
| `@/lib/tauri-bridge` (listDirectoryEntries) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `./FileTypeIcon` (sibling) | `./file-type-icon` |
| `@react-symbols/icons/utils` | unchanged (npm package, added Wave A1) |

**Canonical NOT_IMPLEMENTED marker:** `NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: <snake_case_command>`. (New marker family for the files+tabs sub-stack; do NOT reuse `_3_5_S_` which was the SettingsDialog family.)

**Anti-god-file invariant:** `desktop/src/lib/` contains ONLY `bridge/`. The new cluster lives under `desktop/src/features/chat-agent/components/file-browser/`.

**Git hygiene:** NEVER `git add -A` / `git add .` in this worktree — it accumulates unrelated `crates/**/*.rs` + `docs/parity/*` pollution. ALWAYS stage explicit paths; verify each commit with `git show --stat HEAD`.

---

## Wave A — Foundation: npm dep + IPC stub

### Task A1: Add `@react-symbols/icons` dependency

**Files:** Modify `desktop/package.json`

- [ ] **Step 1: Install via pnpm**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop
pnpm add @react-symbols/icons
```
Expected: added to `dependencies`, `pnpm-lock.yaml` updated.

- [ ] **Step 2: Verify**
```bash
grep '"@react-symbols/icons"' /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop/package.json
```
Expected: present in `dependencies`.

- [ ] **Step 3: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
git add desktop/package.json desktop/pnpm-lock.yaml
git commit -m "feat(desktop): add @react-symbols/icons dep (FB.a prereq for FileTypeIcon)"
git show --stat HEAD | head -6   # verify only package.json + lockfile
```

### Task A2: Add `listDirectoryEntries` IPC stub

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (append at end)

- [ ] **Step 1: Append the new section**

```ts
// === Plan FB.a additions ===
// ─── file-browser IPC stub ───────────────────────────────────────────────────
// FileBrowser calls listDirectoryEntries. Throws NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND
// until the Rust `list_directory_entries` command ships.
// Source: uclaw `@/lib/tauri-bridge` lines 612–619.

export interface DirectoryEntry {
  name: string
  path: string
  isDirectory: boolean
  isFile: boolean
  size?: number
  extension?: string
}

/** Plan FB.a stub — replaced by Rust `list_directory_entries`. */
export async function listDirectoryEntries(_path: string): Promise<DirectoryEntry[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: list_directory_entries')
}
```

**First** confirm the exact return shape by reading uclaw `/Users/ryanliu/Documents/uclaw/ui/src/lib/tauri-bridge.ts:612–619` — the inline object type there is the source of truth for `DirectoryEntry`'s fields. Match it byte-for-byte (the fields above are from recon: `name, path, isDirectory, isFile, size?, extension?` — verify `size`/`extension` optionality).

- [ ] **Step 2: Verify tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop
npx tsc -b 2>&1 | grep -c "error TS"    # expect 28
npm test -- --reporter=dot 2>&1 | tail -6   # expect 1000
```

- [ ] **Step 3: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add listDirectoryEntries IPC stub (FB.a, file-browser prereq)"
git show --stat HEAD | head -4
```

---

## Wave B — Port real FileTypeIcon + replace the stub

### Task B1: Port `FileTypeIcon.tsx`, retarget the consumer, delete the stub

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/FileTypeIcon.tsx`
- Create: `desktop/src/features/chat-agent/components/file-browser/file-type-icon.tsx`
- Modify: `desktop/src/features/chat-agent/components/chat/attachment-preview-item.tsx`
- Delete: `desktop/src/features/chat-agent/lib/file-type-icon-stub.tsx`

The existing stub at `lib/file-type-icon-stub.tsx` has the EXACT prop API of the real component: `{ name: string; isDirectory: boolean; isOpen?: boolean; size?: number; className?: string }`. The real component is a drop-in replacement.

- [ ] **Step 1: Read the uclaw source**
```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/FileTypeIcon.tsx
```

- [ ] **Step 2: Port verbatim**

Create `desktop/src/features/chat-agent/components/file-browser/file-type-icon.tsx` with the verbatim body. Retargets: the only `@/...` imports to check are `@/lib/utils` (cn) → `@/shared/lib/cn` if present. The `@react-symbols/icons/utils` import stays unchanged. Add a 1-line attribution comment at top:
```tsx
// Verbatim from uclaw ui/src/components/file-browser/FileTypeIcon.tsx (Plan FB.a Wave B1)
```

- [ ] **Step 3: Retarget the stub consumer**

In `desktop/src/features/chat-agent/components/chat/attachment-preview-item.tsx`, find the import:
```ts
import { FileTypeIcon } from '@/features/chat-agent/lib/file-type-icon-stub'
```
Replace with:
```ts
import { FileTypeIcon } from '@/features/chat-agent/components/file-browser/file-type-icon'
```
(Read the actual current import line first — the exact path/alias may differ. Use `grep -n "file-type-icon" desktop/src/features/chat-agent/components/chat/attachment-preview-item.tsx`.)

- [ ] **Step 4: Delete the stub**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
rm desktop/src/features/chat-agent/lib/file-type-icon-stub.tsx
```
Confirm no other consumers remain:
```bash
grep -rn "file-type-icon-stub" desktop/src/ || echo "clean — stub fully removed"
```
Expected: empty (only attachment-preview-item referenced it, now retargeted).

- [ ] **Step 5: Verify tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop
npx tsc -b 2>&1 | grep -c "error TS"    # expect 28 (unchanged)
npm test -- --reporter=dot 2>&1 | tail -6   # expect 1000 (attachment-preview-item tests still pass with real icon)
```
If `attachment-preview-item.test.tsx` (if one exists) asserted on `data-testid="file-type-icon-stub"`, that assertion must be updated to match the real component's output. Read any such test and adjust the assertion to target a stable attribute the real `FileTypeIcon` renders (e.g. an `svg` or the `className`). DO NOT loosen it to a tautology — assert the icon element renders.

- [ ] **Step 6: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
git add desktop/src/features/chat-agent/components/file-browser/file-type-icon.tsx desktop/src/features/chat-agent/components/chat/attachment-preview-item.tsx
git rm desktop/src/features/chat-agent/lib/file-type-icon-stub.tsx
# also add the attachment-preview-item test if it was modified:
# git add desktop/src/features/chat-agent/components/chat/attachment-preview-item.test.tsx
git commit -m "feat(desktop): port real FileTypeIcon, retarget attachment-preview-item, delete stub (FB.a Wave B)"
git show --stat HEAD | head -8
```

---

## Wave C — Port FileDropZone + FileBrowser + barrel

### Task C1: Port `FileDropZone.tsx` (92 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/FileDropZone.tsx`
- Create: `desktop/src/features/chat-agent/components/file-browser/file-drop-zone.tsx`

- [ ] **Step 1: Read source + audit imports**
```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/FileDropZone.tsx
grep -nE "^import|from '@/" /Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/FileDropZone.tsx
```
Recon found only `cn` + lucide `Upload`. Confirm no other `@/...` imports; if any surface, resolve via the retarget table or escalate.

- [ ] **Step 2: Port verbatim with retargets**

Retargets: `@/lib/utils` (cn) → `@/shared/lib/cn`. Add attribution comment.

- [ ] **Step 3: Run tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop
npm test -- --reporter=dot 2>&1 | tail -6   # expect 1000
```

- [ ] **Step 4: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
git add desktop/src/features/chat-agent/components/file-browser/file-drop-zone.tsx
git commit -m "feat(desktop): port file-drop-zone (verbatim, FB.a Wave C1)"
git show --stat HEAD | head -4
```

### Task C2: Port `FileBrowser.tsx` (253 LOC) + mount smoke test

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/FileBrowser.tsx`
- Create: `desktop/src/features/chat-agent/components/file-browser/file-browser.tsx`
- Create: `desktop/src/features/chat-agent/components/file-browser/file-browser.test.tsx` (NEW — uclaw ships none)

- [ ] **Step 1: Read source**
```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/file-browser/FileBrowser.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Retargets:
- `@/lib/utils` (cn) → `@/shared/lib/cn`
- `./FileTypeIcon` → `./file-type-icon`
- `@/lib/chat-types` (FileEntry) → `@/features/chat-agent/lib/chat-types`
- `@/lib/tauri-bridge` (listDirectoryEntries) → `@/features/chat-agent/lib/tauri-bridge-stub`

`listDirectoryEntries` stays as the named-wrapper import (added in Wave A2). Add attribution comment.

- [ ] **Step 3: Write a minimal mount smoke test**

```tsx
// desktop/src/features/chat-agent/components/file-browser/file-browser.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FileBrowser } from './file-browser'

// listDirectoryEntries is a stub that throws NOT_IMPLEMENTED — mock it so the
// component's load effect resolves with a small fixture.
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    listDirectoryEntries: vi.fn().mockResolvedValue([
      { name: 'src', path: '/root/src', isDirectory: true, isFile: false },
      { name: 'README.md', path: '/root/README.md', isDirectory: false, isFile: true, extension: 'md' },
    ]),
  }
})

describe('FileBrowser', () => {
  it('renders entries returned by listDirectoryEntries', async () => {
    render(<FileBrowser rootPath="/root" />)
    await waitFor(() => {
      expect(screen.getByText('README.md')).toBeTruthy()
    })
  })
})
```
**Refine after reading the source:** confirm the component's actual prop name for the root path (the uclaw placeholder index showed `rootPath?`, but the REAL `FileBrowser.tsx` may use a different prop — read its props interface). Confirm it calls `listDirectoryEntries` in a mount effect and renders entry `name`s. Adjust the prop + the asserted text to match the real component. Keep ≥1 meaningful assertion (an entry name from the fixture appears).

- [ ] **Step 4: Run tests + tsc**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop
npm test -- --reporter=dot 2>&1 | tail -6   # expect 1001 (+1)
npx tsc -b 2>&1 | grep -c "error TS"    # expect 28
```

- [ ] **Step 5: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
git add desktop/src/features/chat-agent/components/file-browser/file-browser.tsx desktop/src/features/chat-agent/components/file-browser/file-browser.test.tsx
git commit -m "feat(desktop): port file-browser (verbatim + mount smoke test, FB.a Wave C2)"
git show --stat HEAD | head -5
```

### Task C3: Write the barrel `index.ts` (real re-export, NOT uclaw's placeholder)

**Files:**
- Create: `desktop/src/features/chat-agent/components/file-browser/index.ts`

uclaw's `file-browser/index.tsx` is a `[PLACEHOLDER]` that shadows the real components with stubs — a uclaw oversight. We write a REAL barrel (documented divergence, like the `browser-runtime-settings-helpers` rename in 3.5.s.c).

- [ ] **Step 1: Write the barrel**
```ts
// Real barrel for the file-browser cluster.
// NOTE: uclaw's ui/src/components/file-browser/index.tsx is a [PLACEHOLDER] that
// shadows the real sibling components with stubs (a uclaw oversight). This barrel
// deliberately diverges by re-exporting the REAL ported components. (Plan FB.a Wave C3)
export { FileBrowser } from './file-browser'
export { FileDropZone } from './file-drop-zone'
export { FileTypeIcon } from './file-type-icon'
```
**First verify the export names** match what each component file actually exports (`grep -nE "^export" desktop/src/features/chat-agent/components/file-browser/*.tsx`). If `FileBrowser`/`FileDropZone` export additional types (e.g. `FileBrowserProps`), re-export those too with `export type { ... }`.

- [ ] **Step 2: Run tests + tsc**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop
npm test -- --reporter=dot 2>&1 | tail -6   # expect 1001
npx tsc -b 2>&1 | grep -c "error TS"    # expect 28
```

- [ ] **Step 3: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
git add desktop/src/features/chat-agent/components/file-browser/index.ts
git commit -m "feat(desktop): add real file-browser barrel (diverges from uclaw placeholder, FB.a Wave C3)"
git show --stat HEAD | head -4
```

---

## Wave D — Final sweep

- [ ] **Step 1: Anti-god-file invariant**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
find desktop/src/lib -type f -not -path '*/bridge/*'   # expect empty
```

- [ ] **Step 2: Stub fully removed**
```bash
grep -rn "file-type-icon-stub" desktop/src/   # expect empty
```

- [ ] **Step 3: Storage-key audit**
```bash
git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/chat-agent/components/file-browser/ || echo "clean"
```

- [ ] **Step 4: Branch pollution check**
```bash
git diff main..HEAD --name-only | grep -vE "^desktop/|^docs/superpowers/" || echo "clean — desktop+plan only"
```
Expected: empty (no `crates/` or `docs/parity/` pollution). If ANY appears, it's the known stash-conflict pollution — `git restore` it and re-verify.

- [ ] **Step 5: tsc + final test run**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser/desktop
npx tsc -b 2>&1 | grep -c "error TS"    # expect 28
npm test -- --reporter=dot 2>&1 | tail -10   # expect 1001, 0 failing
```

- [ ] **Step 6: Commit only if a fixable issue surfaced**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-file-browser
git add desktop/   # targeted to desktop only
git commit -m "chore(desktop): Plan FB.a final sweep" 2>/dev/null || echo "nothing to commit"
```

---

## Final Self-Review Checklist

- [ ] Wave A: `@react-symbols/icons` dep + `listDirectoryEntries` stub
- [ ] Wave B: real FileTypeIcon ported; `attachment-preview-item.tsx` retargeted; `file-type-icon-stub.tsx` deleted; no remaining stub references
- [ ] Wave C: FileDropZone + FileBrowser (+ smoke test) + real barrel index ported
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] Test count up by ≥1 (1000 → ≥1001)
- [ ] tsc residual stable at 28 (no NEW errors)
- [ ] No branch pollution (desktop/ + docs/superpowers/ only)
- [ ] All commits conventional-commit prefixed + verified clean via `git show --stat`
- [ ] Canonical `NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND` marker for the new stub

---

## Carry-Forward Follow-ups

After FB.a merges, the files+tabs sub-stack continues:
1. **Plan FB.b — files-rail cluster** (~1,612 LOC): workspace + changes panels, `useFileTree`/`useFilesRailWatcher` hooks, `tree-patch` util, plus its foundation — `files-rail-atoms.ts`, `files-rail-row-atoms.ts`, `files-rail-helpers.ts`, the `addPendingAttachmentAction` preview-chip atom, 12 IPC stubs (`files_rail_*`, `rename_artifact`, `move_artifact`, `delete_artifact_recursive`, `attach/detach_*_directory`, `copy_file_into_workspace`), and `@tauri-apps/plugin-dialog`.
2. **Plan FB.c — tabs cluster** (~1,245 LOC): TabBar/TabBarItem/TabSwitcher/TabPreviewPanel/TabErrorBoundary/TabCloseConfirmDialog real; TabContent + MainArea stub the not-yet-ported content clusters (ChatView, BrowserPanel, Panel, WorkspaceShell); `useCloseTab` + `useWindowDragOnMove` hooks.
3. **Rust backend** for `list_directory_entries` (+ the FB.b/FB.c IPC stubs).
