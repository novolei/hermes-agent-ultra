// Plan 3.2 — ported from uclaw ui/src/components/workspace/WorkspaceCreateDialog.test.tsx.
// Import retargets applied:
//   @/lib/tauri-bridge (createWorkspace) → @/lib/bridge/workspaces
//   @/lib/tauri-bridge (openFolderDialog) → @/lib/bridge/files
//   @/test-utils/render renderWithProviders → local inline render helper
//     (WorkspaceCreateDialog uses no Jotai atoms; plain render suffices)
// API adaptation: createWorkspace mock returns WorkspaceInfo shape.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkspaceCreateDialog } from './workspace-create-dialog'
import type { WorkspaceInfo } from '@/lib/bridge/workspaces'

vi.mock('@/lib/bridge/workspaces', async () => {
  return {
    createWorkspace: vi.fn().mockResolvedValue({
      id: 'new-id', name: 'x', icon: 'Folder', cwd: null, color: null,
      position: 0, created_at: null, updated_at: null,
    } satisfies WorkspaceInfo),
  }
})

vi.mock('@/lib/bridge/files', async () => {
  return {
    openFolderDialog: vi.fn().mockResolvedValue({ path: '/custom/picked' }),
  }
})

function renderWithProviders(ui: React.ReactElement) {
  return render(ui)
}

describe('WorkspaceCreateDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('preview path follows slugified name', () => {
    renderWithProviders(
      <WorkspaceCreateDialog open onClose={() => {}} onCreated={() => {}} />
    )
    const input = screen.getByPlaceholderText('Workspace name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'My Project!' } })
    expect(screen.getByText(/~\/Documents\/workground\/my-project/)).toBeInTheDocument()
  })

  it('"选择其他位置..." overrides the preview path', async () => {
    renderWithProviders(
      <WorkspaceCreateDialog open onClose={() => {}} onCreated={() => {}} />
    )
    const input = screen.getByPlaceholderText('Workspace name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'thing' } })
    expect(screen.getByText(/workground\/thing/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('选择其他位置...'))
    await waitFor(() => {
      expect(screen.getByText('/custom/picked')).toBeInTheDocument()
    })
  })

  it('"清除" reverts the preview to slug', async () => {
    renderWithProviders(
      <WorkspaceCreateDialog open onClose={() => {}} onCreated={() => {}} />
    )
    const input = screen.getByPlaceholderText('Workspace name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'thing' } })
    fireEvent.click(screen.getByText('选择其他位置...'))
    await waitFor(() => expect(screen.getByText('/custom/picked')).toBeInTheDocument())
    fireEvent.click(screen.getByText('清除'))
    expect(screen.getByText(/workground\/thing/)).toBeInTheDocument()
  })

  it('Create call passes cwd when set, null when not', async () => {
    const { createWorkspace } = await import('@/lib/bridge/workspaces')
    // First: no override → cwd is null
    const { unmount } = renderWithProviders(
      <WorkspaceCreateDialog open onClose={() => {}} onCreated={() => {}} />
    )
    fireEvent.change(screen.getByPlaceholderText('Workspace name'), { target: { value: 'plain' } })
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(createWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'plain', cwd: null, icon: 'Folder' })
      )
    })
    unmount()
    vi.clearAllMocks()
    // Second: with override → cwd is picked path
    renderWithProviders(
      <WorkspaceCreateDialog open onClose={() => {}} onCreated={() => {}} />
    )
    fireEvent.change(screen.getByPlaceholderText('Workspace name'), { target: { value: 'plain' } })
    fireEvent.click(screen.getByText('选择其他位置...'))
    await waitFor(() => expect(screen.getByText('/custom/picked')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Create'))
    await waitFor(() => {
      expect(createWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'plain', cwd: '/custom/picked', icon: 'Folder' })
      )
    })
  })
})
