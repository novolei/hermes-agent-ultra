/**
 * conversation.tsx — forward stub
 *
 * Minimal type + hook stubs so that scroll-minimap.tsx can compile before
 * the full conversation port (Task 28) lands.  Task 28 will replace this file
 * entirely with the real Conversation component and context.
 *
 * DO NOT add business logic here — keep it as a placeholder only.
 */

import * as React from 'react'

export interface ConversationContextValue {
  scrollRef: React.RefObject<HTMLDivElement | null>
  /** 外壳容器（不参与滚动），供 minimap 等浮层 portal 进入 */
  viewportEl: HTMLDivElement | null
  /** 主动滚动到底部 */
  scrollToBottom: (behavior?: ScrollBehavior) => void
  /** Scroll to a specific message by id, with a brief flash highlight. */
  scrollToMessage: (messageId: string) => void
}

const ConversationContext = React.createContext<ConversationContextValue | null>(null)

export function useConversationContext(): ConversationContextValue | null {
  return React.useContext(ConversationContext)
}
