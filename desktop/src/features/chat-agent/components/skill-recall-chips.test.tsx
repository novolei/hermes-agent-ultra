import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect } from 'vitest'
import { SkillRecallChips } from './skill-recall-chips'

describe('SkillRecallChips', () => {
  it('renders without crashing for an empty session', () => {
    const { container } = render(
      <Provider>
        <SkillRecallChips sessionId="s1" />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
