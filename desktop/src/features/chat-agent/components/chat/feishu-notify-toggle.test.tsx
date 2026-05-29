import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { FeishuNotifyToggle } from './feishu-notify-toggle'

describe('FeishuNotifyToggle', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <FeishuNotifyToggle sessionId="test-session-123" />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
