import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { ContextUsageBadge } from './context-usage-badge'

describe('ContextUsageBadge', () => {
  it('renders idle state without throwing', () => {
    const { container } = render(
      <Provider>
        <ContextUsageBadge
          inputTokens={1000}
          contextWindow={8000}
          isCompacting={false}
          isProcessing={false}
          onCompact={() => {}}
        />
      </Provider>,
    )
    expect(container).toBeDefined()
  })

  it('returns null when no data', () => {
    const { container } = render(
      <Provider>
        <ContextUsageBadge
          inputTokens={undefined}
          contextWindow={8000}
          isCompacting={false}
          isProcessing={false}
          onCompact={() => {}}
        />
      </Provider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows spinner when compacting', () => {
    const { container } = render(
      <Provider>
        <ContextUsageBadge
          inputTokens={1000}
          contextWindow={8000}
          isCompacting={true}
          isProcessing={false}
          onCompact={() => {}}
        />
      </Provider>,
    )
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
