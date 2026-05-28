import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders a button element by default', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument()
  })

  it('supports asChild to render a Slot', () => {
    render(<Button asChild><a href="/x">Link</a></Button>)
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link).toHaveAttribute('href', '/x')
  })

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})
