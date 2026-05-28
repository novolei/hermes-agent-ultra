import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScrollPositionManager } from './scroll-position-manager'

describe('ScrollPositionManager (stub)', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(
      <ScrollPositionManager id="s1" ready={true} />
    )
    expect(container.firstChild).toBeNull()
  })
})
