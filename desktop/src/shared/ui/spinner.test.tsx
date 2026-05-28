import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spinner } from './spinner'

describe('Spinner', () => {
  it('renders with an accessible label', () => {
    render(<Spinner aria-label="loading" />)
    expect(screen.getByLabelText('loading')).toBeInTheDocument()
  })
})
