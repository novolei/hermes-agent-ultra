import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Provider, createStore } from 'jotai'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WorkspaceHeader } from './workspace-header'
import { workspacesAtom, activeWorkspaceIdAtom } from '@/features/chat-agent/atoms/workspace'
import type { WorkspaceInfo } from '@/lib/bridge/workspaces'

vi.mock('@/lib/bridge/workspaces', () => ({
  updateWorkspace: vi.fn().mockResolvedValue(true),
  deleteWorkspace: vi.fn().mockResolvedValue(true),
  listWorkspaces: vi.fn().mockResolvedValue([]),
  getActiveWorkspaceId: vi.fn().mockResolvedValue(null),
  setActiveWorkspaceId: vi.fn().mockResolvedValue(true),
  createWorkspace: vi.fn().mockResolvedValue(null),
  reorderWorkspaces: vi.fn().mockResolvedValue(true),
}))

function makeWs(id: string, name: string, cwd = '/tmp/test'): WorkspaceInfo {
  return {
    id, name, icon: 'Folder', cwd, color: null, position: 0,
    created_at: null, updated_at: null,
  }
}

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(<Provider store={store}><WorkspaceHeader /></Provider>)
}

describe('WorkspaceHeader', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders active workspace name + icon + truncated cwd', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', '2222', '/Users/me/Documents/workground/2222')])
    store.set(activeWorkspaceIdAtom, 'w1')
    renderWithStore(store)
    expect(screen.getByText('2222')).toBeInTheDocument()
    // After Phase 4b icon-picker switch: workspace.icon is rendered as a
    // lucide component (legacy '📁' still resolves via getWorkspaceIcon).
    // Assert presence of the icon button by aria-label.
    expect(screen.getByLabelText(/更换图标|图标:/)).toBeInTheDocument()
    expect(screen.getByText(/workground\/2222/)).toBeInTheDocument()
  })

  it('rename + delete buttons are absent for default workspace', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('default', '默认工作区')])
    store.set(activeWorkspaceIdAtom, 'default')
    renderWithStore(store)
    expect(screen.queryByTitle('重命名')).not.toBeInTheDocument()
    expect(screen.queryByTitle('删除工作区')).not.toBeInTheDocument()
  })

  it('rename button shows inline input + Enter commits via updateWorkspace', async () => {
    const { updateWorkspace } = await import('@/lib/bridge/workspaces')
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'original')])
    store.set(activeWorkspaceIdAtom, 'w1')
    renderWithStore(store)
    fireEvent.click(screen.getByTitle('重命名'))
    const input = await screen.findByDisplayValue('original') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'renamed' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => {
      expect(updateWorkspace).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'w1', name: 'renamed' })
      )
    })
  })

  it('Esc cancels rename without calling updateWorkspace', async () => {
    const { updateWorkspace } = await import('@/lib/bridge/workspaces')
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'keepme')])
    store.set(activeWorkspaceIdAtom, 'w1')
    renderWithStore(store)
    fireEvent.click(screen.getByTitle('重命名'))
    const input = await screen.findByDisplayValue('keepme') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'scratched' } })
    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => expect(screen.getByText('keepme')).toBeInTheDocument())
    expect(updateWorkspace).not.toHaveBeenCalled()
  })

  it('delete button opens confirm dialog; confirm calls deleteWorkspace', async () => {
    const { deleteWorkspace } = await import('@/lib/bridge/workspaces')
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'todelete')])
    store.set(activeWorkspaceIdAtom, 'w1')
    renderWithStore(store)
    fireEvent.click(screen.getByTitle('删除工作区'))
    await waitFor(() => expect(screen.getByText('确认删除工作区?')).toBeInTheDocument())
    fireEvent.click(screen.getByText('删除'))
    await waitFor(() => {
      expect(deleteWorkspace).toHaveBeenCalledWith('w1')
    })
  })

  it('renders null when there is no active workspace', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'one')])
    store.set(activeWorkspaceIdAtom, null)
    const { container } = renderWithStore(store)
    expect(container.textContent).toBe('')
  })
})
