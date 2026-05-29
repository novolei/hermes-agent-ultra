import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { settingsOpenAtom } from '@/features/chat-agent/atoms/settings-tab'
import { SettingsDialog } from './settings-dialog'

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

// Mock Wave D IPC stubs so opening the dialog (which renders ConnectivityTab)
// doesn't trigger real NOT_IMPLEMENTED throws in unhandled async effects.
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    // Wave C stubs (GeneralSettings / PromptSettings)
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

// jsdom doesn't ship IntersectionObserver (used by SettingsBreadcrumb inside SettingsPanel)
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

describe('SettingsDialog', () => {
  it('renders the dialog wrapper closed by default (no data-settings-dialog in DOM)', () => {
    render(
      <Provider>
        <SettingsDialog />
      </Provider>,
    )
    // When closed, the portal content is not mounted anywhere in the document
    expect(document.querySelector('[data-settings-dialog]')).toBeNull()
  })

  it('renders data-settings-dialog in the document when open=true', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    render(
      <Provider store={store}>
        <SettingsDialog />
      </Provider>,
    )
    // Portal renders to document.body, not the local container
    expect(document.querySelector('[data-settings-dialog]')).not.toBeNull()
  })
})
