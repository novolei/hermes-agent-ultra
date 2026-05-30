/**
 * AgentSettings — mount smoke test (Wave B, Plan 3.5.s.b).
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AgentSettings } from './agent-settings'

vi.mock('./persona-studio', () => ({
  PersonaStudio: () => <div data-testid="persona-studio" />,
}))

vi.mock('./persona-bond-timeline', () => ({
  PersonaBondTimeline: () => <div data-testid="persona-bond-timeline" />,
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('AgentSettings', () => {
  it('mounts without throwing', () => {
    const { container } = render(
      <Provider>
        <AgentSettings />
      </Provider>,
    )
    expect(container).toBeTruthy()
  })

  it('renders persona sub-components', () => {
    const { getByTestId } = render(
      <Provider>
        <AgentSettings />
      </Provider>,
    )
    expect(getByTestId('persona-studio')).toBeInTheDocument()
    expect(getByTestId('persona-bond-timeline')).toBeInTheDocument()
  })

  it('renders behavior toggles section', () => {
    const { getByText } = render(
      <Provider>
        <AgentSettings />
      </Provider>,
    )
    expect(getByText('流式响应')).toBeInTheDocument()
    expect(getByText('自动生成标题')).toBeInTheDocument()
  })
})
