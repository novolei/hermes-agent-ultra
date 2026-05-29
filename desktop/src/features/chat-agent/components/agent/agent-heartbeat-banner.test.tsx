import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AgentHeartbeatBanner } from './agent-heartbeat-banner'

describe('AgentHeartbeatBanner', () => {
  it('mounts with sessionId prop', () => {
    const { container } = render(<AgentHeartbeatBanner sessionId="test-session-123" />)
    expect(container).toBeTruthy()
  })

  it('renders without errors when sessionId changes', () => {
    const { rerender } = render(<AgentHeartbeatBanner sessionId="session-1" />)
    rerender(<AgentHeartbeatBanner sessionId="session-2" />)
  })
})
