import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect } from 'vitest'
import { WelcomeEmptyState } from './welcome-empty-state'

describe('WelcomeEmptyState', () => {
  it('renders without crashing inside a Jotai Provider', () => {
    const { container } = render(
      <Provider>
        <WelcomeEmptyState />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('renders the quick actions grid when onQuickAction is provided', () => {
    render(
      <Provider>
        <WelcomeEmptyState onQuickAction={() => {}} />
      </Provider>,
    )
    // Quick actions grid should render at least one button
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('does not render quick action buttons when onQuickAction is not provided', () => {
    render(
      <Provider>
        <WelcomeEmptyState />
      </Provider>,
    )
    // No buttons rendered without the handler
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
