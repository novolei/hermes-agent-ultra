import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AgentSessionProvider, useAgentSessionId, ConversationProvider, useConversationId, useConversationIdOptional } from './session-context'

function Probe() {
  const sessionId = useAgentSessionId()
  return <div data-testid="probe">{sessionId}</div>
}

describe('AgentSessionProvider', () => {
  it('renders children inside the provider', () => {
    const { getByTestId } = render(
      <AgentSessionProvider sessionId="test-session-123">
        <Probe />
      </AgentSessionProvider>,
    )
    expect(getByTestId('probe').textContent).toBe('test-session-123')
  })

  it('throws when useAgentSessionId is called outside provider', () => {
    expect(() => {
      render(<Probe />)
    }).toThrow('useAgentSessionId 必须在 AgentSessionProvider 内使用')
  })
})

describe('ConversationProvider', () => {
  it('renders children inside the provider', () => {
    function ConversationProbe() {
      const id = useConversationId()
      return <div data-testid="conv-probe">{id}</div>
    }
    const { getByTestId } = render(
      <ConversationProvider conversationId="conv-123">
        <ConversationProbe />
      </ConversationProvider>,
    )
    expect(getByTestId('conv-probe').textContent).toBe('conv-123')
  })

  it('useConversationId throws when called outside provider', () => {
    function ConversationProbe() {
      useConversationId()
      return null
    }
    expect(() => render(<ConversationProbe />)).toThrow('useConversationId 必须在 ConversationProvider 内使用')
  })

  it('useConversationIdOptional returns null outside provider', () => {
    function OptionalProbe() {
      const id = useConversationIdOptional()
      return <div data-testid="optional-probe">{String(id)}</div>
    }
    const { getByTestId } = render(<OptionalProbe />)
    expect(getByTestId('optional-probe').textContent).toBe('null')
  })
})
