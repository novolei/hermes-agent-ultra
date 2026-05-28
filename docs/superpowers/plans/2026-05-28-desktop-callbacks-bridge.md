# Desktop Agent Callbacks Bridge — Plan 2b.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `hermes_agent::AgentCallbacks` into the desktop's `AgentService` so the four high-value lifecycle callbacks (`on_tool_start`, `on_tool_complete`, `on_thinking`, `status_callback`) emit typed `agent:*` Tauri events; refactor `AgentService` to per-call `AgentLoop` construction (resolves Plan 2a's documented TODO by setting `AgentConfig.session_id` per call + disabling code_index/memory for the desktop's no-workspace context); and extend the frontend `AgentEventMap` so the new event names are compile-checked. **The frontend UI does not change** — the MVP composer continues to consume only `agent:text-delta`/`done`/`error`; Plan 2b.2 (uclaw UI port) renders the new events.

**Architecture:** A new `build_desktop_callbacks(app, session_id) -> AgentCallbacks` factory constructs four closures that each capture `(AppHandle, String)` and emit a typed `agent:*` event via the same `emit_*(app, e)` helpers established in Plan 2a Task 3. `AgentService` caches only the `(Arc<dyn LlmProvider>, model_string)` tuple from env vars; `send_message_streaming` builds a fresh `AgentLoop` per call with `config.session_id = Some(session_id)`, `config.skip_memory = true`, `config.skip_context_files = true`, `config.code_index_enabled = false`, then chains `.with_callbacks(desktop_callbacks)`. The existing `on_chunk` stream callback (text-delta path) and `translate_chunk` translator are unchanged — they handle text/usage; the new bridge handles tool/thinking/status.

**Tech stack additions:** None — all dependencies are already in place from Plan 2a.

**What this plan does NOT do** (per the ADR Phase 3 split, deferred to Plan 2b.2 or Plan 2c):
- Port uclaw's `ai-elements/`, `agent/`, `chat/` components or `applyAgentEvent` — Plan 2b.2.
- Replace the MVP composer with the uclaw message view — Plan 2b.2.
- Wire `on_step_complete` (turn-boundary marker) — Plan 2b.2 if needed, otherwise YAGNI.
- Wire `background_review_callback` (tokio::spawn'd, more complex thread model) — Plan 2c.
- Add teammate / sub-agent delegation callbacks — those don't exist in `AgentCallbacks` today; requires modifying `hermes-agent` (Plan 2c+).
- Surface `is_error` from tool completion — the callback signature doesn't expose it; would require modifying `AgentCallbacks` upstream (Plan 2c+).

**Reference:** ADR [DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md](../../roadmaps/DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md) — Phase 3 (Anti-corruption layer + message view 1:1). This plan is the **callbacks half** of Phase 3's backend; Plans 2a (already shipped) + 2b.1 (this) together complete the backend ACL.

---

## File Structure (modified)

```
desktop/src-tauri/src/
  events.rs                              # MODIFY: + 4 event structs + 4 emit helpers + 4 tests
  lib.rs                                 # MODIFY: collect_events! gains 4 entries
  services/agent_service.rs              # MODIFY: per-call AgentLoop construction + build_desktop_callbacks
desktop/src/lib/bridge/
  events.ts                              # MODIFY: AgentEventMap gains 4 entries
  index.ts                               # MODIFY: re-export 4 new event types
  generated.ts                           # AUTO-REGENERATED via export_bindings test
```

No new files. All changes are additive to existing modules.

---

## Task 1: Add 4 new event payload structs + emit helpers + serialization tests (TDD)

**Files:**
- Modify: `desktop/src-tauri/src/events.rs`

Pattern follows Plan 2a Task 3 + Task 3-fixup exactly: uniform `emit_<name>(app, e: <EventStruct>)` signature, `tracing::warn!` on emit error, `#[serde(skip_serializing_if = "Option::is_none")]` on any Option fields (none in these four structs).

- [ ] **Step 1: Add the 4 structs + constants + emit helpers**

In `desktop/src-tauri/src/events.rs`, append the following AFTER the existing structs/constants/helpers (alphabetically grouped — keep the file scannable):

```rust
#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct ToolStartEvent {
    pub session_id: String,
    pub tool: String,
    /// JSON-encoded tool arguments. Frontend may `JSON.parse` if it needs the
    /// structured form; we keep the wire format as a string so specta exports
    /// a plain TS `string` (avoids `serde_json::Value` → `unknown` widening).
    pub arguments_json: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct ToolResultEvent {
    pub session_id: String,
    pub tool: String,
    pub result: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct ThinkingDeltaEvent {
    pub session_id: String,
    pub token: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, specta::Type, tauri_specta::Event)]
pub struct StatusEvent {
    pub session_id: String,
    /// Free-form event_type from hermes-agent's status_callback. Observed today:
    /// `"lifecycle"` (retries, compacting, context pressure). Future values are
    /// possible — frontend should treat as opaque tag.
    pub event_type: String,
    pub message: String,
}

pub const TOOL_START: &str = "agent:tool-start";
pub const TOOL_RESULT: &str = "agent:tool-result";
pub const THINKING_DELTA: &str = "agent:thinking-delta";
pub const STATUS: &str = "agent:status";

pub fn emit_tool_start(app: &AppHandle, e: ToolStartEvent) {
    if let Err(err) = app.emit(TOOL_START, e) {
        tracing::warn!(target = "events", "emit tool-start failed: {err}");
    }
}

pub fn emit_tool_result(app: &AppHandle, e: ToolResultEvent) {
    if let Err(err) = app.emit(TOOL_RESULT, e) {
        tracing::warn!(target = "events", "emit tool-result failed: {err}");
    }
}

pub fn emit_thinking_delta(app: &AppHandle, e: ThinkingDeltaEvent) {
    if let Err(err) = app.emit(THINKING_DELTA, e) {
        tracing::warn!(target = "events", "emit thinking-delta failed: {err}");
    }
}

pub fn emit_status(app: &AppHandle, e: StatusEvent) {
    if let Err(err) = app.emit(STATUS, e) {
        tracing::warn!(target = "events", "emit status failed: {err}");
    }
}
```

- [ ] **Step 2: Write the 4 serialization tests**

Append to the `#[cfg(test)] mod tests { ... }` block in `events.rs`:

```rust
    #[test]
    fn tool_start_serializes_with_arguments_json() {
        let json = serde_json::to_value(ToolStartEvent {
            session_id: "s1".into(),
            tool: "shell".into(),
            arguments_json: r#"{"cmd":"ls"}"#.into(),
        }).unwrap();
        assert_eq!(json["session_id"], "s1");
        assert_eq!(json["tool"], "shell");
        assert_eq!(json["arguments_json"], r#"{"cmd":"ls"}"#);
    }

    #[test]
    fn tool_result_serializes_with_result_string() {
        let json = serde_json::to_value(ToolResultEvent {
            session_id: "s1".into(),
            tool: "shell".into(),
            result: "hello\n".into(),
        }).unwrap();
        assert_eq!(json["tool"], "shell");
        assert_eq!(json["result"], "hello\n");
    }

    #[test]
    fn thinking_delta_serializes_with_token() {
        let json = serde_json::to_value(ThinkingDeltaEvent {
            session_id: "s1".into(),
            token: "Let me think...".into(),
        }).unwrap();
        assert_eq!(json["token"], "Let me think...");
    }

    #[test]
    fn status_serializes_with_event_type_and_message() {
        let json = serde_json::to_value(StatusEvent {
            session_id: "s1".into(),
            event_type: "lifecycle".into(),
            message: "Retrying API call (attempt 2/3)".into(),
        }).unwrap();
        assert_eq!(json["event_type"], "lifecycle");
        assert_eq!(json["message"], "Retrying API call (attempt 2/3)");
    }
```

- [ ] **Step 3: Verify all events tests pass**

```bash
cargo test -p hermes-desktop events
```
Expected: **9 PASS** (5 existing + 4 new). Full suite `cargo test -p hermes-desktop` should show **20 PASS** (16 from Plan 2a + 4 new).

- [ ] **Step 4: Commit**

```bash
git add desktop/src-tauri/src/events.rs
git commit -m "feat(desktop): typed payloads + emit helpers for tool/thinking/status events"
```

---

## Task 2: Per-call `AgentLoop` construction + `build_desktop_callbacks` factory

**Files:**
- Modify: `desktop/src-tauri/src/services/agent_service.rs`

This is the meaty refactor that resolves Plan 2a's TODO. The current implementation lazy-inits a single `Arc<AgentLoop>` and reuses it across all calls. We change it to:
1. Cache only `(Arc<dyn LlmProvider>, model_string)` (provider construction is the only expensive bit — provider holds API client state).
2. Build a fresh `AgentLoop` per `send_message_streaming` call with `session_id` set and the desktop-relevant config flipped.
3. Wire desktop callbacks via `.with_callbacks(...)`.

**Verified field names** from `crates/hermes-agent/src/agent_loop.rs` (don't trust this list blindly — re-grep on entry):
- `pub max_turns: u32` (line 346)
- `pub model: String` (line 354)
- `pub stream: bool` (line 378)
- `pub session_id: Option<String>` (line 403)
- `pub skip_memory: bool` (line 411)
- `pub skip_context_files: bool` (line 416)
- `pub code_index_enabled: bool` (line 561)
- `pub fn with_callbacks(mut self, cb: AgentCallbacks) -> Self` (line 1970)

**`AgentCallbacks` shape** (`agent_loop.rs:807–829`):
```rust
pub struct AgentCallbacks {
    pub on_thinking: Option<Box<dyn Fn(&str) + Send + Sync>>,
    pub on_tool_start: Option<Box<dyn Fn(&str, &serde_json::Value) + Send + Sync>>,
    pub on_tool_complete: Option<Box<dyn Fn(&str, &str) + Send + Sync>>,
    pub on_stream_delta: Option<Box<dyn Fn(&str) + Send + Sync>>,
    pub on_step_complete: Option<Box<dyn Fn(u32) + Send + Sync>>,
    pub background_review_callback: Option<Arc<dyn Fn(&str) + Send + Sync>>,
    pub status_callback: Option<Arc<dyn Fn(&str, &str) + Send + Sync>>,
}
```
We set 4 of them (`on_tool_start`, `on_tool_complete`, `on_thinking`, `status_callback`); leave the others `None`.

- [ ] **Step 1: Verify the field names match reality before editing**

```bash
grep -nE 'pub (skip_memory|skip_context_files|code_index_enabled|session_id|stream|max_turns|model)\b' \
    /Users/ryanliu/Documents/hermes-agent-ultra/crates/hermes-agent/src/agent_loop.rs
grep -nA1 "pub fn with_callbacks" /Users/ryanliu/Documents/hermes-agent-ultra/crates/hermes-agent/src/agent_loop.rs
grep -nE 'pub on_(thinking|tool_start|tool_complete)|pub status_callback' \
    /Users/ryanliu/Documents/hermes-agent-ultra/crates/hermes-agent/src/agent_loop.rs
```
Confirm: all 7 AgentConfig fields exist with the names listed above; `with_callbacks(mut self, cb: AgentCallbacks) -> Self` exists; the four callback fields use the exact closure signatures above. If anything differs, ADAPT the code in Step 2 to match.

- [ ] **Step 2: Add `build_desktop_callbacks` factory at the top of `agent_service.rs`'s module (before `AgentService`)**

Add these imports (alongside the existing `use hermes_agent::...` block):
```rust
use hermes_agent::AgentCallbacks;
```

Then add the factory function (place it AFTER the `use` declarations and BEFORE the `AgentService` struct):

```rust
/// Builds an `AgentCallbacks` value with the four desktop-facing callbacks
/// wired to typed `agent:*` Tauri events. Each closure owns its own clone of
/// `(AppHandle, session_id)` so the value is `Send + Sync + 'static`.
///
/// Callbacks NOT wired (intentionally, see Plan 2b.1):
///   - on_stream_delta: text deltas are handled by run_stream's `on_chunk`
///     callback (which fires per StreamChunk) — wiring this would double-emit.
///   - on_step_complete: turn-boundary marker not yet consumed by the UI.
///   - background_review_callback: runs on a spawned task; needs careful
///     thread-model design (Plan 2c).
fn build_desktop_callbacks(app: tauri::AppHandle, session_id: String) -> AgentCallbacks {
    let mut cb = AgentCallbacks::default();

    // on_tool_start(name, args)
    let (app_ts, sid_ts) = (app.clone(), session_id.clone());
    cb.on_tool_start = Some(Box::new(move |name: &str, args: &serde_json::Value| {
        events::emit_tool_start(&app_ts, events::ToolStartEvent {
            session_id: sid_ts.clone(),
            tool: name.to_string(),
            arguments_json: args.to_string(),
        });
    }));

    // on_tool_complete(name, result_content)
    let (app_tc, sid_tc) = (app.clone(), session_id.clone());
    cb.on_tool_complete = Some(Box::new(move |name: &str, result: &str| {
        events::emit_tool_result(&app_tc, events::ToolResultEvent {
            session_id: sid_tc.clone(),
            tool: name.to_string(),
            result: result.to_string(),
        });
    }));

    // on_thinking(reasoning_token)
    let (app_th, sid_th) = (app.clone(), session_id.clone());
    cb.on_thinking = Some(Box::new(move |token: &str| {
        events::emit_thinking_delta(&app_th, events::ThinkingDeltaEvent {
            session_id: sid_th.clone(),
            token: token.to_string(),
        });
    }));

    // status_callback(event_type, message)
    let (app_st, sid_st) = (app, session_id);
    cb.status_callback = Some(std::sync::Arc::new(move |event_type: &str, message: &str| {
        events::emit_status(&app_st, events::StatusEvent {
            session_id: sid_st.clone(),
            event_type: event_type.to_string(),
            message: message.to_string(),
        });
    }));

    cb
}
```

- [ ] **Step 3: Refactor `AgentService` to cache provider only**

Find the current `AgentService` struct + `inner: Mutex<Option<Arc<AgentLoop>>>` field. Replace the struct + its impl shell:

```rust
/// Lazily-cached LLM provider for the desktop session. `AgentLoop` itself is
/// built per `send_message_streaming` call so `AgentConfig.session_id` matches
/// the caller's session and callbacks can be wired per-session.
pub struct AgentService {
    /// Cached `(provider, model)` pair from env. None until first send.
    cached: tokio::sync::Mutex<Option<(std::sync::Arc<dyn LlmProvider>, String)>>,
}

impl AgentService {
    pub fn new() -> Self {
        Self { cached: tokio::sync::Mutex::new(None) }
    }

    /// Returns (or initialises) the (provider, model) pair.
    async fn get_or_init_provider(&self) -> Result<(std::sync::Arc<dyn LlmProvider>, String), AgentError> {
        let mut guard = self.cached.lock().await;
        if let Some((p, m)) = guard.as_ref() {
            return Ok((p.clone(), m.clone()));
        }
        let (provider, model) = build_provider_from_env()?;
        *guard = Some((provider.clone(), model.clone()));
        Ok((provider, model))
    }

    // (send_message_streaming reworked in Step 4 below)
}

impl Default for AgentService {
    fn default() -> Self { Self::new() }
}
```

Delete the old `get_or_init() -> Arc<AgentLoop>` method entirely. The old TODO comment about per-call construction is **resolved** by this refactor — remove the TODO block and replace its content with the new struct's comment above.

- [ ] **Step 4: Rewrite `send_message_streaming` to build `AgentLoop` per call with callbacks**

Replace the method body so it constructs a fresh `AgentLoop` for each call:

```rust
    pub async fn send_message_streaming(
        &self,
        app: AppHandle,
        session: &SessionService,
        session_id: String,
        user_text: String,
    ) -> Result<String, AgentError> {
        // Cache only the provider; everything else is per-call.
        let (provider, model) = self.get_or_init_provider().await?;

        // Per-call AgentConfig: tie session_id to this session; disable the
        // features that don't apply to a desktop session (no workspace project,
        // no memory wired yet).
        let config = AgentConfig {
            model,
            stream: true,
            max_turns: 20,
            session_id: Some(session_id.clone()),
            skip_memory: true,
            skip_context_files: true,
            code_index_enabled: false,
            ..AgentConfig::default()
        };

        // Empty tool registry for now; Plan 2c+ will register real tools.
        let tools = std::sync::Arc::new(AgentToolRegistry::new());

        // Wire the four desktop callbacks (tool/thinking/status).
        let callbacks = build_desktop_callbacks(app.clone(), session_id.clone());

        // Build and configure the agent.
        let agent = AgentLoop::new(config, tools, provider).with_callbacks(callbacks);

        // Load prior history (or emit a non-fatal error event and continue with empty).
        let mut history = match session.load(&session_id) {
            Ok(h) => h,
            Err(e) => {
                tracing::warn!(target = "agent_service", "session.load({session_id}) failed: {e}; using empty history");
                events::emit_error(&app, events::ErrorEvent {
                    session_id: session_id.clone(),
                    message: format!("session.load failed (using empty history): {e}"),
                });
                Vec::new()
            }
        };
        history.push(Message {
            role: MessageRole::User,
            content: Some(user_text),
            tool_calls: None,
            tool_call_id: None,
            name: None,
            reasoning_content: None,
            cache_control: None,
        });

        // Stream callback: translate StreamChunks → agent:text-delta / agent:tool-call-delta / agent:usage.
        let app_for_cb = app.clone();
        let session_for_cb = session_id.clone();
        let on_chunk: Box<dyn Fn(hermes_core::StreamChunk) + Send + Sync> = Box::new(move |chunk| {
            for tev in translate_chunk(&session_for_cb, &chunk) {
                match tev {
                    TranslatedEvent::TextDelta(e)     => events::emit_text_delta(&app_for_cb, e),
                    TranslatedEvent::ToolCallDelta(e) => events::emit_tool_call_delta(&app_for_cb, e),
                    TranslatedEvent::Usage(e)         => events::emit_usage(&app_for_cb, e),
                }
            }
        });

        // Drive the loop.
        let result = match agent.run_stream(history, None, Some(on_chunk)).await {
            Ok(r) => r,
            Err(e) => {
                events::emit_error(&app, events::ErrorEvent {
                    session_id: session_id.clone(),
                    message: e.to_string(),
                });
                return Err(e);
            }
        };

        // Persist updated history.
        if let Err(e) = session.save(&session_id, &result.messages, None) {
            tracing::warn!(target = "agent_service", "session.save({session_id}) failed: {e}");
        }

        // Extract last assistant reply.
        let reply = result
            .messages
            .iter()
            .rev()
            .find(|m| matches!(m.role, MessageRole::Assistant))
            .and_then(|m| m.content.clone())
            .unwrap_or_default();

        // Done reason from AgentResult.
        let reason = if result.interrupted {
            "interrupted"
        } else if result.finished_naturally {
            "stop"
        } else {
            "max_turns"
        };
        events::emit_done(&app, events::DoneEvent {
            session_id: session_id.clone(),
            reason: Some(reason.into()),
        });
        Ok(reply)
    }
```

> Verify `Arc::new(AgentToolRegistry::new())` is the right constructor. Plan 2a Task 5 used `AgentToolRegistry::new()` — same here.

- [ ] **Step 5: Add a test asserting `build_desktop_callbacks` wires all four fields**

Append to the `#[cfg(test)] mod tests { ... }` block in `agent_service.rs`:

```rust
    #[test]
    fn desktop_callbacks_factory_wires_four_fields() {
        // We can't construct an AppHandle without a Tauri runtime, so we use
        // a smoke-level test: confirm the function compiles and its return
        // value has the expected fields set when given a builder mock.
        //
        // Since AppHandle isn't constructible in a unit test, this test
        // verifies the FUNCTION SIGNATURE at compile time. The fact that the
        // crate builds is itself the test — if any closure capture or trait
        // bound is wrong, this compiles fails. We mark this with a deliberate
        // compile-only check that exercises the function pointer.
        let _f: fn(tauri::AppHandle, String) -> hermes_agent::AgentCallbacks = build_desktop_callbacks;
    }
```

> This is a "build-time test" — its only purpose is to make `build_desktop_callbacks` appear in the test compilation graph so any signature/bound regression breaks the build immediately. Don't elaborate beyond that; a fuller integration test requires a Tauri runtime (Plan 2b.2 territory).

- [ ] **Step 6: Verify the crate builds + all existing tests still pass**

```bash
cargo build -p hermes-desktop 2>&1 | tail -10
cargo test -p hermes-desktop 2>&1 | tail -20
```

Expected:
- Build: PASS, no NEW warnings beyond what Plan 2a had (which was zero). The Plan 2a-era `dead_code` warnings should not regress (they were resolved when commands consumed the services).
- Tests: **21 PASS** = 16 (Plan 2a) + 4 events tests (Task 1 of this plan) + 1 callback factory build-test (this Task).

- [ ] **Step 7: Commit**

```bash
git add desktop/src-tauri/src/services/agent_service.rs
git commit -m "refactor(desktop): per-call AgentLoop + DesktopCallbacks bridge (resolves Plan 2a TODO)"
```

---

## Task 3: Register the 4 new events in `collect_events!` + regenerate bindings

**Files:**
- Modify: `desktop/src-tauri/src/lib.rs`

- [ ] **Step 1: Extend the events list in `make_builder()`**

Find the `collect_events!` macro invocation inside `make_builder()`. Extend it from the current 5 entries to 9:

```rust
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
```
Also extend the `use crate::events::{...}` import line above `make_builder()` to include the 4 new types:
```rust
use crate::events::{
    TextDeltaEvent, ToolCallDeltaEvent, UsageEvent, DoneEvent, ErrorEvent,
    ToolStartEvent, ToolResultEvent, ThinkingDeltaEvent, StatusEvent,
};
```
Leave everything else in `lib.rs` unchanged.

- [ ] **Step 2: Regenerate bindings and verify**

```bash
cargo test -p hermes-desktop tests::export_bindings
grep -E 'ToolStartEvent|ToolResultEvent|ThinkingDeltaEvent|StatusEvent' \
    desktop/src/lib/bridge/generated.ts | head
```
Expected: all four types appear in `generated.ts` (likely as `export type ToolStartEvent = { session_id: string; tool: string; arguments_json: string }` etc. — note these have NO Option fields, so they should NOT split into `_Serialize`/`_Deserialize` variants like the Plan 2a structs did).

- [ ] **Step 3: Verify the full test suite is still green**

```bash
cargo test -p hermes-desktop 2>&1 | tail -5
```
Expected: 21 PASS (regenerating bindings doesn't add tests).

- [ ] **Step 4: Commit**

```bash
git add desktop/src-tauri/src/lib.rs desktop/src/lib/bridge/generated.ts
git commit -m "feat(desktop): register tool/thinking/status events with tauri-specta"
```

---

## Task 4: Extend the frontend `AgentEventMap` + re-export the new types

**Files:**
- Modify: `desktop/src/lib/bridge/events.ts`
- Modify: `desktop/src/lib/bridge/index.ts`

- [ ] **Step 1: Add 4 entries to `AgentEventMap`**

Replace `desktop/src/lib/bridge/events.ts` so the imports + map include the new types:

```ts
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  TextDeltaEvent,
  ToolCallDeltaEvent,
  UsageEvent,
  DoneEvent,
  ErrorEvent,
  ToolStartEvent,
  ToolResultEvent,
  ThinkingDeltaEvent,
  StatusEvent,
} from "./generated";

export type AgentEventMap = {
  "agent:text-delta": TextDeltaEvent;
  "agent:tool-call-delta": ToolCallDeltaEvent;
  "agent:usage": UsageEvent;
  "agent:done": DoneEvent;
  "agent:error": ErrorEvent;
  "agent:tool-start": ToolStartEvent;
  "agent:tool-result": ToolResultEvent;
  "agent:thinking-delta": ThinkingDeltaEvent;
  "agent:status": StatusEvent;
};

/** Subscribe to one of the `agent:*` events. The callback receives the
 *  typed payload (NOT Tauri's wrapper `{ event, payload }` — only the payload).
 *  Returns the unlisten function. */
export async function listenAgent<K extends keyof AgentEventMap>(
  name: K,
  cb: (payload: AgentEventMap[K]) => void,
): Promise<UnlistenFn> {
  return listen<AgentEventMap[K]>(name, (e) => cb(e.payload));
}
```

> Note: depending on whether the Plan 2a struct types `UsageEvent_Serialize as UsageEvent` aliases are imported via `events.ts` or via `index.ts`, you may need to keep the same aliasing pattern for the new types here. If `generated.ts` does NOT emit a `_Serialize` variant for the new types (they have no Option fields), the plain name resolves correctly — no aliasing needed.

- [ ] **Step 2: Update `index.ts` re-exports**

Replace `desktop/src/lib/bridge/index.ts` so the type re-exports include the 4 new types. Use whatever `_Serialize` aliasing the existing types use; the new types likely won't need it (no Option fields). Add them to the existing type re-export block:

```ts
// Thin re-export only. No logic here. One domain module per backend `commands/<domain>.rs`.
// `call` stays INTERNAL to lib/bridge/ — consumers use the per-domain bridges only.
export * as appBridge from "./app";
export * as agentBridge from "./agent";
export * as sessionBridge from "./session";
export * from "./events";
export type {
  AppInfo,
  SessionMessage_Serialize as SessionMessage,
  TextDeltaEvent,
  ToolCallDeltaEvent_Serialize as ToolCallDeltaEvent,
  UsageEvent_Serialize as UsageEvent,
  DoneEvent_Serialize as DoneEvent,
  ErrorEvent,
  ToolStartEvent,
  ToolResultEvent,
  ThinkingDeltaEvent,
  StatusEvent,
} from "./generated";
```

> If `cargo test tests::export_bindings` made the new types appear with a `_Serialize` suffix in `generated.ts`, alias them the same way (e.g., `ToolStartEvent_Serialize as ToolStartEvent`). The structs as written have no Option fields, so the suffix shouldn't appear — but verify by reading the generated file after the test runs.

- [ ] **Step 3: Verify the frontend type-checks**

```bash
pnpm --dir desktop build && pnpm --dir desktop test
```
Expected: build PASS (tsc resolves all new types from `generated.ts`); test PASS (1 cn test unchanged).

> The MVP `App.tsx` does NOT subscribe to the new events. That's deliberate — Plan 2b.2 will. Confirm `App.tsx` is untouched: `git diff fc32c9a -- desktop/src/app/App.tsx` should be empty.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/lib/bridge/events.ts desktop/src/lib/bridge/index.ts
git commit -m "feat(desktop): extend AgentEventMap with tool/thinking/status events"
```

---

## Task 5: Smoke verification (automated parts only)

**Files:** None (verification only).

- [ ] **Step 1: Backend lib tests**

```bash
cargo test -p hermes-desktop --lib
```
Expected: **21 PASS** (1 app_service + 1 export_bindings + 2 session_service + 9 events + 8 agent_service [7 translate_chunk + 1 callbacks factory]).

- [ ] **Step 2: Frontend tests + build**

```bash
pnpm --dir desktop test
pnpm --dir desktop build
```
Expected: 1 PASS (cn util); build clean.

- [ ] **Step 3: Warning-free build + clippy**

```bash
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -5
cargo clippy -p hermes-desktop --no-deps -- -D warnings 2>&1 | tail -5
```
Expected: both clean. (The pre-existing `manual_map` warning in `hermes-core` remains out of scope.)

- [ ] **Step 4: Workspace regression check**

```bash
cargo check --workspace
```
Expected: PASS. (Per-call AgentLoop construction is a self-contained change — sibling crates are unaffected.)

- [ ] **Step 5: Bindings up-to-date check**

```bash
cargo test -p hermes-desktop tests::export_bindings
git status --short desktop/src/lib/bridge/generated.ts
```
Expected: test PASS, status shows no diff (bindings are already committed).

- [ ] **Step 6: Manual visual smoke** — surface this to the human reviewer; subagent must NOT attempt.

The new events fire only when:
- A model with extended thinking is configured AND emits thinking tokens → `agent:thinking-delta`.
- The agent invokes a tool → `agent:tool-start` + `agent:tool-result`. **This requires non-empty `ToolRegistry`, which Plan 2b.1 deliberately leaves empty** — so tool events do NOT fire under Plan 2b.1 alone. They'll fire once Plan 2c+ registers real tools.
- The agent encounters a retryable API error or hits context limits → `agent:status` with `event_type: "lifecycle"`.

So the **observable behaviour from a manual `tauri dev` smoke after Plan 2b.1 is unchanged from Plan 2a**: send a message, see streamed text reply, done. The new event bridge is structurally in place but doesn't have triggers in the MVP scope. This is **the expected and acceptable outcome** for Plan 2b.1 — the bridge exists so Plan 2b.2 can immediately consume new events as the UI port gains the rendering surface, without needing further backend changes.

To explicitly verify the existing MVP behaviour did NOT regress:
```bash
export OPENAI_API_KEY="sk-…"   # or ANTHROPIC_API_KEY
pnpm --dir desktop tauri dev
```
Type "hi" → press Send. Expected: same streaming token behaviour as Plan 2a; no console errors.

- [ ] **Step 7: Repo state**

```bash
git status --short
git log --oneline -8
```
Expected: tree clean, four commits visible above `fc32c9a` (Plan 2a tip).

---

## Done When

- `cargo test -p hermes-desktop --lib` → **21 PASS**.
- `cargo build -p hermes-desktop` warning-free with `-D warnings`; `cargo clippy -p hermes-desktop --no-deps -- -D warnings` clean.
- `cargo check --workspace` PASS.
- `pnpm --dir desktop build` + `pnpm --dir desktop test` PASS.
- `desktop/src/lib/bridge/generated.ts` includes all 9 event types; the new four (`ToolStartEvent`/`ToolResultEvent`/`ThinkingDeltaEvent`/`StatusEvent`) appear as plain types (no `_Serialize`/`_Deserialize` split, since they have no Option fields).
- `AgentService` constructs `AgentLoop` per call with `config.session_id = Some(session_id)` + `skip_memory: true` + `skip_context_files: true` + `code_index_enabled: false`, and chains `.with_callbacks(build_desktop_callbacks(app, session_id))`.
- The Plan 2a TODO block about per-call construction is REMOVED from `agent_service.rs`.
- `App.tsx` is byte-identical to its Plan 2a state (`git diff fc32c9a -- desktop/src/app/App.tsx` empty).

## Next Plan

**Plan 2b.2 — uclaw message-view 1:1 port:** copy whole directories `ui/src/components/{ai-elements,agent,chat}` + `atoms/agent-atoms.ts` + `atoms/chat-atoms.ts` from `/Users/ryanliu/Documents/uclaw` into `desktop/src/features/chat-agent/`; re-point each `applyAgentEvent` event type to consume the events from `listenAgent` (the typed `AgentEventMap` from this plan covers 9 of uclaw's ~14 event types — the remaining 5 are deferred to Plan 2c per the recon in the ADR); replace the MVP composer with uclaw's full composer + message timeline + tool renderers. Use Plan 2a's foundation + Plan 2b.1's event surface as the substrate.
