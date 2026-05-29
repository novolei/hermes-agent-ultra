/**
 * AppearanceSettings — mount smoke tests.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { AppearanceSettings } from './appearance-settings'

describe('AppearanceSettings', () => {
  it('renders the 外观设置 heading', () => {
    render(
      <Provider>
        <AppearanceSettings />
      </Provider>,
    )
    expect(screen.getByText('外观设置')).toBeInTheDocument()
  })

  it('renders 跟随系统 button', () => {
    render(
      <Provider>
        <AppearanceSettings />
      </Provider>,
    )
    expect(screen.getByRole('button', { name: '跟随系统' })).toBeInTheDocument()
  })

  it('renders theme cards grid with at least 2 theme options', () => {
    render(
      <Provider>
        <AppearanceSettings />
      </Provider>,
    )
    expect(screen.getByText('浅色')).toBeInTheDocument()
    expect(screen.getByText('深色')).toBeInTheDocument()
  })

  it('renders 界面行为 section with sticky message toggle', () => {
    render(
      <Provider>
        <AppearanceSettings />
      </Provider>,
    )
    expect(screen.getByText('界面行为')).toBeInTheDocument()
    expect(screen.getByText('用户消息置顶条')).toBeInTheDocument()
  })
})
