// Wave E4 minimal smoke test for ProviderPriorityList
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ProviderPriorityList } from './provider-priority-list'

describe('ProviderPriorityList', () => {
  it('renders without throwing when priority list is empty', () => {
    const { container } = render(
      <ProviderPriorityList
        rows={[]}
        priority={[]}
        pendingAction={null}
        probePendingProviderId={null}
        disabled={false}
        onEnable={vi.fn()}
        onSetFirst={vi.fn()}
        onRunProbe={vi.fn()}
        onRunSetup={vi.fn()}
        onConfigureMcp={vi.fn()}
      />
    )
    expect(container).toBeTruthy()
  })
})
