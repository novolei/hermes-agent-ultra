// Layout-wrapper stub for uclaw's app-shell/Panel. The real Panel has variants;
// MainArea only uses it as a flex container. Minimal faithful wrapper.
// Ported shape from uclaw components/app-shell/Panel.tsx (Plan FB.c Wave A2).
import * as React from 'react'
import { cn } from '@/shared/lib/cn'

interface PanelProps {
  children?: React.ReactNode
  variant?: 'shrink' | 'grow'
  width?: number
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}

export function Panel({ children, variant: _variant, width: _width, className, style }: PanelProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col', className)} style={style}>
      {children}
    </div>
  )
}
