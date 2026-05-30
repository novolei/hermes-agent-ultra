/**
 * Slider — native HTML range input shim
 *
 * Matches the shadcn Slider API surface used by ContextSettingsPopover:
 *   value: number[]
 *   onValueChange: (values: number[]) => void
 *   max: number
 *   step: number
 *   className?: string
 *
 * Note: @radix-ui/react-slider is not in hermes' dependencies; this shim
 * uses a styled native <input type="range"> instead. API is compatible with
 * the radix-based slider used in uclaw's ContextSettingsPopover.
 */

import * as React from 'react'
import { cn } from '@/shared/lib/cn'

export interface SliderProps {
  value?: number[]
  onValueChange?: (values: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function Slider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  className,
}: SliderProps): React.ReactElement {
  return (
    <input
      type="range"
      value={value[0] ?? 0}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      className={cn(
        'w-full h-1.5 cursor-pointer appearance-none rounded-full bg-primary/20',
        '[&::-webkit-slider-thumb]:appearance-none',
        '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
        '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
        '[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/50',
        '[&::-webkit-slider-thumb]:shadow',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
    />
  )
}
