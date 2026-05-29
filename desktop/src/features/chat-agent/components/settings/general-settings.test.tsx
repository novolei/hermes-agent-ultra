/**
 * GeneralSettings — mount smoke test.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { GeneralSettings } from './general-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getSettings: vi.fn(async () => ({ language: 'zh-CN', theme: 'dark', configPath: '', dataPath: '' })),
    patchSettings: vi.fn(async (p) => ({ language: 'zh-CN', theme: 'dark', configPath: '', dataPath: '', ...p })),
  }
})

describe('GeneralSettings', () => {
  it('renders language section heading', () => {
    render(
      <Provider>
        <GeneralSettings />
      </Provider>,
    )
    expect(screen.getByText('语言与地区')).toBeInTheDocument()
  })

  it('renders messaging section heading', () => {
    render(
      <Provider>
        <GeneralSettings />
      </Provider>,
    )
    expect(screen.getByText('消息')).toBeInTheDocument()
  })

  it('renders bottom dock toggle', () => {
    render(
      <Provider>
        <GeneralSettings />
      </Provider>,
    )
    expect(screen.getByText('底部 Dock 导航栏')).toBeInTheDocument()
  })
})
