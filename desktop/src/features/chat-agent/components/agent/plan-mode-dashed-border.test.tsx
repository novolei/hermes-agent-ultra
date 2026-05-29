import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PlanModeDashedBorder } from './plan-mode-dashed-border'

describe('PlanModeDashedBorder', () => {
  it('renders without throwing', () => {
    const { container } = render(<PlanModeDashedBorder />)
    expect(container).toBeDefined()
  })

  it('renders an absolutely positioned div', () => {
    const { container } = render(<PlanModeDashedBorder />)
    const div = container.querySelector('div[style*="inset"]')
    expect(div).toBeDefined()
  })
})
