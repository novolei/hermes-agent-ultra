/**
 * ConnectivityTab — mount smoke test.
 * Adapted from uclaw ConnectivityTab.test.tsx; uses hermes render pattern.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { ConnectivityTab } from './connectivity-tab'

// Mock recharts to avoid ResizeObserver / SVG layout issues in jsdom
vi.mock('recharts', async () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children }: any) => <div>{children}</div>,
    Bar: () => null,
    PieChart: ({ children }: any) => <div>{children}</div>,
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
    listProviders: vi.fn(async () => []),
    listConfiguredProviders: vi.fn(async () => []),
    getAllConfiguredModels: vi.fn(async () => []),
    getDailyCosts: vi.fn(async () => []),
    getModelCosts: vi.fn(async () => []),
    getSessionCosts: vi.fn(async () => []),
    onTurnCost: vi.fn(async () => () => {}),
    getMonthCostTotal: vi.fn(async () => 0),
    listWorkspaceCostRollup: vi.fn(async () => []),
    getSettings: vi.fn(async () => ({ monthlyBudgetUsd: null })),
    patchSettings: vi.fn(async () => ({})),
  }
})

describe('ConnectivityTab', () => {
  it('renders without throwing and contains data-settings-section markers', () => {
    const { container } = render(
      <Provider>
        <ConnectivityTab />
      </Provider>,
    )
    const markers = container.querySelectorAll('[data-settings-section]')
    expect(markers.length).toBe(2)
    const names = Array.from(markers).map((m) => (m as HTMLElement).dataset.settingsSection)
    expect(names).toContain('服务商')
    expect(names).toContain('用量与预算')
  })
})
