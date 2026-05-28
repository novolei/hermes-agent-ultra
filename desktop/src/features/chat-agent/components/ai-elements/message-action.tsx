import * as React from 'react'

/**
 * Extracted from uclaw's `components/ai-elements/message.tsx` so CopyButton
 * and Message can both depend on this leaf component without creating a
 * circular import. Plan 2c+ may consider upstreaming this split to uclaw.
 */
export function MessageAction({
  children,
  onClick,
  tooltip,
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  tooltip?: string
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      className="p-1 rounded text-muted-foreground/60 hover:text-foreground transition-colors disabled:opacity-40"
      onClick={onClick}
      title={tooltip}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
