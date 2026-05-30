// Ported verbatim from uclaw components/preview/editors/MarkdownEditor.tsx — Plan PV.c
/**
 * MarkdownEditor — routes to TipTap rich or CM6 raw based on the
 * persisted markdownEditorModeAtom toggle.
 *
 * Both modes use auto-save (saveMode='auto' passed down). The toggle
 * lives in EditorToolbar (Task 15).
 */

import * as React from 'react'
import { useAtomValue } from 'jotai'
import { markdownEditorModeAtom } from '@/features/chat-agent/atoms/preview-editor-atoms'
import { TextEditor, type EditorProps } from './text-editor'
import { MarkdownRichEditor } from './markdown-rich-editor'

export function MarkdownEditor(props: EditorProps): React.ReactElement {
  const mode = useAtomValue(markdownEditorModeAtom)
  // Both modes auto-save (per W4d spec §4 hybrid model).
  const propsWithAutoSave: EditorProps = { ...props, saveMode: 'auto' }
  return mode === 'rich' ? (
    <MarkdownRichEditor {...propsWithAutoSave} />
  ) : (
    <TextEditor {...propsWithAutoSave} language="markdown" />
  )
}
