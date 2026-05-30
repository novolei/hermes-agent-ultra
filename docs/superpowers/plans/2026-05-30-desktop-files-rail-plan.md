# Plan FB.b — Desktop files-rail Cluster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Second PR of the "workspace files + tabs" sub-stack (FB.a ✅ → FB.b → FB.c). Port the uclaw `files-rail/` cluster verbatim: the workspace file-tree panel (lazy-loaded tree, rename/move/delete, attach/detach dirs), the changes panel, the supporting hooks (`useFileTree`, `useFilesRailWatcher`), the `tree-patch` util, and all foundation (2 atom files, 1 lib helper, 1 preview-chip action atom, ~13 IPC stubs).

**Architecture:** Verbatim port discipline (PRs #18–#24 pattern). Byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/components/files-rail/` + `/Users/ryanliu/Documents/uclaw/ui/src/atoms/` with only standardized import retargets + IPC-stub substitution. The cluster is ported leaf-first (util → atoms → hooks → leaf components → tree components → rail entry). FilesRail is NOT wired into a parent in this PR (consistent with FB.a's FileBrowser — wiring is a follow-up). `@tauri-apps/plugin-dialog` is handled via the existing vite-alias-mock pattern (like `plugin-updater`/`plugin-process`), keeping `WorkspacePanelFooter` byte-for-byte verbatim and requiring NO npm install and NO Rust changes.

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 (incl. `atomFamily` from `jotai/utils` — already used by `agent-atoms.ts`; the deprecation warning is pre-existing/tolerated) · Tailwind v3 · lucide-react · sonner. Package manager **pnpm**. **No new npm deps.**

---

## Closure summary

| Group | Files | LOC |
|---|---|---|
| Foundation: util + atoms + lib + preview action | tree-patch(+test), files-rail-atoms, files-rail-row-atoms, files-rail-helpers, preview-chip-atoms | ~390 |
| Foundation: IPC stubs + types + plugin-dialog mock | tauri-bridge-stub additions, `__mocks__/tauri-plugin-dialog.ts`, vite.config alias | ~100 |
| Hooks | use-file-tree, use-files-rail-watcher | ~193 |
| Workspace components | 10 files (+2 tests) | ~1,223 + 195 |
| Changes components | ChangeRow, FileChangesPanel | ~89 |
| Rail entry | FilesRailTabs, index | ~75 |
| **Total** | **~29 files** | **~2,270 + tests** |

Large but coherent — the whole file-tree feature in one PR (the user scoped files-rail as one PR of the FB sub-stack).

---

## File Structure

### New files
```
desktop/src/
├── __mocks__/
│   └── tauri-plugin-dialog.ts                                      # NEW (Wave A0, vite-alias mock — no-op `open`)
└── features/chat-agent/
    ├── utils/
    │   ├── tree-patch.ts                                           # NEW (Wave A1, 144 LOC verbatim)
    │   └── tree-patch.test.ts                                      # NEW (Wave A1, 62 LOC verbatim)
    ├── atoms/
    │   ├── files-rail-atoms.ts                                     # NEW (Wave A2, 51 LOC verbatim)
    │   ├── files-rail-row-atoms.ts                                 # NEW (Wave A2, 38 LOC verbatim)
    │   └── preview-chip-atoms.ts                                   # NEW (Wave A2, addPendingAttachmentAction ~60 LOC)
    ├── lib/
    │   └── files-rail-helpers.ts                                   # NEW (Wave A2, 33 LOC verbatim)
    ├── hooks/
    │   ├── use-file-tree.ts                                        # NEW (Wave B, 141 LOC verbatim)
    │   └── use-files-rail-watcher.ts                               # NEW (Wave B, 52 LOC verbatim)
    └── components/files-rail/
        ├── index.tsx                                               # NEW (Wave E, 38 LOC — FilesRail entry)
        ├── files-rail-tabs.tsx                                     # NEW (Wave E, 37 LOC)
        ├── workspace/
        │   ├── rename-input.tsx                                    # NEW (Wave C, 112 LOC) + .test.tsx (107)
        │   ├── change-row …                                        # (in changes/)
        │   ├── file-row-menu.tsx                                   # NEW (Wave C, 207 LOC) + .test.tsx (88)
        │   ├── workspace-panel-header.tsx                          # NEW (Wave C, 155 LOC)
        │   ├── workspace-panel-footer.tsx                          # NEW (Wave C, 150 LOC)
        │   ├── move-to-dialog.tsx                                  # NEW (Wave C, 94 LOC)
        │   ├── delete-confirm-dialog.tsx                           # NEW (Wave C, 104 LOC)
        │   ├── file-tree-node.tsx                                  # NEW (Wave D, 178 LOC — recursive)
        │   ├── attached-dir-row.tsx                                # NEW (Wave D, 258 LOC)
        │   └── workspace-files-panel.tsx                           # NEW (Wave D, 190 LOC)
        └── changes/
            ├── change-row.tsx                                      # NEW (Wave C, 43 LOC)
            └── file-changes-panel.tsx                              # NEW (Wave D, 46 LOC)
```

### Modified files
```
desktop/
├── vite.config.ts                                                  # MODIFY (Wave A0: add plugin-dialog alias)
└── src/features/chat-agent/lib/tauri-bridge-stub.ts                # MODIFY (Wave A3: ~13 IPC stubs + 2 input types)
```

### Existing prereqs (verified — DO NOT re-port)
- ✅ atoms: `agent-atoms` (currentAgentWorkspaceIdAtom, workspaceAttachedDirsMapAtom, agentSessionAttachedDirsMapAtom, agentPendingFilesAtom, agentRunningSessionIdsAtom, SessionIndicatorStatus), `workspace`, `app-mode`, `chat-atoms` (pendingAttachmentsAtom), `tab-atoms`
- ✅ lib: `cn` (`@/shared/lib/cn`), `workspace-icons`, `model-logo`, `im-channel-display`
- ✅ types: `FileEntry` (chat-types), `AgentPendingFile` (agent-atoms)
- ✅ primitives: `alert-dialog`, `dropdown-menu`, `tooltip` (`@/shared/ui/`)
- ✅ FB.a: `FileTypeIcon`/`FileDropZone` (`@/features/chat-agent/components/file-browser/`), `listDirectoryEntries`+`DirectoryEntry` (tauri-bridge-stub)
- ✅ `atomFamily` from `jotai/utils` — already used by `agent-atoms.ts`

---

## Standard Retargets Table

| uclaw import | hermes retarget |
|---|---|
| `@/components/ui/<x>` | `@/shared/ui/<x>` |
| `@/components/file-browser/FileTypeIcon` | `@/features/chat-agent/components/file-browser/file-type-icon` |
| `@/components/files-rail/<X>` (sibling) | relative `./` or `../<kebab>` within the cluster |
| `@/components/files-rail/utils/tree-patch` | `@/features/chat-agent/utils/tree-patch` |
| `@/components/files-rail/hooks/<X>` | `@/features/chat-agent/hooks/<kebab>` |
| `@/atoms/files-rail-atoms` | `@/features/chat-agent/atoms/files-rail-atoms` |
| `@/atoms/files-rail-row-atoms` | `@/features/chat-agent/atoms/files-rail-row-atoms` |
| `@/atoms/preview-chip-atoms` | `@/features/chat-agent/atoms/preview-chip-atoms` |
| `@/atoms/<x>` (agent/workspace/app-mode/chat) | `@/features/chat-agent/atoms/<x>` |
| `@/lib/files-rail-helpers` | `@/features/chat-agent/lib/files-rail-helpers` |
| `@/lib/utils` (cn) | `@/shared/lib/cn` |
| `@/lib/tauri-bridge` | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/lib/agent-types` (AgentPendingFile) | `@/features/chat-agent/atoms/agent-atoms` (or wherever the type lives — verify) |
| `@tauri-apps/api/core` (raw invoke) | unchanged (verbatim) |
| `@tauri-apps/api/event` (listen) | unchanged (verbatim) |
| `@tauri-apps/plugin-dialog` | unchanged (resolved via vite alias → mock, Wave A0) |

**Canonical NOT_IMPLEMENTED marker:** `NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: <snake_case_command>` (the files+tabs sub-stack family, started in FB.a).

**Anti-god-file invariant:** `desktop/src/lib/` contains ONLY `bridge/`. New lib/atoms/hooks/utils go under `desktop/src/features/chat-agent/`.

**Git hygiene:** NEVER `git add -A` / `git add .` — this worktree accumulates unrelated `crates/**/*.rs` + `docs/parity/*` pollution. ALWAYS stage explicit paths; verify each commit with `git show --stat HEAD` (only `desktop/` files).

**Test shim:** hermes has NO `@/test-utils/render`. uclaw tests import `renderWithProviders` from there — replace with the established INLINE shim per test file:
```tsx
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
function renderWithProviders(
  ui: React.ReactElement,
  opts?: { store?: ReturnType<typeof createStore> },
) {
  return render(<Provider store={opts?.store}>{ui}</Provider>)
}
```
(If a uclaw test destructures `{ user }` from `renderWithProviders`, extend the shim to `userEvent.setup()` and return `{ ...render(...), user }` — match the Wave-D/3.5.s.c precedent.)

---

## Wave A — Foundation

### Task A0: Add `@tauri-apps/plugin-dialog` vite-alias mock

`WorkspacePanelFooter.tsx` imports `{ open as openDialog } from '@tauri-apps/plugin-dialog'` (verbatim). The package is NOT installed. Follow the EXISTING uninstalled-plugin pattern (`plugin-updater`/`plugin-process` are aliased to mocks in `vite.config.ts`).

**Files:** Create `desktop/src/__mocks__/tauri-plugin-dialog.ts`; Modify `desktop/vite.config.ts`

- [ ] **Step 1: Create the mock**
```ts
// desktop/src/__mocks__/tauri-plugin-dialog.ts
/**
 * Stub for @tauri-apps/plugin-dialog — used in dev/test where the Tauri
 * dialog plugin is not installed. Provides the minimal `open` surface that
 * files-rail/workspace/WorkspacePanelFooter imports so Vite's import-analysis
 * resolves it. Returns null (user-cancelled) so the verbatim-ported component
 * gracefully no-ops until the Rust dialog plugin ships.
 */
export interface OpenDialogOptions {
  multiple?: boolean
  directory?: boolean
  title?: string
  filters?: Array<{ name: string; extensions: string[] }>
}

export async function open(
  _options?: OpenDialogOptions,
): Promise<string | string[] | null> {
  return null
}
```

- [ ] **Step 2: Add the vite alias**

In `desktop/vite.config.ts`, inside the `alias: [ ... ]` array, add (alongside the existing `plugin-updater`/`plugin-process` entries, BEFORE the catch-all `@/` alias):
```ts
      {
        find: "@tauri-apps/plugin-dialog",
        replacement: path.resolve(
          import.meta.dirname,
          "./src/__mocks__/tauri-plugin-dialog.ts",
        ),
      },
```

- [ ] **Step 3: Verify + commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail/desktop
npm test -- --reporter=dot 2>&1 | tail -4   # expect 1001
cd ..
git add desktop/src/__mocks__/tauri-plugin-dialog.ts desktop/vite.config.ts
git commit -m "feat(desktop): add @tauri-apps/plugin-dialog vite-alias mock (FB.b Wave A0)"
git show --stat HEAD | head -5
```

### Task A1: Port `tree-patch.ts` util + test

**Files:**
- Sources: `/Users/ryanliu/Documents/uclaw/ui/src/components/files-rail/utils/tree-patch.ts` (144) + `tree-patch.test.ts` (62)
- Create: `desktop/src/features/chat-agent/utils/tree-patch.ts` + `tree-patch.test.ts`

- [ ] **Step 1: Read both sources + confirm no `@/` imports** (recon: stdlib only)
```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/files-rail/utils/tree-patch.ts
grep -nE "^import" /Users/ryanliu/Documents/uclaw/ui/src/components/files-rail/utils/tree-patch.ts
```
If any `@/...` import surfaces, escalate. Exports to confirm: `NodeKind`, `TreeNode` (`{kind, relPath, name, size, mtimeMs, children?}`), `ChangeKind`, `FileChange` (`{kind, relPath, newRelPath?, isDir}`), `applyChanges(roots, changes)`.

- [ ] **Step 2: Copy verbatim** (1-line attribution comment at top of each). The test imports only `./tree-patch` (retarget the sibling path if needed) + vitest — no `renderWithProviders` shim needed (pure unit test).

- [ ] **Step 3: Run tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail/desktop
npm test -- --reporter=dot 2>&1 | tail -4   # expect 1001 + tree-patch cases
```

- [ ] **Step 4: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail
git add desktop/src/features/chat-agent/utils/tree-patch.ts desktop/src/features/chat-agent/utils/tree-patch.test.ts
git commit -m "feat(desktop): port tree-patch util + test (FB.b Wave A1, verbatim)"
git show --stat HEAD | head -4
```

### Task A2: Port atoms + lib helper + preview-chip action

**Files:**
- Sources: `/Users/ryanliu/Documents/uclaw/ui/src/atoms/files-rail-atoms.ts` (51), `atoms/files-rail-row-atoms.ts` (38), `lib/files-rail-helpers.ts` (33), `atoms/preview-chip-atoms.ts` (port ONLY `addPendingAttachmentAction` + its required types/imports)
- Creates: `desktop/src/features/chat-agent/atoms/files-rail-atoms.ts`, `atoms/files-rail-row-atoms.ts`, `lib/files-rail-helpers.ts`, `atoms/preview-chip-atoms.ts`

- [ ] **Step 1: Port `files-rail-atoms.ts` verbatim**

Retargets: `@/components/files-rail/utils/tree-patch` → `@/features/chat-agent/utils/tree-patch`. Keep `atomFamily` from `jotai/utils` (consistent with `agent-atoms.ts`). Exports: `FilesRailTab`, `MountKind`, `MountRoot` (`{id,label,path,kind,editable}`), `TreeState`, `filesRailTabAtom`, `mountRootsAtomFamily`, `expandedPathsAtomFamily`, `fileTreeAtomFamily`, `filesRailRefreshTickAtom`, `bumpFilesRailRefreshAtom`. Add attribution comment.

- [ ] **Step 2: Port `files-rail-row-atoms.ts` verbatim**

Imports only `jotai`. Exports: `FileRowTarget` (`{mountId, absolutePath, workspaceRelPath, name, isDirectory}`), `renamingFilePathAtom`, `moveTargetAtom`, `deleteTargetAtom`. Add attribution.

- [ ] **Step 3: Port `files-rail-helpers.ts` verbatim**

Retarget: `@/atoms/files-rail-atoms` → `@/features/chat-agent/atoms/files-rail-atoms`. Exports `spaceIdForMount(mount, currentWorkspaceId)`. Add attribution.

- [ ] **Step 4: Port `addPendingAttachmentAction` into `atoms/preview-chip-atoms.ts`**

Read uclaw `/Users/ryanliu/Documents/uclaw/ui/src/atoms/preview-chip-atoms.ts` and port ONLY `addPendingAttachmentAction` (the write-only action atom) + any types it needs (`AddAttachmentPayload` shape). DO NOT port the chip-rendering exports (hermes already has those in `lib/preview-chip-stubs.tsx`). Retargets:
- `@/atoms/chat-atoms` (pendingAttachmentsAtom) → `@/features/chat-agent/atoms/chat-atoms`
- `@/atoms/agent-atoms` (agentPendingFilesAtom) → `@/features/chat-agent/atoms/agent-atoms`
- `@/lib/agent-types` (AgentPendingFile) → wherever `AgentPendingFile` lives in hermes (verify: `grep -rn "AgentPendingFile" desktop/src/features/chat-agent/atoms/agent-atoms.ts`)
- `@tauri-apps/api/core` (invoke for `preview_read_bytes`) → unchanged (raw invoke)
- `sonner` → unchanged

The `invoke('preview_read_bytes', ...)` call stays raw (verbatim). Add attribution. **Verify `pendingAttachmentsAtom`/`agentPendingFilesAtom` shapes match what the action writes** — if a field differs, the port must match the hermes atom shapes (these are pre-ported atoms; the action must write the shape they expect). If there's a mismatch, report DONE_WITH_CONCERNS.

- [ ] **Step 5: Run tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail/desktop
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4
```

- [ ] **Step 6: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail
git add desktop/src/features/chat-agent/atoms/files-rail-atoms.ts desktop/src/features/chat-agent/atoms/files-rail-row-atoms.ts desktop/src/features/chat-agent/lib/files-rail-helpers.ts desktop/src/features/chat-agent/atoms/preview-chip-atoms.ts
git commit -m "feat(desktop): port files-rail atoms + helpers + addPendingAttachmentAction (FB.b Wave A2)"
git show --stat HEAD | head -7
```

### Task A3: Add ~13 IPC stubs + 2 input types to tauri-bridge-stub.ts

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (append)

- [ ] **Step 1: Read uclaw signatures**

Read `/Users/ryanliu/Documents/uclaw/ui/src/lib/tauri-bridge.ts` for the EXACT signatures of: `filesRailListMounts`, `filesRailReadDir`, `filesRailWatchStart`, `filesRailWatchStop`, `renameArtifact`, `moveArtifact`, `deleteArtifactRecursive`, `attachWorkspaceDirectory`, `detachWorkspaceDirectory`, `detachSessionDirectory`, `copyFileIntoWorkspace`, plus the `RenameArtifactInput`/`MoveArtifactInput` types. Also confirm `openFolderDialog` already exists (it does — line ~1052) and `openFileDialog` (line ~375) — reuse, don't duplicate.

- [ ] **Step 2: Append the new section**

Append a new group at the end of `tauri-bridge-stub.ts`:
```ts
// === Plan FB.b additions ===
// ─── files-rail IPC stubs ─────────────────────────────────────────────────────
// files-rail/ components + useFileTree call these. All throw
// NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND until the Rust commands ship.
// MountRoot + TreeNode types are imported from the atom/util files (source of truth).

import type { MountRoot } from '../atoms/files-rail-atoms'
import type { TreeNode } from '../utils/tree-patch'

export interface RenameArtifactInput { /* port exact fields from uclaw tauri-bridge.ts */ }
export interface MoveArtifactInput { /* port exact fields from uclaw tauri-bridge.ts */ }

export async function filesRailListMounts(_sessionId: string | null): Promise<MountRoot[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: files_rail_list_mounts')
}
export async function filesRailReadDir(_mountId: string, _relPath: string, _sessionId?: string | null): Promise<TreeNode[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: files_rail_read_dir')
}
export async function filesRailWatchStart(_mountId: string, _sessionId?: string | null): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: files_rail_watch_start')
}
export async function filesRailWatchStop(_mountId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: files_rail_watch_stop')
}
export async function renameArtifact(_input: RenameArtifactInput): Promise<boolean> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: rename_artifact')
}
export async function moveArtifact(_input: MoveArtifactInput): Promise<boolean> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: move_artifact')
}
export async function deleteArtifactRecursive(_spaceId: string, _path: string): Promise<boolean> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: delete_artifact_recursive')
}
export async function attachWorkspaceDirectory(_workspaceId: string, _dirPath: string): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: attach_workspace_directory')
}
export async function detachWorkspaceDirectory(_workspaceId: string, _dirPath: string): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: detach_workspace_directory')
}
export async function detachSessionDirectory(_sessionId: string, _dirPath: string): Promise<string[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: detach_session_directory')
}
export async function copyFileIntoWorkspace(_workspaceId: string, _sourcePath: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND: copy_file_into_workspace')
}
```
**Fill the `RenameArtifactInput`/`MoveArtifactInput` interface bodies from the uclaw source — do NOT leave empty `{}`.** Confirm each param order/type against uclaw. If any of these already exists in the file (grep first), reuse and skip the duplicate.

- [ ] **Step 3: Verify tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail/desktop
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4   # expect ~1003 (tree-patch cases)
```

- [ ] **Step 4: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add files-rail IPC stubs + artifact input types (FB.b Wave A3)"
git show --stat HEAD | head -4
```

---

## Wave B — Hooks

### Task B1: Port `useFileTree` + `useFilesRailWatcher`

**Files:**
- Sources: `files-rail/hooks/useFileTree.ts` (141), `files-rail/hooks/useFilesRailWatcher.ts` (52)
- Creates: `desktop/src/features/chat-agent/hooks/use-file-tree.ts`, `hooks/use-files-rail-watcher.ts`

- [ ] **Step 1: Port `use-file-tree.ts` verbatim**

Retargets: `@/atoms/files-rail-atoms` → `@/features/chat-agent/atoms/files-rail-atoms`; `@/lib/tauri-bridge` (filesRailReadDir) → `@/features/chat-agent/lib/tauri-bridge-stub`; `@/components/files-rail/utils/tree-patch` → `@/features/chat-agent/utils/tree-patch`. Exports `useFileTree(mountId, sessionId?)` → `{nodes, loadState, errorMessage?, isExpanded, toggleExpand, applyExternalChanges, reload}`. Add attribution.

- [ ] **Step 2: Port `use-files-rail-watcher.ts` verbatim**

Retargets: `@/components/files-rail/utils/tree-patch` → `@/features/chat-agent/utils/tree-patch`. Keeps raw `listen<...>('files_rail:change', ...)` from `@tauri-apps/api/event`. Exports `useFilesRailWatcher(mountId, apply)`. Add attribution.

- [ ] **Step 3: tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail/desktop
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4
```

- [ ] **Step 4: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-files-rail
git add desktop/src/features/chat-agent/hooks/use-file-tree.ts desktop/src/features/chat-agent/hooks/use-files-rail-watcher.ts
git commit -m "feat(desktop): port useFileTree + useFilesRailWatcher hooks (FB.b Wave B, verbatim)"
git show --stat HEAD | head -4
```

---

## Wave C — Leaf components (+ 2 tests)

Port each verbatim with the retarget table. Sources under `/Users/ryanliu/Documents/uclaw/ui/src/components/files-rail/`. Destinations under `desktop/src/features/chat-agent/components/files-rail/`. Add a 1-line attribution comment to each. For the 2 tests, replace `renderWithProviders` from `@/test-utils/render` with the inline shim (see Test shim above).

### Task C1: `changes/ChangeRow.tsx` (43 LOC) → `changes/change-row.tsx`
Leaf, no sibling deps. Retargets: cn, `@/atoms/files-rail-*` if any. Commit `feat(desktop): port change-row (FB.b Wave C1, verbatim)`.

### Task C2: `workspace/RenameInput.tsx` (112) + test (107) → `workspace/rename-input.tsx` + `.test.tsx`
Pure local form. Test needs the inline shim. Commit `feat(desktop): port rename-input + test (FB.b Wave C2, verbatim)`.

### Task C3: `workspace/WorkspacePanelHeader.tsx` (155) → `workspace/workspace-panel-header.tsx`
Uses raw `invoke('reveal_path_in_file_manager', ...)` (verbatim). Retargets: cn, atoms. Commit `feat(desktop): port workspace-panel-header (FB.b Wave C3, verbatim)`.

### Task C4: `workspace/WorkspacePanelFooter.tsx` (150) → `workspace/workspace-panel-footer.tsx`
Imports `{ open as openDialog } from '@tauri-apps/plugin-dialog'` (resolved via Wave A0 alias — keep verbatim). Plus `attachWorkspaceDirectory`/`copyFileIntoWorkspace` from tauri-bridge-stub. Retargets: cn, atoms, tauri-bridge-stub. Commit `feat(desktop): port workspace-panel-footer (FB.b Wave C4, verbatim)`.

### Task C5: `workspace/MoveToDialog.tsx` (94) → `workspace/move-to-dialog.tsx`
Uses `moveArtifact` + `openFolderDialog` (both stubs). Retargets: atoms, tauri-bridge-stub. Commit `feat(desktop): port move-to-dialog (FB.b Wave C5, verbatim)`.

### Task C6: `workspace/DeleteConfirmDialog.tsx` (104) → `workspace/delete-confirm-dialog.tsx`
Uses `deleteArtifactRecursive` + `@/shared/ui/alert-dialog`. Retargets: atoms, tauri-bridge-stub, ui. Commit `feat(desktop): port delete-confirm-dialog (FB.b Wave C6, verbatim)`.

### Task C7: `workspace/FileRowMenu.tsx` (207) + test (88) → `workspace/file-row-menu.tsx` + `.test.tsx`
Uses `addPendingAttachmentAction` (Wave A2), raw `invoke('reveal_path_in_file_manager')`, `@/shared/ui/dropdown-menu`, the row atoms. Retargets: `@/atoms/preview-chip-atoms` → `@/features/chat-agent/atoms/preview-chip-atoms`, atoms, ui. Test needs inline shim + `vi.mock('@tauri-apps/api/core', ...)`. Commit `feat(desktop): port file-row-menu + test (FB.b Wave C7, verbatim)`.

After each: `cd desktop && npm test -- --reporter=dot 2>&1 | tail -4 && npx tsc -b 2>&1 | grep -c "error TS"` (expect tsc 28; tests grow with C2/C7 tests). Targeted `git add` + `git show --stat` per commit.

---

## Wave D — Tree components

### Task D1: `workspace/FileTreeNode.tsx` (178) → `workspace/file-tree-node.tsx`
Recursive component (renders itself + `FileRowMenu` + `RenameInput`). Retargets: sibling kebab paths (`./file-row-menu`, `./rename-input`), `@/features/chat-agent/components/file-browser/file-type-icon`, hooks, atoms, tauri-bridge-stub (renameArtifact). The recursive self-render is same-file (no circular import — verified in recon). Commit `feat(desktop): port file-tree-node (FB.b Wave D1, verbatim)`.

### Task D2: `workspace/AttachedDirRow.tsx` (258) → `workspace/attached-dir-row.tsx`
Embeds FileTreeNode + uses useFileTree/useFilesRailWatcher + detach IPCs + raw reveal invoke. Retargets: `./file-tree-node`, hooks, atoms, tauri-bridge-stub. Commit `feat(desktop): port attached-dir-row (FB.b Wave D2, verbatim)`.

### Task D3: `workspace/WorkspaceFilesPanel.tsx` (190) → `workspace/workspace-files-panel.tsx`
Orchestrator: embeds FileTreeNode, AttachedDirRow, WorkspacePanelHeader, WorkspacePanelFooter, MoveToDialog, DeleteConfirmDialog. Retargets: sibling kebab paths, hooks, atoms, tauri-bridge-stub (filesRailListMounts, filesRailWatchStart/Stop). Commit `feat(desktop): port workspace-files-panel (FB.b Wave D3, verbatim)`.

### Task D4: `changes/FileChangesPanel.tsx` (46) → `changes/file-changes-panel.tsx`
Embeds ChangeRow (stub panel — empty list). Retargets: `./change-row`, atoms. Commit `feat(desktop): port file-changes-panel (FB.b Wave D4, verbatim)`.

After each: test + tsc (expect 28) + targeted commit + `git show --stat`.

---

## Wave E — Rail entry + barrels

### Task E1: `FilesRailTabs.tsx` (37) → `files-rail-tabs.tsx`
Tab switcher (workspace/changes). Retargets: `@/atoms/files-rail-atoms`, cn. Commit `feat(desktop): port files-rail-tabs (FB.b Wave E1, verbatim)`.

### Task E2: `index.tsx` (38) → `index.tsx` (FilesRail entry)
Composes FilesRailTabs + WorkspaceFilesPanel + FileChangesPanel. Retargets: sibling kebab paths, atoms. This is the cluster's public entry (`<FilesRail sessionId={...} ... />`). It is NOT wired into a parent in this PR (carry-forward — consistent with FB.a). Commit `feat(desktop): port FilesRail index entry (FB.b Wave E2, verbatim)`.

### Task E3: Mount smoke test for the FilesRail entry
Write `desktop/src/features/chat-agent/components/files-rail/index.test.tsx` — a minimal mount test that renders `<FilesRail>` inside the inline `renderWithProviders` shim, mocks `filesRailListMounts` → `[]` (and any other mount-effect IPC) so it renders the empty workspace panel without throwing. Assert the workspace/changes tab labels render (read the verbatim `FilesRailTabs` for the exact Chinese labels). Commit `feat(desktop): add FilesRail mount smoke test (FB.b Wave E3)`.

---

## Wave F — Final sweep

- [ ] **Step 1: Anti-god-file** — `find desktop/src/lib -type f -not -path '*/bridge/*'` → empty.
- [ ] **Step 2: Storage-key audit** — `git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/chat-agent/components/files-rail/ desktop/src/features/chat-agent/atoms/files-rail* desktop/src/features/chat-agent/hooks/use-file* || echo clean`.
- [ ] **Step 3: Branch pollution** — `git diff main..HEAD --name-only | grep -vE "^desktop/|^docs/superpowers/" || echo "clean"`. If any `crates/`/`docs/parity/` appears, `git restore` it.
- [ ] **Step 4: Verbatim residual scan** — `grep -rn "@/test-utils/render\|@/components/files-rail\|@/atoms/files-rail\|@/lib/files-rail-helpers" desktop/src/features/chat-agent/components/files-rail/ desktop/src/features/chat-agent/hooks/ desktop/src/features/chat-agent/atoms/files-rail* || echo "all retargeted"` → confirm NO un-retargeted uclaw paths remain.
- [ ] **Step 5: tsc + final tests** — `cd desktop && npx tsc -b 2>&1 | grep -c "error TS"` (expect 28); `npm test -- --reporter=dot 2>&1 | tail -10` (expect ~1006, 0 failing).
- [ ] **Step 6: Commit only if a fixable issue surfaced** — targeted `git add desktop/...`; `chore(desktop): Plan FB.b final sweep`.

---

## Final Self-Review Checklist

- [ ] Wave A: plugin-dialog mock + alias; tree-patch util+test; files-rail atoms + row-atoms + helpers + preview-chip action; ~11 new IPC stubs + 2 input types
- [ ] Wave B: useFileTree + useFilesRailWatcher hooks
- [ ] Wave C: 7 leaf components (+ 2 tests) ported
- [ ] Wave D: FileTreeNode (recursive) + AttachedDirRow + WorkspaceFilesPanel + FileChangesPanel
- [ ] Wave E: FilesRailTabs + FilesRail index + mount smoke test
- [ ] Anti-god-file: `desktop/src/lib/` only `bridge/`
- [ ] Test count up by ≥4 (1001 → ≥1005; tree-patch + rename-input + file-row-menu + FilesRail smoke)
- [ ] tsc residual stable at 28
- [ ] No branch pollution (desktop/ + docs/superpowers/ only); every commit verified via `git show --stat`
- [ ] Canonical `NOT_IMPLEMENTED_IN_PLAN_FB_BACKEND` marker for all new stubs
- [ ] No `@/test-utils/render` references (inline shim used); no un-retargeted `@/atoms/files-rail`/`@/components/files-rail` paths
- [ ] FilesRail entry ported but NOT wired into a parent (carry-forward documented)

---

## Carry-Forward Follow-ups

After FB.b merges:
1. **Wire FilesRail into the workspace rail / app-shell left sidebar** (FB.a's FileBrowser + FB.b's FilesRail both await a wiring step — likely folded into FB.c or a small follow-up).
2. **Plan FB.c — tabs cluster** (~1,245 LOC): TabBar/Switcher/Preview real; TabContent + MainArea stub the unported ChatView/BrowserPanel/Panel/WorkspaceShell; `useCloseTab` + `useWindowDragOnMove` hooks.
3. **Rust backends** for the FB IPC stubs: `files_rail_*` (list_mounts/read_dir/watch_start/watch_stop), `rename_artifact`, `move_artifact`, `delete_artifact_recursive`, `attach/detach_*_directory`, `copy_file_into_workspace`, `preview_read_bytes`, `list_directory_entries` (FB.a), plus the real `@tauri-apps/plugin-dialog` plugin (replacing the vite-alias mock) when the dialog backend lands.
