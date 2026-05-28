import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { IconPicker } from './icon-picker'

describe('IconPicker', () => {
  it('renders without crashing', () => {
    const onChange = vi.fn()
    const { container } = render(<IconPicker value="Star" onChange={onChange} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders icon buttons for each icon in the catalog', () => {
    const onChange = vi.fn()
    render(<IconPicker value="Star" onChange={onChange} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('calls onChange with the icon name when a button is clicked', async () => {
    const onChange = vi.fn()
    render(<IconPicker value="Star" onChange={onChange} />)
    const buttons = screen.getAllByRole('radio')
    await userEvent.click(buttons[1])
    expect(onChange).toHaveBeenCalled()
  })

  it('marks the selected icon as checked', () => {
    const onChange = vi.fn()
    render(<IconPicker value="Star" onChange={onChange} />)
    const buttons = screen.getAllByRole('radio')
    const starButton = buttons[0]
    expect(starButton).toHaveAttribute('aria-checked', 'true')
  })

  it('respects custom column count', () => {
    const onChange = vi.fn()
    const { container } = render(<IconPicker value="Star" onChange={onChange} columns={4} />)
    const gridDiv = container.querySelector('[role="radiogroup"]') as HTMLElement
    expect(gridDiv.style.gridTemplateColumns).toContain('repeat(4')
  })
})
