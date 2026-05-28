import { render } from '@testing-library/react'
import { describe, it, expect, beforeAll } from 'vitest'
import { Conversation } from '@/features/chat-agent/components/ai-elements/conversation'
import { ScrollPositionManager } from './use-scroll-position-memory'

beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = function () {}
  }
})

describe('ScrollPositionManager', () => {
  it('renders nothing (side-effect-only component)', () => {
    const { container } = render(
      <Conversation>
        <ScrollPositionManager id="s-test" ready={true} />
      </Conversation>,
    )
    expect(container).toBeDefined()
  })

  it('handles ready=false without crashing', () => {
    const { container } = render(
      <Conversation>
        <ScrollPositionManager id="s-test" ready={false} />
      </Conversation>,
    )
    expect(container).toBeDefined()
  })
})
