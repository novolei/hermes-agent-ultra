import { describe, it, expect } from 'vitest'
import {
  formatDuration,
  buildUsageTooltip,
  formatRelativeShort,
  parseAttachedFiles,
  isImageFile,
  agentActivitiesToChatActivities,
  extractToolActivities,
} from './agent-messages-utils'
import type { ToolActivity } from './agent-types'

describe('agent-messages-utils', () => {
  describe('formatDuration', () => {
    it('formats sub-second duration as ms', () => {
      expect(formatDuration(500)).toBe('500ms')
    })
    it('formats exactly 1000ms as seconds', () => {
      expect(formatDuration(1000)).toBe('1.0s')
    })
    it('formats multi-second duration', () => {
      expect(formatDuration(2500)).toBe('2.5s')
    })
    it('formats minute-range duration', () => {
      // 90s → 1m 30s
      expect(formatDuration(90_000)).toBe('1m 30s')
    })
  })

  describe('buildUsageTooltip', () => {
    it('returns a string mentioning duration for ms-only call', () => {
      const result = buildUsageTooltip(1234)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toContain('耗时')
    })
    it('includes token counts when usage is provided', () => {
      const result = buildUsageTooltip(1000, {
        inputTokens: 500,
        outputTokens: 100,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      })
      expect(result).toContain('输入')
      expect(result).toContain('输出')
    })
    it('does not add input line when pureInput is 0', () => {
      // inputTokens == cacheReadTokens + cacheCreationTokens → pureInput = 0
      const result = buildUsageTooltip(500, {
        inputTokens: 100,
        cacheReadTokens: 50,
        cacheCreationTokens: 50,
      })
      expect(result).not.toContain('输入:')
    })
  })

  describe('formatRelativeShort', () => {
    it('returns "刚刚" for very recent timestamp (< 60s)', () => {
      expect(formatRelativeShort(Date.now() - 5_000)).toBe('刚刚')
    })
    it('returns "Xm ago" for timestamps 1-59 minutes ago', () => {
      const result = formatRelativeShort(Date.now() - 5 * 60 * 1000)
      expect(result).toBe('5m ago')
    })
    it('returns "Xh ago" for timestamps 1-23 hours ago', () => {
      const result = formatRelativeShort(Date.now() - 2 * 3600 * 1000)
      expect(result).toBe('2h ago')
    })
    it('returns a date string for timestamps > 24h ago', () => {
      const result = formatRelativeShort(Date.now() - 2 * 86400 * 1000)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('isImageFile', () => {
    it('detects .png as image', () => expect(isImageFile('x.png')).toBe(true))
    it('detects .jpg as image', () => expect(isImageFile('x.jpg')).toBe(true))
    it('detects .jpeg as image', () => expect(isImageFile('x.jpeg')).toBe(true))
    it('detects .gif as image', () => expect(isImageFile('x.gif')).toBe(true))
    it('detects .webp as image', () => expect(isImageFile('x.webp')).toBe(true))
    it('detects .svg as image', () => expect(isImageFile('x.svg')).toBe(true))
    it('detects .bmp as image', () => expect(isImageFile('x.bmp')).toBe(true))
    it('detects .ico as image', () => expect(isImageFile('x.ico')).toBe(true))
    it('rejects .txt as non-image', () => expect(isImageFile('x.txt')).toBe(false))
    it('rejects .ts as non-image', () => expect(isImageFile('x.ts')).toBe(false))
    it('is case-insensitive', () => expect(isImageFile('x.PNG')).toBe(true))
  })

  describe('parseAttachedFiles', () => {
    it('returns empty files for plain content with no XML block', () => {
      const out = parseAttachedFiles('hello')
      expect(out.files).toEqual([])
      expect(out.text.trim()).toBe('hello')
    })
    it('extracts file refs from attached_files block (dash-colon format)', () => {
      const input = '<attached_files>\n- photo.png: /home/user/photo.png\n</attached_files>\nbody'
      const out = parseAttachedFiles(input)
      expect(out.files).toHaveLength(1)
      expect(out.files[0]).toEqual({ filename: 'photo.png', path: '/home/user/photo.png' })
      expect(out.text).toContain('body')
    })
    it('strips the attached_files block from text', () => {
      const input = '<attached_files>\n- a.txt: /tmp/a.txt\n</attached_files>\nremaining'
      const out = parseAttachedFiles(input)
      expect(out.text).not.toContain('attached_files')
    })
    it('handles multiple files', () => {
      const input = '<attached_files>\n- a.png: /a.png\n- b.jpg: /b.jpg\n</attached_files>\ntext'
      const out = parseAttachedFiles(input)
      expect(out.files).toHaveLength(2)
    })
  })

  describe('extractToolActivities', () => {
    it('returns empty array for undefined input', () => {
      expect(extractToolActivities(undefined)).toEqual([])
    })
    it('returns empty array for empty events array', () => {
      expect(extractToolActivities([])).toEqual([])
    })
    it('builds a tool activity from tool_start event', () => {
      const events = [
        {
          type: 'tool_start',
          toolUseId: 'tu-1',
          toolName: 'bash',
          input: { command: 'ls' },
        },
      ]
      const result = extractToolActivities(events)
      expect(result).toHaveLength(1)
      expect(result[0]!.toolUseId).toBe('tu-1')
      expect(result[0]!.toolName).toBe('bash')
      expect(result[0]!.done).toBe(true)
    })
    it('merges tool_result into matching activity', () => {
      const events = [
        { type: 'tool_start', toolUseId: 'tu-2', toolName: 'read_file', input: { path: '/x' } },
        { type: 'tool_result', toolUseId: 'tu-2', result: 'file content', isError: false },
      ]
      const result = extractToolActivities(events)
      expect(result).toHaveLength(1)
      expect(result[0]!.result).toBe('file content')
      expect(result[0]!.isError).toBe(false)
    })
  })

  describe('agentActivitiesToChatActivities', () => {
    it('converts empty array to empty array', () => {
      expect(agentActivitiesToChatActivities([])).toEqual([])
    })
    it('produces start + result pair for a done activity', () => {
      const activity: ToolActivity = {
        toolUseId: 'tc-1',
        toolName: 'bash',
        input: { command: 'pwd' },
        done: true,
        result: '/home/user',
        isError: false,
      }
      const result = agentActivitiesToChatActivities([activity])
      expect(result).toHaveLength(2)
      expect(result[0]!.type).toBe('start')
      expect(result[1]!.type).toBe('result')
      expect(result[1]!.status).toBe('completed')
    })
    it('produces only start for an in-progress activity', () => {
      const activity: ToolActivity = {
        toolUseId: 'tc-2',
        toolName: 'bash',
        input: { command: 'sleep 5' },
        done: false,
      }
      const result = agentActivitiesToChatActivities([activity])
      expect(result).toHaveLength(1)
      expect(result[0]!.type).toBe('start')
    })
    it('sets status to "failed" for error result', () => {
      const activity: ToolActivity = {
        toolUseId: 'tc-3',
        toolName: 'bash',
        input: {},
        done: true,
        result: 'error message',
        isError: true,
      }
      const result = agentActivitiesToChatActivities([activity])
      const resultEntry = result.find((r) => r.type === 'result')
      expect(resultEntry!.status).toBe('failed')
    })
  })
})
