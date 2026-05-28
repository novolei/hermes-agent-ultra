import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip'

describe('Tooltip', () => {
  it('renders trigger and shows content on focus', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>hover me</TooltipTrigger>
          <TooltipContent>tip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    expect(screen.getByText('hover me')).toBeInTheDocument()
    fireEvent.focus(screen.getByText('hover me'))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('tip content')
  })
})
