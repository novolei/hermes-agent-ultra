import * as React from 'react'
import type { ContentBlock } from '../../lib/agent-types'

/**
 * SDK thinking block shape — mirrors Anthropic SDK's ThinkingBlock from
 * extended thinking feature. Plan 2b.2.c will upgrade to uclaw's real
 * implementations (collapsible reasoning trace + skill-citation highlights).
 */
interface SDKThinkingBlock {
  type: 'thinking'
  thinking?: string
  signature?: string
}

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c upgrades to uclaw's real implementations
 * (collapsible reasoning trace + skill-citation highlights for ThinkingBlock;
 * Anthropic block dispatcher for NativeBlockRenderer).
 */

interface ThinkingBlockProps {
  block: SDKThinkingBlock
  dimmed?: boolean
  sessionId?: string | null
}

export function ThinkingBlock({
  block,
  dimmed: _dimmed,
  sessionId: _sessionId,
}: ThinkingBlockProps): React.ReactElement {
  // Read the `thinking` text from the block — uclaw's SDKThinkingBlock has a
  // `thinking` field per the Anthropic SDK shape. Plan 2b.2.c renders this
  // collapsibly; the stub just prints it.
  const text = block.thinking ?? ''
  return (
    <pre
      data-stub="thinking-block"
      className="whitespace-pre-wrap text-xs text-muted-foreground/70 italic"
    >
      {text}
    </pre>
  )
}

interface NativeBlockRendererProps {
  blocks: ContentBlock[]
  conversationId?: string
  className?: string
}

export function NativeBlockRenderer({
  blocks,
  conversationId: _conversationId,
  className,
}: NativeBlockRendererProps): React.ReactElement {
  return (
    <div data-stub="native-block-renderer" className={className}>
      {blocks.map((block, i) => {
        if (block.type === 'text' && 'text' in block) {
          return (
            <span key={i} data-stub="native-block-text">
              {block.text}
            </span>
          )
        }
        return (
          <span
            key={i}
            data-stub="native-block-other"
            className="text-muted-foreground/40"
          >
            [{block.type}]
          </span>
        )
      })}
    </div>
  )
}
