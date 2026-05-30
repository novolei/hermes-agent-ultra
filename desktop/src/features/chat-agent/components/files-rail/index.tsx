/**
 * <FilesRail /> — W3 right-rail files panel.
 *
 * Replaces the legacy <FileBrowser> usage inside SidePanel.tsx. Use as:
 *
 *   <FilesRail sessionId={sessionId} onFileClick={...} />
 *
 * Sections (workspace tab):
 *   - Workspace files (always shown when ~/Documents/workground exists)
 *   - Session files (when the session has a directory) — wired in W3 Task 10
 *   - Attached directories (one section per attached path) — wired in W3 Task 10
 *
 * Changes tab: per-session list of agent edits (stubbed in W3; wired in W4).
 */
// Ported verbatim from uclaw ui/src/components/files-rail/index.tsx

import * as React from 'react'
import { useAtomValue } from 'jotai'
import { filesRailTabAtom, type MountRoot } from '@/features/chat-agent/atoms/files-rail-atoms'
import { FilesRailTabs } from './files-rail-tabs'
import { WorkspaceFilesPanel } from './workspace/workspace-files-panel'
import { FileChangesPanel } from './changes/file-changes-panel'
import type { TreeNode } from '@/features/chat-agent/utils/tree-patch'

interface FilesRailProps {
  sessionId: string | null
  onFileClick?: (mount: MountRoot, node: TreeNode, event: React.MouseEvent<HTMLButtonElement>) => void
}

export function FilesRail({ sessionId, onFileClick }: FilesRailProps): React.ReactElement {
  const tab = useAtomValue(filesRailTabAtom)
  return (
    <div className="flex flex-col h-full bg-popover">
      <FilesRailTabs />
      {tab === 'workspace' && <WorkspaceFilesPanel sessionId={sessionId} onFileClick={onFileClick} />}
      {tab === 'changes' && <FileChangesPanel />}
    </div>
  )
}
