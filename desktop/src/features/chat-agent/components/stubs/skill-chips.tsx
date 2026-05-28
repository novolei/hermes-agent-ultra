// desktop/src/features/chat-agent/components/stubs/skill-chips.tsx
import * as React from 'react'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c upgrades to the real chip components
 * (uclaw's SkillCitationChips + SkillRecallChips).
 *
 * The placeholder types `SkillCitation` here mirror uclaw's signature
 * — Plan 2b.2.c imports the real type from agent-types/skill-citation lib.
 */

// Plan 2b.2.c will replace with the real type from uclaw's skill module.
export type SkillCitation = unknown

interface SkillCitationChipsProps {
  citations: SkillCitation[]
  messageKey: string
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SkillCitationChips({ citations, messageKey: _messageKey, className }: SkillCitationChipsProps): React.ReactElement | null {
  if (citations.length === 0) return null
  return (
    <div data-stub="skill-citation-chips" className={className ?? 'text-xs text-muted-foreground/60'}>
      {citations.length} citation{citations.length > 1 ? 's' : ''}
    </div>
  )
}

interface SkillRecallChipsProps {
  sessionId: string
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SkillRecallChips({ sessionId: _sessionId, className }: SkillRecallChipsProps): React.ReactElement | null {
  // Stub: real component queries skillRecallsMapAtom for this session.
  // Plan 2b.2.c implements the read.
  return (
    <div data-stub="skill-recall-chips" className={className ?? 'text-xs text-muted-foreground/60'}>
      {/* no recalls in stub */}
    </div>
  )
}
