// Wave E4 minimal smoke test for ProviderPriorityList
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProviderPriorityList } from './provider-priority-list'

describe('ProviderPriorityList', () => {
  it('renders the section title and the empty-state hint when rows is empty', () => {
    render(
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
      />,
    )
    // SettingsSection title surfaces as visible text.
    expect(screen.getByText('Provider Priority')).toBeTruthy()
    // Empty-state hint (verbatim from uclaw: '等待 Rust Browser Automation 报告。').
    expect(screen.getByText(/等待 Rust Browser Automation/)).toBeTruthy()
  })
})
