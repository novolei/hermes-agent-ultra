/**
 * context-stats-modal.test.tsx — mount smoke test for ContextStatsModal
 *
 * Verifies that ContextStatsModal renders the stats section when open=true
 * and a stats object is provided.
 *
 * Wave D2 — chat.a.
 */

import { describe, it, expect } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { ContextStatsModal } from './context-stats-modal'
import type { ContextStats } from '@/features/chat-agent/lib/chat-types'

function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}>{ui}</Provider>)
}

const mockStats: ContextStats = {
  totalTokens: 5000,
  maxTokens: 10000,
  usagePercent: 50,
  messagesTokens: 3000,
  systemPromptTokens: 500,
  freeTokens: 5000,
}

describe('ContextStatsModal', () => {
  it('renders the stats dialog title and percentage when open', () => {
    const store = createStore()
    renderWithProviders(
      <ContextStatsModal open={true} onOpenChange={() => {}} stats={mockStats} />,
      { store },
    )

    // Dialog title should be visible
    expect(screen.getByText('上下文统计')).toBeInTheDocument()

    // Percentage badge should show 50.0%
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })

  it('renders total usage summary when stats are provided', () => {
    const store = createStore()
    renderWithProviders(
      <ContextStatsModal open={true} onOpenChange={() => {}} stats={mockStats} />,
      { store },
    )

    // Should show the "总使用 / 上限" label
    expect(screen.getByText('总使用 / 上限')).toBeInTheDocument()
  })

  it('shows 暂无统计数据 when stats is null', () => {
    const store = createStore()
    renderWithProviders(
      <ContextStatsModal open={true} onOpenChange={() => {}} stats={null} />,
      { store },
    )

    expect(screen.getByText('暂无统计数据')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    const store = createStore()
    renderWithProviders(
      <ContextStatsModal open={false} onOpenChange={() => {}} stats={mockStats} />,
      { store },
    )

    expect(screen.queryByText('上下文统计')).not.toBeInTheDocument()
  })
})
