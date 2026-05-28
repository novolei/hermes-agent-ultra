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
} from "./generated";
