/**
 * ToolsTab mount smoke test.
 * Adapted from uclaw ToolsTab.test.tsx — Wave E.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { ToolsTab } from './tools-tab'

// Mock the tauri-bridge-stub so async calls don't throw in tests
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    listActiveManifestSkills: vi.fn().mockResolvedValue([]),
    listPermissionRules: vi.fn().mockResolvedValue([]),
    listPermissionAudit: vi.fn().mockResolvedValue([]),
    getSafetyPolicy: vi.fn().mockResolvedValue({
      globalMode: 'supervised',
      toolOverrides: {},
      autoApprovedTools: [],
      blockedTools: [],
    }),
    getWorkspaceSkillTags: vi.fn().mockResolvedValue([]),
    listAlwaysAllowedPaths: vi.fn().mockResolvedValue([]),
    listSessionAllowedPaths: vi.fn().mockResolvedValue([]),
  }
})

describe('ToolsTab', () => {
  it('renders 2 sub-section markers (learned skills and MCP have moved to Kaleidoscope)', () => {
    const { container } = render(
      <Provider>
        <ToolsTab />
      </Provider>
    )
    const markers = container.querySelectorAll('[data-settings-section]')
    expect(markers.length).toBe(2)
    const names = Array.from(markers).map((m) => (m as HTMLElement).dataset.settingsSection)
    expect(names).toContain('工具与 MCP')
    expect(names).toContain('工具权限')
  })
})
