/**
 * Stub for uclaw's GitActionsPicker component.
 * Plan 3.3 C2: port SidebarGitActions requires this placeholder.
 * Real implementation lands when git/GitActionsPicker is ported.
 */

import * as React from 'react'

export interface GitActionsPickerProps {
  variant?: string
  cwd?: string | null
  isGitRepo?: boolean | null
  onGitRepoChanged?: () => void
  onBranchChange?: (branch: string) => void
  onOpenWorkbench?: () => void
}

export function GitActionsPicker(_props: GitActionsPickerProps): React.ReactElement {
  return <div data-testid="git-actions-picker-stub">GitActionsPicker stub</div>
}
