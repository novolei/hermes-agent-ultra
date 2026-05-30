/**
 * ContextSettingsPopover - 上下文长度设置弹出层
 *
 * Popover 内含上下文长度 Slider（0/5/10/15/20/∞ 轮）。
 * 简化版移植自 proma-frontend，去掉 Token 估算部分。
 *
 * Ported verbatim from uclaw components/chat/ContextSettingsPopover.tsx.
 * Retargets: @/components/ui → @/shared/ui, @/lib/utils → @/shared/lib/cn,
 *            @/atoms/chat-atoms → @/features/chat-agent/atoms/chat-atoms,
 *            @/hooks/useConversationSettings → use-conversation-settings.
 * Note: @radix-ui/react-slider not installed; using native range shim from
 *       @/shared/ui/slider (API-compatible with shadcn Slider).
 */

import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover'
import { Slider } from '@/shared/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { Settings2 } from 'lucide-react'
import {
  CONTEXT_LENGTH_OPTIONS,
  type ContextLengthValue,
} from '@/features/chat-agent/atoms/chat-atoms'
import { useConversationContextLength } from '@/features/chat-agent/hooks/use-conversation-settings'

/** 上下文长度滑块标签 */
function getContextLengthLabel(value: ContextLengthValue): string {
  if (value === 'infinite') return '无限'
  if (value === 0) return '0 轮'
  return `${value} 轮`
}

/** 将滑块位置转换为实际值 */
function sliderPositionToValue(position: number): ContextLengthValue {
  return CONTEXT_LENGTH_OPTIONS[position]!
}

/** 将实际值转换为滑块位置 */
function valueToSliderPosition(value: ContextLengthValue): number {
  const index = CONTEXT_LENGTH_OPTIONS.indexOf(value)
  return index >= 0 ? index : CONTEXT_LENGTH_OPTIONS.length - 2 // 默认 20
}

export function ContextSettingsPopover(): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [contextLength, setContextLength] = useConversationContextLength()

  const sliderPosition = valueToSliderPosition(contextLength)
  const maxSliderPosition = CONTEXT_LENGTH_OPTIONS.length - 1

  const handleSliderChange = (values: number[]): void => {
    const newValue = sliderPositionToValue(values[0]!)
    setContextLength(newValue)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip open={open ? false : undefined}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>上下文设置</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72" side="top" align="center">
        <div className="space-y-3">
          {/* 上下文长度设置 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">上下文长度</span>
              <span className="text-xs text-muted-foreground">
                {getContextLengthLabel(contextLength)}
              </span>
            </div>

            <Slider
              value={[sliderPosition]}
              onValueChange={handleSliderChange}
              max={maxSliderPosition}
              step={1}
              className="w-full"
            />

            {/* 刻度标签 */}
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span className={cn(
                contextLength === 'infinite' ? '' : 'opacity-50'
              )}>
                ∞
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
