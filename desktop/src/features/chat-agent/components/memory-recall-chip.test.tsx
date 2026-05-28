import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRecallChip } from './memory-recall-chip'
import type { MemoryRecallEvent } from '@/features/chat-agent/atoms/agent-atoms'

describe('MemoryRecallChip', () => {
  it('renders for a minimal memory recall event', () => {
    const event: MemoryRecallEvent = {
      totalCandidates: 5,
      skillsCount: 1,
      bootCount: 1,
      triggeredCount: 2,
      relevantCount: 1,
      expandedCount: 0,
      recentCount: 1,
      items: [
        {
          nodeId: 'item1',
          title: 'Test Memory',
          kind: 'procedure',
          source: 'test',
        },
      ],
      conversationId: null,
      timestamp: new Date().toISOString(),
    }
    const { container } = render(<MemoryRecallChip event={event} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders in inline mode without wrapper', () => {
    const event: MemoryRecallEvent = {
      totalCandidates: 3,
      skillsCount: 0,
      bootCount: 1,
      triggeredCount: 1,
      relevantCount: 1,
      expandedCount: 0,
      recentCount: 0,
      items: [],
      conversationId: null,
      timestamp: new Date().toISOString(),
    }
    const { container } = render(<MemoryRecallChip event={event} inline />)
    expect(container.firstChild).not.toBeNull()
  })
})
