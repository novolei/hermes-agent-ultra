import * as React from 'react'
import { cn } from '@/shared/lib/cn'
import { CARD_CLASS, DIVIDER_CLASS } from './SettingsUIConstants'

/**
 * Inline Separator — thin horizontal rule.
 * @radix-ui/react-separator is not in the workspace dep list;
 * this thin wrapper is identical in visual output.
 */
function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn('h-px w-full bg-border', className)} />
}

interface SettingsCardProps {
  children: React.ReactNode
  className?: string
  /** 是否在子元素间自动插入分隔线（默认 true） */
  divided?: boolean
}

export function SettingsCard({ children, className, divided = true }: SettingsCardProps) {
  const childArray = React.Children.toArray(children).filter(Boolean)

  return (
    <div className={cn(CARD_CLASS, className)}>
      {divided
        ? childArray.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < childArray.length - 1 && (
                <Separator className={DIVIDER_CLASS} />
              )}
            </React.Fragment>
          ))
        : children}
    </div>
  )
}
