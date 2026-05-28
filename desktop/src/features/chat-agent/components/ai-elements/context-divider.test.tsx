import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ContextDivider } from './context-divider'

describe('ContextDivider', () => {
  it('renders without crashing', () => {
    const { container } = render(<ContextDivider messageId="test-123" />)
    expect(container.firstChild).not.toBeNull()
  })

  it('displays the context cleared text', () => {
    const { getByText } = render(<ContextDivider messageId="test-123" />)
    expect(getByText('上下文已清除')).toBeInTheDocument()
  })

  it('renders delete button when onDelete is provided', () => {
    const onDelete = vi.fn()
    const { container } = render(
      <ContextDivider messageId="test-123" onDelete={onDelete} />
    )
    const button = container.querySelector('button')
    expect(button).not.toBeNull()
  })

  it('does not render delete button when onDelete is not provided', () => {
    const { container } = render(<ContextDivider messageId="test-123" />)
    const button = container.querySelector('button')
    expect(button).toBeNull()
  })
})
