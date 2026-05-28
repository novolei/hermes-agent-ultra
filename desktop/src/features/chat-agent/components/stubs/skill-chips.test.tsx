import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SkillCitationChips, SkillRecallChips } from './skill-chips'

describe('skill-chips stubs', () => {
  it('SkillCitationChips renders nothing for empty list', () => {
    const { container } = render(<SkillCitationChips citations={[]} messageKey="msg-1" />)
    expect(container.firstChild).toBeNull()
  })

  it('SkillCitationChips shows count for citations', () => {
    render(<SkillCitationChips citations={[{}, {}]} messageKey="msg-1" />)
    expect(screen.getByText(/2 citations/)).toBeInTheDocument()
  })

  it('SkillRecallChips renders a (potentially empty) wrapper', () => {
    render(<SkillRecallChips sessionId="s1" />)
    const el = document.querySelector('[data-stub="skill-recall-chips"]')
    expect(el).not.toBeNull()
  })
})
