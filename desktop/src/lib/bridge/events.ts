import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  TextDeltaEvent,
  ToolCallDeltaEvent_Serialize as ToolCallDeltaEvent,
  UsageEvent_Serialize as UsageEvent,
  DoneEvent_Serialize as DoneEvent,
  ErrorEvent,
} from "./generated";

export type { TextDeltaEvent, ToolCallDeltaEvent, UsageEvent, DoneEvent, ErrorEvent };

export type AgentEventMap = {
  "agent:text-delta": TextDeltaEvent;
  "agent:tool-call-delta": ToolCallDeltaEvent;
  "agent:usage": UsageEvent;
  "agent:done": DoneEvent;
  "agent:error": ErrorEvent;
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
