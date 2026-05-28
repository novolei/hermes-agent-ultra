import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatToolActivityIndicator } from './chat-tool-activity-indicator'
import type { ChatToolActivity } from '../../lib/chat-types'

describe('ChatToolActivityIndicator stub', () => {
  const runningActivity: ChatToolActivity = {
    toolCallId: 'tc-1',
    type: 'start',
    toolName: 'bash',
    status: 'running',
  }

  const completedActivity: ChatToolActivity = {
    ...runningActivity,
    status: 'completed',
  }

  const failedActivity: ChatToolActivity = {
    ...runningActivity,
    status: 'failed',
  }

  it('renders nothing when no running activities', () => {
    const { container } = render(<ChatToolActivityIndicator activities={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when all activities are completed', () => {
    const { container } = render(
      <ChatToolActivityIndicator activities={[completedActivity]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders count for one running tool', () => {
    render(<ChatToolActivityIndicator activities={[runningActivity]} />)
    expect(screen.getByText(/1 tool running/)).toBeInTheDocument()
  })

  it('renders count for multiple running tools', () => {
    render(
      <ChatToolActivityIndicator
        activities={[runningActivity, { ...runningActivity, toolCallId: 'tc-2' }]}
      />
    )
    expect(screen.getByText(/2 tools running/)).toBeInTheDocument()
  })

  it('counts only running activities, ignores completed', () => {
    render(
      <ChatToolActivityIndicator
        activities={[runningActivity, completedActivity, failedActivity]}
      />
    )
    expect(screen.getByText(/1 tool running/)).toBeInTheDocument()
  })

  it('ignores isStreaming prop', () => {
    render(
      <ChatToolActivityIndicator activities={[runningActivity]} isStreaming={true} />
    )
    expect(screen.getByText(/1 tool running/)).toBeInTheDocument()
  })
})
