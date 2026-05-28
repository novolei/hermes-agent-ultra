import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MessageAction } from './message-action'

describe('MessageAction', () => {
  it('renders children inside a button', () => {
    render(<MessageAction>click me</MessageAction>)
    expect(screen.getByRole('button', { name: 'click me' })).toBeInTheDocument()
  })

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<MessageAction onClick={onClick}>x</MessageAction>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('respects disabled', () => {
    render(<MessageAction disabled>x</MessageAction>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('exposes tooltip as title attribute', () => {
    render(<MessageAction tooltip="hint">x</MessageAction>)
    expect(screen.getByRole('button')).toHaveAttribute('title', 'hint')
  })
})
