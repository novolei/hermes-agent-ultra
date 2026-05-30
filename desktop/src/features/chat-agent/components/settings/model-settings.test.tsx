/**
 * ModelSettings — mount smoke test (Wave B, Plan 3.5.s.b).
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { ModelSettings } from './model-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getAllConfiguredModels: vi.fn(async () => []),
    getRoleModels: vi.fn(async () => []),
    setRoleModel: vi.fn(async () => undefined),
  }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('ModelSettings', () => {
  it('mounts without throwing', () => {
    const { container } = render(
      <Provider>
        <ModelSettings />
      </Provider>,
    )
    expect(container).toBeTruthy()
  })

  it('renders the configured count summary', () => {
    const { getByText } = render(
      <Provider>
        <ModelSettings />
      </Provider>,
    )
    // 0 of 5 roles configured initially
    expect(getByText(/0\/5 已配置/)).toBeInTheDocument()
  })
})
