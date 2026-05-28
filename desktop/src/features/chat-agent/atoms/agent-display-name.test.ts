import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { DEFAULT_AGENT_NAME, agentDisplayNameForAtom, agentDisplayNameMapAtom, setAgentDisplayName } from './agent-display-name'

describe('agent-display-name atoms', () => {
  it('exports DEFAULT_AGENT_NAME as a non-empty string', () => {
    expect(typeof DEFAULT_AGENT_NAME).toBe('string')
    expect(DEFAULT_AGENT_NAME.length).toBeGreaterThan(0)
  })

  it('agentDisplayNameMapAtom defaults to empty record', () => {
    const store = createStore()
    expect(store.get(agentDisplayNameMapAtom)).toEqual({})
  })

  it('agentDisplayNameForAtom returns a function', () => {
    const store = createStore()
    expect(typeof store.get(agentDisplayNameForAtom)).toBe('function')
  })

  it('agentDisplayNameForAtom lookup returns DEFAULT_AGENT_NAME for missing conversation', () => {
    const store = createStore()
    const lookup = store.get(agentDisplayNameForAtom)
    expect(lookup('unknown-session')).toBe(DEFAULT_AGENT_NAME)
  })

  it('agentDisplayNameForAtom lookup returns DEFAULT_AGENT_NAME for null/undefined', () => {
    const store = createStore()
    const lookup = store.get(agentDisplayNameForAtom)
    expect(lookup(null)).toBe(DEFAULT_AGENT_NAME)
    expect(lookup(undefined)).toBe(DEFAULT_AGENT_NAME)
  })

  it('setAgentDisplayName adds a new name mapping', () => {
    const map = {}
    const updated = setAgentDisplayName(map, 'session-1', 'My Agent')
    expect(updated).toEqual({ 'session-1': 'My Agent' })
  })

  it('setAgentDisplayName trims whitespace', () => {
    const map = {}
    const updated = setAgentDisplayName(map, 'session-1', '  Custom Name  ')
    expect(updated).toEqual({ 'session-1': 'Custom Name' })
  })

  it('setAgentDisplayName removes mapping when name is empty/whitespace', () => {
    const map = { 'session-1': 'Old Name', 'session-2': 'Other Name' }
    const updated = setAgentDisplayName(map, 'session-1', '')
    expect(updated).toEqual({ 'session-2': 'Other Name' })
  })

  it('setAgentDisplayName removes mapping when name is only whitespace', () => {
    const map = { 'session-1': 'Old Name' }
    const updated = setAgentDisplayName(map, 'session-1', '   ')
    expect(updated).toEqual({})
  })
})
