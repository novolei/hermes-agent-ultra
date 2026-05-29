/**
 * agent-messages.tsx — canonical agent/ sub-directory barrel.
 *
 * Plan C1 of Plan 2b.2.c.4.a: places AgentMessages under the
 * components/agent/ directory (mirroring uclaw's
 * components/agent/AgentMessages.tsx file layout) without duplicating
 * the ~1,100-LOC implementation that lives at
 * components/agent-messages.tsx (ported in earlier waves).
 *
 * ALL consumers should prefer this path going forward:
 *   import { AgentMessages } from '@/features/chat-agent/components/agent/agent-messages'
 */

export {
  AgentMessages,
  DurationBadge,
} from '@/features/chat-agent/components/agent-messages'
export type { AgentMessagesProps } from '@/features/chat-agent/components/agent-messages'

// Utility helpers that uclaw exported from AgentMessages — re-exported here
// so consumers can import from the canonical agent/ path.
export {
  formatDuration,
  buildUsageTooltip,
} from '@/features/chat-agent/lib/agent-messages-utils'
