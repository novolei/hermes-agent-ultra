/**
 * MainArea — workspace surface 的主内容区域。
 *
 * 顶层 surface 切换（workspace ↔ kaleidoscope）在 AppShell 层完成 —— 见
 * AppShell.tsx。MainArea 只负责 workspace surface 自己的内容。
 *
 * Ported verbatim from uclaw ui/src/components/tabs/MainArea.tsx (Plan FB.c Wave D3)
 * Panel and WorkspaceShell are layout/content stubs (not yet ported clusters).
 */

import * as React from 'react'
import { Panel } from '@/features/chat-agent/components/app-shell/panel-stub'
import { WorkspaceShell } from '@/features/chat-agent/components/workspace/workspace-shell'

export function MainArea(): React.ReactElement {
  return (
    <Panel
      variant="grow"
      className="bg-content-area rounded-2xl shadow-xl"
    >
      <WorkspaceShell />
    </Panel>
  )
}
