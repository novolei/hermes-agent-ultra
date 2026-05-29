import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import SettingsPanel from './settings-panel'

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

// Mock Wave D IPC stubs so rendering ConnectivityTab (the default tab)
// doesn't trigger real NOT_IMPLEMENTED throws in unhandled async effects.
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    // Wave C stubs
    getSettings: vi.fn(async () => ({ language: 'zh-CN', theme: 'dark', configPath: '', dataPath: '' })),
    patchSettings: vi.fn(async () => ({})),
    getSystemPromptConfig: vi.fn(async () => ({ prompts: [], defaultPromptId: null })),
    // Wave D stubs (ChannelSettings)
    listProviders: vi.fn(async () => []),
    listConfiguredProviders: vi.fn(async () => []),
    getAllConfiguredModels: vi.fn(async () => []),
    // Wave D stubs (UsageSettings)
    getDailyCosts: vi.fn(async () => []),
    getModelCosts: vi.fn(async () => []),
    getSessionCosts: vi.fn(async () => []),
    onTurnCost: vi.fn(async () => () => {}),
    getMonthCostTotal: vi.fn(async () => 0),
    listWorkspaceCostRollup: vi.fn(async () => []),
  }
})

// jsdom doesn't ship IntersectionObserver (used by SettingsBreadcrumb)
beforeAll(() => {
  ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() { return [] }
    root = null
    rootMargin = ''
    thresholds = []
  } as unknown as typeof IntersectionObserver
})

describe('SettingsPanel', () => {
  it('renders the nav and breadcrumb', () => {
    const { container } = render(
      <Provider>
        <SettingsPanel />
      </Provider>,
    )
    // SettingsBreadcrumb renders 「设置」
    expect(screen.getByText('设置')).not.toBeNull()
    // SettingsNav renders group headers
    expect(screen.getByText('核心')).not.toBeNull()
    expect(screen.getByText('偏好')).not.toBeNull()
    expect(screen.getByText('系统')).not.toBeNull()
    // Default tab is 'connectivity' — ConnectivityTab renders the real sub-components
    // which include data-settings-section markers (Wave D upgrade)
    expect(container.querySelector('[data-settings-section="服务商"]')).not.toBeNull()
  })

  it('default tab label is 服务商与用量', () => {
    render(
      <Provider>
        <SettingsPanel />
      </Provider>,
    )
    // Appears in both breadcrumb and nav — use getAllByText
    expect(screen.getAllByText('服务商与用量').length).toBeGreaterThan(0)
  })
})
