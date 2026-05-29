/**
 * WorkspaceSandboxSettings mount smoke tests.
 * Adapted from uclaw WorkspaceSandboxSettings.test.tsx — Wave E.
 * Uses hermes render pattern: direct @testing-library/react + jotai Provider.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import { WorkspaceSandboxSettings } from './workspace-sandbox-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    listAlwaysAllowedPaths: vi.fn().mockResolvedValue(['/tmp', '/Users/me/notes']),
    addAlwaysAllowedPath: vi.fn().mockResolvedValue(undefined),
    removeAlwaysAllowedPath: vi.fn().mockResolvedValue(undefined),
    listSessionAllowedPaths: vi.fn().mockResolvedValue([]),
    promoteSessionPathToGlobal: vi.fn().mockResolvedValue(undefined),
    openFolderDialog: vi.fn().mockResolvedValue({ path: '/new/path', name: 'path' }),
  }
})

function renderComponent() {
  return render(
    <Provider>
      <WorkspaceSandboxSettings />
    </Provider>
  )
}

describe('WorkspaceSandboxSettings', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders the global allowed list from IPC', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('/tmp')).toBeInTheDocument()
      expect(screen.getByText('/Users/me/notes')).toBeInTheDocument()
    })
  })

  it('shows empty state when global list is empty', async () => {
    const bridge = await import('@/features/chat-agent/lib/tauri-bridge-stub')
    vi.mocked(bridge.listAlwaysAllowedPaths).mockResolvedValueOnce([])
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('尚未添加任何路径。')).toBeInTheDocument()
    })
  })

  it('shows "no active session" when sessionId is null', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('没有活动会话。')).toBeInTheDocument()
    })
  })
})
