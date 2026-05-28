import { describe, it, expect } from "vitest";
import type { AgentStreamState } from "./agent-atoms";
import { applyAgentEvent } from "./agent-atoms";
import { createBridgeAdapter } from "../bridge-adapter";

/**
 * Build an empty AgentStreamState matching the default the reducer expects.
 * Shape derived from the AgentStreamState interface in agent-atoms.ts:
 *   running: boolean
 *   content: string
 *   reasoning?: string
 *   toolActivities: ToolActivity[]
 *   teammates: TeammateState[]
 */
function emptyState(): AgentStreamState {
  return {
    running: true,
    content: "",
    reasoning: "",
    toolActivities: [],
    teammates: [],
  } as AgentStreamState;
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
    // Reducer reads camelCase: event.usage.inputTokens / outputTokens / costUsd
    expect(next.inputTokens).toBe(10);
    expect(next.outputTokens).toBe(20);
    expect(next.costUsd).toBeCloseTo(0.0001);
  });

  it("complete finalizes tool activities (running state is unchanged by complete)", () => {
    const adapter = createBridgeAdapter();
    // Give it an unfinished tool so we can verify finalizeStreamingActivities ran
    const start = adapter.translate("agent:tool-start", {
      session_id: "s1", tool: "shell", arguments_json: "{}",
    })!;
    const done = adapter.translate("agent:done", { session_id: "s1", reason: "stop" })!;
    const afterStart = applyAgentEvent(emptyState(), start);
    expect(afterStart.toolActivities[0]?.done).toBe(false);
    const next = applyAgentEvent(afterStart, done);
    // finalizeStreamingActivities marks all unfinished tools done
    expect(next.toolActivities[0]?.done).toBe(true);
    // `complete` case does NOT set running: false per the reducer body
    expect(next.running).toBe(true);
  });

  it("error transitions stream into error state (running becomes false)", () => {
    const adapter = createBridgeAdapter();
    const ev = adapter.translate("agent:error", { session_id: "s1", message: "boom" })!;
    const next = applyAgentEvent(emptyState(), ev);
    // Reducer case 'error': return { ...prev, running: false }
    expect(next.running).toBe(false);
  });

  it("thinking_delta accumulates reasoning text", () => {
    const adapter = createBridgeAdapter();
    const ev1 = adapter.translate("agent:thinking-delta", {
      session_id: "s1", token: "Let me ",
    })!;
    const ev2 = adapter.translate("agent:thinking-delta", {
      session_id: "s1", token: "think...",
    })!;
    const next = applyAgentEvent(applyAgentEvent(emptyState(), ev1), ev2);
    expect(next.reasoning).toBe("Let me think...");
  });
});
