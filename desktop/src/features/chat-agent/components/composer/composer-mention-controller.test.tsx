/**
 * Smoke tests for ComposerMentionController.
 *
 * Full render tests are integration-shaped (require TipTap editor +
 * popup positioning). These tests assert module-level compilation and
 * export shape only. Deeper coverage lands in RichTextInput (Task 10)
 * and downstream consumers.
 */
import { describe, it, expect } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { ComposerMentionController } from './composer-mention-controller'
import { MentionChipNode } from '@/features/chat-agent/lib/composer/mention-chip-node'
import { serializeDocToWireText } from '@/features/chat-agent/lib/composer/composer-serialize'

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

// ---------------------------------------------------------------------------
// TipTap-mock integration: insertMentionChip → wire-text round-trip
//
// Context: ComposerMentionController.commitRow calls
//   `editorRef.current.commands.insertMentionChip(...)` to write a chip
//   node into the editor. The handle only exposes `handleKeyDown`; the
//   chip insertion itself is a TipTap command registered by MentionChipNode.
//
// These tests exercise that command through to the wire-format boundary,
// confirming that:
//   1. MentionChipNode registers the `insertMentionChip` command correctly.
//   2. The inserted node has the right attrs that serializeDocToWireText reads.
//   3. The serializer produces the expected wire marker for each chip kind.
//
// This is a headless (no DOM render) test — Editor without a DOM element is
// valid for command dispatch tests; TipTap's core doesn't require mounting.
// ---------------------------------------------------------------------------
describe('ComposerMentionController integration — insertMentionChip → wire-text', () => {
  function makeEditor() {
    return new Editor({
      extensions: [StarterKit, MentionChipNode],
      content: '',
    })
  }

  it('skill chip serializes to /<value>', () => {
    const editor = makeEditor()
    try {
      editor.commands.insertMentionChip({
        kind: 'skill',
        display: 'tdd',
        value: 'tdd',
      })
      const wire = serializeDocToWireText(editor.getJSON())
      // insertMentionChip also appends a trailing space so the user can
      // keep typing; wire text reflects that.
      expect(wire).toBe('/tdd ')
    } finally {
      editor.destroy()
    }
  })

  it('file chip serializes to @<absolutePath>', () => {
    const editor = makeEditor()
    try {
      editor.commands.insertMentionChip({
        kind: 'file',
        display: 'utils.ts',
        value: '/Users/foo/src/utils.ts',
      })
      const wire = serializeDocToWireText(editor.getJSON())
      expect(wire).toBe('@/Users/foo/src/utils.ts ')
    } finally {
      editor.destroy()
    }
  })

  it('skill chip with from/to replaces a trigger span', () => {
    // Simulate: user typed "@tdd" (@ at pos 1, cursor at pos 4).
    // commitRow passes from=1, to=4 so the trigger span is deleted
    // before the chip is inserted.
    const editor = makeEditor()
    try {
      // Seed the editor with the trigger text the user typed.
      editor.commands.insertContent('@tdd')
      // Mimic commitRow: provide from/to to wipe the trigger span.
      // After insertContent('@tdd') the doc is: paragraph[@tdd]
      // Positions: 0=doc, 1=paragraph, 2=@, 3=t, 4=d, 5=d
      // from=1 (start of paragraph content), to=5 (end of '@tdd')
      editor.commands.insertMentionChip({
        kind: 'skill',
        display: 'tdd',
        value: 'tdd',
        from: 1,
        to: 5,
      })
      const wire = serializeDocToWireText(editor.getJSON())
      // The trigger text is gone; only the chip (+ trailing space) remains.
      expect(wire).toBe('/tdd ')
    } finally {
      editor.destroy()
    }
  })

  it('chip inserted mid-text leaves surrounding prose intact', () => {
    const editor = makeEditor()
    try {
      editor.commands.insertContent('help me ')
      editor.commands.insertMentionChip({
        kind: 'skill',
        display: 'tdd',
        value: 'tdd',
      })
      editor.commands.insertContent('refactor this')
      const wire = serializeDocToWireText(editor.getJSON())
      expect(wire).toBe('help me /tdd refactor this')
    } finally {
      editor.destroy()
    }
  })
})
