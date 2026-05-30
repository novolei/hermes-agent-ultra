import { describe, it, expect, vi as vitest } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AttachmentPreviewItem } from './attachment-preview-item'

describe('AttachmentPreviewItem', () => {
  it('renders image variant when mediaType is image and previewUrl is provided', () => {
    const { container } = render(
      <Provider>
        <AttachmentPreviewItem
          filename="test-image.png"
          mediaType="image/png"
          previewUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          onRemove={() => {}}
        />
      </Provider>,
    )
    expect(container.firstChild).toBeTruthy()
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img?.getAttribute('alt')).toBe('test-image.png')
  })

  it('renders file variant when mediaType is not image', () => {
    const { container } = render(
      <Provider>
        <AttachmentPreviewItem
          filename="test-document.pdf"
          mediaType="application/pdf"
          onRemove={() => {}}
        />
      </Provider>,
    )
    expect(container.firstChild).toBeTruthy()
    // Use .truncate selector to target the filename span (not the FileTypeIcon wrapper span)
    const span = container.querySelector('span.truncate')
    expect(span?.textContent).toContain('test-document.pdf')
  })

  it('renders file variant when mediaType is image but previewUrl is missing', () => {
    const { container } = render(
      <Provider>
        <AttachmentPreviewItem
          filename="no-preview-image.jpg"
          mediaType="image/jpeg"
          onRemove={() => {}}
        />
      </Provider>,
    )
    expect(container.firstChild).toBeTruthy()
    // Should render as file variant, not image variant
    const img = container.querySelector('img')
    expect(img).toBeNull()
  })

  it('truncates long filenames', () => {
    const { container } = render(
      <Provider>
        <AttachmentPreviewItem
          filename="this-is-a-very-long-filename-that-should-be-truncated.txt"
          mediaType="text/plain"
          onRemove={() => {}}
        />
      </Provider>,
    )
    const span = container.querySelector('span.truncate')
    expect(span?.textContent).toMatch(/\.\.\./)
  })

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vitest.fn()
    const { container } = render(
      <Provider>
        <AttachmentPreviewItem
          filename="test.txt"
          mediaType="text/plain"
          onRemove={onRemove}
        />
      </Provider>,
    )
    const removeButton = container.querySelector('button[aria-label="移除附件"]')
    removeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onRemove).toHaveBeenCalled()
  })
})
