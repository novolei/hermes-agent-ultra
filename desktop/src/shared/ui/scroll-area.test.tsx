import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScrollArea } from './scroll-area'

describe('ScrollArea', () => {
  it('renders children inside the viewport', () => {
    render(
      <ScrollArea>
        <div data-testid="child">contents</div>
      </ScrollArea>,
    )
    expect(screen.getByTestId('child')).toHaveTextContent('contents')
  })
})
