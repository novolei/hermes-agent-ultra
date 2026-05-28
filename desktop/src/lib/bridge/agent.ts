import { call } from "./client";
import type { AgentSendError } from "./generated";

/** Mirrors `commands/agent.rs::agent_send_message`. Returns the final
 *  assistant text. Streaming text-deltas arrive via `listenAgent`. */
export async function agentSendMessage(sessionId: string, text: string): Promise<string> {
  return call<string>("agent_send_message", { sessionId, text });
}

export type { AgentSendError };
