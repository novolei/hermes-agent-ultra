import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { BrowserViewer } from './browser-viewer'

describe('BrowserViewer', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <BrowserViewer />
      </Provider>
    )
    expect(container).toBeDefined()
  })
})
