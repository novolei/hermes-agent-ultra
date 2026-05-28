# Recon: Plan 3.2 (Desktop Workspace)

**Date:** 2026-05-28  
**Task:** Inspect uclaw's atoms/workspace.ts shape, dormant-stub consumers, component imports, Rust backend patterns.

---

## 1. Uclaw atoms/workspace.ts Exports (17 total)

### Interfaces (2)
- `WorkspaceInfo` — workspace metadata (id, name, icon, path, attachedDirs, sortOrder, createdAt, updatedAt)
- `WorkspaceSession` — session metadata (id, title, titleEmoji, titlePending, spaceId, updatedAt, pinnedAt, metadataJson, archived, imChannelType)

### State Atoms (3)
- `workspacesAtom` — Array of `WorkspaceInfo[]`
- `activeWorkspaceIdAtom` — currently selected workspace ID (`string | null`)
- `activeWorkspaceCwdAtom` — derived atom; active workspace's filesystem path (pure sync, re-evaluates on workspace or ID change)

### Derived Atoms (4)
- `branchSyncTickAtom` — numeric tick for cross-surface git-branch sync (bumped after in-app branch changes)
- `workspaceSwitchDirectionAtom` — 'forward' | 'backward' (slide animation direction on workspace switch)
- `swipeGestureAtom` — `SwipeGestureState | null` (active swipe drag state with offsetPx, containerWidth, previewWorkspaceId)
- `workspaceSessionsAtom` — Record of sessions grouped by workspace ID

### Action Atoms (8)
- `refreshWorkspacesAtom` — async action; fetches all workspaces + active ID from backend
- `updateWorkspaceAtom` — async action; updates workspace name/icon, re-syncs from backend
- `reorderWorkspacesAtom` — async action; reorders workspaces with optimistic local update (reverts on failure)
- `selectWorkspaceAtom` — async action; switches active workspace, computes slide direction, persists to backend
- `updateSessionTitleAtom` — sync action; partial update of session title/emoji in grouped map
- `syncWorkspaceSessionsAtom` — sync action; syncs agent sessions into workspace session map

---

## 2. Tauri Commands Called by Uclaw Atoms

The action atoms invoke these Tauri bridge commands:

| Command | Atom(s) Calling | Purpose |
|---------|-----------------|---------|
| `listSpaces()` | refreshWorkspacesAtom, updateWorkspaceAtom, reorderWorkspacesAtom | Fetch all workspaces from backend |
| `getActiveWorkspaceId()` | refreshWorkspacesAtom | Get currently active workspace ID |
| `updateWorkspace(input)` | updateWorkspaceAtom | Update workspace name/icon |
| `setActiveWorkspaceId(id)` | selectWorkspaceAtom | Persist active workspace selection |
| `reorderWorkspaces(orderedIds)` | reorderWorkspacesAtom | Persist new workspace order |

**Out-of-scope for atoms (but in uclaw bridge):**
- `createWorkspace(name, path?, icon?)` — called by WorkspaceCreateDialog component
- `deleteWorkspace(id)` — called by WorkspaceHeader component
- `createSpace(input)` — different from createWorkspace (different backend table)
- `deleteSpace(id)` — different from deleteWorkspace
- `getWorkspaceDirectories(workspaceId)`, `attachWorkspaceDirectory()`, `detachWorkspaceDirectory()`
- `uploadWorkspaceFile()`, `copyFileIntoWorkspace()`, `deleteWorkspaceFile()`
- `searchWorkspace()`, `getWorkspaceSkillTags()`, `setWorkspaceSkillTags()`
- `searchWorkspaceFilesForMention()`, `listWorkspaceCostRollup()`

---

## 3. Dormant-Stub Consumer Files (2 in desktop/src)

1. **`/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-workspace/desktop/src/features/chat-agent/atoms/tab-atoms.ts`**
   - Imports: `activeWorkspaceIdAtom` (line 32)
   - Re-exports: `activeWorkspaceIdAtom` (line 37)
   - Uses: reads `activeWorkspaceIdAtom` in atoms (lines 67, 84, 89)

2. **`/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-workspace/desktop/src/features/chat-agent/components/composer/composer-mention-controller.tsx`**
   - Imports: `activeWorkspaceIdAtom` (line 27, via tab-atoms)
   - Uses: `const activeWorkspaceId = useAtomValue(activeWorkspaceIdAtom)` (line 104)

**Stub file location:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-workspace/desktop/src/features/chat-agent/atoms/workspace.ts`

**Stub content (23 lines):**
```typescript
import { atom } from 'jotai'

export interface WorkspaceMeta {
  id: string
  name: string
}

export const activeWorkspaceIdAtom = atom<string | null>(null)
export const workspacesAtom = atom<WorkspaceMeta[]>([])
```

---

## 4. Uclaw Component Import Surface

### IconPicker.tsx
- React, @/lib/utils (cn), @/lib/workspace-icons (WORKSPACE_ICON_CATALOG)

### SessionItem.tsx
- React, lucide-react (icons), jotai (useAtomValue, useSetAtom), sonner (toast)
- @/lib/utils, @/lib/im-channel-display
- @/components/ui/dropdown-menu, @/components/ui/context-menu
- @/atoms/dock-atoms (dockOrderAtom, addDockPin, removeDockPin)
- **No direct atoms/workspace imports** — receives props from parent

### WorkspaceCreateDialog.tsx
- React, lucide-react (FolderOpen), sonner (toast)
- @/components/ui/button, @/components/ui/input
- @/lib/tauri-bridge (full import as *), ./IconPicker
- @/lib/workspace-icons (DEFAULT_WORKSPACE_ICON, getWorkspaceIcon)
- **Tauri calls:** createWorkspace()

### WorkspaceHeader.tsx
- React, lucide-react (Pencil, Trash2), jotai, sonner (toast)
- @/components/ui/popover, @/components/ui/button, @/components/ui/input
- @/lib/tauri-bridge.deleteWorkspace
- @/lib/workspace-icons.getWorkspaceIcon
- ./IconPicker
- **Tauri calls:** deleteWorkspace()

### WorkspaceRail.tsx
- React, lucide-react, jotai (useAtomValue, useSetAtom)
- @/components/agent/MoveSessionDialog, ./SessionItem
- @/atoms/tab-atoms (tabsAtom)
- @/lib/agent-types (AgentWorkspace, AgentSessionMeta)
- @/lib/tauri-bridge (toggleArchiveAgentSession, deleteAgentSession)
- @/atoms/workspace (WorkspaceSession type only)
- sonner (toast)
- **Tauri calls:** toggleArchiveAgentSession(), deleteAgentSession()

### WorkspaceSwitcherBar.tsx
- React, lucide-react (Plus, LucideIcon), jotai (useAtomValue, useSetAtom)
- @/lib/utils (cn), @/lib/workspace-icons.getWorkspaceIcon
- @/components/ui/button, @/components/ui/menu, etc.
- ./WorkspaceCreateDialog
- @/atoms/top-level-view (topLevelViewAtom)
- @/views/Kaleidoscope/KaleidoscopeIcon
- **No direct Tauri calls from this component**

---

## 5. SessionPersistence Pattern Reference

**File:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-workspace/crates/hermes-agent/src/session_persistence.rs`

**Crate:** `hermes-agent` (Rust crate in `.worktrees/desktop-workspace/crates/hermes-agent/`)

**Public API (excerpt):**
```rust
/// Manages session persistence to SQLite and markdown log files.
pub struct SessionPersistence {
    db_path: PathBuf,              // SQLite database file
    sessions_dir: PathBuf,         // Session log files
    trajectories_dir: PathBuf,     // Trajectory files for RL training
}

impl SessionPersistence {
    /// Create a new persistence manager rooted at hermes_home.
    pub fn new(hermes_home: impl AsRef<Path>) -> Self { ... }

    /// Create using default home resolution:
    /// HERMES_HOME → HERMES_AGENT_ULTRA_HOME → ~/.hermes-agent-ultra
    /// with legacy fallback to ~/.hermes
    pub fn default_home() -> Self { ... }

    /// Ensure the SQLite database and tables exist.
    pub fn ensure_db(&self) -> Result<(), AgentError> { ... }
    // ... other methods for persistence
}
```

**Key pattern:**
- Uses home directory resolution (env vars with fallback)
- SQLite-backed with FTS5 indexing
- Provides `ensure_db()` for schema initialization
- No Mutex/Arc wrapping in the struct itself; Arc is added at the service level (see AppState below)

---

## 6. AppState Shape + Construction

**File:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-workspace/desktop/src-tauri/src/state.rs`

**Structure:**
```rust
#[derive(Clone)]
pub struct AppState {
    pub app: AppService,
    pub session: Arc<SessionService>,
    pub agent: Arc<AgentService>,
}

impl AppState {
    /// Construct the AppState with all services rooted at hermes_home.
    pub fn init() -> Self {
        let hermes_home = default_hermes_home();
        let session = SessionService::open(&hermes_home)
            .expect("failed to initialise SessionService at hermes_home");
        Self {
            app: AppService,
            session: Arc::new(session),
            agent: Arc::new(AgentService::new()),
        }
    }
}
```

**Pattern:**
- Cloneable (all fields are Clone — app is empty struct, session/agent are Arc)
- Services are Arc-wrapped (thread-safe sharing)
- AppState is initialized once at startup via `AppState::init()`
- Uses same `default_hermes_home()` resolution as SessionPersistence (env vars → ~/.hermes-agent-ultra → ~/.hermes)

---

## 7. Services and Commands Structure

### services/mod.rs
```rust
pub mod agent_service;
pub mod app_service;
pub mod session_service;
```

Three service modules, one file per domain.

### commands/mod.rs
```rust
pub mod agent;
pub mod app;
pub mod files;
pub mod session;
```

Four command modules. Pattern: keep commands thin; logic lives in services.

### tauri-specta Builder (in lib.rs)

```rust
fn make_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            commands::app::app_info,
            commands::agent::agent_send_message,
            commands::session::session_load,
            commands::files::read_attachment,
            commands::files::save_image_as,
        ])
        .events(collect_events![
            TextDeltaEvent,
            ToolCallDeltaEvent,
            UsageEvent,
            DoneEvent,
            ErrorEvent,
            ToolStartEvent,
            ToolResultEvent,
            ThinkingDeltaEvent,
            StatusEvent,
        ])
}

pub fn run() {
    let builder = make_builder();

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default()
                .header("// AUTOGENERATED by tauri-specta..."),
            "../src/lib/bridge/generated.ts",
        )
        .expect("failed to export specta bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Pattern:**
- Uses `tauri-specta` for command/event collection and TypeScript generation
- `collect_commands!` macro collects all command fn signatures
- `collect_events!` macro collects all event types
- AppState is managed via `.manage(AppState::init())`
- Invoke handler is generated by builder; exports TypeScript bindings to `../src/lib/bridge/generated.ts`
- Debug builds export bindings; test builds can regenerate via `export_bindings()` test

---

## 8. Out-of-Scope Discoveries

### Additional Uclaw Bridge Commands (not called by atoms)
The uclaw tauri-bridge.ts exports many commands beyond the 5 used by workspace atoms:
- **Workspace/directory commands:** getWorkspaceDirectories, attachWorkspaceDirectory, detachWorkspaceDirectory
- **File commands:** uploadWorkspaceFile, copyFileIntoWorkspace, deleteWorkspaceFile
- **Search:** searchWorkspace, searchWorkspaceFilesForMention
- **Skills:** getWorkspaceSkillTags, setWorkspaceSkillTags
- **Cost tracking:** listWorkspaceCostRollup

These are called by components (WorkspaceCreateDialog, WorkspaceHeader) or other features, but **not by the atoms themselves**.

### Atoms that Need Porting
**Extra uclaw atoms not in the stub:**
- `activeWorkspaceCwdAtom` — derived atom (pure sync; computed from activeWorkspaceIdAtom + workspacesAtom)
- `branchSyncTickAtom` — used by git features for cross-surface sync
- `workspaceSwitchDirectionAtom` — used by UI (LeftSidebar, TabBar, RightSidePanel) for slide animation
- `swipeGestureAtom` — used for swipe gesture tracking (not MVP, but needed for full parity)
- `workspaceSessionsAtom` — session grouping by workspace
- `syncWorkspaceSessionsAtom` — action to populate sessions from backend

**Plan scope:** atoms + interfaces + 5 action atoms (refresh, update, reorder, select, updateSessionTitle). The syncWorkspaceSessionsAtom will need to be wired to backend when sessions are fetched.

---

## Summary Table

| Item | Count / Location |
|------|-----------------|
| Uclaw atoms/workspace.ts exports | 17 (2 interfaces, 3 state, 4 derived, 8 action) |
| Tauri commands called by atoms | 5 (listSpaces, getActiveWorkspaceId, updateWorkspace, setActiveWorkspaceId, reorderWorkspaces) |
| Dormant-stub consumer files | 2 (tab-atoms.ts, composer-mention-controller.tsx) |
| SessionPersistence crate | hermes-agent (Rust crate, no Mutex wrapping in struct) |
| AppState pattern | Arc-wrapped services, cloneable, initialized at startup |
| tauri-specta pattern | collect_commands! + collect_events!, auto-export TypeScript, builder.invoke_handler() |
| Uclaw component count | 6 (IconPicker, SessionItem, WorkspaceCreateDialog, WorkspaceHeader, WorkspaceRail, WorkspaceSwitcherBar) |
| Component Tauri calls | createWorkspace (Dialog), deleteWorkspace (Header), toggleArchiveAgentSession & deleteAgentSession (Rail) |
| Out-of-scope commands | ~15 additional workspace/file/search commands in uclaw bridge |

---

## Next Steps (Plan 3.2 Task 2+)

1. Create `commands/workspace.rs` with handlers for the 5 atom commands
2. Add SessionService.workspace_*() methods or new WorkspaceService
3. Extend AppState to include WorkspaceService or workspace methods on SessionService
4. Add `pub mod workspace` to commands/mod.rs
5. Add new command fns to collect_commands! in lib.rs
6. Port uclaw atoms/workspace.ts to desktop/src/lib/workspace-atoms.ts (or same stub location)
7. Update consumers (tab-atoms.ts, composer-mention-controller.tsx) import path if needed
8. Extend components as needed for create/delete (WorkspaceCreateDialog, WorkspaceHeader)
