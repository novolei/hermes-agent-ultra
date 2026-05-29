/**
 * MemoryRecallSettings — mount smoke test.
 * Mocks IPC stubs so the component renders in loading-then-loaded state.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRecallSettings } from './memory-recall-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getMemoryRecallConfig: vi.fn(async () => ({})),
    patchMemoryRecallConfig: vi.fn(async (input: unknown) => input),
  }
})

describe('MemoryRecallSettings', () => {
  it('renders without throwing', async () => {
    const { container } = render(<MemoryRecallSettings />)
    // Initially shows loading skeleton; eventually resolves
    await waitFor(() => {
      // After loading, the "操作栏" save/reset buttons appear
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  it('renders token budget section after load', async () => {
    const { getByText } = render(<MemoryRecallSettings />)
    await waitFor(() => {
      expect(getByText('Token 预算')).toBeTruthy()
    })
  })

  it('renders recall limit section after load', async () => {
    const { getByText } = render(<MemoryRecallSettings />)
    await waitFor(() => {
      expect(getByText('召回数量限制')).toBeTruthy()
    })
  })
})
