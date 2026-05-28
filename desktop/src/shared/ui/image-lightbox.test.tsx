import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ImageLightbox } from './image-lightbox'

describe('ImageLightbox', () => {
  it('renders the thumbnail img element', () => {
    render(<ImageLightbox src="/x.png" alt="example" />)
    expect(screen.getByAltText('example')).toBeInTheDocument()
  })
})
