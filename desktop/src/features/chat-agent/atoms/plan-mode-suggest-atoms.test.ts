import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  pendingPlanModeSuggestsAtom,
  silencedPlanModeSessionsAtom,
  PlanModeSuggestRequest,
} from './plan-mode-suggest-atoms'

describe('plan-mode-suggest-atoms', () => {
  beforeEach(() => localStorage.clear())

  it('pendingPlanModeSuggestsAtom has a stable initial value', () => {
    const store = createStore()
    const v = store.get(pendingPlanModeSuggestsAtom)
    expect(v).toBeDefined()
    expect(v).toEqual({})
  })

  it('silencedPlanModeSessionsAtom initializes with empty Set', () => {
    const store = createStore()
    const v = store.get(silencedPlanModeSessionsAtom)
    expect(v).toBeDefined()
    expect(v instanceof Set).toBe(true)
    expect(v.size).toBe(0)
  })

  it('silencedPlanModeSessionsAtom can be updated with session ids', () => {
    const store = createStore()
    const initialSet = store.get(silencedPlanModeSessionsAtom)
    const newSet = new Set(initialSet)
    newSet.add('session-foo')
    store.set(silencedPlanModeSessionsAtom, newSet)
    const updated = store.get(silencedPlanModeSessionsAtom)
    expect(updated.has('session-foo')).toBe(true)
  })

  it('pendingPlanModeSuggestsAtom can store requests keyed by sessionId', () => {
    const store = createStore()
    const request: PlanModeSuggestRequest = {
      id: 'req-1',
      session_id: 'session-1',
      source: 'keyword',
      matched_pattern: 'pattern-1',
      reason: 'Test reason',
      preview_steps: ['step1', 'step2'],
      fired_at_ms: 1000,
    }
    const newRecord = { 'session-1': request }
    store.set(pendingPlanModeSuggestsAtom, newRecord)
    const updated = store.get(pendingPlanModeSuggestsAtom)
    expect(updated['session-1']).toEqual(request)
  })
})
