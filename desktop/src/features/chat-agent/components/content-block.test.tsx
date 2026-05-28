import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect, beforeAll } from 'vitest'
import { ThinkingBlock } from './content-block'

beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
})

describe('content-block', () => {
  it('ThinkingBlock renders without crashing for a thinking-type block', () => {
    const block = { type: 'thinking' as const, thinking: 'reasoning trace' }
    const { container } = render(
      <Provider>
        <ThinkingBlock block={block} />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('ThinkingBlock handles empty thinking gracefully', () => {
    const block = { type: 'thinking' as const, thinking: '' }
    const { container } = render(
      <Provider>
        <ThinkingBlock block={block} />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('ThinkingBlock renders the Thinking label button', () => {
    const block = { type: 'thinking' as const, thinking: 'some thought' }
    const { getByRole } = render(
      <Provider>
        <ThinkingBlock block={block} />
      </Provider>,
    )
    // The toggle button should be present
    const btn = getByRole('button')
    expect(btn).toBeDefined()
  })

  it('ThinkingBlock accepts dimmed prop', () => {
    const block = { type: 'thinking' as const, thinking: 'dimmed trace' }
    const { container } = render(
      <Provider>
        <ThinkingBlock block={block} dimmed={true} />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('ThinkingBlock accepts sessionId prop', () => {
    const block = { type: 'thinking' as const, thinking: 'trace with session' }
    const { container } = render(
      <Provider>
        <ThinkingBlock block={block} sessionId="session-123" />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
