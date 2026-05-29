import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { QueuedMessagesBanner } from './queued-messages-banner'

describe('QueuedMessagesBanner', () => {
  it('renders without throwing for empty queue', () => {
    const { container } = render(
      <Provider>
        <QueuedMessagesBanner
          messages={[]}
          onSteer={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
