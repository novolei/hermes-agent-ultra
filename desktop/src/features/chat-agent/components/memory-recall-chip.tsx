/**
 * MemoryRecallChip (kebab-cased from MemoryRecallChip.tsx)
 *
 * 在消息气泡下方展示 Agent turn 触发的记忆召回摘要，
 * 包含召回总量、技能激活数和层级分布。
 */

import * as React from 'react'
import { Brain } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import type { MemoryRecallEvent } from '@/features/chat-agent/atoms/agent-atoms'
import { cn } from '@/shared/lib/cn'

interface MemoryRecallChipProps {
  event: MemoryRecallEvent
  /** 内联模式：不渲染外层 wrapper，由父级 flex 容器统一布局 */
  inline?: boolean
  className?: string
}


export function MemoryRecallChip({
  event,
  inline = false,
  className,
}: MemoryRecallChipProps): React.ReactElement {
  const hasSkills = event.skillsCount > 0

  const chip = (
    <span
      role="status"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] leading-tight bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors animate-in fade-in duration-200"
    >
      <Brain className="size-3 shrink-0" />
      <span>
        已召回 {event.totalCandidates} 条记忆
        {hasSkills && ` · ${event.skillsCount} 技能`}
      </span>
    </span>
  )

  if (inline) {
    return chip
  }

  return <div className={cn('px-4 pb-2', className)}>{chip}</div>
}
