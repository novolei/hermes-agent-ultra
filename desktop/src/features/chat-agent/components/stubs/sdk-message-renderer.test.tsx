import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompactingIndicator, CompactBoundaryDivider } from './sdk-message-renderer'

describe('sdk-message-renderer stubs', () => {
  it('CompactingIndicator renders with stub marker', () => {
    render(<CompactingIndicator />)
    expect(screen.getByText(/compacting/)).toHaveAttribute('data-stub', 'compacting-indicator')
  })

  it('CompactBoundaryDivider renders as separator with stub marker', () => {
    const { getByRole } = render(<CompactBoundaryDivider />)
    expect(getByRole('separator')).toHaveAttribute('data-stub', 'compact-boundary-divider')
  })

  it('CompactBoundaryDivider shows counts when both provided', () => {
    render(<CompactBoundaryDivider removed={5} remaining={3} />)
    expect(screen.getByText(/compacted 5/)).toBeInTheDocument()
    expect(screen.getByText(/3 kept/)).toBeInTheDocument()
  })
})
