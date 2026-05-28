import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScreenshotResultRenderer } from './screenshot-result'

describe('ScreenshotResultRenderer', () => {
  it('renders without crashing for a valid result payload', () => {
    const result = JSON.stringify({
      ok: true,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      width: 1,
      height: 1,
    })
    const { container } = render(<ScreenshotResultRenderer result={result} isError={false} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders image with correct dimensions', () => {
    const result = JSON.stringify({
      ok: true,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      width: 800,
      height: 600,
    })
    const { getByAltText } = render(<ScreenshotResultRenderer result={result} isError={false} />)
    const img = getByAltText('Screenshot 800×600')
    expect(img).toBeInTheDocument()
  })

  it('renders error state without crashing', () => {
    const { container } = render(<ScreenshotResultRenderer result="error message" isError={true} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders error state when result is not valid JSON', () => {
    const result = 'not valid json'
    const { container } = render(<ScreenshotResultRenderer result={result} isError={false} />)
    const preElement = container.querySelector('pre')
    expect(preElement).toBeInTheDocument()
    expect(preElement).toHaveTextContent('not valid json')
  })

  it('renders error state when ok is false', () => {
    const result = JSON.stringify({
      ok: false,
      error: 'Screenshot failed',
    })
    const { container } = render(<ScreenshotResultRenderer result={result} isError={false} />)
    const preElement = container.querySelector('pre')
    expect(preElement).toBeInTheDocument()
  })

  it('renders with correct Tailwind classes', () => {
    const result = JSON.stringify({
      ok: true,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      width: 1024,
      height: 768,
    })
    const { container } = render(<ScreenshotResultRenderer result={result} isError={false} />)
    const img = container.querySelector('img')
    expect(img).toHaveClass('rounded')
    expect(img).toHaveClass('border')
    expect(img).toHaveClass('object-contain')
  })
})
