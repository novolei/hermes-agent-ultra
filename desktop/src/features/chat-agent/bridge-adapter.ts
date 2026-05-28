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
          return { type: "complete", sessionId: p.session_id, reason: p.reason ?? undefined };
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
              inputTokens: p.prompt_tokens,
              outputTokens: p.completion_tokens,
              costUsd: p.estimated_cost,
            },
          } as AgentEvent;
        }
        case "agent:thinking-delta": {
          const p = payload as ThinkingDeltaEvent;
          // uclaw's reducer treats thinking as appended `reasoning` text.
          // Emit `thinking_delta`-typed event; Task 5 verifies the reducer's switch.
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
            isError: false, // Upstream callback doesn't expose; defaults false. Plan 2c+ enhances.
          };
        }
        case "agent:tool-call-delta": {
          // Partial tool-call assembly chunks; no uclaw handler. Drop.
          return null;
        }
        case "agent:status": {
          const p = payload as StatusEvent;
          // Map known `event_type` values to uclaw's specific cases; fallback to generic 'status'.
          const t = (() => {
            if (p.event_type === "lifecycle") {
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
