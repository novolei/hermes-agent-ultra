import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { BrowserPreviewOverlay } from './browser-preview-overlay'

// Mock the useBrowserScreencast hook
vi.mock('../../hooks/use-browser-screencast', () => ({
  useBrowserScreencast: vi.fn(),
}))

// Mock openExternal
vi.mock('../../lib/tauri-bridge-stub', () => ({
  openExternal: vi.fn(),
}))

describe('BrowserPreviewOverlay', () => {
  it('returns null when preview is not visible', () => {
    const { container } = render(
      <Provider>
        <BrowserPreviewOverlay sessionId="test-session" />
      </Provider>
    )
    expect(container.firstChild).toBeNull()
  })
})
