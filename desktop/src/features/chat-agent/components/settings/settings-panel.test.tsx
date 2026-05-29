import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import SettingsPanel from './settings-panel'

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
    // Default tab is 'connectivity' — ConnectivityTab placeholder renders
    expect(container.querySelector('[data-deferred-to="3.5.s.a-wave-d"]')).not.toBeNull()
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
