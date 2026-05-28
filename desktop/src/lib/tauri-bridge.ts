/**
 * tauri-bridge.ts — Desktop stub
 *
 * Minimal type-compatible stub for the functions imported by agent-atoms.ts.
 * Real implementations will replace these in Plan 2b.2.b/c when the full
 * IPC layer is ported. Calling these at runtime before replacement will throw.
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { AskUserRequest, ExitPlanModeRequest } from '../features/chat-agent/lib/agent-types'

/** Toggle the pinned state of an agent session. Returns the new pinnedAt timestamp or null. */
export const togglePinAgentSession = (_id: string): Promise<number | null> => {
  throw new Error('tauri-bridge: togglePinAgentSession not yet implemented in hermes-desktop')
}

/** Subscribe to agent:ask_user_request events from the Tauri backend. */
export const onAskUserRequest = (cb: (payload: AskUserRequest) => void): Promise<UnlistenFn> =>
  listen('agent:ask_user_request', (e) => cb(e.payload as AskUserRequest))

/** Subscribe to agent:exit_plan_request events from the Tauri backend. */
export const onExitPlanRequest = (cb: (payload: ExitPlanModeRequest) => void): Promise<UnlistenFn> =>
  listen('agent:exit_plan_request', (e) => cb(e.payload as ExitPlanModeRequest))
