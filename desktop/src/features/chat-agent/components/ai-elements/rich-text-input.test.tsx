import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RichTextInput } from './rich-text-input'

describe('RichTextInput', () => {
  it('renders a TipTap editable surface', () => {
    render(<RichTextInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />)
    const editor = document.querySelector('[contenteditable="true"]')
    expect(editor).not.toBeNull()
  })

  it('supports placeholder prop without crashing', () => {
    const { container } = render(
      <RichTextInput value="" onChange={vi.fn()} onSubmit={vi.fn()} placeholder="Type here" />,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('supports disabled prop without crashing', () => {
    const { container } = render(
      <RichTextInput value="" onChange={vi.fn()} onSubmit={vi.fn()} disabled />,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
