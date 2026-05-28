import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProviderAvatar } from './provider-avatar'

describe('ProviderAvatar', () => {
  it('renders without crashing for a known model id', () => {
    const { container } = render(<ProviderAvatar model="claude-sonnet-4-6" />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders without crashing for an unknown model (falls back to Bot icon)', () => {
    const { container } = render(<ProviderAvatar model="unknown-model" />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders img tag when logo is found', () => {
    const { container } = render(<ProviderAvatar model="claude-sonnet-4-6" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
  })

  it('renders Bot icon when logo is not found', () => {
    const { container } = render(<ProviderAvatar model="unknown-model" />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('respects custom size prop', () => {
    const { container } = render(<ProviderAvatar model="claude-sonnet-4-6" size={48} />)
    const img = container.querySelector('img')
    expect(img).toHaveStyle('width: 48px')
    expect(img).toHaveStyle('height: 48px')
  })

  it('respects custom className', () => {
    const { container } = render(
      <ProviderAvatar model="claude-sonnet-4-6" className="custom-class" />
    )
    const img = container.querySelector('img')
    expect(img?.className).toContain('custom-class')
  })

  it('uses provider hint when provided', () => {
    const { container } = render(
      <ProviderAvatar model="some-model" provider="anthropic" />
    )
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
  })
})
