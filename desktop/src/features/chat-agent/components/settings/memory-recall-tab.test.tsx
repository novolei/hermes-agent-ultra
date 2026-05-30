/**
 * MemoryRecallTab — mount smoke test.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRecallTab } from './memory-recall-tab'

vi.mock('./memory-recall-settings', () => ({
  MemoryRecallSettings: () => <div data-testid="memory-recall-settings" />,
}))

describe('MemoryRecallTab', () => {
  it('renders without throwing and contains settings section marker', () => {
    const { container } = render(<MemoryRecallTab />)
    const section = container.querySelector('[data-settings-section="记忆召回配置"]')
    expect(section).not.toBeNull()
  })

  it('mounts the MemoryRecallSettings sub-component', () => {
    const { getByTestId } = render(<MemoryRecallTab />)
    expect(getByTestId('memory-recall-settings')).toBeTruthy()
  })
})
