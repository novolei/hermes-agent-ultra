import { call } from "./client";
import type { SessionMessage_Serialize as SessionMessage } from "./generated";

/** Mirrors `commands/session.rs::session_load`. Empty list for unknown sessions. */
export function sessionLoad(sessionId: string): Promise<SessionMessage[]> {
  return call<SessionMessage[]>("session_load", { sessionId });
}

export type { SessionMessage };
