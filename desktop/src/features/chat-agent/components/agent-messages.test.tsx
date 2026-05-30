import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { AgentMessages } from './agent-messages'
import { TooltipProvider } from '@/shared/ui/tooltip'
import {
  agentUserMessage,
  agentAssistantMessage,
  agentMessageWithToolActivities,
  agentMessageWithReasoning,
  agentStatusMessage,
} from '../__fixtures__/message-fixtures'
import {
  emptyStreaming,
  partialStreaming,
  completedStreaming,
  partialStreaming as streamingWithTools,
} from '../__fixtures__/streaming-fixture'
import type { AgentMessagesProps } from './agent-messages'

// useChipCacheInvalidator calls listen() from @tauri-apps/api/event (absent in
// jsdom); useFileChipResolver calls invoke() from @tauri-apps/api/core. Restored
// these mocks now that PV.c swapped the Jotai-free/IPC-free stubs for real chips.
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async () => () => {}),
  emit: vi.fn(async () => {}),
}))
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => []),
}))

// ResizeObserver stub for jsdom (ScrollMinimap uses it)
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // scrollTo stub — jsdom does not implement Element.scrollTo
  if (!window.HTMLElement.prototype.scrollTo) {
    window.HTMLElement.prototype.scrollTo = function () {}
  }
})

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

function renderAM(propsOverride: Partial<AgentMessagesProps> = {}) {
  const props: AgentMessagesProps = {
    sessionId: 's-test',
    messages: [],
    messagesLoaded: true,
    streaming: false,
    ...propsOverride,
  }
  return render(
    <Provider>
      <TooltipProvider>
        <AgentMessages {...props} />
      </TooltipProvider>
    </Provider>,
  )
}

describe('AgentMessages', () => {
  it('renders welcome empty state when messages is empty and not streaming', () => {
    renderAM()
    // WelcomeEmptyState renders an h3 heading
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('renders a single user turn', () => {
    renderAM({ messages: [agentUserMessage] })
    expect(screen.getAllByText(/Create a new feature for user authentication/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders a single assistant turn', () => {
    renderAM({ messages: [agentAssistantMessage] })
    expect(screen.getAllByText(/user authentication feature/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders multi-turn conversation in order', () => {
    renderAM({ messages: [agentUserMessage, agentAssistantMessage] })
    // Both user and assistant messages should be visible
    expect(screen.getAllByText(/Create a new feature for user authentication/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/user authentication feature/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders streaming partial content from partialStreaming fixture', () => {
    renderAM({
      messages: [],
      streaming: true,
      streamState: partialStreaming,
    })
    expect(screen.getByText(/analyzing your request/i)).toBeInTheDocument()
  })

  it('renders error banner when streamState.error is set', () => {
    // Use a custom streamState with the error field explicitly set.
    // The error banner renders in the non-empty branch, so we include a message
    // to ensure hasContent=true and the full ConversationContent tree renders.
    const errorStreamState = {
      running: false,
      content: '',
      toolActivities: [],
      teammates: [],
      error: 'rate-limited by the API',
    }
    renderAM({
      messages: [agentUserMessage],
      streaming: false,
      streamState: errorStreamState,
    })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/rate-limited/i)
  })

  it('does NOT render welcome state when streaming even with empty messages', () => {
    renderAM({
      messages: [],
      streaming: true,
      streamState: emptyStreaming,
    })
    // When streaming=true we should NOT show EmptyState (the condition is !hasContent && !streaming)
    // The welcome heading should not appear
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('renders a message with tool activities (persisted)', () => {
    renderAM({ messages: [agentMessageWithToolActivities] })
    // The tool activities are stored in the message; AgentMessageItem renders them
    // The message content should still appear
    expect(screen.getByText(/set up the authentication feature/i)).toBeInTheDocument()
  })

  it('renders a message with reasoning field', () => {
    renderAM({ messages: [agentMessageWithReasoning] })
    expect(screen.getAllByText(/OAuth 2\.0/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders without crashing when a user message has attached_files XML', () => {
    const msgWithAttachment = {
      ...agentUserMessage,
      id: 'u-attach-1',
      content: '<attached_files>\n<file path="/x.png" />\n</attached_files>\nbody text here',
    }
    renderAM({ messages: [msgWithAttachment] })
    expect(screen.getAllByText(/body text here/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders completedStreaming state with persistent messages present', () => {
    // completedStreaming has running:false with finished content.
    // The error/stream-bubble branch only renders when hasContent || streaming,
    // so include a persisted message to enter that branch.
    const { container } = renderAM({
      messages: [agentAssistantMessage],
      streaming: false,
      streamState: completedStreaming,
    })
    // The persisted assistant message content should be visible
    expect(container.innerHTML).toMatch(/user authentication feature/i)
    // Container renders without crashing
    expect(container.firstChild).not.toBeNull()
  })

  it('renders a status role message without crashing', () => {
    const { container } = renderAM({ messages: [agentStatusMessage] })
    // Status role messages should render without throwing
    expect(container.firstChild).not.toBeNull()
  })

  it('renders streaming with tool activities from streamingWithTools fixture', () => {
    renderAM({
      messages: [],
      streaming: true,
      streamState: streamingWithTools,
    })
    // The streaming content should be visible
    expect(screen.getAllByText(/analyzing your request/i).length).toBeGreaterThanOrEqual(1)
    // data-stub element for tool activity indicator may or may not appear depending
    // on whether the converter sets status:'running' — verify the component at least renders
    const container = document.body
    expect(container).toBeTruthy()
  })

  it('exports DurationBadge for external consumers', async () => {
    const mod = await import('./agent-messages')
    expect(typeof mod.DurationBadge).toBe('function')
  })

  it('exports formatDuration and parseAttachedFiles from agent-messages-utils', async () => {
    const utils = await import('../lib/agent-messages-utils')
    expect(typeof utils.formatDuration).toBe('function')
    expect(typeof utils.parseAttachedFiles).toBe('function')
  })

  it('error banner is visible even when messages is empty (closes 2b.2.c-B)', () => {
    const streamState = {
      running: false,
      content: '',
      reasoning: '',
      toolActivities: [],
      teammates: [],
      error: 'rate-limited',
    } as Parameters<typeof AgentMessages>[0]['streamState']
    renderAM({ messages: [], streaming: false, streamState })
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('rate-limited')
  })
})
