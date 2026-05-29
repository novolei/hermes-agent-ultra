import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { PermissionBanner } from './permission-banner'

describe('PermissionBanner', () => {
  it('renders without throwing when there are no pending permission requests', () => {
    const { container } = render(
      <Provider>
        <PermissionBanner sessionId="test-session" />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
