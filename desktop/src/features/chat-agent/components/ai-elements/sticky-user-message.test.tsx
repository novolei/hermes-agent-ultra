import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StickyUserMessage } from './sticky-user-message'

describe('StickyUserMessage', () => {
  it('renders null when userMessages is empty', () => {
    const { container } = render(<StickyUserMessage userMessages={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders null when latest message has no id', () => {
    const { container } = render(
      <StickyUserMessage
        userMessages={[
          { id: null, text: 'Hello', attachments: [] },
        ]}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders without crashing with valid message data', () => {
    const { container } = render(
      <StickyUserMessage
        userMessages={[
          { id: '1', text: 'Hello', attachments: [] },
        ]}
      />
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('displays the latest message text', () => {
    const { getByText } = render(
      <StickyUserMessage
        userMessages={[
          { id: '1', text: 'First message', attachments: [] },
          { id: '2', text: 'Latest message', attachments: [] },
        ]}
      />
    )
    expect(getByText('Latest message')).toBeInTheDocument()
  })

  it('truncates long text with ellipsis', () => {
    const longText = 'a'.repeat(150)
    const { getByText } = render(
      <StickyUserMessage
        userMessages={[
          { id: '1', text: longText, attachments: [] },
        ]}
      />
    )
    expect(getByText(/\.\.\./)).toBeInTheDocument()
  })

  it('displays attachment count when attachments exist', () => {
    const { getByText } = render(
      <StickyUserMessage
        userMessages={[
          { id: '1', text: 'Message', attachments: [{ filename: 'file.pdf', isImage: false }] },
        ]}
      />
    )
    expect(getByText('1')).toBeInTheDocument()
  })

  it('calls onClick callback with message id when clicked', () => {
    const onClick = vi.fn()
    const { container } = render(
      <StickyUserMessage
        userMessages={[
          { id: '123', text: 'Click me', attachments: [] },
        ]}
        onClick={onClick}
      />
    )
    const button = container.querySelector('[role="button"]')
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).toHaveBeenCalledWith('123')
  })

  it('respects custom className', () => {
    const { container } = render(
      <StickyUserMessage
        userMessages={[
          { id: '1', text: 'Message', attachments: [] },
        ]}
        className="custom-class"
      />
    )
    const div = container.querySelector('div')
    expect(div?.className).toContain('custom-class')
  })
})
