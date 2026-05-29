import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AskUserBanner } from './ask-user-banner'

describe('AskUserBanner', () => {
  it('renders without throwing when there are no pending ask-user requests', () => {
    const { container } = render(
      <Provider>
        <AskUserBanner sessionId="test-session" />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
