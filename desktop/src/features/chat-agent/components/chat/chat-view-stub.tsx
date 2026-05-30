// Content stub for uclaw's chat/ChatView (~3.5 KLOC cluster, not yet ported).
// TabContent routes 'chat' tabs here until the real chat-rendering cluster lands.
import * as React from 'react'
export function ChatView(_props: { conversationId?: string; [key: string]: unknown }): React.ReactElement {
  return (
    <div data-deferred-stub="ChatView" className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
      聊天视图将在后续 PR 中接入。
    </div>
  )
}
