import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AgentHeartbeatBanner } from './agent-heartbeat-banner'

// Mock @tauri-apps/api/event so listen() resolves with a no-op unlisten
// instead of throwing in jsdom. AgentHeartbeatBanner subscribes to 5
// Tauri events on mount; without this mock the unhandled rejections
// pollute test stderr with 16 lines per run (Plan 4.b FU #3 closure).
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))

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
