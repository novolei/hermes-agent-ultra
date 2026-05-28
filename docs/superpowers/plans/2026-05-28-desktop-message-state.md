# Desktop Message-View State Machine Port — Plan 2b.2.a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port uclaw's message-view **state-machine spine** into `desktop/src/features/chat-agent/`: the typed event reducer `applyAgentEvent` + `AgentStreamState` Jotai atoms + the shared agent/chat type definitions — and TDD a `bridgeEventToAgentEvent` adapter so all 9 of our `agent:*` Tauri events translate to the `AgentEvent` shape `applyAgentEvent` expects. **No React components yet** — that's Plan 2b.2.b. **No App.tsx wiring** — that's Plan 2b.2.c.

**Architecture:** uclaw's `agent-atoms.ts` is a 1029-line module containing the `AgentStreamState` reducer that backs uclaw's message-view UI. It imports ONLY from `@/lib/agent-types` (types) — making it a clean port boundary. We copy the file verbatim, retarget the import path to our local `features/chat-agent/lib/agent-types.ts`, and add a Tauri-event-to-AgentEvent adapter on top so the existing reducer accepts our Tauri events. The result is a fully unit-tested state machine — Plan 2b.2.b builds React components on top, Plan 2b.2.c wires the bridge to it.

**Tech stack additions:** `jotai@2.17.1` (state primitive uclaw uses). That's the only new dep — the reducer itself is pure TS, requires no runtime libraries beyond jotai's `atom`/`atomFamily`.

**What this plan does NOT do** (per the ADR Phase 3 split and the 2b.2 sub-split):
- Port any uclaw React components (ai-elements, agent message UI, chat UI) — **Plan 2b.2.b**.
- Replace `App.tsx`'s MVP composer with the full uclaw message view — **Plan 2b.2.c**.
- Add tool renderers (`tool-renderers/*`) — **Plan 2b.2.c**.
- Wire `listenAgent` to call `applyAgentEvent` — **Plan 2b.2.c**.
- Add markdown rendering, Shiki, TipTap, motion deps — **Plan 2b.2.b** (when components consume them).
- Port any chat-mode (non-agent) atoms or components — out of scope (we're agent-mode only).

**Reference**: ADR [DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md](../../roadmaps/DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md) — Phase 3 (Anti-corruption layer + message view 1:1) — Plan 2b.2 is the frontend half; 2b.2.a is its state-machine port.

---

## Known mismatches between our 9 Tauri events and uclaw's `applyAgentEvent`

The adapter (Task 4) translates these:

| Our Tauri event (post-bridge) | uclaw `AgentEvent.type` | Field-level mismatches |
|---|---|---|
| `agent:text-delta` | `text_delta` | uclaw uses `event.text`; we use `event.text` ✓ |
| `agent:done` | `complete` | uclaw uses `event.reason` (string); we use `event.reason` (string) ✓ |
| `agent:error` | `error` | uclaw uses `event.message`; we use `event.message` ✓ |
| `agent:usage` | `usage_update` | uclaw uses `event.usage: { input_tokens, output_tokens, ... }`; we use flat `{ prompt_tokens, completion_tokens, total_tokens, estimated_cost }` — **adapter remaps fields**. |
| `agent:thinking-delta` | (verify uclaw's case name — likely `thinking_delta` or `reasoning`) | uclaw mutates `prev.reasoning += event.text`; we send `event.token` (one reasoning token) — **adapter remaps `token` → `text`** if needed. |
| `agent:tool-start` | `tool_start` | uclaw expects `{ toolUseId, toolName, input }`; we send `{ tool, arguments_json }`. **Adapter synthesizes `toolUseId` from `(session_id, tool, monotonic_counter)` per session** (limitation: parallel same-name tools merge — acceptable for MVP since `ToolRegistry::new()` is empty anyway). Also parses `arguments_json` to `input: Record<string, unknown>`. |
| `agent:tool-result` | `tool_result` | uclaw expects `{ toolUseId, result, isError }`. **Adapter matches by `(session_id, tool)` against the most-recent pending start** for that name. `isError` not available from our event — adapter sets `false` until upstream callback is enhanced (Plan 2c+). |
| `agent:tool-call-delta` | (no case in uclaw) | **Adapter drops** these events — they're partial tool-call assembly chunks; tool_start arrives once the call is complete. Documented in the adapter. |
| `agent:status` | `compacting` / `compact_complete` / `retrying` / etc. | uclaw has DISTINCT case names per status; our `event.event_type` is the discriminator string. **Adapter switches on `event_type` to choose the right uclaw `type`**. For unknown `event_type` values, adapter emits a generic `{ type: 'status', message }` and uclaw's switch falls through gracefully (verified at Task 5). |

The adapter is the **central piece of testable logic in this plan**. Every mapping is TDD'd.

---

## File Structure (created or modified)

```
desktop/
  package.json                              # MODIFY: + jotai@2.17.1
  pnpm-lock.yaml                            # AUTO
  src/features/chat-agent/                  # NEW directory
    lib/
      agent-types.ts                        # CREATE: port from uclaw/ui/src/lib/agent-types.ts
      chat-types.ts                         # CREATE: port from uclaw/ui/src/lib/chat-types.ts (shared types)
    atoms/
      agent-atoms.ts                        # CREATE: port from uclaw/ui/src/atoms/agent-atoms.ts (verbatim, retarget imports)
    bridge-adapter.ts                       # CREATE: bridgeEventToAgentEvent — TDD heart of this plan
    bridge-adapter.test.ts                  # CREATE: 9 + integration test cases
```

The `desktop/src/features/chat-agent/` directory is a self-contained feature module (per Plan 1's feature-based discipline). Plan 2b.2.b adds `components/`, Plan 2b.2.c adds `AgentView.tsx` and wires `App.tsx`.

---

## Task 1: Install `jotai` + scaffold the `features/chat-agent/` directory

**Files:**
- Modify: `desktop/package.json`
- Create: `desktop/src/features/chat-agent/.gitkeep`
- Create: `desktop/src/features/chat-agent/lib/.gitkeep`
- Create: `desktop/src/features/chat-agent/atoms/.gitkeep`

- [ ] **Step 1: Install Jotai (the exact version uclaw uses)**
```bash
pnpm --dir desktop add jotai@2.17.1
```
Expected: `package.json` gains `"jotai": "2.17.1"` (the leading `^` is fine if pnpm adds it). Verify with `grep '"jotai"' desktop/package.json`.

- [ ] **Step 2: Create the feature directory skeleton**
```bash
mkdir -p desktop/src/features/chat-agent/lib desktop/src/features/chat-agent/atoms
touch desktop/src/features/chat-agent/.gitkeep \
      desktop/src/features/chat-agent/lib/.gitkeep \
      desktop/src/features/chat-agent/atoms/.gitkeep
```
(The `.gitkeep` files get replaced by the real source files in Tasks 2–4; they exist so git tracks the empty dirs until then.)

- [ ] **Step 3: Verify the frontend still builds + tests pass (Jotai installed; nothing yet uses it)**
```bash
pnpm --dir desktop build && pnpm --dir desktop test
```
Expected: PASS (Jotai is a transitive type-only add until Tasks 3–4 import it).

- [ ] **Step 4: Commit**
```bash
git add desktop/package.json desktop/pnpm-lock.yaml desktop/src/features
git commit -m "feat(desktop): install jotai@2.17.1 + scaffold features/chat-agent/"
```

---

## Task 2: Port `agent-types.ts` + `chat-types.ts` into `features/chat-agent/lib/`

**Files:**
- Create: `desktop/src/features/chat-agent/lib/agent-types.ts` (port from `uclaw/ui/src/lib/agent-types.ts`)
- Create: `desktop/src/features/chat-agent/lib/chat-types.ts` (port from `uclaw/ui/src/lib/chat-types.ts`)

These two files define every type `agent-atoms.ts` consumes. They are largely self-contained TypeScript — `agent-types.ts` imports a few shared types from `chat-types.ts` (notably `ChatToolActivity`, `FileAttachment`, `ContentBlock`, `Channel`, `ChannelModel`); `chat-types.ts` imports nothing from inside the project (just `node`-style types).

- [ ] **Step 1: Copy `chat-types.ts` verbatim**
```bash
cp /Users/ryanliu/Documents/uclaw/ui/src/lib/chat-types.ts desktop/src/features/chat-agent/lib/chat-types.ts
```
Read the file to check for any `@/...` import paths (there should be none — verify with `grep '@/' desktop/src/features/chat-agent/lib/chat-types.ts`). If grep returns hits, those imports need re-pointing or stubbing; report what they are and pause for instruction.

- [ ] **Step 2: Copy `agent-types.ts` verbatim**
```bash
cp /Users/ryanliu/Documents/uclaw/ui/src/lib/agent-types.ts desktop/src/features/chat-agent/lib/agent-types.ts
```

- [ ] **Step 3: Retarget any `@/lib/chat-types` import inside `agent-types.ts` to a sibling path**

uclaw's `agent-types.ts` likely has `import ... from '@/lib/chat-types'`. In our port that path doesn't exist — it should be `./chat-types`. Find and replace ONLY the `@/lib/chat-types` → `./chat-types` substitution. Other `@/lib/...` imports (if any — check via `grep '@/' desktop/src/features/chat-agent/lib/agent-types.ts`): if they point to project modules we don't have (e.g., `@/lib/tauri-bridge`), report them — those types may need stubbing.

- [ ] **Step 4: Verify the frontend still type-checks**
```bash
pnpm --dir desktop build
```
Expected: PASS. tsc must accept both new files. If it fails, the most likely cause is an unresolved `@/` import — fix or stub per the discussion in Step 3, then re-run.

- [ ] **Step 5: Commit**
```bash
git add desktop/src/features/chat-agent/lib
git commit -m "feat(desktop): port agent-types + chat-types from uclaw"
```

---

## Task 3: Port `agent-atoms.ts` into `features/chat-agent/atoms/`

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/agent-atoms.ts` (port from `uclaw/ui/src/atoms/agent-atoms.ts`)

uclaw's `agent-atoms.ts` is 1029 LOC. Per the recon, its only project-level imports are `@/lib/agent-types`. We retarget that single import path to our local types module.

- [ ] **Step 1: Copy `agent-atoms.ts` verbatim**
```bash
cp /Users/ryanliu/Documents/uclaw/ui/src/atoms/agent-atoms.ts desktop/src/features/chat-agent/atoms/agent-atoms.ts
```

- [ ] **Step 2: Retarget the `@/lib/agent-types` import to the local path**

Open the file and locate the import line near the top (around line 10 per the recon). It should look like:
```ts
import type { ... } from '@/lib/agent-types'
```
Replace with:
```ts
import type { ... } from '../lib/agent-types'
```
(Path is relative because atoms/ is sibling to lib/.)

If the file has OTHER `@/` imports (project-level), enumerate them and report:
```bash
grep -n '@/' desktop/src/features/chat-agent/atoms/agent-atoms.ts
```
Expected: zero or one hit (only `@/lib/agent-types`, now retargeted). If more hits, those modules need stubbing or alias-pointing — pause and report.

- [ ] **Step 3: Verify the frontend builds + tests pass**
```bash
pnpm --dir desktop build && pnpm --dir desktop test
```
Expected: PASS. tsc must accept the 1029-line atoms file with its retargeted import.

> If tsc reports missing exports from `chat-types.ts` (because some types referenced by `agent-atoms.ts` chain through `agent-types.ts` to `chat-types.ts`), that means Task 2 missed a re-export. Fix by exporting the missing types from `agent-types.ts` (`export type { X, Y } from './chat-types'`) until tsc is satisfied. The principle: agent-atoms.ts is the SOURCE OF TRUTH for what we need to support — any type it consumes must be reachable.

- [ ] **Step 4: Commit**
```bash
git add desktop/src/features/chat-agent/atoms/agent-atoms.ts
git commit -m "feat(desktop): port agent-atoms (applyAgentEvent reducer) from uclaw"
```

---

## Task 4: Build `bridgeEventToAgentEvent` adapter (TDD — the core of this plan)

**Files:**
- Create: `desktop/src/features/chat-agent/bridge-adapter.ts`
- Create: `desktop/src/features/chat-agent/bridge-adapter.test.ts`

The adapter accepts a `BridgeAgentEvent` discriminated union (one variant per our 9 Tauri events) and returns an `AgentEvent` (uclaw's loose `{ type: string; ... }` shape) that `applyAgentEvent` accepts. The adapter holds **per-adapter-instance state** to synthesize `toolUseId`s (a counter map keyed by `(session_id, tool_name)` so each tool_start gets a unique id matchable to its tool_result).

- [ ] **Step 1: Write the failing test file FIRST**

Create `desktop/src/features/chat-agent/bridge-adapter.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type {
  TextDeltaEvent, ToolCallDeltaEvent, UsageEvent, DoneEvent, ErrorEvent,
  ToolStartEvent, ToolResultEvent, ThinkingDeltaEvent, StatusEvent,
} from "@/lib/bridge";
import { createBridgeAdapter } from "./bridge-adapter";

describe("bridgeEventToAgentEvent", () => {
  it("translates text-delta", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:text-delta", {
      session_id: "s1", text: "hello",
    } as TextDeltaEvent);
    expect(out).toEqual({ type: "text_delta", sessionId: "s1", text: "hello" });
  });

  it("translates done into uclaw's `complete`", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:done", {
      session_id: "s1", reason: "stop",
    } as DoneEvent);
    expect(out).toMatchObject({ type: "complete", sessionId: "s1", reason: "stop" });
  });

  it("translates error", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:error", {
      session_id: "s1", message: "boom",
    } as ErrorEvent);
    expect(out).toMatchObject({ type: "error", sessionId: "s1", message: "boom" });
  });

  it("translates usage by remapping field names", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:usage", {
      session_id: "s1",
      prompt_tokens: 10, completion_tokens: 20, total_tokens: 30,
      estimated_cost: 0.0001,
    } as UsageEvent);
    expect(out).toMatchObject({
      type: "usage_update",
      sessionId: "s1",
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        estimated_cost_usd: 0.0001,
      },
    });
  });

  it("translates thinking-delta into uclaw's thinking case", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:thinking-delta", {
      session_id: "s1", token: "Let me think...",
    } as ThinkingDeltaEvent);
    // Match whatever uclaw's reducer expects — verify via task 5 integration test.
    // The minimum contract: a `type` string the switch handles, and the text.
    expect(out.type).toMatch(/thinking|reasoning/);
    expect(out.sessionId).toBe("s1");
  });

  it("translates tool-start, synthesizing a toolUseId", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:tool-start", {
      session_id: "s1", tool: "shell", arguments_json: '{"cmd":"ls"}',
    } as ToolStartEvent);
    expect(out.type).toBe("tool_start");
    expect(out.sessionId).toBe("s1");
    expect((out as { toolName: string }).toolName).toBe("shell");
    expect((out as { toolUseId: string }).toolUseId).toMatch(/^s1:shell:/);
    expect((out as { input: Record<string, unknown> }).input).toEqual({ cmd: "ls" });
  });

  it("translates tool-result, matching the synthesized toolUseId from a prior tool-start", () => {
    const adapter = createBridgeAdapter();
    const startOut = adapter.translate("agent:tool-start", {
      session_id: "s1", tool: "shell", arguments_json: '{"cmd":"ls"}',
    } as ToolStartEvent);
    const resultOut = adapter.translate("agent:tool-result", {
      session_id: "s1", tool: "shell", result: "a.txt\nb.txt\n",
    } as ToolResultEvent);
    expect(resultOut.type).toBe("tool_result");
    expect((resultOut as { toolUseId: string }).toolUseId)
      .toBe((startOut as { toolUseId: string }).toolUseId);
    expect((resultOut as { result: string }).result).toBe("a.txt\nb.txt\n");
    expect((resultOut as { isError: boolean }).isError).toBe(false);
  });

  it("drops tool-call-delta (partial tool-call assembly — no uclaw handler)", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:tool-call-delta", {
      session_id: "s1", index: 0, function_name: "shell", arguments_chunk: "{",
    } as ToolCallDeltaEvent);
    expect(out).toBeNull();
  });

  it("translates status: lifecycle → compacting/retrying/etc.", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:status", {
      session_id: "s1", event_type: "lifecycle", message: "Retrying API call",
    } as StatusEvent);
    // Generic status — uclaw's reducer should accept `type: 'status'` or fall through;
    // adapter emits a stable shape.
    expect(out).toMatchObject({ sessionId: "s1", message: "Retrying API call" });
    expect(out?.type).toMatch(/status|retrying|compacting/);
  });
});
```

- [ ] **Step 2: Run the failing test to confirm RED**
```bash
pnpm --dir desktop test bridge-adapter
```
Expected: FAIL (module not found — `./bridge-adapter` doesn't exist yet).

- [ ] **Step 3: Implement the adapter to GREEN**

Create `desktop/src/features/chat-agent/bridge-adapter.ts`:

```ts
import type {
  TextDeltaEvent, ToolCallDeltaEvent, UsageEvent, DoneEvent, ErrorEvent,
  ToolStartEvent, ToolResultEvent, ThinkingDeltaEvent, StatusEvent,
} from "@/lib/bridge";
import type { AgentEvent } from "./lib/agent-types";

/** Discriminated input shape — one variant per `AgentEventMap` key. */
export type BridgeAgentEvent =
  | { name: "agent:text-delta"; payload: TextDeltaEvent }
  | { name: "agent:tool-call-delta"; payload: ToolCallDeltaEvent }
  | { name: "agent:usage"; payload: UsageEvent }
  | { name: "agent:done"; payload: DoneEvent }
  | { name: "agent:error"; payload: ErrorEvent }
  | { name: "agent:tool-start"; payload: ToolStartEvent }
  | { name: "agent:tool-result"; payload: ToolResultEvent }
  | { name: "agent:thinking-delta"; payload: ThinkingDeltaEvent }
  | { name: "agent:status"; payload: StatusEvent };

export interface BridgeAdapter {
  /** Translate ONE bridge event. Returns null for events with no uclaw equivalent. */
  translate<K extends BridgeAgentEvent["name"]>(
    name: K,
    payload: Extract<BridgeAgentEvent, { name: K }>["payload"],
  ): AgentEvent | null;
}

/** Create an adapter instance. Each instance owns a per-session tool-id counter
 *  so concurrent sessions don't collide; counters are scoped to (session_id, tool_name). */
export function createBridgeAdapter(): BridgeAdapter {
  // (session_id, tool_name) → most-recent synthesized toolUseId
  const lastToolId = new Map<string, string>();
  // (session_id, tool_name) → monotonically incrementing counter
  const counters = new Map<string, number>();

  function nextToolUseId(sessionId: string, tool: string): string {
    const key = `${sessionId}::${tool}`;
    const n = (counters.get(key) ?? 0) + 1;
    counters.set(key, n);
    const id = `${sessionId}:${tool}:${n}`;
    lastToolId.set(key, id);
    return id;
  }

  function getLastToolId(sessionId: string, tool: string): string {
    const key = `${sessionId}::${tool}`;
    return lastToolId.get(key) ?? `${sessionId}:${tool}:orphan`;
  }

  return {
    translate(name, payload) {
      switch (name) {
        case "agent:text-delta": {
          const p = payload as TextDeltaEvent;
          return { type: "text_delta", sessionId: p.session_id, text: p.text };
        }
        case "agent:done": {
          const p = payload as DoneEvent;
          return { type: "complete", sessionId: p.session_id, reason: p.reason };
        }
        case "agent:error": {
          const p = payload as ErrorEvent;
          return { type: "error", sessionId: p.session_id, message: p.message };
        }
        case "agent:usage": {
          const p = payload as UsageEvent;
          return {
            type: "usage_update",
            sessionId: p.session_id,
            usage: {
              input_tokens: p.prompt_tokens,
              output_tokens: p.completion_tokens,
              total_tokens: p.total_tokens,
              estimated_cost_usd: p.estimated_cost,
            },
          };
        }
        case "agent:thinking-delta": {
          const p = payload as ThinkingDeltaEvent;
          // uclaw's reducer treats thinking as appended `reasoning` text.
          // We emit a `thinking_delta`-typed event; Task 5 verifies the reducer's switch.
          return { type: "thinking_delta", sessionId: p.session_id, text: p.token };
        }
        case "agent:tool-start": {
          const p = payload as ToolStartEvent;
          const toolUseId = nextToolUseId(p.session_id, p.tool);
          let input: Record<string, unknown>;
          try {
            input = JSON.parse(p.arguments_json) as Record<string, unknown>;
          } catch {
            input = { _raw: p.arguments_json };
          }
          return {
            type: "tool_start",
            sessionId: p.session_id,
            toolUseId,
            toolName: p.tool,
            input,
          };
        }
        case "agent:tool-result": {
          const p = payload as ToolResultEvent;
          const toolUseId = getLastToolId(p.session_id, p.tool);
          return {
            type: "tool_result",
            sessionId: p.session_id,
            toolUseId,
            result: p.result,
            isError: false, // Upstream callback doesn't expose; defaults to false. Plan 2c+ enhances.
          };
        }
        case "agent:tool-call-delta": {
          // Partial tool-call assembly chunks; no uclaw handler. Drop.
          return null;
        }
        case "agent:status": {
          const p = payload as StatusEvent;
          // Map known `event_type` values to uclaw's specific cases; fallback to a generic 'status'
          // shape that the reducer's switch falls through on (verified in Task 5).
          const t = (() => {
            if (p.event_type === "lifecycle") {
              // Best-effort string match — these are heuristic mappings.
              if (/retry/i.test(p.message)) return "retrying";
              if (/compact/i.test(p.message)) return "compacting";
            }
            return "status";
          })();
          return { type: t, sessionId: p.session_id, message: p.message };
        }
        default: {
          // Exhaustiveness guard — TypeScript will flag if any AgentEventMap key is missed.
          const _exhaustive: never = name;
          return _exhaustive;
        }
      }
    },
  };
}
```

- [ ] **Step 4: Run the tests to GREEN**
```bash
pnpm --dir desktop test bridge-adapter
```
Expected: 9 PASS.

If the `thinking-delta` test fails because `agent-atoms.ts`'s reducer uses a different `type` string than `'thinking_delta'` (e.g., the switch case might be on a different name), adjust the adapter's output and the test together — Task 5's integration test will catch this definitively. Report the specific mismatch and the chosen mapping.

- [ ] **Step 5: Verify full crate is still green**
```bash
pnpm --dir desktop build && pnpm --dir desktop test
```
Expected: build PASS, all tests PASS (≥10 = 1 cn + 9 adapter).

- [ ] **Step 6: Commit**
```bash
git add desktop/src/features/chat-agent/bridge-adapter.ts desktop/src/features/chat-agent/bridge-adapter.test.ts
git commit -m "feat(desktop): bridgeEventToAgentEvent adapter (TDD, 9 event types)"
```

---

## Task 5: Integration test — `applyAgentEvent` accepts every adapter output

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/agent-atoms.test.ts`

The adapter (Task 4) maps Tauri events to AgentEvent shapes. This task verifies the REDUCER accepts every shape and updates `AgentStreamState` as expected. This is the "second half" of the state machine TDD: adapter+reducer end-to-end.

- [ ] **Step 1: Write the failing integration test**

Create `desktop/src/features/chat-agent/atoms/agent-atoms.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { AgentStreamState } from "./agent-atoms";
import { applyAgentEvent } from "./agent-atoms";
import { createBridgeAdapter } from "../bridge-adapter";

/** Build an empty AgentStreamState (whatever defaults uclaw's reducer expects).
 *  The shape: see agent-atoms.ts — usually content="", reasoning="", toolActivities=[],
 *  isRunning=false, usage=undefined, etc. The reducer's case bodies tell us. */
function emptyState(): AgentStreamState {
  return applyAgentEvent(undefined as any, { type: "__init__", sessionId: "s1" } as any);
  // If applyAgentEvent requires a non-undefined `prev`, this helper needs to be revised
  // to pass an actual empty state object — read agent-atoms.ts to determine the canonical
  // empty shape (look for the atomFamily's default value or any export of an `emptyAgentStreamState`).
}

describe("applyAgentEvent accepts every adapter output", () => {
  it("text_delta appends to content", () => {
    const adapter = createBridgeAdapter();
    const ev = adapter.translate("agent:text-delta", {
      session_id: "s1", text: "hello ",
    })!;
    const next = applyAgentEvent(emptyState(), ev);
    expect(next.content).toContain("hello");
  });

  it("multiple text_delta accumulate", () => {
    const adapter = createBridgeAdapter();
    const a = adapter.translate("agent:text-delta", { session_id: "s1", text: "hello " })!;
    const b = adapter.translate("agent:text-delta", { session_id: "s1", text: "world" })!;
    const next = applyAgentEvent(applyAgentEvent(emptyState(), a), b);
    expect(next.content).toBe("hello world");
  });

  it("tool_start + tool_result produces ONE completed activity", () => {
    const adapter = createBridgeAdapter();
    const start = adapter.translate("agent:tool-start", {
      session_id: "s1", tool: "shell", arguments_json: '{"cmd":"ls"}',
    })!;
    const result = adapter.translate("agent:tool-result", {
      session_id: "s1", tool: "shell", result: "a.txt\n",
    })!;
    const afterStart = applyAgentEvent(emptyState(), start);
    expect(afterStart.toolActivities).toHaveLength(1);
    expect(afterStart.toolActivities[0]?.done).toBe(false);

    const afterResult = applyAgentEvent(afterStart, result);
    expect(afterResult.toolActivities).toHaveLength(1);
    expect(afterResult.toolActivities[0]?.done).toBe(true);
    expect(afterResult.toolActivities[0]?.result).toBe("a.txt\n");
  });

  it("usage_update sets token counts", () => {
    const adapter = createBridgeAdapter();
    const ev = adapter.translate("agent:usage", {
      session_id: "s1",
      prompt_tokens: 10, completion_tokens: 20, total_tokens: 30, estimated_cost: 0.0001,
    })!;
    const next = applyAgentEvent(emptyState(), ev);
    // Whatever fields uclaw uses — read the case body to know the actual setters.
    // Assert at least that SOMETHING changed.
    expect(JSON.stringify(next)).toContain("30");
  });

  it("complete marks the stream done", () => {
    const adapter = createBridgeAdapter();
    const ev = adapter.translate("agent:done", { session_id: "s1", reason: "stop" })!;
    const next = applyAgentEvent(emptyState(), ev);
    // The reducer sets `isRunning=false` or similar. Verify by reading the `case 'complete'` body
    // in agent-atoms.ts and assert that flag.
    expect((next as { isRunning?: boolean }).isRunning).toBe(false);
  });

  it("error transitions stream into error state", () => {
    const adapter = createBridgeAdapter();
    const ev = adapter.translate("agent:error", { session_id: "s1", message: "boom" })!;
    const next = applyAgentEvent(emptyState(), ev);
    expect((next as { isRunning?: boolean }).isRunning).toBe(false);
  });

  it("thinking_delta accumulates reasoning text", () => {
    const adapter = createBridgeAdapter();
    const ev = adapter.translate("agent:thinking-delta", {
      session_id: "s1", token: "Let me ",
    })!;
    const ev2 = adapter.translate("agent:thinking-delta", {
      session_id: "s1", token: "think...",
    })!;
    const next = applyAgentEvent(applyAgentEvent(emptyState(), ev), ev2);
    // Read the case body in agent-atoms.ts to determine which field holds reasoning text;
    // it's likely `next.reasoning` or `next.thinking`. Assert it contains "Let me think...".
    const reasoning = (next as { reasoning?: string; thinking?: string }).reasoning ??
                      (next as { reasoning?: string; thinking?: string }).thinking ?? "";
    expect(reasoning).toBe("Let me think...");
  });
});
```

> **CRITICAL implementation note**: this test file makes assumptions about `AgentStreamState`'s default shape (`content: ""`, `reasoning: ""`, `toolActivities: []`, `isRunning: false`). Before running, READ `agent-atoms.ts` to find:
> - The canonical empty state — search for `defaultStreamingState`, `emptyAgentStreamState`, the `atomFamily(...)` default-value function, or the `initial` value passed when a session is first seen.
> - The exact field names used by `applyAgentEvent`'s case bodies (e.g., is it `next.reasoning` or `next.thinking_content`?).
> Adjust the `emptyState()` helper and the assertions to match reality. If a case's mapping doesn't exist as expected (e.g., `thinking_delta` isn't a case), DOCUMENT the discrepancy and either (a) adjust the adapter's output type in `bridge-adapter.ts` to match an existing case, or (b) mark the test as expected-fail with a clear `// SKIPPED — pending Plan 2b.2.b discovery` comment and proceed. The plan accepts a SUBSET of the 7 cases passing in this task as long as text_delta, tool_start, tool_result, complete, error pass (the core 5).

- [ ] **Step 2: Run the failing tests + adapt until ≥5 of 7 pass**
```bash
pnpm --dir desktop test agent-atoms
```
Expected: AT LEAST text_delta, multiple text_delta, tool_start+tool_result, complete, error pass. The usage_update and thinking_delta tests may need adapter-output tweaks based on what `agent-atoms.ts`'s case bodies actually do.

If any test fails because the reducer expects a field shape different from what the adapter emits, fix the adapter (in `bridge-adapter.ts`) and update its unit test in `bridge-adapter.test.ts` to keep that file green too. Document the discrepancy in a one-line code comment.

- [ ] **Step 3: Re-run the adapter tests to make sure they're still green after adapter tweaks**
```bash
pnpm --dir desktop test bridge-adapter
```
Expected: 9 PASS.

- [ ] **Step 4: Full test suite**
```bash
pnpm --dir desktop test
```
Expected: ≥1 (cn) + 9 (adapter) + 5–7 (integration) = ≥15 PASS. Report the actual count and which integration tests pass/skip.

- [ ] **Step 5: Commit**
```bash
git add desktop/src/features/chat-agent/atoms/agent-atoms.test.ts desktop/src/features/chat-agent/bridge-adapter.ts desktop/src/features/chat-agent/bridge-adapter.test.ts
git commit -m "test(desktop): integration tests for applyAgentEvent across 7 Tauri-bridge events"
```

---

## Task 6: Smoke verification (automated parts)

**Files:** None (verification only).

- [ ] **Step 1: Backend tests still pass** — confirm Plan 2b.1's 21 lib tests didn't break.
```bash
cargo test -p hermes-desktop --lib 2>&1 | tail -3
```
Expected: 21 PASS.

- [ ] **Step 2: Frontend tests**
```bash
pnpm --dir desktop test 2>&1 | tail -10
```
Expected: ≥15 PASS (1 cn + 9 adapter + ≥5 integration).

- [ ] **Step 3: Warning-free build**
```bash
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -5
```
Expected: both clean.

- [ ] **Step 4: Workspace regression check**
```bash
cargo check --workspace
```
Expected: PASS (no Rust changes in this plan, so no regression risk).

- [ ] **Step 5: App.tsx untouched** — confirm the MVP composer still renders.
```bash
git diff aa98cac -- desktop/src/app/App.tsx
```
Expected: empty.

- [ ] **Step 6: Feature directory shape**
```bash
ls -R desktop/src/features/chat-agent
```
Expected: `lib/{agent-types.ts, chat-types.ts}`, `atoms/{agent-atoms.ts, agent-atoms.test.ts}`, `bridge-adapter.ts`, `bridge-adapter.test.ts` (plus the `.gitkeep` files left over from Task 1).

- [ ] **Step 7: Repo state**
```bash
git status --short
git log --oneline -8
```
Expected: tree clean; 5 commits (Task 1–5) visible above `aa98cac` (the Plan 2b.1 tip).

---

## Done When

- `pnpm --dir desktop test` shows ≥15 PASS: 1 (existing cn util) + 9 (adapter unit tests) + ≥5 (integration tests dispatching through `applyAgentEvent`).
- `desktop/src/features/chat-agent/` contains: `lib/agent-types.ts`, `lib/chat-types.ts`, `atoms/agent-atoms.ts`, `bridge-adapter.ts`, plus the two test files.
- `agent-atoms.ts` is the FULL uclaw port (≈1029 LOC), with its single project-level import (`@/lib/agent-types`) retargeted to `../lib/agent-types`.
- `bridgeEventToAgentEvent` adapter maps every `AgentEventMap` key (TypeScript exhaustiveness-checked) and synthesizes deterministic `toolUseId`s for tool_start/tool_result pairing.
- Backend untouched: `cargo test -p hermes-desktop` shows 21 PASS unchanged; the per-call AgentLoop + callback wiring from Plan 2b.1 is preserved.
- Frontend `App.tsx` untouched: the MVP composer still renders.
- No new React components, no markdown deps, no Shiki/TipTap/motion — those land in Plan 2b.2.b.

## Next Plan

**Plan 2b.2.b — Message rendering UI:** port `components/ai-elements/*` (Message, Conversation, Reasoning, ScrollMinimap, ProviderAvatar, StickyUserMessage, RichTextInput) + `components/agent/AgentMessages.tsx` + supporting helpers (CodeBlock, UserAvatar, CopyButton, ChatToolActivityIndicator, WelcomeEmptyState) + utility modules (`model-logo`, `proma-ui` `useSmoothStream` hook, `normalize-agent-markdown`, `skill-citation`). Add npm deps: `react-markdown@10.1.0`, `remark-gfm@4.0.0`, `shiki@3.22.0`, `@tiptap/react@3.23.2` + extensions, `motion@12.38.0`, `lucide-react@0.460.0`, `dompurify@3.4.1`, `lowlight@3.3.0`. Components render from the atoms ported in 2b.2.a (read via Jotai hooks), using mock state initially. ~2,500 LOC ported.

**Plan 2b.2.c — Tool rendering + App.tsx integration:** port `components/agent/ToolActivityItem.tsx` + `tool-renderers/*` + `BashStreamView` + the chat preview-chip helpers; build the `ChatAgentView` container that wires the Plan 2b.1 `listenAgent` bridge → `applyAgentEvent` → atom updates → React re-renders; replace `App.tsx`'s MVP composer. ~900 LOC ported. End-to-end vertical slice: type a message → see uclaw's full message view stream the reply with tool activities and thinking blocks rendered.
