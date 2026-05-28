/**
 * Smoke tests for ComposerMentionController.
 *
 * Full render tests are integration-shaped (require TipTap editor +
 * popup positioning). These tests assert module-level compilation and
 * export shape only. Deeper coverage lands in RichTextInput (Task 10)
 * and downstream consumers.
 */
import { describe, it, expect } from 'vitest'
import { ComposerMentionController } from './composer-mention-controller'

describe('ComposerMentionController', () => {
  it('exports the controller component', () => {
    // forwardRef returns an object (not a function)
    expect(ComposerMentionController).toBeDefined()
    expect(
      typeof ComposerMentionController === 'object' ||
        typeof ComposerMentionController === 'function',
    ).toBe(true)
  })
})
