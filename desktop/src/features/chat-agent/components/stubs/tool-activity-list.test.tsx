import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToolActivityList, ChatToolActivityIndicator } from './tool-activity-list'
import type { ToolActivity } from '../../atoms/agent-atoms'
import type { ChatToolActivity } from '../../lib/chat-types'

const pendingTool: ToolActivity = {
  toolUseId: 'tu-1',
  toolName: 'web_search',
  input: { query: 'test' },
  done: false,
}

const completedTool: ToolActivity = {
  ...pendingTool,
  done: true,
}

describe('tool-activity-list stubs', () => {
  describe('ToolActivityList', () => {
    it('renders nothing for empty activities', () => {
      const { container } = render(<ToolActivityList activities={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders tool name with running state', () => {
      render(<ToolActivityList activities={[pendingTool]} />)
      expect(screen.getByText('web_search')).toBeInTheDocument()
      expect(screen.getByText(/running…/)).toBeInTheDocument()
    })

    it('renders tool name with done state', () => {
      render(<ToolActivityList activities={[completedTool]} />)
      expect(screen.getByText('web_search')).toBeInTheDocument()
      expect(screen.getByText(/done/)).toBeInTheDocument()
    })

    it('renders multiple tools with their states', () => {
      render(<ToolActivityList activities={[completedTool, pendingTool]} />)
      const items = screen.getAllByRole('listitem')
      expect(items).toHaveLength(2)
      expect(screen.getByText(/done/)).toBeInTheDocument()
      expect(screen.getByText(/running…/)).toBeInTheDocument()
    })

    it('ignores animate prop', () => {
      const { container } = render(<ToolActivityList activities={[pendingTool]} animate={true} />)
      expect(container.querySelector('[data-stub="tool-activity-list"]')).toBeInTheDocument()
    })
  })

  describe('ChatToolActivityIndicator', () => {
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
})
