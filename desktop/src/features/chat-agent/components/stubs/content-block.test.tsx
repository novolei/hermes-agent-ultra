import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ThinkingBlock, NativeBlockRenderer } from './content-block'
import type { ContentBlock } from '../../lib/agent-types'

describe('content-block stubs', () => {
  describe('ThinkingBlock', () => {
    it('renders the thinking text from block', () => {
      const block = { type: 'thinking' as const, thinking: 'reasoning' }
      render(<ThinkingBlock block={block} />)
      expect(screen.getByText('reasoning')).toHaveAttribute(
        'data-stub',
        'thinking-block'
      )
    })

    it('renders empty string when thinking is undefined', () => {
      const block = { type: 'thinking' as const, thinking: undefined }
      const { container } = render(<ThinkingBlock block={block} />)
      expect(container.querySelector('[data-stub="thinking-block"]')).toBeInTheDocument()
    })

    it('accepts dimmed and sessionId props without crashing', () => {
      const block = { type: 'thinking' as const, thinking: 'test' }
      render(
        <ThinkingBlock block={block} dimmed={true} sessionId="session-123" />
      )
      expect(screen.getByText('test')).toBeInTheDocument()
    })
  })

  describe('NativeBlockRenderer', () => {
    it('renders text blocks', () => {
      const blocks: ContentBlock[] = [{ type: 'text', text: 'hello' }]
      render(<NativeBlockRenderer blocks={blocks} />)
      expect(screen.getByText('hello')).toHaveAttribute(
        'data-stub',
        'native-block-text'
      )
    })

    it('renders multiple text blocks', () => {
      const blocks: ContentBlock[] = [
        { type: 'text', text: 'first' },
        { type: 'text', text: 'second' },
      ]
      render(<NativeBlockRenderer blocks={blocks} />)
      expect(screen.getByText('first')).toBeInTheDocument()
      expect(screen.getByText('second')).toBeInTheDocument()
    })

    it('shows non-text placeholder for tool_use', () => {
      const blocks: ContentBlock[] = [
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'some_tool',
          input: {},
        },
      ]
      render(<NativeBlockRenderer blocks={blocks} />)
      expect(screen.getByText('[tool_use]')).toBeInTheDocument()
    })

    it('shows non-text placeholder for tool_result', () => {
      const blocks: ContentBlock[] = [
        {
          type: 'tool_result',
          tool_use_id: 'tool-1',
          content: 'result',
        },
      ]
      render(<NativeBlockRenderer blocks={blocks} />)
      expect(screen.getByText('[tool_result]')).toBeInTheDocument()
    })

    it('shows non-text placeholder for thinking blocks', () => {
      const blocks: ContentBlock[] = [{ type: 'thinking', thinking: 'reason' }]
      render(<NativeBlockRenderer blocks={blocks} />)
      expect(screen.getByText('[thinking]')).toBeInTheDocument()
    })

    it('accepts conversationId and className without crashing', () => {
      const blocks: ContentBlock[] = [{ type: 'text', text: 'test' }]
      render(
        <NativeBlockRenderer
          blocks={blocks}
          conversationId="conv-123"
          className="custom-class"
        />
      )
      expect(screen.getByText('test')).toBeInTheDocument()
    })

    it('applies className to the wrapper div', () => {
      const blocks: ContentBlock[] = [{ type: 'text', text: 'test' }]
      const { container } = render(
        <NativeBlockRenderer blocks={blocks} className="my-class" />
      )
      expect(container.querySelector('.my-class')).toBeInTheDocument()
    })

    it('renders empty list gracefully', () => {
      const blocks: ContentBlock[] = []
      const { container } = render(<NativeBlockRenderer blocks={blocks} />)
      expect(container.querySelector('[data-stub="native-block-renderer"]')).toBeInTheDocument()
      expect(container.querySelectorAll('[data-stub*="native-block"]').length).toBe(1)
    })
  })
})
