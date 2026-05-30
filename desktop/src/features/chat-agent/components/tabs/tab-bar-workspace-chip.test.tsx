// Ported from uclaw ui/src/components/tabs/TabBarWorkspaceChip.test.tsx (Plan FB.c Wave B3)
// Adapted: WorkspaceInfo shape differs (hermes uses cwd/color/position vs uclaw path/attachedDirs/sortOrder)
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Provider, createStore } from 'jotai'
import { render, screen } from '@testing-library/react'
import { TabBarWorkspaceChip } from './tab-bar-workspace-chip'
import { workspacesAtom, activeWorkspaceIdAtom, type WorkspaceInfo } from '@/features/chat-agent/atoms/workspace'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()),
  setActiveWorkspaceId: vi.fn(),
  listSpaces: vi.fn().mockResolvedValue([]),
  getActiveWorkspaceId: vi.fn().mockResolvedValue(null),
}))

function makeWs(id: string, name: string, icon = '📁'): WorkspaceInfo {
  return {
    id, name, icon, cwd: `/tmp/${id}`, color: null, position: 0,
    created_at: 1747094400, updated_at: 1747094400,
  }
}

describe('TabBarWorkspaceChip (passive label)', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  it('renders active workspace icon + name', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', '2222', '📁')])
    store.set(activeWorkspaceIdAtom, 'w1')
    render(<Provider store={store}><TabBarWorkspaceChip /></Provider>)
    expect(screen.getByText('2222')).toBeInTheDocument()
    // Phase 4b icon-picker switch: workspace.icon is resolved through
    // getWorkspaceIcon → a lucide component (legacy '📁' still maps to
    // the Folder glyph). Assert via title attribute, since the icon
    // itself is an SVG with no text content.
    expect(screen.getByTitle(/工作区: 2222/)).toBeInTheDocument()
  })

  it('truncates names longer than 12 chars', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'abcdefghijklmnopqrst')])
    store.set(activeWorkspaceIdAtom, 'w1')
    render(<Provider store={store}><TabBarWorkspaceChip /></Provider>)
    expect(screen.getByText('abcdefghijkl…')).toBeInTheDocument()
  })

  it('returns null when there is no active workspace', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'one')])
    store.set(activeWorkspaceIdAtom, null)
    const { container } = render(<Provider store={store}><TabBarWorkspaceChip /></Provider>)
    expect(container.textContent).toBe('')
  })

  it('does not render an interactive trigger (no button)', () => {
    const store = createStore()
    store.set(workspacesAtom, [makeWs('w1', 'one')])
    store.set(activeWorkspaceIdAtom, 'w1')
    render(<Provider store={store}><TabBarWorkspaceChip /></Provider>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
