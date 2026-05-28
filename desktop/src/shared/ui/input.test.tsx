import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from './input'

describe('Input', () => {
  it('renders an input element with placeholder', () => {
    render(<Input placeholder="type here" />)
    expect(screen.getByPlaceholderText('type here')).toBeInTheDocument()
  })

  it('forwards refs', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={(el) => { ref.current = el }} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
