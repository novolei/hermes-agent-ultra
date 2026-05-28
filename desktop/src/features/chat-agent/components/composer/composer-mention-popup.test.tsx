/**
 * Smoke tests for ComposerMentionPopup.
 *
 * Full render tests are integration-shaped (require TipTap editor +
 * popup positioning). These tests assert module-level compilation and
 * export shape only. Deeper coverage lands in RichTextInput (Task 10)
 * and downstream consumers.
 */
import { describe, it, expect } from 'vitest'
import { ComposerMentionPopup } from './composer-mention-popup'

describe('ComposerMentionPopup', () => {
  it('exports the popup component', () => {
    expect(typeof ComposerMentionPopup).toBe('function')
  })
})
