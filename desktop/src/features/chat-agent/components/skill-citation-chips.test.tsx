import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect } from 'vitest'
import { SkillCitationChips } from './skill-citation-chips'
import type { SkillCitation } from '@/shared/lib/skill-citation'

describe('SkillCitationChips', () => {
  it('renders nothing for empty citations array', () => {
    const { container } = render(
      <Provider>
        <SkillCitationChips citations={[]} messageKey="m-1" />
      </Provider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders chip(s) for non-empty citations', () => {
    const citations: SkillCitation[] = [
      { title: 'test-skill', reason: 'it helps', raw: '> 应用技能：test-skill — it helps' },
    ]
    const { container } = render(
      <Provider>
        <SkillCitationChips citations={citations} messageKey="m-1" />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
