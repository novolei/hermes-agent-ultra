import { describe, it, expect } from 'vitest'
import { formatMessageTime } from './format-message-time'

describe('formatMessageTime', () => {
  it('returns a non-empty string for a recent timestamp', () => {
    const result = formatMessageTime(Date.now())
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns a string for a date in the past', () => {
    const lastYear = Date.now() - 365 * 24 * 60 * 60 * 1000
    const result = formatMessageTime(lastYear)
    expect(typeof result).toBe('string')
  })

  it('formats same-year timestamp as MM/DD HH:MM', () => {
    // Jan 5 of current year at 09:07
    const now = new Date()
    const sameYear = new Date(now.getFullYear(), 0, 5, 9, 7).getTime()
    const result = formatMessageTime(sameYear)
    expect(result).toBe('01/05 09:07')
  })

  it('formats different-year timestamp as YYYY/MM/DD HH:MM', () => {
    // March 15 2020 at 14:30
    const oldDate = new Date(2020, 2, 15, 14, 30).getTime()
    const result = formatMessageTime(oldDate)
    expect(result).toBe('2020/03/15 14:30')
  })
})
