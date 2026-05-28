import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'jotai'
import {
  workspacesAtom,
  activeWorkspaceIdAtom,
  activeWorkspaceCwdAtom,
  type WorkspaceInfo,
} from './workspace'

vi.mock('@/lib/bridge/workspaces', () => ({
  listWorkspaces: vi.fn(async () => []),
  createWorkspace: vi.fn(async () => null),
  updateWorkspace: vi.fn(async () => false),
  deleteWorkspace: vi.fn(async () => false),
  reorderWorkspaces: vi.fn(async () => false),
  getActiveWorkspaceId: vi.fn(async () => null),
  setActiveWorkspaceId: vi.fn(async () => false),
}))

function makeWorkspace(id: string, cwd: string | null): WorkspaceInfo {
  return {
    id,
    name: `Workspace ${id}`,
    icon: 'Folder',
    cwd,
    color: null,
    position: 0,
    created_at: 1747094400,
    updated_at: 1747094400,
  }
}

describe('activeWorkspaceCwdAtom', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
  })

  it('returns the active workspace path', () => {
    store.set(workspacesAtom, [
      makeWorkspace('w1', '/Users/me/projects/foo'),
      makeWorkspace('w2', '/Users/me/projects/bar'),
    ])
    store.set(activeWorkspaceIdAtom, 'w2')

    expect(store.get(activeWorkspaceCwdAtom)).toBe('/Users/me/projects/bar')
  })

  it('returns null when no workspace is active', () => {
    store.set(workspacesAtom, [makeWorkspace('w1', '/Users/me/projects/foo')])
    store.set(activeWorkspaceIdAtom, null)

    expect(store.get(activeWorkspaceCwdAtom)).toBeNull()
  })

  it('returns null when active workspace has null cwd', () => {
    store.set(workspacesAtom, [makeWorkspace('w1', null)])
    store.set(activeWorkspaceIdAtom, 'w1')

    expect(store.get(activeWorkspaceCwdAtom)).toBeNull()
  })
})

describe('workspace atoms defaults', () => {
  it('workspacesAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(workspacesAtom)).toEqual([])
  })

  it('activeWorkspaceIdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(activeWorkspaceIdAtom)).toBeNull()
  })

  it('activeWorkspaceCwdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(activeWorkspaceCwdAtom)).toBeNull()
  })
})

describe('workspace atoms — action atoms (mocked bridge)', () => {
  it('refreshWorkspacesAtom does not throw when bridge returns empty', async () => {
    const { refreshWorkspacesAtom } = await import('./workspace')
    const store = createStore()
    await expect(store.set(refreshWorkspacesAtom)).resolves.toBeUndefined()
    expect(store.get(workspacesAtom)).toEqual([])
  })
})
