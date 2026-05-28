import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { NativeBlockRenderer } from './native-block-renderer'
import type { ContentBlock } from '../lib/chat-types'

// Mock the dependencies — we're testing the renderer's pairing/ordering
// logic, not the markdown / shiki / collapsible-thinking internals.
//
// Note: paths adapted to match the renderer's actual imports —
//   - MessageResponse comes from `./ai-elements/message`
//     It also takes children, not a `content` prop.
//   - ChatToolBlock is defined inline in native-block-renderer.tsx
//   - ThinkingBlock lives in `./content-block` (real impl, Task 11).
vi.mock('./ai-elements/message', () => ({
  MessageResponse: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="text-block">{children}</div>
  ),
}))

vi.mock('./content-block', () => ({
  ThinkingBlock: ({ block }: { block: { thinking: string } }) => (
    <div data-testid="thinking-block">{block.thinking}</div>
  ),
}))

describe('NativeBlockRenderer', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a single text block', () => {
    const blocks: ContentBlock[] = [{ type: 'text', text: 'hello' }]
    render(<NativeBlockRenderer blocks={blocks} />)
    expect(screen.getByTestId('text-block')).toHaveTextContent('hello')
  })

  it('renders a single thinking block', () => {
    const blocks: ContentBlock[] = [{ type: 'thinking', thinking: 'pondering' }]
    render(<NativeBlockRenderer blocks={blocks} />)
    expect(screen.getByTestId('thinking-block')).toHaveTextContent('pondering')
  })

  it('renders interleaved text + thinking + paired tool_use/tool_result in order', () => {
    const blocks: ContentBlock[] = [
      { type: 'thinking', thinking: 'first thought' },
      { type: 'text', text: 'first answer' },
      { type: 'tool_use', id: 't1', name: 'read_file', input: { path: '/a.txt' } },
      { type: 'tool_result', tool_use_id: 't1', content: 'file contents', is_error: false },
      { type: 'text', text: 'second answer' },
    ]
    render(<NativeBlockRenderer blocks={blocks} />)

    const textBlocks = screen.getAllByTestId('text-block')
    expect(textBlocks).toHaveLength(2)
    expect(textBlocks[0]).toHaveTextContent('first answer')
    expect(textBlocks[1]).toHaveTextContent('second answer')

    expect(screen.getByTestId('thinking-block')).toHaveTextContent('first thought')

    const toolBlocks = screen.getAllByTestId('tool-block')
    expect(toolBlocks).toHaveLength(1)
    expect(screen.getByTestId('tool-name')).toHaveTextContent('read_file')
    expect(screen.getByTestId('tool-result')).toHaveTextContent('file contents')

    // tool_result should NOT render its own block — it's paired with the tool_use above.
    expect(screen.queryAllByText('tool result (orphaned)')).toHaveLength(0)
  })

  it('pairs multiple tool_use/tool_result by id even out of declaration order', () => {
    const blocks: ContentBlock[] = [
      { type: 'tool_use', id: 'a', name: 'first', input: {} },
      { type: 'tool_use', id: 'b', name: 'second', input: {} },
      { type: 'tool_result', tool_use_id: 'b', content: 'result-b' },
      { type: 'tool_result', tool_use_id: 'a', content: 'result-a' },
    ]
    render(<NativeBlockRenderer blocks={blocks} />)
    const tools = screen.getAllByTestId('tool-block')
    expect(tools).toHaveLength(2)
    // Order follows tool_use declaration: 'first' then 'second'.
    const names = screen.getAllByTestId('tool-name').map((n) => n.textContent)
    expect(names).toEqual(['first', 'second'])
    const results = screen.getAllByTestId('tool-result').map((n) => n.textContent)
    expect(results).toEqual(['result-a', 'result-b'])
  })

  it('renders a tool_use without matching tool_result (in-flight) without a result', () => {
    const blocks: ContentBlock[] = [
      { type: 'tool_use', id: 'pending', name: 'fetch', input: { url: '/x' } },
    ]
    render(<NativeBlockRenderer blocks={blocks} />)
    expect(screen.getByTestId('tool-block')).toBeInTheDocument()
    expect(screen.getByTestId('tool-name')).toHaveTextContent('fetch')
    expect(screen.queryByTestId('tool-result')).toBeNull()
  })

  it('renders an orphaned tool_result (no prior tool_use) as a placeholder', () => {
    const blocks: ContentBlock[] = [
      { type: 'tool_result', tool_use_id: 'unknown-id', content: 'leftover' },
    ]
    render(<NativeBlockRenderer blocks={blocks} />)
    // No tool block (no tool_use to render).
    expect(screen.queryByTestId('tool-block')).toBeNull()
    // Orphan placeholder appears.
    expect(screen.getByText(/tool result \(orphaned\)/i)).toBeInTheDocument()
    expect(screen.getByText('leftover')).toBeInTheDocument()
  })

  it('propagates is_error through to ChatToolBlock', () => {
    const blocks: ContentBlock[] = [
      { type: 'tool_use', id: 'x', name: 'risky', input: {} },
      { type: 'tool_result', tool_use_id: 'x', content: 'oops', is_error: true },
    ]
    render(<NativeBlockRenderer blocks={blocks} />)
    expect(screen.getByTestId('tool-block')).toHaveAttribute('data-error', 'true')
  })

  it('marks the wrapper with data-native-blocks="true"', () => {
    const blocks: ContentBlock[] = [{ type: 'text', text: 'x' }]
    const { container } = render(<NativeBlockRenderer blocks={blocks} />)
    expect(container.querySelector('[data-native-blocks="true"]')).not.toBeNull()
  })
})
