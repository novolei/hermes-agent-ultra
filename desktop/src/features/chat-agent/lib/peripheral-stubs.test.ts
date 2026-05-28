import { describe, it, expect } from 'vitest'
import {
  readAttachment,
  saveImageAs,
} from './peripheral-stubs'

describe('peripheral-stubs (Plan 2b.2.c.2 — Tauri shims only)', () => {
  it('exports no-op Tauri attachment shims', async () => {
    await expect(readAttachment('/x')).resolves.toBeNull()
    await expect(saveImageAs({ localPath: '/x', filename: 'x.png', mediaType: 'image/png' })).resolves.toBe(false)
  })
})
