import { describe, it, expect } from 'vitest'
import { detectLang } from './pierre-theme'

describe('pierre-theme', () => {
  describe('detectLang', () => {
    it('returns typescript for .ts', () => {
      expect(detectLang('x.ts')).toBe('typescript')
    })
    it('returns text for unknown extension', () => {
      expect(detectLang('x.weirdext')).toBe('text')
    })
    it('returns text for extensionless path', () => {
      expect(detectLang('LICENSE')).toBe('text')
    })
    it('handles case-insensitive extensions', () => {
      expect(detectLang('x.TS')).toBe('typescript')
    })
  })
})
