import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UserAvatar } from './user-avatar'

describe('UserAvatar', () => {
  it('renders without crashing with emoji avatar', () => {
    const { container } = render(<UserAvatar avatar="😀" />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders default emoji when avatar is null', () => {
    const { container } = render(<UserAvatar avatar={null} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders as image when given a data URL', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo='
    const { container } = render(<UserAvatar avatar={dataUrl} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.src).toBe(dataUrl)
  })

  it('renders with custom size', () => {
    const { container } = render(<UserAvatar avatar="😀" size={48} />)
    const div = container.firstChild as HTMLDivElement
    expect(div.style.width).toBe('48px')
    expect(div.style.height).toBe('48px')
  })
})
