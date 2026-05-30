// New minimal mount smoke test — uclaw does not ship a test for ImChannelForm (Plan 3.5.s.c Wave C3)
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ImChannelForm } from './im-channel-form'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}))

describe('ImChannelForm', () => {
  it('renders without throwing for the create path', () => {
    // ImChannelForm is a named export with props { spaces, editing?, onDone }
    // The component root is a <div>, not <form>; check for the channel-type select instead.
    const { container } = render(
      <ImChannelForm
        spaces={[]}
        onDone={() => {}}
      />
    )
    // Channel-type selector is always rendered
    expect(container.querySelector('select')).not.toBeNull()
  })
})
