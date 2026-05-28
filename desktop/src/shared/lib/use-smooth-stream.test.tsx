import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSmoothStream } from './use-smooth-stream'

function Harness({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  const { displayedContent } = useSmoothStream({ content, isStreaming })
  return <div data-testid="out">{displayedContent}</div>
}

describe('useSmoothStream', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('displays the full content when content updates', () => {
    const { rerender } = render(<Harness content="hello" isStreaming={true} />)
    expect(screen.getByTestId('out')).toHaveTextContent('hello')

    rerender(<Harness content="hello world" isStreaming={true} />)
    expect(screen.getByTestId('out')).toHaveTextContent('hello world')
  })

  it('updates displayedContent when content prop changes', () => {
    const { rerender } = render(<Harness content="initial" isStreaming={false} />)
    expect(screen.getByTestId('out')).toHaveTextContent('initial')

    rerender(<Harness content="updated" isStreaming={false} />)
    expect(screen.getByTestId('out')).toHaveTextContent('updated')
  })

  it('handles empty content', () => {
    render(<Harness content="" isStreaming={true} />)
    expect(screen.getByTestId('out')).toHaveTextContent('')
  })

  it('returns displayedContent in the result object', () => {
    const TestComponent = () => {
      const result = useSmoothStream({ content: 'test', isStreaming: false })
      return <div>{typeof result.displayedContent === 'string' ? 'ok' : 'fail'}</div>
    }
    render(<TestComponent />)
    expect(screen.getByText('ok')).toBeInTheDocument()
  })
})
