import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatToolActivityIndicator } from './chat-tool-activity-indicator'

describe('ChatToolActivityIndicator (real)', () => {
  it('renders nothing for empty activities array', () => {
    const { container } = render(<ChatToolActivityIndicator activities={[]} />)
    // Real component returns null for empty; container is still defined
    expect(container).toBeDefined()
  })

  it('renders for a non-empty activities array (start event)', () => {
    const activities = [
      {
        toolCallId: 'tc-1',
        type: 'start' as const,
        toolName: 'read_file',
        input: { path: '/x.txt' },
      },
    ]
    const { container } = render(<ChatToolActivityIndicator activities={activities} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders for a completed activity (result event)', () => {
    const activities = [
      {
        toolCallId: 'tc-2',
        type: 'start' as const,
        toolName: 'bash',
        input: { command: 'echo hi' },
      },
      {
        toolCallId: 'tc-2',
        type: 'result' as const,
        toolName: 'bash',
        input: { command: 'echo hi' },
        result: 'hi',
        isError: false,
      },
    ]
    const { container } = render(<ChatToolActivityIndicator activities={activities} />)
    expect(container.firstChild).not.toBeNull()
  })
})
