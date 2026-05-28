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
        inputTokens: 10,
        outputTokens: 20,
        costUsd: 0.0001,
      },
    });
  });

  it("translates thinking-delta into uclaw's thinking case", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:thinking-delta", {
      session_id: "s1", token: "Let me think...",
    } as ThinkingDeltaEvent);
    // Match whatever uclaw's reducer expects — verify via Task 5 integration test.
    // The minimum contract: a `type` string the switch handles, and the text.
    expect(out?.type).toMatch(/thinking|reasoning/);
    expect(out?.sessionId).toBe("s1");
  });

  it("translates tool-start, synthesizing a toolUseId", () => {
    const adapter = createBridgeAdapter();
    const out = adapter.translate("agent:tool-start", {
      session_id: "s1", tool: "shell", arguments_json: '{"cmd":"ls"}',
    } as ToolStartEvent);
    expect(out?.type).toBe("tool_start");
    expect(out?.sessionId).toBe("s1");
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
    expect(resultOut?.type).toBe("tool_result");
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
