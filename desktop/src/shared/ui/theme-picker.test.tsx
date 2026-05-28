import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import { describe, it, expect, vi } from 'vitest'
import { ThemePicker } from './theme-picker'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}))

describe('ThemePicker', () => {
  it('mounts with a trigger button', () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    expect(screen.getByRole('button', { name: /theme picker/i })).toBeInTheDocument()
  })

  it('opens the popover on click', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    expect(await screen.findByText(/^Mode$/)).toBeInTheDocument()
  })

  it('renders all 4 mode buttons', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    expect(await screen.findByRole('button', { name: /^Light$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Dark$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^System$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Themed$/ })).toBeInTheDocument()
  })

  it('does not render style picker until mode=special', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    expect(screen.queryByText(/^Style$/)).toBeNull()
  })

  it('shows named-style picker after selecting Themed mode', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    await userEvent.click(screen.getByRole('button', { name: /^Themed$/ }))
    const matches = await screen.findAllByText(/Ocean Light|Forest Dark|青夜|The Finals/)
    expect(matches.length).toBeGreaterThan(0)
  })
})
