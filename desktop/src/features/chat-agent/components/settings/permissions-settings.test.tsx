/**
 * PermissionsSettings mount smoke tests.
 * Adapted from uclaw PermissionsSettings.test.tsx — Wave E.
 * Uses hermes render pattern: direct @testing-library/react + jotai Provider.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import { PermissionsSettings } from './permissions-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    listPermissionRules: vi.fn(async () => [
      { id: 'r1', scope: 'pattern', toolName: 'bash', target: 'git status', mode: 'allow', createdAt: 1715000000000 },
    ]),
    listPermissionAudit: vi.fn(async () => [
      { id: 'a1', sessionId: 'sess-aaa', toolName: 'bash', argsHash: 'abc1', decision: 'auto_approve', createdAt: 1715000000000 },
    ]),
    createPermissionRule: vi.fn(async (i: unknown) => ({ ...(i as object), id: 'new', createdAt: Date.now() })),
    deletePermissionRule: vi.fn(async () => true),
    getSafetyPolicy: vi.fn(async () => ({
      globalMode: 'supervised',
      toolOverrides: {},
      autoApprovedTools: ['grep', 'glob', 'read_file'],
      blockedTools: [],
    })),
    removeAutoApprovedTool: vi.fn(async () => ({
      globalMode: 'supervised',
      toolOverrides: {},
      autoApprovedTools: ['glob', 'read_file'],
      blockedTools: [],
    })),
    unblockTool: vi.fn(async () => ({
      globalMode: 'supervised',
      toolOverrides: {},
      autoApprovedTools: ['grep', 'glob', 'read_file'],
      blockedTools: [],
    })),
    listAlwaysAllowedPaths: vi.fn().mockResolvedValue([]),
    listSessionAllowedPaths: vi.fn().mockResolvedValue([]),
  }
})

function renderComponent() {
  const user = userEvent.setup()
  const result = render(
    <Provider>
      <PermissionsSettings />
    </Provider>
  )
  return { ...result, user }
}

describe('PermissionsSettings', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the rules table row', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('git status')).toBeInTheDocument()
      expect(screen.getAllByText('bash').length).toBeGreaterThan(0)
    })
  })

  it('renders the audit log row', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('自动允许')).toBeInTheDocument()
      expect(screen.getByText('abc1')).toBeInTheDocument()
    })
  })

  it('renders empty states when both lists are empty', async () => {
    const bridge = await import('@/features/chat-agent/lib/tauri-bridge-stub')
    vi.mocked(bridge.listPermissionRules).mockResolvedValueOnce([])
    vi.mocked(bridge.listPermissionAudit).mockResolvedValueOnce([])
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('暂无规则')).toBeInTheDocument()
      expect(screen.getByText('暂无审计记录')).toBeInTheDocument()
    })
  })

  it('renders the global allow-list with each whitelisted tool', async () => {
    renderComponent()
    await waitFor(() => {
      // Allow-list section header
      expect(screen.getByText('全局放行 / 阻止')).toBeInTheDocument()
      // Each whitelisted tool from the mock
      expect(screen.getByText('grep')).toBeInTheDocument()
      expect(screen.getByText('glob')).toBeInTheDocument()
      expect(screen.getByText('read_file')).toBeInTheDocument()
    })
  })

  it('removeAutoApprovedTool is called when whitelist row trash button clicked', async () => {
    const bridge = await import('@/features/chat-agent/lib/tauri-bridge-stub')
    const { user } = renderComponent()
    await waitFor(() => expect(screen.getByText('grep')).toBeInTheDocument())
    // Find the row containing 'grep' and click its (hover-revealed) Trash button
    const row = screen.getByText('grep').closest('li')!
    const trashButton = row.querySelector('button[title="移除"]') as HTMLButtonElement
    expect(trashButton).not.toBeNull()
    await user.click(trashButton)
    expect(bridge.removeAutoApprovedTool).toHaveBeenCalledWith({ toolName: 'grep' })
  })
})
