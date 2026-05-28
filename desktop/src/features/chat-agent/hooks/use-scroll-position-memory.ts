// Ported from uclaw hooks/useScrollPositionMemory.ts. Filename normalized to
// kebab-case for consistency. Replaces the stub at
// `desktop/src/features/chat-agent/components/stubs/scroll-position-manager.tsx`.
// Closes the last frontend stub for Plan 2b.2.c family.

import * as React from 'react'
import { useConversationContext } from '@/features/chat-agent/components/ai-elements/conversation'

interface ScrollPositionManagerProps {
  /** 会话/Session ID — 变化时触发重置 */
  id: string
  /** 数据是否已加载就绪，false 时不重置（避免在空内容时滚动无效） */
  ready: boolean
}

export function ScrollPositionManager({ id, ready }: ScrollPositionManagerProps): React.ReactElement | null {
  const ctx = useConversationContext()
  const lastIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!ready || !ctx) return
    // 同 id 已处理过则跳过；id 变化或首次 ready 时滚到底
    if (lastIdRef.current === id) return
    lastIdRef.current = id

    // 等下一帧让消息列表先 paint，再滚动到底（否则 scrollHeight 还没更新到位）
    const raf = window.requestAnimationFrame(() => {
      ctx.scrollToBottom('auto')
    })
    return () => window.cancelAnimationFrame(raf)
  }, [id, ready, ctx])

  return null
}
