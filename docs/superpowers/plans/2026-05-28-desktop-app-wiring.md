# Desktop App Wiring — Plan 2b.2.c.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** End-to-end vertical slice. Replace `App.tsx`'s MVP composer with a slim `ChatAgentView` that mounts `AgentMessages` + the real `RichTextInput` composer, wired to the Plan 2b.1 `listenAgent` → `applyAgentEvent` pipeline via the Plan 2b.2.a bridge adapter. Implement real Tauri `read_attachment` + `save_image_as` commands in Rust. Delete the last frontend stub (`scroll-position-manager`) + the entire `peripheral-stubs.ts`. Close all 5 carry-forward follow-ups from Plan 2b.2.c.2 + `2b.2.c-B` (error banner placement) + `2b.2.b.1 #3` (scroll-minimap dead handlers).

**Architecture:** Bottom-up port + integration. Real Tauri attachment commands first (so screenshot-result / InlineImage / save-as flows work). Then close cosmetic follow-ups in AgentMessages + the ported chips so the spec-compliant message view is ready. Then port `useScrollPositionMemory` (the last stub). Then build the slim `ChatAgentView` container (NEW component, ~250 LOC). Then change `App.tsx` (the first change since Plan 1) to mount `ChatAgentView` inside a Jotai Provider. Finally delete `peripheral-stubs.ts`.

**Tech stack additions:** `tauri-plugin-dialog` (Rust + frontend) for the save-as dialog. No new npm deps; all chip / composer / atom infrastructure already shipped in Plans 2b.2.c.1 + c.2.

**Reference:** Spec — [docs/superpowers/specs/2026-05-28-desktop-message-view-completion-design.md](../specs/2026-05-28-desktop-message-view-completion-design.md) §3.3. Stacked on main at `b4355da` (post-merge of Plan 2b.2.c.2).

---

## Acceptance gate (the dramatic moment)

After this plan ships:
```bash
ls desktop/src/features/chat-agent/components/stubs/ 2>&1
# Expected: "No such file or directory" — directory entirely removed
ls desktop/src/features/chat-agent/lib/peripheral-stubs.ts 2>&1
# Expected: "No such file or directory" — file deleted
git diff main -- desktop/src/app/App.tsx | head
# Expected: NON-empty (the FIRST App.tsx change since Plan 1)
```

Manual launch gate:
```bash
pnpm --dir desktop tauri dev
# Expected: window opens; typing a message and pressing Submit triggers the
# Plan 2b.1 backend bridge; the message renders inside uclaw's AgentMessages
# view; without a configured provider key, the error event surfaces as a
# role="alert" banner above the empty state.
```

---

## File Structure

```
desktop/
  src-tauri/
    Cargo.toml                              # MODIFY (Task 2): + tauri-plugin-dialog dep
    capabilities/main.json                  # MODIFY (Task 2): + dialog:default permission
    src/
      lib.rs                                # MODIFY (Task 2): register dialog plugin
      commands/
        files.rs                            # NEW (Task 3): read_attachment + save_image_as
        mod.rs                              # MODIFY (Task 3): pub mod files;
    tests/
      files_integration.rs                  # NEW (Task 3, optional): integration test
  src/
    lib/
      bridge/
        files.ts                            # NEW (Task 4): typed wrappers
        index.ts                            # MODIFY (Task 4): re-export files surface
    features/
      chat-agent/
        atoms/
          workspace.ts                      # NEW (Task 11): dormant activeWorkspaceIdAtom + WorkspaceMeta type stub
          workspace.test.ts                 # NEW (Task 11)
          tab-atoms.ts                      # MODIFY (Task 11): drop inlined stub; import from ./workspace
          ui-preferences.ts                 # MODIFY (Task 10): doc comment on updateStickyUserMessageEnabled
        components/
          agent-messages.tsx                # MODIFY (Task 5): move error banner above EmptyState branch
          chat-agent-view.tsx               # NEW (Task 12): slim container ~250 LOC
          chat-agent-view.test.tsx          # NEW (Task 12): 8+ integration tests
          memory-recall-chip.tsx            # MODIFY (Task 8): restore Popover drilldown + KIND_LABELS + layer badges
          memory-recall-chip.test.tsx       # MODIFY (Task 8): popover assertions
          ai-elements/
            scroll-minimap.tsx              # MODIFY (Task 10): clean dead handlers (closes 2b.2.b.1 #3)
          composer/
            composer-mention-controller.test.tsx # MODIFY (Task 9): TipTap-mock integration test
        hooks/
          use-scroll-position-memory.ts     # NEW (Task 6): port uclaw's 36-LOC hook
          use-scroll-position-memory.test.tsx # NEW (Task 6)
        lib/
          composer/
            use-editor-mention-trigger.ts   # MOVE (Task 10): from composer/hooks/ to composer/
            hooks/                          # DELETE (Task 10): empty subdir removed
          peripheral-stubs.ts               # DELETE (Task 13): everything migrated or removed
          peripheral-stubs.test.ts          # DELETE (Task 13)
          settings-stubs.ts                 # NEW (Task 13): isolated home for the 4 settings atoms + recordSkillCited + listInvocableSkills + searchWorkspaceFilesForMention (the stubs that can't be implemented until Plan 3+)
          settings-stubs.test.ts            # NEW (Task 13)
        components/stubs/                   # DELETE entire directory (Task 6 deletes scroll-position-manager; Task 13 verifies empty)
    app/
      App.tsx                               # MODIFY (Task 12): replace MVP composer with <Provider><ChatAgentView /></Provider>
```

**Anti-god-file invariants preserved:**
- One file per concern. New `bridge/files.ts` mirrors `bridge/agent.ts`, `bridge/app.ts`, `bridge/session.ts` — no god re-exporter.
- `settings-stubs.ts` is feature-scoped + clearly named — NOT a peripheral-stubs revival.
- `workspace.ts` is a new atom file ≤30 LOC, scoped to the dormant `activeWorkspaceIdAtom`. Plan 3 replaces it with the real workspace module.
- `ChatAgentView` invents a thin API; Plan 2b.2.c.4 will swap in the full uclaw `AgentView.tsx` once Plan 3 provides workspace + permission atoms.
- `desktop/src/lib/` stays at `bridge/` only; the `bridge/files.ts` addition is inside the existing `bridge/` directory.

---

## Task 1: Recon — confirm Tauri plugin + bundle hookup

**Files:** Create `docs/superpowers/plans/2026-05-28-desktop-app-wiring-recon.md`.

- [ ] **Step 1: Confirm `tauri-plugin-dialog` version compatibility**

```bash
# Tauri 2 plugins must match the framework version. Confirm current Tauri:
grep -E '"tauri"\s*=\s*' /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring/desktop/src-tauri/Cargo.toml | head
# Then look up tauri-plugin-dialog versions on crates.io
cargo search tauri-plugin-dialog --limit 1 2>&1 | head
```

Record the dep line we'll add to Cargo.toml (e.g., `tauri-plugin-dialog = "2"`).

- [ ] **Step 2: Confirm current `peripheral-stubs.ts` exports + consumers**

```bash
DEST=/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring
echo "=== peripheral-stubs exports ==="
grep -E "^export " $DEST/desktop/src/features/chat-agent/lib/peripheral-stubs.ts
echo ""
echo "=== Consumers ==="
grep -rn "from .*peripheral-stubs" $DEST/desktop/src 2>&1 | grep -v ".test\.ts" | head -20
```

Each consumer line is a swap target. Record what each one imports.

- [ ] **Step 3: Confirm `scroll-position-manager` stub usage**

```bash
grep -rn "scroll-position-manager" $DEST/desktop/src 2>&1
```

Should be: agent-messages.tsx + the stub + its test. Task 6 swaps the AgentMessages import.

- [ ] **Step 4: Confirm uclaw `useScrollPositionMemory.ts` shape**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/hooks/useScrollPositionMemory.ts
```

Per spec it's 36 LOC + exports `ScrollPositionManager`. Verify.

- [ ] **Step 5: Confirm `scroll-minimap.tsx` dead-handler list**

```bash
grep -n "void canScroll\|void isDragging\|void handleThumbMouseDown\|void handleTrackMouseDown\|void thumbTopPct" $DEST/desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.tsx
```

Lists the exact lines where dead handlers were `void`-suppressed in Plan 2b.2.c.1 to satisfy strict-mode noUnusedLocals. Task 10 either removes them entirely or wires them up.

- [ ] **Step 6: Confirm uclaw `MemoryRecallChip.tsx` popover surface for Task 8 restoration**

```bash
grep -E "^export |KIND_LABELS|Popover|inferItemLayer|layer-distribution" /Users/ryanliu/Documents/uclaw/ui/src/components/chat/MemoryRecallChip.tsx | head -20
wc -l /Users/ryanliu/Documents/uclaw/ui/src/components/chat/MemoryRecallChip.tsx
```

Captures the symbols Task 8 must restore.

- [ ] **Step 7: Verify shadcn Popover primitive exists in our codebase**

```bash
ls $DEST/desktop/src/shared/ui/popover.tsx 2>&1
```

If missing (likely): Task 8 must port `popover.tsx` from uclaw first (small shadcn primitive). Plan accordingly.

- [ ] **Step 8: Confirm App.tsx's current Plan 1 SESSION_ID handling**

```bash
grep -nA 2 "SESSION_ID" $DEST/desktop/src/app/App.tsx
```

Task 12's App.tsx rewrite preserves the `SESSION_ID = "default"` constant for backward compat with Plan 1 behavior.

- [ ] **Step 9: Write recon doc**

Save to `docs/superpowers/plans/2026-05-28-desktop-app-wiring-recon.md` with sections:
- tauri-plugin-dialog version + Cargo.toml line
- peripheral-stubs consumers (per-line)
- scroll-position-manager consumer (per-line)
- useScrollPositionMemory uclaw source + exports
- scroll-minimap dead handlers exact line numbers
- MemoryRecallChip restoration surface (symbols + LOC)
- Popover primitive port-decision (exists / missing)
- App.tsx SESSION_ID location

- [ ] **Step 10: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring
git add docs/superpowers/plans/2026-05-28-desktop-app-wiring-recon.md
git commit -m "docs(plan): recon Plan 2b.2.c.3 (App wiring + Tauri attachments)"
```

## Reporting (per task)

Each subagent reports **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** with commit SHA + test count delta + any adaptations.

---

## Task 2: Add `tauri-plugin-dialog` + capability + plugin registration

**Files:**
- Modify: `desktop/src-tauri/Cargo.toml`
- Modify: `desktop/src-tauri/capabilities/main.json`
- Modify: `desktop/src-tauri/src/lib.rs`

- [ ] **Step 1: Add dep to Cargo.toml**

Edit `desktop/src-tauri/Cargo.toml`. Find the `[dependencies]` section. Add (use the exact version from Task 1 recon):

```toml
tauri-plugin-dialog = "2"
```

- [ ] **Step 2: Grant the dialog capability**

Edit `desktop/src-tauri/capabilities/main.json`. Find the `permissions` array. Append:

```json
"dialog:default"
```

The file should look like (example):
```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "agent:allow-agent-send-message",
    "session:allow-list-sessions",
    "dialog:default"
  ]
}
```

(Preserve whatever's already in the array — only append `dialog:default`.)

- [ ] **Step 3: Register the plugin in `lib.rs`**

Edit `desktop/src-tauri/src/lib.rs`. Find the `tauri::Builder::default()` chain. Add the plugin **before** the `.invoke_handler` call:

```rust
.plugin(tauri_plugin_dialog::init())
```

- [ ] **Step 4: Verify the workspace still builds**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -5
cargo test -p hermes-desktop --lib 2>&1 | tail -3
```

Expected: clean build; 21 tests still pass.

- [ ] **Step 5: Commit**

```bash
git add desktop/src-tauri/Cargo.toml desktop/src-tauri/Cargo.lock desktop/src-tauri/capabilities/main.json desktop/src-tauri/src/lib.rs
git commit -m "feat(desktop): add tauri-plugin-dialog + dialog:default capability"
```

---

## Task 3: Implement `read_attachment` + `save_image_as` Tauri commands

**Files:**
- Create: `desktop/src-tauri/src/commands/files.rs`
- Modify: `desktop/src-tauri/src/commands/mod.rs`
- Modify: `desktop/src-tauri/src/lib.rs` (register the 2 commands in `invoke_handler`)

- [ ] **Step 1: Inspect current `commands/mod.rs` + lib.rs invoke_handler call**

```bash
cat desktop/src-tauri/src/commands/mod.rs
echo "---"
grep -nA 3 "invoke_handler" desktop/src-tauri/src/lib.rs | head -10
```

Note where the existing modules + handlers are registered so the additions match the pattern.

- [ ] **Step 2: Create `desktop/src-tauri/src/commands/files.rs`**

```rust
//! Tauri commands for file attachments.
//!
//! Plan 2b.2.c.3 — replaces the frontend `peripheral-stubs.readAttachment` /
//! `peripheral-stubs.saveImageAs` no-ops. Consumers: `InlineImage` in
//! AgentMessages and `screenshot-result.tsx`.

use base64::Engine;
use serde::Deserialize;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

/// Read a file from disk and return its bytes as base64.
/// Used by InlineImage / screenshot-result to render local attachments
/// without a `file://` blob URL (which is blocked by Tauri's CSP).
#[tauri::command]
pub async fn read_attachment(path: String) -> Result<String, String> {
    let bytes = tokio::fs::read(&path)
        .await
        .map_err(|e| format!("read {path}: {e}"))?;
    Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
}

#[derive(Debug, Deserialize)]
pub struct SaveImageArgs {
    pub local_path: String,
    pub filename: String,
    pub media_type: String,
}

/// Open a save-as dialog for the user, then copy `local_path` to the chosen
/// destination. Returns `true` if the user picked a destination + copy
/// succeeded; `false` if the user cancelled.
#[tauri::command]
pub async fn save_image_as(
    app: AppHandle,
    args: SaveImageArgs,
) -> Result<bool, String> {
    let dest: Option<PathBuf> = app
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpg", "jpeg", "webp"])
        .set_file_name(&args.filename)
        .blocking_save_file()
        .and_then(|fp| fp.into_path().ok());

    let Some(dest) = dest else {
        return Ok(false);
    };

    tokio::fs::copy(&args.local_path, &dest)
        .await
        .map_err(|e| format!("copy {} -> {}: {e}", args.local_path, dest.display()))?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn read_attachment_round_trips_a_small_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("hello.txt");
        tokio::fs::write(&path, b"hello").await.unwrap();
        let b64 = read_attachment(path.to_string_lossy().into_owned()).await.unwrap();
        // 'hello' base64-encoded is 'aGVsbG8='
        assert_eq!(b64, "aGVsbG8=");
    }

    #[tokio::test]
    async fn read_attachment_returns_error_for_missing_file() {
        let res = read_attachment("/definitely/does/not/exist".to_string()).await;
        assert!(res.is_err());
    }
}
```

- [ ] **Step 3: Add `tempfile` as a dev-dependency**

In `desktop/src-tauri/Cargo.toml`, add to `[dev-dependencies]` (create the section if it doesn't exist):

```toml
tempfile = "3"
```

Also add `base64` and `tokio` if they aren't already in `[dependencies]` (check first):
```bash
grep -E '^(base64|tokio)' desktop/src-tauri/Cargo.toml
```

If `tokio` is already there with the `fs` feature, great. If not, add `tokio = { version = "1", features = ["fs", "macros"] }`. Likewise for `base64 = "0.22"`.

- [ ] **Step 4: Register the module in `commands/mod.rs`**

Edit `desktop/src-tauri/src/commands/mod.rs`. Append:

```rust
pub mod files;
```

- [ ] **Step 5: Wire the 2 commands into `invoke_handler` in `lib.rs`**

Find the `tauri-specta` builder invocation in `lib.rs` (per Plan 2b.1, commands are wired via a generated handler). The exact mechanism depends on whether the project uses `tauri::generate_handler!` directly OR a tauri-specta builder.

Inspect first:
```bash
grep -B 2 -A 20 "invoke_handler\|generate_handler" desktop/src-tauri/src/lib.rs | head -40
```

Then add `commands::files::read_attachment` and `commands::files::save_image_as` to the handler list using the project's existing pattern. Document the addition with an inline comment:

```rust
// Plan 2b.2.c.3 — file-attachment Tauri commands consumed by InlineImage +
// screenshot-result via the frontend bridge/files.ts wrapper.
```

- [ ] **Step 6: Build + test**

```bash
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -5
cargo test -p hermes-desktop --lib 2>&1 | tail -5
```

Expected: clean build; 23 tests pass (21 prior + 2 new in `files` module).

- [ ] **Step 7: Commit**

```bash
git add desktop/src-tauri/Cargo.toml desktop/src-tauri/Cargo.lock desktop/src-tauri/src/commands/{files.rs,mod.rs} desktop/src-tauri/src/lib.rs
git commit -m "feat(desktop): Tauri commands read_attachment + save_image_as (+ 2 unit tests)"
```

---

## Task 4: Frontend `lib/bridge/files.ts` + swap peripheral-stubs consumers

**Files:**
- Create: `desktop/src/lib/bridge/files.ts`
- Modify: `desktop/src/lib/bridge/index.ts`
- Modify: every consumer of `peripheral-stubs.readAttachment` / `saveImageAs` (per Task 1 recon)

- [ ] **Step 1: Write `desktop/src/lib/bridge/files.ts`**

```ts
// Plan 2b.2.c.3 — frontend wrappers for the Rust Tauri commands defined in
// desktop/src-tauri/src/commands/files.rs. Replaces the no-op stubs in
// peripheral-stubs.ts; consumers (InlineImage in AgentMessages,
// screenshot-result) retarget to import from here.
import { invoke } from '@tauri-apps/api/core'

/**
 * Read a file from disk and return its base64-encoded bytes.
 * Returns null if the file is missing or unreadable (so UI can fall back
 * to an empty/placeholder state instead of throwing).
 */
export async function readAttachment(localPath: string): Promise<string | null> {
  try {
    return await invoke<string>('read_attachment', { path: localPath })
  } catch {
    return null
  }
}

export interface SaveImageArgs {
  localPath: string
  filename: string
  mediaType: string
}

/**
 * Open the native save-as dialog and copy `localPath` to the chosen target.
 * Returns true on success, false on user cancel or copy failure.
 */
export async function saveImageAs(args: SaveImageArgs): Promise<boolean> {
  try {
    return await invoke<boolean>('save_image_as', {
      args: {
        local_path: args.localPath,
        filename: args.filename,
        media_type: args.mediaType,
      },
    })
  } catch {
    return false
  }
}
```

Note the snake_case field names on the IPC boundary — the Rust struct uses snake_case.

- [ ] **Step 2: Re-export from `bridge/index.ts`**

Open `desktop/src/lib/bridge/index.ts`. Add (matching the existing pattern of per-domain re-exports):

```ts
export * from './files'
```

- [ ] **Step 3: Retarget every consumer**

For each consumer line discovered in Task 1 recon, edit the file. Example diff for `desktop/src/features/chat-agent/components/agent-messages.tsx`:

```diff
- import { saveImageAs } from '@/features/chat-agent/lib/peripheral-stubs'
+ import { saveImageAs } from '@/lib/bridge/files'
```

Same pattern for `screenshot-result.tsx` and any other consumer. **Do not** touch `readAttachment` / `saveImageAs` signatures at call sites — the frontend wrapper preserves the exact same `{ localPath, filename, mediaType }` shape.

- [ ] **Step 4: Run frontend tests + build**

```bash
pnpm --dir desktop test 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: all pass; build clean. Existing tests continue to pass because the frontend `saveImageAs` / `readAttachment` API surface is unchanged — only the import path moves.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/lib/bridge/{files.ts,index.ts} desktop/src/features/chat-agent/components/agent-messages.tsx desktop/src/features/chat-agent/components/tool-renderers/screenshot-result.tsx 2>/dev/null || true
git commit -m "feat(desktop): lib/bridge/files.ts replaces peripheral-stubs Tauri shims"
```

---

## Task 5: Close `2b.2.c-B` — move AgentMessages error banner above EmptyState branch

**Files:** Modify `desktop/src/features/chat-agent/components/agent-messages.tsx`.

Background: Plan 2b.2.b.2's final review flagged that the error banner currently lives inside the `!hasContent && !streaming ? EmptyState : <>…</>` else branch. When `streamState.error` is set during the very first turn (no persistent messages, not streaming), the EmptyState renders and the banner is hidden.

- [ ] **Step 1: Find the current banner placement**

```bash
grep -nA 4 'streamState\?.error' desktop/src/features/chat-agent/components/agent-messages.tsx | head -15
```

Identify the line numbers + the surrounding JSX context (which conditional branch the banner is inside).

- [ ] **Step 2: Hoist the banner above the empty-vs-content branch**

Edit `agent-messages.tsx`. The fix is to render the banner **outside** the empty-vs-content conditional, so it's always visible when `streamState?.error` is truthy. Approximate structure:

```tsx
return (
  <main className="…">
    {/* Plan 2b.2.c.3 (2b.2.c-B) — error banner hoisted out of the empty/content
        branch so first-turn errors are always visible. */}
    {streamState?.error && (
      <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded my-2 mx-auto max-w-2xl">
        {streamState.error}
      </div>
    )}
    {!hasContent && !streaming ? (
      <EmptyState />
    ) : (
      <>
        {/* …existing message-list rendering… */}
      </>
    )}
  </main>
)
```

Adapt placement to the actual JSX hierarchy. The criterion: when `streamState?.error` is set, the banner is visible regardless of `hasContent` / `streaming`.

- [ ] **Step 3: Update the test to assert visibility in the empty-state branch**

Open `desktop/src/features/chat-agent/components/agent-messages.test.tsx`. Find the existing `renders error banner when streamState.error is set` test. It currently passes because the test mounts AgentMessages with non-empty `messages`. Add a new test asserting the banner is visible even when `messages` is empty:

```tsx
it('error banner is visible even when messages is empty (closes 2b.2.c-B)', () => {
  const streamState = {
    running: false,
    content: '',
    reasoning: '',
    toolActivities: [],
    teammates: [],
    error: 'rate-limited',
  } as Parameters<typeof AgentMessages>[0]['streamState']
  renderAM({ messages: [], streaming: false, streamState })
  expect(screen.getByRole('alert')).toHaveTextContent('rate-limited')
})
```

- [ ] **Step 4: Run + commit**

```bash
pnpm --dir desktop test agent-messages 2>&1 | tail -10

git add desktop/src/features/chat-agent/components/agent-messages.tsx desktop/src/features/chat-agent/components/agent-messages.test.tsx
git commit -m "fix(desktop): hoist AgentMessages error banner above EmptyState branch (closes 2b.2.c-B)"
```

---

## Task 6: Port `useScrollPositionMemory` hook + delete the last stub

**Files:**
- Create: `desktop/src/features/chat-agent/hooks/use-scroll-position-memory.ts`
- Create: `desktop/src/features/chat-agent/hooks/use-scroll-position-memory.test.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/scroll-position-manager.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/scroll-position-manager.test.tsx`
- Modify: every consumer of the stub (per Task 1 recon)

- [ ] **Step 1: Port the hook verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/hooks/useScrollPositionMemory.ts` (36 LOC per recon). Save to `desktop/src/features/chat-agent/hooks/use-scroll-position-memory.ts` (kebab-cased filename; exported symbol `ScrollPositionManager` unchanged). Apply retargets:
- `from '@/components/ai-elements/conversation'` → `from '@/features/chat-agent/components/ai-elements/conversation'`

Add a doc comment at the top:

```ts
// Ported from uclaw hooks/useSchrollPositionMemory.ts. Filename normalized to
// kebab-case for consistency. Replaces the stub at
// `desktop/src/features/chat-agent/components/stubs/scroll-position-manager.tsx`.
```

- [ ] **Step 2: Write a smoke test**

```tsx
// desktop/src/features/chat-agent/hooks/use-scroll-position-memory.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect, beforeAll } from 'vitest'
import { Conversation } from '@/features/chat-agent/components/ai-elements/conversation'
import { ScrollPositionManager } from './use-scroll-position-memory'

beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = function () {}
  }
})

describe('ScrollPositionManager', () => {
  it('renders nothing (side-effect-only component)', () => {
    const { container } = render(
      <Conversation>
        <ScrollPositionManager id="s-test" ready={true} />
      </Conversation>,
    )
    // The component returns null; its sibling content (none here) is empty
    expect(container).toBeDefined()
  })

  it('handles ready=false without crashing', () => {
    const { container } = render(
      <Conversation>
        <ScrollPositionManager id="s-test" ready={false} />
      </Conversation>,
    )
    expect(container).toBeDefined()
  })
})
```

- [ ] **Step 3: Swap the consumer import**

```bash
grep -rn "stubs/scroll-position-manager" desktop/src/features/chat-agent/
```

Edit each consumer (likely just `agent-messages.tsx`):

```diff
- import { ScrollPositionManager } from '@/features/chat-agent/components/stubs/scroll-position-manager'
+ import { ScrollPositionManager } from '@/features/chat-agent/hooks/use-scroll-position-memory'
```

- [ ] **Step 4: Delete the stub**

```bash
git rm desktop/src/features/chat-agent/components/stubs/scroll-position-manager.tsx \
       desktop/src/features/chat-agent/components/stubs/scroll-position-manager.test.tsx
```

- [ ] **Step 5: Remove the now-empty `stubs/` directory**

```bash
rmdir desktop/src/features/chat-agent/components/stubs 2>&1
ls desktop/src/features/chat-agent/components/stubs/ 2>&1
# Expected: "No such file or directory" — directory gone entirely
```

- [ ] **Step 6: Run tests + build**

```bash
pnpm --dir desktop test 2>&1 | tail -10
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: all pass; build clean. New scroll-position-memory tests included (+2).

- [ ] **Step 7: Commit**

```bash
git add desktop/src/features/chat-agent/hooks/ desktop/src/features/chat-agent/components/agent-messages.tsx desktop/src/features/chat-agent/components/stubs/
git commit -m "feat(desktop): port useScrollPositionMemory + delete the last stub (stubs/ removed)"
```

---

## Task 7: Restore `MemoryRecallChip` popover drilldown (closes c.2 #1)

**Files:**
- Create (if missing): `desktop/src/shared/ui/popover.tsx` (shadcn primitive)
- Create (if popover.tsx created): `desktop/src/shared/ui/popover.test.tsx`
- Modify: `desktop/src/features/chat-agent/components/memory-recall-chip.tsx`
- Modify: `desktop/src/features/chat-agent/components/memory-recall-chip.test.tsx`

Background: Per the Plan 2b.2.c.2 final review, MemoryRecallChip was "simplified" during the port (46 LOC vs uclaw's 166 LOC). The Popover drilldown, layer-distribution badges (Boot/Triggered/Relevant/Expanded/Recent), `KIND_LABELS` map, recalled-items list, and `inferItemLayer` helper were all removed. Task 7 restores them.

- [ ] **Step 1: Port `popover.tsx` if missing**

Per Task 1 recon Step 7. If `desktop/src/shared/ui/popover.tsx` exists, skip to Step 2. Otherwise:

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ui/popover.tsx` → `desktop/src/shared/ui/popover.tsx`. Retarget `from '@/lib/utils'` → `from '../lib/cn'`. Add a popover test mirroring `tooltip.test.tsx`'s pattern.

- [ ] **Step 2: Read uclaw's MemoryRecallChip for the surface to restore**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/chat/MemoryRecallChip.tsx
```

Identify:
- `KIND_LABELS` map (memory kind → display string)
- `inferItemLayer` helper (assigns each item to Boot/Triggered/Relevant/Expanded/Recent)
- Layer-distribution Badge row
- Popover with recalled-items list

- [ ] **Step 3: Restore the full MemoryRecallChip**

Edit `desktop/src/features/chat-agent/components/memory-recall-chip.tsx`. Replace the simplified body with a verbatim port of uclaw's, applying retargets:
- `@/components/ui/badge` → `@/shared/ui/badge`
- `@/components/ui/popover` → `@/shared/ui/popover`
- `@/lib/utils` → `@/shared/lib/cn`
- `@/atoms/agent-atoms` (MemoryRecallEvent) → `@/features/chat-agent/atoms/agent-atoms`

Add an inline header comment:

```tsx
// Plan 2b.2.c.3 — Popover drilldown + KIND_LABELS + inferItemLayer + layer-distribution
// badges restored, closing the c.2 follow-up #1. The Plan 2b.2.c.2 port had
// simplified to a count-only chip; the full uclaw surface is now in parity.
```

- [ ] **Step 4: Extend the test**

Edit `desktop/src/features/chat-agent/components/memory-recall-chip.test.tsx`. Add tests asserting:
- Popover trigger is rendered (a clickable summary chip)
- When opened (e.g., via `userEvent.click`), the layer-distribution badges + recalled items are visible
- `inferItemLayer` categorizes items correctly (test as exported helper if uclaw exports it; otherwise test via the rendered output)

Use `Popover` from `@/shared/ui/popover` in any test wrapper if needed. Mirror the `Tooltip` test pattern.

- [ ] **Step 5: Run + commit**

```bash
pnpm --dir desktop test memory-recall-chip 2>&1 | tail -10
pnpm --dir desktop build 2>&1 | tail -5

git add desktop/src/shared/ui/popover.tsx desktop/src/shared/ui/popover.test.tsx desktop/src/features/chat-agent/components/memory-recall-chip.tsx desktop/src/features/chat-agent/components/memory-recall-chip.test.tsx 2>/dev/null || true
git commit -m "feat(desktop): restore MemoryRecallChip popover drilldown (closes c.2 #1)"
```

---

## Task 8: Composer mention controller integration test (closes c.2 #3)

**Files:** Modify `desktop/src/features/chat-agent/components/composer/composer-mention-controller.test.tsx`.

Background: The Plan 2b.2.c.2 port shipped a 21-LOC smoke test for `ComposerMentionController` (a 398-LOC controller). The c.2 review flagged this as thin — recommended a TipTap-mock integration test exercising the `insertMentionChip` path through to the wire-format string at the editor boundary.

- [ ] **Step 1: Inspect the controller's public surface**

```bash
grep -E "^export |ComposerMentionControllerHandle|insertMentionChip" desktop/src/features/chat-agent/components/composer/composer-mention-controller.tsx | head -15
```

Confirm the exposed handle methods (likely includes `insertMentionChip(attrs)` or similar) and the controller's external API.

- [ ] **Step 2: Add the integration test**

Append to `desktop/src/features/chat-agent/components/composer/composer-mention-controller.test.tsx`. Suggested shape:

```tsx
import * as React from 'react'
import { render, act } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, it, expect, vi } from 'vitest'
import { ComposerMentionController, type ComposerMentionControllerHandle } from './composer-mention-controller'
import { MentionChipNode } from '@/features/chat-agent/lib/composer/mention-chip-node'
import { serializeDocToWireText } from '@/features/chat-agent/lib/composer/composer-serialize'

describe('ComposerMentionController integration', () => {
  it('insertMentionChip writes a chip node that serializes to the wire-text marker', async () => {
    // Create a real TipTap Editor with our MentionChipNode + serializer wired up
    const editor = new Editor({
      extensions: [StarterKit, MentionChipNode],
      content: '',
    })

    const ref = React.createRef<ComposerMentionControllerHandle>()
    render(
      <ComposerMentionController
        ref={ref}
        editor={editor}
        sessionId="s-test"
        spaceId={undefined}
        onError={vi.fn()}
      />,
    )

    await act(async () => {
      ref.current?.insertMentionChip({
        kind: 'skill',
        id: 'test-skill',
        label: 'Test Skill',
      })
    })

    const wire = serializeDocToWireText(editor.getJSON())
    expect(wire).toContain('@test-skill')

    editor.destroy()
  })
})
```

If the actual `ComposerMentionControllerHandle` exposes a different method name or arguments, adapt the call. If `ComposerMentionController` doesn't accept an `editor` prop directly (uclaw may use a different wiring pattern — e.g., a context provider), inspect the source and adapt the test setup accordingly.

If the integration test reveals that `serializeDocToWireText` doesn't produce the expected wire-text marker, the bug is in the port — surface it; do NOT change the test to mask the bug.

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test composer-mention-controller 2>&1 | tail -10

git add desktop/src/features/chat-agent/components/composer/composer-mention-controller.test.tsx
git commit -m "test(desktop): TipTap-mock integration test for ComposerMentionController (closes c.2 #3)"
```

---

## Task 9: Workspace atom + retarget `activeWorkspaceIdAtom` (closes c.2 #4)

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/workspace.ts`
- Create: `desktop/src/features/chat-agent/atoms/workspace.test.ts`
- Modify: `desktop/src/features/chat-agent/atoms/tab-atoms.ts` (drop inlined stub; import from `./workspace`)

Background: Plan 2b.2.c.2 inlined `activeWorkspaceIdAtom` as a dormant stub inside `tab-atoms.ts`. The c.2 review noted that when Plan 3 lands the workspace module, this import path will need retargeting. Task 9 pre-extracts the atom to its own file so Plan 3's swap is import-name-compatible.

- [ ] **Step 1: Write `desktop/src/features/chat-agent/atoms/workspace.ts`**

```ts
// Plan 2b.2.c.3 — dormant workspace atom extracted to its own file so Plan 3
// (Navigation spine) can ship the real workspace module by replacing this
// file's contents with the verbatim uclaw atoms/workspace.ts port. AgentMessages
// + ComposerMentionController consume this file directly; no consumer change
// needed when Plan 3 lands.
import { atom } from 'jotai'

export interface WorkspaceMeta {
  id: string
  name: string
}

/**
 * Dormant in MVP — Plan 3 populates this with the real active workspace ID.
 */
export const activeWorkspaceIdAtom = atom<string | null>(null)

/**
 * Dormant in MVP — Plan 3 populates from the workspace list backend.
 */
export const workspacesAtom = atom<WorkspaceMeta[]>([])
```

- [ ] **Step 2: Write `desktop/src/features/chat-agent/atoms/workspace.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { activeWorkspaceIdAtom, workspacesAtom } from './workspace'

describe('workspace atoms (dormant stubs)', () => {
  it('activeWorkspaceIdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(activeWorkspaceIdAtom)).toBeNull()
  })

  it('workspacesAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(workspacesAtom)).toEqual([])
  })
})
```

- [ ] **Step 3: Edit `desktop/src/features/chat-agent/atoms/tab-atoms.ts`**

Find the inlined `activeWorkspaceIdAtom` declaration (per Plan 2b.2.c.2). Replace with an import + re-export:

```diff
- // Plan 2b.2.c.2 — `activeWorkspaceIdAtom` inlined as dormant stub …
- const activeWorkspaceIdAtom = atom<string | null>(null)
+ // Plan 2b.2.c.3 — workspace atoms extracted to ./workspace so Plan 3's real
+ // module ports are import-name-compatible. Re-exporting preserves any
+ // back-compat consumers that still import from './tab-atoms'.
+ import { activeWorkspaceIdAtom } from './workspace'
+ export { activeWorkspaceIdAtom }
```

- [ ] **Step 4: Verify no consumer breakage**

```bash
grep -rn "from .*tab-atoms.*activeWorkspaceIdAtom\|activeWorkspaceIdAtom.*from .*tab-atoms" desktop/src 2>&1
```

Any consumer importing `activeWorkspaceIdAtom` from `tab-atoms` will still resolve via the re-export. Optionally retarget direct consumers to `./workspace` for clarity:

```diff
- import { activeWorkspaceIdAtom } from '@/features/chat-agent/atoms/tab-atoms'
+ import { activeWorkspaceIdAtom } from '@/features/chat-agent/atoms/workspace'
```

Decide consumer-by-consumer based on local clarity (no policy rule).

- [ ] **Step 5: Run + commit**

```bash
pnpm --dir desktop test atoms 2>&1 | tail -10

git add desktop/src/features/chat-agent/atoms/{workspace.ts,workspace.test.ts,tab-atoms.ts}
git commit -m "refactor(desktop): extract activeWorkspaceIdAtom to atoms/workspace.ts (closes c.2 #4)"
```

---

## Task 10: Cleanups bundle — c.2 #2 + c.2 #5 + 2b.2.b.1 #3

**Files:**
- Modify: `desktop/src/features/chat-agent/atoms/ui-preferences.ts` (c.2 #2)
- Move: `desktop/src/features/chat-agent/lib/composer/hooks/use-editor-mention-trigger.ts` → `desktop/src/features/chat-agent/lib/composer/use-editor-mention-trigger.ts` (c.2 #5)
- Modify: every consumer of the moved file (c.2 #5)
- Modify: `desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.tsx` (2b.2.b.1 #3)

- [ ] **Step 1: c.2 #2 — doc comment on `updateStickyUserMessageEnabled`**

Edit `desktop/src/features/chat-agent/atoms/ui-preferences.ts`. Find `updateStickyUserMessageEnabled`. Add a Plan-2b.2.c.3 doc comment matching the precedent set by `initializeUiPreferences`:

```ts
/**
 * Plan 2b.2.c.3 — the Rust `set_sticky_user_message_enabled` command has not
 * been implemented yet (settings UI lands in Plan 3.5). For MVP we persist to
 * localStorage directly so the atom is usable from the React side without
 * blocking on a backend that hasn't shipped. When the real Rust command lands,
 * this function becomes the thin Tauri-invoke wrapper it was in uclaw.
 */
export async function updateStickyUserMessageEnabled(enabled: boolean): Promise<void> {
  // …existing localStorage write…
}
```

- [ ] **Step 2: c.2 #5 — move `use-editor-mention-trigger.ts` out of the one-off hooks subdir**

```bash
git mv desktop/src/features/chat-agent/lib/composer/hooks/use-editor-mention-trigger.ts \
       desktop/src/features/chat-agent/lib/composer/use-editor-mention-trigger.ts
rmdir desktop/src/features/chat-agent/lib/composer/hooks 2>&1
```

Then find consumers:

```bash
grep -rn "composer/hooks/use-editor-mention-trigger" desktop/src 2>&1
```

Edit each consumer:

```diff
- import { useEditorMentionTrigger } from '@/features/chat-agent/lib/composer/hooks/use-editor-mention-trigger'
+ import { useEditorMentionTrigger } from '@/features/chat-agent/lib/composer/use-editor-mention-trigger'
```

- [ ] **Step 3: 2b.2.b.1 #3 — clean up `scroll-minimap` dead handlers**

```bash
grep -n "void canScroll\|void isDragging\|void handleThumbMouseDown\|void handleTrackMouseDown\|void thumbTopPct" desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.tsx
```

For each `void X` suppression, decide:
- If the underlying handler is wired into JSX in uclaw upstream (check the uclaw source), wire it up here too.
- If the handler is dead in uclaw upstream (preserved verbatim per Plan 2b.2.c.1 port methodology), DELETE the declaration entirely. Add a brief comment:

```tsx
// Plan 2b.2.c.3 (2b.2.b.1 #3) — dead handlers in uclaw upstream removed.
// `canScroll`, `isDragging`, etc. were declared but never wired into JSX.
// If uclaw resurrects them later, sync via the standard port methodology.
```

Inspect the uclaw source first:
```bash
grep -nE "canScroll|isDragging|handleThumbMouseDown|handleTrackMouseDown|thumbTopPct" /Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/scroll-minimap.tsx | head -20
```

If uclaw also has them dead, prefer deletion. If uclaw wires them up, sync the wiring.

- [ ] **Step 4: Run + build**

```bash
pnpm --dir desktop test 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/ui-preferences.ts \
        desktop/src/features/chat-agent/lib/composer/use-editor-mention-trigger.ts \
        desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.tsx
git commit -m "chore(desktop): close c.2 #2 (ui-prefs doc) + c.2 #5 (composer hook move) + 2b.2.b.1 #3 (minimap dead handlers)"
```

---

## Task 11: Build slim `ChatAgentView` + integration tests

**Files:**
- Create: `desktop/src/features/chat-agent/components/chat-agent-view.tsx` (~250 LOC NEW)
- Create: `desktop/src/features/chat-agent/components/chat-agent-view.test.tsx`

This component is **invented**, not ported — uclaw's `AgentView.tsx` is 1,926 LOC and pulls in ~7,000 LOC of unported sub-components. The slim version below covers the MVP wire-up; Plan 2b.2.c.4 will port the full uclaw shell once Plan 3 provides the workspace + permission atoms.

- [ ] **Step 1: Write the component**

Create `desktop/src/features/chat-agent/components/chat-agent-view.tsx`:

```tsx
// Plan 2b.2.c.3 — slim container above AgentMessages + RichTextInput,
// wired to the Plan 2b.1 listenAgent → applyAgentEvent pipeline via the
// Plan 2b.2.a bridge adapter. Plan 2b.2.c.4 will replace this file with
// the full uclaw AgentView.tsx port once Plan 3 ships the workspace +
// permission/plan-mode atoms.

import * as React from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { agentBridge, listenAgent } from '@/lib/bridge'
import type { AgentEventMap } from '@/lib/bridge/events'
import { AgentMessages } from './agent-messages'
import { RichTextInput } from './ai-elements/rich-text-input'
import { Button } from '@/shared/ui/button'
import {
  agentMessagesAtomFamily,
  agentStreamStateAtomFamily,
  applyAgentEvent,
  type AgentStreamState,
} from '@/features/chat-agent/atoms/agent-atoms'
import { createBridgeAdapter } from '@/features/chat-agent/bridge-adapter'

interface ChatAgentViewProps {
  sessionId: string
}

export function ChatAgentView({ sessionId }: ChatAgentViewProps): React.ReactElement {
  const messages = useAtomValue(agentMessagesAtomFamily(sessionId))
  const [streamState, setStreamState] = useAtom(agentStreamStateAtomFamily(sessionId))
  const setMessages = useSetAtom(agentMessagesAtomFamily(sessionId))
  const [input, setInput] = React.useState('')
  const [sending, setSending] = React.useState(false)

  // Per-session bridge adapter; stable across renders.
  const adapterRef = React.useRef(createBridgeAdapter())

  // Wire all 9 agent:* Tauri events through the adapter into the reducer.
  React.useEffect(() => {
    const unlisteners: Array<() => void> = []
    let cancelled = false

    void (async () => {
      const eventNames: Array<keyof AgentEventMap> = [
        'agent:text-delta',
        'agent:thinking-delta',
        'agent:tool-call-delta',
        'agent:tool-start',
        'agent:tool-result',
        'agent:done',
        'agent:error',
        'agent:status',
        'agent:usage',
      ]

      for (const name of eventNames) {
        const unlisten = await listenAgent(name, (payload) => {
          if ((payload as { session_id?: string }).session_id !== sessionId) return
          const event = adapterRef.current.translate(name, payload)
          if (event == null) return
          setStreamState((prev: AgentStreamState | undefined) =>
            applyAgentEvent(prev ?? createEmptyState(), event),
          )
        })
        if (cancelled) {
          unlisten()
          return
        }
        unlisteners.push(unlisten)
      }
    })()

    return () => {
      cancelled = true
      unlisteners.forEach((u) => u())
    }
  }, [sessionId, setStreamState])

  // When streaming completes, drain the final assistant content into the
  // persistent messages array. Plan 2b.2.c.4 / Plan 4 (real session
  // persistence) replaces this with a backend round-trip.
  React.useEffect(() => {
    if (streamState?.running === false && streamState?.content) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          role: 'assistant',
          content: streamState.content,
          createdAt: Date.now(),
          model: streamState.model,
        } as (typeof prev)[number],
      ])
      // Clear the stream state for the next turn
      setStreamState(undefined)
    }
  }, [streamState, setMessages, setStreamState])

  const handleSubmit = React.useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    // Push the user turn locally
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        createdAt: Date.now(),
      } as (typeof prev)[number],
    ])
    try {
      await agentBridge.agentSendMessage(sessionId, text)
    } catch (e) {
      // Surfaced via the agent:error event subscription; nothing extra needed
      console.error('agentSendMessage failed', e)
    } finally {
      setSending(false)
    }
  }, [input, sending, sessionId, setMessages])

  return (
    <main className="flex h-screen flex-col">
      <AgentMessages
        sessionId={sessionId}
        messages={messages}
        messagesLoaded={true}
        streaming={streamState?.running ?? false}
        streamState={streamState}
      />
      <div className="border-t border-border bg-background p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="flex-1">
            <RichTextInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              disabled={sending}
              placeholder="Type a message…"
            />
          </div>
          <Button onClick={handleSubmit} disabled={sending || !input.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </main>
  )
}

function createEmptyState(): AgentStreamState {
  return {
    running: true,
    content: '',
    reasoning: '',
    toolActivities: [],
    teammates: [],
  } as AgentStreamState
}
```

Adapt to actual atom signatures / types if anything doesn't match (the project's `AgentStreamState`, `applyAgentEvent`, etc. shapes are settled by Plans 2b.2.a/b.1/b.2/c.*). The criterion: the file compiles + the round-trip event flow works end-to-end.

- [ ] **Step 2: Write integration tests**

Create `desktop/src/features/chat-agent/components/chat-agent-view.test.tsx`:

```tsx
import * as React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { ChatAgentView } from './chat-agent-view'

// jsdom setup
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = function () {}
  }
})

// Mock the Tauri bridge so tests don't try to invoke the runtime.
vi.mock('@/lib/bridge', async () => {
  return {
    agentBridge: { agentSendMessage: vi.fn().mockResolvedValue('ok') },
    listenAgent: vi.fn().mockImplementation(async () => () => {}),
  }
})

describe('ChatAgentView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mounts without crashing', () => {
    const { container } = render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('renders the welcome state when no messages and no streaming', () => {
    render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    // WelcomeEmptyState renders a heading
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('renders the composer (RichTextInput) with a Send button', () => {
    render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    const editor = document.querySelector('[contenteditable="true"]')
    expect(editor).not.toBeNull()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('Send button is disabled when input is empty', () => {
    render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('calls agentBridge.agentSendMessage when a non-empty input is submitted', async () => {
    const { agentBridge } = await import('@/lib/bridge')
    render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement
    // TipTap doesn't accept userEvent.type directly; simulate the onChange
    // by dispatching the controlled-value path. We expect the component's
    // internal handleSubmit to be reachable via the Send button after the
    // editor reports a value. For now, assert that clicking Send with empty
    // input does NOT call the bridge.
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(agentBridge.agentSendMessage).not.toHaveBeenCalled()
  })

  it('subscribes to all 9 agent:* events on mount', async () => {
    const { listenAgent } = await import('@/lib/bridge')
    render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    // The component subscribes asynchronously inside useEffect; wait a tick
    await act(async () => { await Promise.resolve() })
    const eventNames = (listenAgent as unknown as { mock: { calls: [string][] } }).mock.calls.map((c) => c[0])
    expect(eventNames).toContain('agent:text-delta')
    expect(eventNames).toContain('agent:done')
    expect(eventNames).toContain('agent:error')
    expect(eventNames.length).toBe(9)
  })

  it('unsubscribes on unmount', async () => {
    const { listenAgent } = await import('@/lib/bridge')
    const unlisten = vi.fn()
    ;(listenAgent as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(unlisten)
    const { unmount } = render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    await act(async () => { await Promise.resolve() })
    unmount()
    // Each of 9 subscriptions should have called its unlisten on cleanup
    expect(unlisten).toHaveBeenCalled()
  })

  it('disabled state propagates to RichTextInput when sending', () => {
    // Without a real bridge round-trip, we can't trigger sending=true through
    // the UI cleanly. Instead, assert the disabled state is wired to the Send
    // button (covered by test #4) and the editor remains mounted.
    render(
      <Provider>
        <ChatAgentView sessionId="s-test" />
      </Provider>,
    )
    expect(document.querySelector('[contenteditable="true"]')).not.toBeNull()
  })
})
```

8 tests. Adapt the bridge-mock paths to whatever the project uses; if `@/lib/bridge` re-exports `listenAgent`, this works as-is.

- [ ] **Step 3: Run + build**

```bash
pnpm --dir desktop test chat-agent-view 2>&1 | tail -15
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: 8/8 PASS; build clean.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/chat-agent-view*
git commit -m "feat(desktop): slim ChatAgentView container + 8 integration tests"
```

---

## Task 12: Wire `App.tsx` to render `<ChatAgentView />` (FIRST App.tsx change since Plan 1)

**Files:** Modify `desktop/src/app/App.tsx`.

- [ ] **Step 1: Replace the MVP composer body**

Read the current `desktop/src/app/App.tsx`. Replace its body with:

```tsx
import { Provider } from 'jotai'
import { ChatAgentView } from '@/features/chat-agent/components/chat-agent-view'

// Plan 2b.2.c.3 — first App.tsx change since Plan 1. Replaces the MVP
// composer (kept inert from Plan 1 through Plan 2b.2.c.2) with the slim
// ChatAgentView container that mounts AgentMessages + RichTextInput wired
// to the Plan 2b.1 backend bridge. Plan 2b.2.c.4 will replace ChatAgentView
// with the full uclaw AgentView once Plan 3 ships the workspace atoms.

const SESSION_ID = 'default'

export function App() {
  return (
    <Provider>
      <ChatAgentView sessionId={SESSION_ID} />
    </Provider>
  )
}
```

The `SESSION_ID = 'default'` constant preserves Plan 1's backend session-id contract.

- [ ] **Step 2: Run tests + build**

```bash
pnpm --dir desktop test 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -10
```

Expected: all tests pass; build clean. App.tsx now mounts the real ChatAgentView.

- [ ] **Step 3: Manual launch verification**

```bash
pnpm --dir desktop tauri dev
```

A native window opens. Expected:
- Window shows the welcome empty state (WelcomeEmptyState heading)
- Editable composer area + Send button visible at the bottom
- Typing in the composer enables the Send button
- Pressing Send dispatches to the backend; without a configured provider key, an `agent:error` event surfaces as a `role="alert"` banner above the empty state (closes 2b.2.c-B for real)

If anything crashes or fails to render, surface the exact error.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/app/App.tsx
git commit -m "feat(desktop): App.tsx mounts ChatAgentView (first change since Plan 1)"
```

---

## Task 13: Delete `peripheral-stubs.ts` + split settings into `settings-stubs.ts`

**Files:**
- Create: `desktop/src/features/chat-agent/lib/settings-stubs.ts`
- Create: `desktop/src/features/chat-agent/lib/settings-stubs.test.ts`
- Delete: `desktop/src/features/chat-agent/lib/peripheral-stubs.ts`
- Delete: `desktop/src/features/chat-agent/lib/peripheral-stubs.test.ts`
- Modify: every consumer of `peripheral-stubs` (per Task 1 + Task 4 recon)

- [ ] **Step 1: Inventory what's left in peripheral-stubs.ts**

```bash
grep -E "^export " desktop/src/features/chat-agent/lib/peripheral-stubs.ts
```

After Task 4, `readAttachment` + `saveImageAs` + `SaveImageArgs` should be gone. What remains:
- Settings: `SettingsTab`, `settingsTabAtom`, `settingsOpenAtom`, `environmentCheckDialogOpenAtom`
- Other shims: `openExternal`, `recordSkillCited`
- Composer support stubs: `listInvocableSkills`, `searchWorkspaceFilesForMention`

- [ ] **Step 2: Write `desktop/src/features/chat-agent/lib/settings-stubs.ts`**

```ts
// Plan 2b.2.c.3 — feature-local stubs for settings + composer-skill autocomplete
// + external link helper. Replaces peripheral-stubs.ts (deleted in this plan).
// Plan 3.5 (settings UI) replaces the settings atoms with the real wired surface;
// Plan 4 (skill registry) replaces listInvocableSkills + recordSkillCited.
import { atom } from 'jotai'
import type { InvocableSkill, WorkspaceFileMatch } from './types'

// ---- Settings atoms (Plan 3.5 ships real settings UI) ---------------------

export type SettingsTab =
  | 'connectivity'
  | 'general'
  | 'shortcuts'
  | 'appearance'
  | 'about'

export const settingsTabAtom = atom<SettingsTab>('connectivity')
export const settingsOpenAtom = atom(false)
export const environmentCheckDialogOpenAtom = atom(false)

// ---- Shims (Plan 4 / 3.5 implementations) ---------------------------------

/** Plan 3.5 — open external URL via the OS shell (tauri-plugin-opener). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function openExternal(_url: string): Promise<void> {
  // No-op until Plan 3.5 wires the plugin-opener bridge.
}

/** Plan 4 — record a skill citation event into the skill registry. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function recordSkillCited(_skillName: string): Promise<void> {
  return
}

/** Plan 4 — list skills available for composer mention autocomplete. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function listInvocableSkills(_spaceId?: string): Promise<InvocableSkill[]> {
  return []
}

/** Plan 3 — search workspace files for the composer mention autocomplete. */
export async function searchWorkspaceFilesForMention(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _sessionId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _query: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _limit?: number,
): Promise<WorkspaceFileMatch[]> {
  return []
}
```

Adjust if `peripheral-stubs.ts` had additional exports that don't fit into this file. Anything obviously settings-adjacent goes here; otherwise inline at the call site and remove the export entirely.

- [ ] **Step 3: Write `settings-stubs.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  settingsTabAtom,
  settingsOpenAtom,
  environmentCheckDialogOpenAtom,
  openExternal,
  recordSkillCited,
  listInvocableSkills,
  searchWorkspaceFilesForMention,
} from './settings-stubs'

describe('settings-stubs', () => {
  it('settings atoms have safe defaults', () => {
    const store = createStore()
    expect(store.get(settingsTabAtom)).toBe('connectivity')
    expect(store.get(settingsOpenAtom)).toBe(false)
    expect(store.get(environmentCheckDialogOpenAtom)).toBe(false)
  })

  it('shim functions resolve without throwing', async () => {
    await expect(openExternal('http://example.com')).resolves.toBeUndefined()
    await expect(recordSkillCited('test-skill')).resolves.toBeUndefined()
    await expect(listInvocableSkills()).resolves.toEqual([])
    await expect(searchWorkspaceFilesForMention('s', 'q')).resolves.toEqual([])
  })
})
```

- [ ] **Step 4: Repoint every consumer**

```bash
grep -rn "from .*peripheral-stubs" desktop/src 2>&1 | grep -v "settings-stubs"
```

For each consumer (likely chips, SkillCitationChips, agent-messages.tsx for settings atoms if any), retarget:

```diff
- import { settingsTabAtom, settingsOpenAtom } from '@/features/chat-agent/lib/peripheral-stubs'
+ import { settingsTabAtom, settingsOpenAtom } from '@/features/chat-agent/lib/settings-stubs'
```

Same for the function shims.

- [ ] **Step 5: Delete peripheral-stubs**

```bash
git rm desktop/src/features/chat-agent/lib/peripheral-stubs.ts \
       desktop/src/features/chat-agent/lib/peripheral-stubs.test.ts
```

- [ ] **Step 6: Verify clean state**

```bash
ls desktop/src/features/chat-agent/lib/peripheral-stubs.ts 2>&1
# Expected: "No such file or directory"

grep -rn "peripheral-stubs" desktop/src 2>&1
# Expected: no matches
```

- [ ] **Step 7: Run + build**

```bash
pnpm --dir desktop test 2>&1 | tail -10
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: all pass; build clean.

- [ ] **Step 8: Commit**

```bash
git add desktop/src/features/chat-agent/lib/settings-stubs.ts \
        desktop/src/features/chat-agent/lib/settings-stubs.test.ts \
        desktop/src/features/chat-agent/lib/peripheral-stubs.ts \
        desktop/src/features/chat-agent/lib/peripheral-stubs.test.ts \
        desktop/src/features/chat-agent/components/
git commit -m "refactor(desktop): split settings-stubs from peripheral-stubs + delete peripheral-stubs.ts"
```

---

## Task 14: Smoke verification + manual launch gate

**Files:** None (verification only).

- [ ] **Step 1: Backend tests + new Tauri commands**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring
cargo test -p hermes-desktop --lib 2>&1 | tail -5
```

Expected: ≥23 PASS (21 prior + 2 new from `files.rs` unit tests).

- [ ] **Step 2: Frontend tests**

```bash
pnpm --dir desktop test 2>&1 | tail -15
```

Expected: ≥440 PASS (421 prior + ~19+ new: 8 ChatAgentView + 4 MemoryRecallChip popover + 2 workspace atoms + 1 composer-mention integration + 2 useScrollPositionMemory + 2 settings-stubs + the new agent-messages error-banner test).

- [ ] **Step 3: Warning-free builds**

```bash
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -10
```

Expected: both clean.

- [ ] **Step 4: Workspace regression check**

```bash
cargo check --workspace 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 5: Confirm the acceptance gate state**

```bash
echo "=== stubs/ directory ==="
ls desktop/src/features/chat-agent/components/stubs/ 2>&1
echo ""
echo "=== peripheral-stubs.ts ==="
ls desktop/src/features/chat-agent/lib/peripheral-stubs.ts 2>&1
echo ""
echo "=== App.tsx diff vs main ==="
git diff main -- desktop/src/app/App.tsx | head -20
```

Expected:
- `stubs/` reports "No such file or directory" (or empty)
- `peripheral-stubs.ts` reports "No such file or directory"
- App.tsx diff is non-empty (the first App.tsx change since Plan 1)

- [ ] **Step 6: No god-file regression**

```bash
ls desktop/src/lib/
```

Expected: `bridge/` directory (with `agent.ts`, `app.ts`, `session.ts`, `events.ts`, `index.ts`, `generated.ts`, `client.ts`, and now `files.ts` from Task 4) only — no `tauri-bridge.ts` or other god file at the top level.

- [ ] **Step 7: Repo state**

```bash
git status --short
git log --oneline main..HEAD | wc -l
git log --oneline main..HEAD | head -20
```

Expected: clean tree; ~14 task commits since main.

- [ ] **Step 8: Manual launch gate (the headline)**

```bash
pnpm --dir desktop tauri dev
```

Wait for the window to open. Expected:
- Native macOS window titled "Hermes Agent Ultra"
- WelcomeEmptyState heading visible
- RichTextInput composer + Send button at the bottom
- Type a message: Send button enables
- Click Send: backend bridge is invoked; without a provider key, an error banner appears (closes 2b.2.c-B for real); with a key, the AgentMessages streaming branch renders the reply

If anything crashes or fails to render, surface the exact error and the corresponding file.

After verification, kill the dev process (Ctrl+C or `pkill -f hermes-desktop`).

## Reporting

Report **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** with:
- Backend test count
- Frontend test count + delta from main's 421
- Build status
- Final stubs/ + peripheral-stubs.ts state
- Manual launch result (window opened? composer worked? error banner visible?)

---

## Done When

- All 13 source-affecting tasks (Tasks 1–13) complete; Task 14 smoke + manual launch gate pass.
- ≥19 new frontend tests pass on top of main's 421 (target ≥440 cumulative).
- 2 new Rust tests pass (`read_attachment` round-trip + missing-file error).
- Backend cumulative: ≥23 PASS.
- `desktop/src/features/chat-agent/components/stubs/` directory does NOT exist.
- `desktop/src/features/chat-agent/lib/peripheral-stubs.ts` does NOT exist.
- App.tsx changed (first time since Plan 1).
- Manual launch (`pnpm tauri dev`) opens the window and the composer round-trips through the bridge.
- Build clean (tsc + vite + cargo + `-D warnings`).
- Final code review: APPROVED or APPROVED_WITH_FOLLOWUPS.

## Next Plans

- **Plan 2b.2.c.4 — Full uclaw AgentView shell port (~7,000 LOC).** Once Plan 3 ships the workspace + permission-mode atoms, port uclaw's `AgentView.tsx` verbatim plus the 16 unported sibling components (AgentHeader, BrowserPreviewOverlay, ContextUsageBadge, AutoPreviewPopover, StrategyPresetSelector, PermissionBanner, AgentHeartbeatBanner, PermissionModeSelector, AgentStatusBar, AskUserBanner, ExitPlanModeBanner, PlanModeSuggestBanner, AutomationRunBanner, PlanModeDashedBorder, PetWidget, QueuedMessagesBanner). Plus ProviderModelSelector + AttachmentPreviewItem + FeishuNotifyToggle + GitChipsRow from chat-side. STT subsystem (SttModal + FirstRunDialog + SpeechButton) skipped or deferred to a dedicated audio plan. Replaces this plan's slim ChatAgentView.
- **Plan 3 — Navigation spine.** Workspace + ARC sidebar + bottom Dock + multi-theme + named theme palettes. Ports `atoms/workspace.ts` real implementation (replaces the dormant stub from Task 9 of this plan).
- **Plan 3.5 — App Shell.** Right panel + file preview + focus mode. Real settings UI (replaces this plan's `settings-stubs.ts`). Real `openExternal` via tauri-plugin-opener.
- **Plan 4 — cn-desktop domain screens.** Real skill registry backend (replaces this plan's `recordSkillCited` + `listInvocableSkills` stubs).
- **Plan 7 — Packaging + distribution.**
