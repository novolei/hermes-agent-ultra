/**
 * Safely parse a date string or number and return a Date object.
 * Returns null if parsing fails.
 */
export function safeParseDate(input: any): Date | null {
  if (!input) return null

  try {
    if (typeof input === 'number') {
      return new Date(input)
    }
    if (typeof input === 'string') {
      const date = new Date(input)
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date
      }
    }
    return null
  } catch {
    return null
  }
}
