import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Reasoning, ReasoningTrigger, ReasoningContent } from './reasoning'

describe('Reasoning', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Reasoning>
        <ReasoningTrigger />
        <ReasoningContent>Test content</ReasoningContent>
      </Reasoning>
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('displays content when defaultOpen is true', () => {
    render(
      <Reasoning defaultOpen={true}>
        <ReasoningTrigger />
        <ReasoningContent>Reasoning content</ReasoningContent>
      </Reasoning>
    )
    expect(screen.getByText('Reasoning content')).toBeInTheDocument()
  })

  it('hides content when defaultOpen is false', () => {
    const { queryByText } = render(
      <Reasoning defaultOpen={false}>
        <ReasoningTrigger />
        <ReasoningContent>Hidden content</ReasoningContent>
      </Reasoning>
    )
    expect(queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('toggles content visibility on trigger click', async () => {
    const user = userEvent.setup()
    const { queryByText, getByRole } = render(
      <Reasoning defaultOpen={false}>
        <ReasoningTrigger />
        <ReasoningContent>Toggleable content</ReasoningContent>
      </Reasoning>
    )

    // Initially hidden
    expect(queryByText('Toggleable content')).not.toBeInTheDocument()

    // Click trigger to open
    const button = getByRole('button')
    await user.click(button)
    expect(queryByText('Toggleable content')).toBeInTheDocument()

    // Click trigger to close
    await user.click(button)
    expect(queryByText('Toggleable content')).not.toBeInTheDocument()
  })
})

describe('ReasoningTrigger', () => {
  it('renders button with default text when not streaming', () => {
    render(<ReasoningTrigger isStreaming={false} />)
    expect(screen.getByText('查看推理过程')).toBeInTheDocument()
  })

  it('renders button with streaming text when isStreaming is true', () => {
    render(<ReasoningTrigger isStreaming={true} />)
    expect(screen.getByText('思考中...')).toBeInTheDocument()
  })

  it('renders as a button element', () => {
    render(<ReasoningTrigger />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')
  })

  it('accepts onClick handler', () => {
    const handleClick = () => {}
    const { container } = render(<ReasoningTrigger onClick={handleClick} />)
    const button = container.querySelector('button')
    expect(button).toHaveAttribute('type', 'button')
  })
})

describe('ReasoningContent', () => {
  it('renders children content', () => {
    render(<ReasoningContent>Test reasoning content</ReasoningContent>)
    expect(screen.getByText('Test reasoning content')).toBeInTheDocument()
  })

  it('preserves whitespace formatting', () => {
    const content = 'Line 1\nLine 2\nLine 3'
    const { container } = render(<ReasoningContent>{content}</ReasoningContent>)
    const div = container.querySelector('div')
    expect(div).toHaveClass('whitespace-pre-wrap')
  })
})
