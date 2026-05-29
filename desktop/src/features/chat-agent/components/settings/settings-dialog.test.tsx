import { describe, it, expect, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { settingsOpenAtom } from '@/features/chat-agent/atoms/settings-tab'
import { SettingsDialog } from './settings-dialog'

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
