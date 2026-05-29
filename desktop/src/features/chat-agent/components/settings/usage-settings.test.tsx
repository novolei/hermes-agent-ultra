/**
 * UsageSettings — mount smoke tests.
 * Adapted from uclaw UsageSettings.test.tsx; uses hermes render pattern
 * (direct @testing-library/react with jotai Provider).
 *
 * Recharts under jsdom emits lots of warnings about ResizeObserver
 * and SVG layout — mock the layout primitives but keep the chart shells
 * so the component tree renders.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import { UsageSettings } from './usage-settings'

vi.mock('recharts', async () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="rc-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="rc-bar">{children}</div>,
    Bar: () => null,
    PieChart: ({ children }: any) => <div data-testid="rc-pie">{children}</div>,
    Pie: () => null,
    Cell: () => null,
    XAxis: () => null, YAxis: () => null,
    CartesianGrid: () => null, Tooltip: () => null, Legend: () => null,
  }
})

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getDailyCosts: vi.fn(async () => [
      { day: '2026-05-08', inputTokens: 1000, outputTokens: 500, costUsd: 0.0012, turnCount: 4 },
      { day: '2026-05-09', inputTokens: 2000, outputTokens: 800, costUsd: 0.0024, turnCount: 6 },
    ]),
    getModelCosts: vi.fn(async () => [
      { model: 'claude-4', inputTokens: 2500, outputTokens: 1100, costUsd: 0.030, turnCount: 8 },
      { model: 'gpt-4o',   inputTokens: 500,  outputTokens: 200,  costUsd: 0.006, turnCount: 2 },
    ]),
    getSessionCosts: vi.fn(async () => [
      { sessionId: 's1', title: 'Foo', inputTokens: 1500, outputTokens: 600, costUsd: 0.020, turnCount: 5, lastUsedAt: 1715000000000 },
    ]),
    onTurnCost: vi.fn(async () => () => {}),
    getMonthCostTotal: vi.fn(async () => 0.0036),
    listWorkspaceCostRollup: vi.fn(async () => []),
    getSettings: vi.fn(async () => ({ monthlyBudgetUsd: null })),
    patchSettings: vi.fn(async () => ({})),
  }
})

function renderUsageSettings() {
  return render(
    <Provider>
      <UsageSettings />
    </Provider>,
  )
}

describe('UsageSettings', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the KPI totals from the daily rollup', async () => {
    renderUsageSettings()
    // Total cost = 0.0012 + 0.0024 = 0.0036 → "$0.0036" (sub-cent: 4 decimals)
    // May appear in both BudgetHeader and KPI card — use getAllByText
    await waitFor(() => {
      expect(screen.getAllByText(/\$0\.0036/).length).toBeGreaterThanOrEqual(1)
    })
    // Total turns = 4 + 6 = 10
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('renders the bar + donut chart shells with data', async () => {
    renderUsageSettings()
    await waitFor(() => {
      expect(screen.getByTestId('rc-bar')).toBeInTheDocument()
      expect(screen.getByTestId('rc-pie')).toBeInTheDocument()
    })
  })

  it('renders the per-session table row', async () => {
    renderUsageSettings()
    await waitFor(() => {
      expect(screen.getByText('Foo')).toBeInTheDocument()
      expect(screen.getByText('$0.02')).toBeInTheDocument()
    })
  })

  it('renders empty-state when all rollups are empty', async () => {
    const bridge = await import('@/features/chat-agent/lib/tauri-bridge-stub')
    vi.mocked(bridge.getDailyCosts).mockResolvedValueOnce([])
    vi.mocked(bridge.getModelCosts).mockResolvedValueOnce([])
    vi.mocked(bridge.getSessionCosts).mockResolvedValueOnce([])
    renderUsageSettings()
    await waitFor(() => {
      // Three "暂无数据" placeholders (daily / model / session).
      expect(screen.getAllByText('暂无数据').length).toBeGreaterThanOrEqual(3)
    })
  })
})
