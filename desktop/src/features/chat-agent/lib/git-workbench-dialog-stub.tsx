/**
 * Stub for uclaw's GitWorkbenchDialog component.
 * Plan 3.3 C2: port SidebarGitActions requires this placeholder.
 * Real implementation lands when git/GitWorkbenchDialog is ported.
 */

import * as React from 'react'

export interface GitWorkbenchDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  cwd?: string | null
  currentBranch?: string
}

export function GitWorkbenchDialog(_props: GitWorkbenchDialogProps): React.ReactElement | null {
  return null
}
