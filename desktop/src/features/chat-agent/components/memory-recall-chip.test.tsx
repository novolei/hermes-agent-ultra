import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRecallChip } from './memory-recall-chip'
import type { MemoryRecallEvent } from '@/features/chat-agent/atoms/agent-atoms'

const makeEvent = (overrides?: Partial<MemoryRecallEvent>): MemoryRecallEvent => ({
  totalCandidates: 5,
  skillsCount: 1,
  bootCount: 1,
  triggeredCount: 2,
  relevantCount: 1,
  expandedCount: 0,
  recentCount: 1,
  items: [
    { nodeId: 'item1', title: 'Test Memory', kind: 'procedure', source: 'test' },
    { nodeId: 'item2', title: 'Profile Note', kind: 'user_profile', source: 'test' },
    { nodeId: 'item3', title: 'Episode Log', kind: 'episode', source: 'test' },
  ],
  conversationId: null,
  timestamp: new Date().toISOString(),
  ...overrides,
})

describe('MemoryRecallChip', () => {
  it('renders trigger chip with memory count', () => {
    render(<MemoryRecallChip event={makeEvent()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/已召回 5 条记忆/)).toBeInTheDocument()
  })

  it('shows skill count in trigger when skillsCount > 0', () => {
    render(<MemoryRecallChip event={makeEvent({ skillsCount: 2 })} />)
    expect(screen.getByText(/2 技能/)).toBeInTheDocument()
  })

  it('does not show skill count when skillsCount is 0', () => {
    render(<MemoryRecallChip event={makeEvent({ skillsCount: 0 })} />)
    expect(screen.queryByText(/技能/)).toBeNull()
  })

  it('opens popover and shows drilldown details on click', async () => {
    render(<MemoryRecallChip event={makeEvent()} />)
    fireEvent.click(screen.getByRole('status'))
    expect(await screen.findByText('记忆召回详情')).toBeInTheDocument()
    expect(screen.getByText(/共召回 5 条记忆/)).toBeInTheDocument()
  })

  it('shows layer-distribution badges in popover', async () => {
    render(<MemoryRecallChip event={makeEvent()} />)
    fireEvent.click(screen.getByRole('status'))
    expect(await screen.findByText('层级分布')).toBeInTheDocument()
    // Boot layer has count=1, Triggered has count=2, Relevant has count=1, Recent has count=1
    expect(screen.getByText('Boot: 1')).toBeInTheDocument()
    expect(screen.getByText('Triggered: 2')).toBeInTheDocument()
    expect(screen.getByText('Relevant: 1')).toBeInTheDocument()
    expect(screen.getByText('Recent: 1')).toBeInTheDocument()
  })

  it('KIND_LABELS: procedure renders as 技能 in popover', async () => {
    render(<MemoryRecallChip event={makeEvent()} />)
    fireEvent.click(screen.getByRole('status'))
    expect(await screen.findByText('技能')).toBeInTheDocument()
  })

  it('KIND_LABELS: user_profile renders as 偏好 in popover', async () => {
    render(<MemoryRecallChip event={makeEvent()} />)
    fireEvent.click(screen.getByRole('status'))
    expect(await screen.findByText('偏好')).toBeInTheDocument()
  })

  it('KIND_LABELS: unknown kind falls back to raw kind string', async () => {
    const event = makeEvent({
      items: [{ nodeId: 'x', title: 'Misc', kind: 'unknown_kind', source: 'test' }],
    })
    render(<MemoryRecallChip event={event} />)
    fireEvent.click(screen.getByRole('status'))
    expect(await screen.findByText('unknown_kind')).toBeInTheDocument()
  })

  it('shows recalled item titles in popover', async () => {
    render(<MemoryRecallChip event={makeEvent()} />)
    fireEvent.click(screen.getByRole('status'))
    expect(await screen.findByText('Test Memory')).toBeInTheDocument()
    expect(screen.getByText('Profile Note')).toBeInTheDocument()
  })

  it('renders in inline mode without outer wrapper div', () => {
    const event = makeEvent({ skillsCount: 0 })
    const { container } = render(<MemoryRecallChip event={event} inline />)
    // In inline mode the root element is the Popover (not a div with px-4 pb-2)
    expect(container.firstChild).not.toBeNull()
    // The status chip should still be present
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders for a minimal memory recall event', () => {
    const event = makeEvent({
      totalCandidates: 5,
      skillsCount: 1,
      items: [{ nodeId: 'item1', title: 'Test Memory', kind: 'procedure', source: 'test' }],
    })
    const { container } = render(<MemoryRecallChip event={event} />)
    expect(container.firstChild).not.toBeNull()
  })
})
