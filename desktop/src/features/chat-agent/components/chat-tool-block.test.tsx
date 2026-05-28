import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatToolBlock } from './chat-tool-block'

describe('ChatToolBlock', () => {
  it('renders without crashing for a minimal tool block', () => {
    const { container } = render(
      <ChatToolBlock
        toolName="read_file"
        input={{ path: '/x.txt' }}
        result=""
        isError={false}
        isCompleted={false}
      />,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('renders completed state with result', () => {
    const { container } = render(
      <ChatToolBlock
        toolName="bash"
        input={{ command: 'ls -la' }}
        result="total 0\n-rw-r--r-- 1 user group 0 file.txt"
        isError={false}
        isCompleted={true}
      />,
    )
    expect(container.firstChild).not.toBeNull()
  })

  it('renders error state', () => {
    const { container } = render(
      <ChatToolBlock
        toolName="bash"
        input={{ command: 'bad-cmd' }}
        result="command not found"
        isError={true}
        isCompleted={true}
      />,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
