import * as React from 'react'
import { cn } from '../lib/cn'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size (controlled via font-size)
   * @default 'default' (1.5em)
   */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Spinner - 3x3 grid loading animation
 *
 * Based on SpinKit Grid animation. Uses em units for scalability.
 *
 * @example
 * ```tsx
 * <Spinner size="sm" className="text-muted-foreground/60" />
 * ```
 */
export function Spinner({
  size = 'default',
  className,
  ...props
}: SpinnerProps): React.ReactElement {
  const sizeClasses = {
    sm: 'text-sm',      // 14px → spinner ~21px
    default: 'text-base', // 16px → spinner ~24px
    lg: 'text-lg',      // 18px → spinner ~27px
  }

  return (
    <div
      className={cn(
        'spinner text-muted-foreground',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="loading"
      {...props}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="spinner-cube" />
      ))}
    </div>
  )
}
