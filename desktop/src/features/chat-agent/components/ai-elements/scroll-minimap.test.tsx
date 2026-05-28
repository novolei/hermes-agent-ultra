import { describe, it, expect } from 'vitest'
import { ScrollMinimap } from './scroll-minimap'

describe('ScrollMinimap', () => {
  it('module compiles and exports ScrollMinimap', () => {
    expect(typeof ScrollMinimap).toBe('function')
  })

  // Note: a full render test would require a ConversationContext provider
  // (from conversation.tsx, ported in Task 28). That integration is exercised
  // in Plan 2b.2.b.2 (AgentMessages tests). For now we only assert the module
  // compiles and the symbol exists.
})
