import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { ProactiveLearningChip } from './proactive-learning-chip'
import type { ProactiveLearningEvent } from '@/features/chat-agent/lib/types'

describe('ProactiveLearningChip', () => {
  it('renders for a minimal proactive learning event', () => {
    const event: ProactiveLearningEvent = {
      scenario: 'conversation_learning',
      items_extracted: 5,
      categories: ['category1', 'category2'],
      timestamp: new Date().toISOString(),
      summary: 'Test proactive learning summary',
    }
    const { container } = render(
      <TooltipProvider>
        <ProactiveLearningChip event={event} />
      </TooltipProvider>
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('renders for skill extraction scenario', () => {
    const event: ProactiveLearningEvent = {
      scenario: 'skill_extraction',
      items_extracted: 3,
      categories: ['skill1', 'skill2', 'skill3', 'skill4'],
      timestamp: new Date().toISOString(),
      summary: 'Extracted multiple skills',
    }
    const { container } = render(
      <TooltipProvider>
        <ProactiveLearningChip event={event} />
      </TooltipProvider>
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('renders for multimodal context scenario', () => {
    const event: ProactiveLearningEvent = {
      scenario: 'multimodal_context',
      items_extracted: 2,
      categories: [],
      timestamp: new Date().toISOString(),
      summary: 'Multimodal context learning',
    }
    const { container } = render(
      <TooltipProvider>
        <ProactiveLearningChip event={event} />
      </TooltipProvider>
    )
    expect(container.firstChild).not.toBeNull()
  })
})
