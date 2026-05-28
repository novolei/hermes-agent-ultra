import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('vitest + RTL + jsdom', () => {
  it('renders a DOM element and asserts via jest-dom matchers', () => {
    render(<div role="status">ready</div>)
    expect(screen.getByRole('status')).toHaveTextContent('ready')
  })
})
