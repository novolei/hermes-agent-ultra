import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { ExitPlanModeBanner } from './exit-plan-mode-banner'
import { allPendingExitPlanRequestsAtom, agentStreamingStatesAtom } from '@/features/chat-agent/atoms/agent-atoms'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', () => ({
  respondExitPlanMode: vi.fn().mockResolvedValue(undefined),
  stopAgent: vi.fn().mockResolvedValue(undefined),
}))

const FRESH_REQ = {
  requestId: 'req-1',
  sessionId: 's1',
  plan: '# 计划\n\n1. 第一步\n2. 第二步',
  allowedPrompts: ['read', 'write'],
}

function renderWithRequest(request = FRESH_REQ) {
  const store = createStore()
  store.set(allPendingExitPlanRequestsAtom, new Map([['s1', [request]]]))
  store.set(agentStreamingStatesAtom, new Map([
    ['s1', {
      running: true,
      content: '',
      toolActivities: [],
      teammates: [],
    }],
  ]))
  return { store, ...render(
    <Provider store={store}>
      <ExitPlanModeBanner sessionId="s1" />
    </Provider>,
  )}
}

describe('ExitPlanModeBanner', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders nothing when no pending request exists', () => {
    const store = createStore()
    store.set(allPendingExitPlanRequestsAtom, new Map())
    const { container } = render(
      <Provider store={store}>
        <ExitPlanModeBanner sessionId="s1" />
      </Provider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the banner with request plan when a pending request exists', () => {
    renderWithRequest()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText(/Agent 计划待审批/)).toBeInTheDocument()
    expect(screen.getByText(/第一步/)).toBeInTheDocument()
  })

  it('renders allowed prompts when present in request', () => {
    renderWithRequest()
    expect(screen.getByText(/计划声明的允许操作/)).toBeInTheDocument()
    expect(screen.getByText('read')).toBeInTheDocument()
    expect(screen.getByText('write')).toBeInTheDocument()
  })

  it('renders all three action buttons when allowedPrompts is non-empty', () => {
    renderWithRequest()
    expect(screen.getByText(/接受 \+ 切到 Auto 执行/)).toBeInTheDocument()
    expect(screen.getByText(/接受 \+ 留 plan/)).toBeInTheDocument()
    expect(screen.getByText(/拒绝并反馈/)).toBeInTheDocument()
  })

  it('renders only two action buttons when allowedPrompts is empty', () => {
    renderWithRequest({
      ...FRESH_REQ,
      allowedPrompts: [],
    })
    expect(screen.getByText(/接受 \+ 切到 Auto 执行/)).toBeInTheDocument()
    expect(screen.queryByText(/接受 \+ 留 plan/)).not.toBeInTheDocument()
    expect(screen.getByText(/拒绝并反馈/)).toBeInTheDocument()
  })
})
