/**
 * Stub for uclaw's FileTypeIcon component.
 * Plan 2b.2.c.4.a B1: port AttachmentPreviewItem requires this placeholder.
 * Real implementation lands when file-browser/FileTypeIcon is ported.
 */

import * as React from 'react'

interface FileTypeIconProps {
  name: string
  isDirectory: boolean
  isOpen?: boolean
  size?: number
  className?: string
}

export const FileTypeIcon = React.memo(function FileTypeIcon({
  className,
  size = 16,
}: FileTypeIconProps): React.ReactElement {
  return (
    <div
      data-testid="file-type-icon-stub"
      className={className}
      style={{ width: size, height: size, display: 'inline-flex' }}
    />
  )
})
