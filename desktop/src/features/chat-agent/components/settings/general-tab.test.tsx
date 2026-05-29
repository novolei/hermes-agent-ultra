/**
 * GeneralTab — mount smoke test.
 * Ported from uclaw GeneralTab.test.tsx with retargets applied.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { GeneralTab } from './general-tab'

// Stub tauri-bridge-stub so getSettings() doesn't throw during mount
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getSettings: vi.fn(async () => ({ language: 'zh-CN', theme: 'dark', configPath: '', dataPath: '' })),
    patchSettings: vi.fn(async (p) => ({ language: 'zh-CN', theme: 'dark', configPath: '', dataPath: '', ...p })),
    getSystemPromptConfig: vi.fn(async () => ({ prompts: [], defaultPromptId: 'builtin-default' })),
  }
})

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// jsdom doesn't implement IntersectionObserver
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

describe('GeneralTab', () => {
  it('renders 3 sub-section markers', () => {
    const { container } = render(
      <Provider>
        <GeneralTab />
      </Provider>,
    )
    const markers = container.querySelectorAll('[data-settings-section]')
    expect(markers.length).toBe(3)
    const names = Array.from(markers).map((m) => (m as HTMLElement).dataset.settingsSection)
    expect(names).toContain('通用偏好')
    expect(names).toContain('系统提示词')
    expect(names).toContain('主题与字体')
  })
})
