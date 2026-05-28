/**
 * Ported verbatim from uclaw's ChatMessageItem.tsx.
 * Formats a Unix-millisecond timestamp into a concise display string:
 *   - Same year  → "MM/DD HH:MM"
 *   - Other year → "YYYY/MM/DD HH:MM"
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()

  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const time = `${hh}:${mm}`

  if (date.getFullYear() === now.getFullYear()) {
    return `${month}/${day} ${time}`
  }

  return `${date.getFullYear()}/${month}/${day} ${time}`
}
