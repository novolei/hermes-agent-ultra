import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProactiveLearningChip, MemoryRecallChip } from './learning-chips'

describe('learning-chips stubs', () => {
  it('ProactiveLearningChip renders with stub marker', () => {
    render(<ProactiveLearningChip event={{}} />)
    expect(screen.getByText(/learning/)).toHaveAttribute('data-stub', 'proactive-learning-chip')
  })

  it('MemoryRecallChip renders with stub marker', () => {
    render(<MemoryRecallChip event={{}} />)
    expect(screen.getByText(/recall/)).toHaveAttribute('data-stub', 'memory-recall-chip')
  })

  it('MemoryRecallChip respects inline prop', () => {
    render(<MemoryRecallChip event={{}} inline />)
    expect(screen.getByText(/recall/)).toBeInTheDocument()
  })
})
