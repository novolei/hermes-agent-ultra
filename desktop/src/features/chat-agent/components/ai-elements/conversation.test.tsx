import { render } from '@testing-library/react'
import { describe, it, expect, beforeAll } from 'vitest'
import { Conversation, ConversationContent, ConversationScrollButton, useConversationContext } from './conversation'
import * as React from 'react'

// jsdom does not implement ResizeObserver — provide a no-op stub so that
// Conversation's useEffect (which wires up a ResizeObserver) doesn't throw.
beforeAll(() => {
  if (typeof global.ResizeObserver === 'undefined') {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

describe('Conversation', () => {
  it('renders without crashing with no children', () => {
    const { container } = render(<Conversation />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders provided children', () => {
    const { getByTestId } = render(
      <Conversation>
        <div data-testid="child">turn</div>
      </Conversation>,
    )
    expect(getByTestId('child')).toBeInTheDocument()
  })

  it('renders with className prop', () => {
    const { container } = render(<Conversation className="custom-class" />)
    expect(container.querySelector('.custom-class')).not.toBeNull()
  })

  it('renders with resize prop without crashing', () => {
    const { container } = render(<Conversation resize="smooth" />)
    expect(container.firstChild).not.toBeNull()
  })
})

describe('ConversationContent', () => {
  it('renders children', () => {
    const { getByTestId } = render(
      <ConversationContent>
        <div data-testid="content-child">content</div>
      </ConversationContent>,
    )
    expect(getByTestId('content-child')).toBeInTheDocument()
  })
})

describe('ConversationScrollButton', () => {
  it('renders null (scroll button is integrated into container)', () => {
    const { container } = render(<ConversationScrollButton />)
    expect(container.firstChild).toBeNull()
  })
})

describe('useConversationContext', () => {
  it('returns null when used outside ConversationContext', () => {
    let contextValue: ReturnType<typeof useConversationContext> = undefined as never
    function TestComponent() {
      contextValue = useConversationContext()
      return null
    }
    render(<TestComponent />)
    expect(contextValue).toBeNull()
  })

  it('exposes scrollRef, viewportEl, scrollToBottom, scrollToMessage inside Conversation', () => {
    let contextValue: ReturnType<typeof useConversationContext> = undefined as never
    function TestConsumer() {
      contextValue = useConversationContext()
      return null
    }
    render(
      <Conversation>
        <TestConsumer />
      </Conversation>,
    )
    expect(contextValue).not.toBeNull()
    expect(contextValue).toHaveProperty('scrollRef')
    expect(contextValue).toHaveProperty('viewportEl')
    expect(contextValue).toHaveProperty('scrollToBottom')
    expect(contextValue).toHaveProperty('scrollToMessage')
    expect(typeof contextValue!.scrollToBottom).toBe('function')
    expect(typeof contextValue!.scrollToMessage).toBe('function')
  })
})
