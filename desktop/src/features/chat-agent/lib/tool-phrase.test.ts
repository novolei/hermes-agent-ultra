import { describe, it, expect } from 'vitest'
import { getToolPhrase } from './tool-phrase'

describe('tool-phrase', () => {
  it('returns a ToolPhrase object for known tools', () => {
    const phrase = getToolPhrase('Read', { file_path: '/x.txt' })
    expect(phrase).toBeDefined()
    expect(typeof phrase).toBe('object')
    expect(typeof phrase.label).toBe('string')
    expect(typeof phrase.loadingLabel).toBe('string')
  })

  it('handles null input gracefully', () => {
    const phrase = getToolPhrase('Read', null)
    expect(phrase).toBeDefined()
    expect(typeof phrase.label).toBe('string')
  })

  it('returns a ToolPhrase for unknown tools (fallback)', () => {
    const phrase = getToolPhrase('totally_unknown_tool', {})
    expect(phrase).toBeDefined()
    expect(typeof phrase.label).toBe('string')
  })

  it('loadingLabel is derived from label', () => {
    const phrase = getToolPhrase('Bash', { command: 'ls -la' })
    expect(phrase.loadingLabel).toContain(phrase.label)
  })

  it('includes file name in Read phrase', () => {
    const phrase = getToolPhrase('Read', { file_path: '/some/path/foo.ts' })
    expect(phrase.label).toContain('foo.ts')
  })
})
