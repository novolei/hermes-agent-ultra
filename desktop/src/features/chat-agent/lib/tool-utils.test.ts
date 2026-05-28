import { describe, it, expect } from 'vitest'
import {
  TOOL_ICONS,
  getToolIcon,
  getToolDisplayName,
  computeDiffStats,
  formatElapsed,
  inferLanguageFromPath,
} from './tool-utils'

describe('tool-utils', () => {
  it('TOOL_ICONS is a non-empty map', () => {
    expect(Object.keys(TOOL_ICONS).length).toBeGreaterThan(0)
  })

  it('getToolIcon returns a value for known + unknown tools', () => {
    expect(getToolIcon('read_file')).toBeDefined()
    expect(getToolIcon('unknown_tool_xyz')).toBeDefined()
  })

  it('getToolDisplayName returns a string', () => {
    expect(typeof getToolDisplayName('Read')).toBe('string')
  })

  it('getToolDisplayName returns original name for unknown tools', () => {
    expect(getToolDisplayName('unknown_tool_xyz')).toBe('unknown_tool_xyz')
  })

  it('inferLanguageFromPath returns "text" for unknown extensions', () => {
    expect(inferLanguageFromPath('x.weirdext')).toBe('text')
  })

  it('formatElapsed returns a string', () => {
    expect(typeof formatElapsed(0)).toBe('string')
    expect(typeof formatElapsed(120)).toBe('string')
  })

  it('formatElapsed formats seconds under 60 as X.Xs', () => {
    expect(formatElapsed(5)).toBe('5.0s')
  })

  it('formatElapsed formats seconds >= 60 as Xm Ys', () => {
    expect(formatElapsed(90)).toBe('1m 30s')
  })

  it('computeDiffStats returns a defined value for Edit tool', () => {
    const stats = computeDiffStats('Edit', {
      old_string: 'line1\nline2\nline3',
      new_string: 'line1\nline2\nline3\nline4',
    })
    expect(stats).toBeDefined()
    expect(stats).not.toBeNull()
    expect(stats?.additions).toBe(4)
    expect(stats?.deletions).toBe(3)
  })

  it('computeDiffStats returns null for non-Edit tools', () => {
    const stats = computeDiffStats('Read', { file_path: '/x.ts' })
    expect(stats).toBeNull()
  })
})
