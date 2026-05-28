import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { ModeSwitcher } from './mode-switcher'

describe('ModeSwitcher', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <ModeSwitcher />
      </Provider>,
    )
    expect(container.firstChild).toBeDefined()
  })
})
