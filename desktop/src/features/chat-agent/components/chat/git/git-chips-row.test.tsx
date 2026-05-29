import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { GitChipsRow } from './git-chips-row'

describe('GitChipsRow', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <GitChipsRow />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
