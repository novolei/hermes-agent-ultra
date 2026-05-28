import { call } from "./client";
import { commands } from "./generated";
import type { SessionMessage_Serialize as SessionMessage } from "./generated";

/** Mirrors `commands/session.rs::session_load`. Empty list for unknown sessions. */
export function sessionLoad(sessionId: string): Promise<SessionMessage[]> {
  return call<SessionMessage[]>("session_load", { sessionId });
}

/**
 * Toggle the archived flag of an agent session.
 *
 * Returns the archived epoch-ms timestamp (number) when archiving, or `null`
 * when un-archiving. Throws when the session is not found.
 *
 * Plan 3.3 F1 — replaces stub in tauri-bridge-stub.ts.
 */
export async function toggleArchiveAgentSession(sessionId: string): Promise<number | null> {
  const r = await commands.toggleArchiveAgentSession(sessionId);
  if (r.status === "error") throw new Error(r.error);
  return r.data;
}

/**
 * Permanently delete an agent session and all its messages.
 *
 * Returns `true` when the session was found and deleted, `false` when it was
 * already absent (idempotent).
 *
 * Plan 3.3 F1 — replaces stub in tauri-bridge-stub.ts.
 */
export async function deleteAgentSession(sessionId: string): Promise<boolean> {
  const r = await commands.deleteAgentSession(sessionId);
  if (r.status === "error") throw new Error(r.error);
  return r.data;
}

export type { SessionMessage };
