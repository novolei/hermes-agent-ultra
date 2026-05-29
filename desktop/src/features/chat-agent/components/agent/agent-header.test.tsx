import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AgentHeader } from './agent-header'
import { AgentSessionProvider } from '@/features/chat-agent/contexts/session-context'

describe('AgentHeader', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <AgentSessionProvider sessionId="test-session">
          <AgentHeader sessionId="test-session" />
        </AgentSessionProvider>
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
