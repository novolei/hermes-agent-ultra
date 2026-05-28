import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

describe('Popover', () => {
  it('renders trigger and shows content on click', async () => {
    render(
      <Popover>
        <PopoverTrigger>open</PopoverTrigger>
        <PopoverContent>tip content</PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('open')).toBeInTheDocument()
    fireEvent.click(screen.getByText('open'))
    expect(await screen.findByText('tip content')).toBeInTheDocument()
  })
})
