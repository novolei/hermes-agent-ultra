// Ported verbatim from uclaw components/preview/PreviewSurface.tsx — Plan PV.d
import * as React from 'react'
import { useFileBytes } from '@/features/chat-agent/components/preview/hooks/use-file-bytes'
import { usePreviewRouter } from '@/features/chat-agent/components/preview/hooks/use-preview-router'
import { PreviewEmpty } from './preview-empty'
import { ImageRenderer } from './renderers/image-renderer'
import { VideoRenderer } from './renderers/video-renderer'
import { EditorSurface } from './editors/editor-surface'
import { WriteApprovalDialog } from './editors/write-approval-dialog'
import { DiffRenderer } from './renderers/diff/diff-renderer'
import { BinaryFallback } from './renderers/binary-fallback'
import { PdfRenderer } from './renderers/pdf-renderer'
import { DocxRenderer } from './renderers/docx-renderer'
import { XlsxRenderer } from './renderers/xlsx-renderer'
import { PptxRenderer } from './renderers/pptx-renderer'
import { LegacyOfficeHint } from './renderers/legacy-office-hint'
import { usePreviewRefresh } from '@/features/chat-agent/hooks/use-preview-refresh'
import type { PreviewFileTarget } from '@/features/chat-agent/atoms/preview-panel-atoms'

interface PreviewSurfaceProps {
  target: PreviewFileTarget | null
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return ''
  }
}

export function PreviewSurface({ target }: PreviewSurfaceProps): React.ReactElement {
  const route = usePreviewRouter(target)
  const state = useFileBytes(target)
  const resolvedPath = state.status === 'ready' ? state.resolvedPath : null
  usePreviewRefresh(resolvedPath)

  // Decode bytes lazily; only when we know we need text (code / markdown).
  const text = React.useMemo(() => {
    if (state.status !== 'ready') return ''
    if (!route) return ''
    if (route.kind === 'code' || route.kind === 'markdown' || route.kind === 'diff') {
      return decodeUtf8(state.bytes)
    }
    return ''
  }, [state, route])

  if (!target) return <PreviewEmpty status="idle" />
  if (state.status === 'loading' || state.status === 'idle') return <PreviewEmpty status="loading" />
  if (state.status === 'error') return <PreviewEmpty status="error" message={state.message} />

  if (!route) return <PreviewEmpty status="idle" />

  if (route.kind === 'image') {
    return <ImageRenderer resolvedPath={state.resolvedPath} name={target.name} />
  }
  if (route.kind === 'video') {
    return <VideoRenderer resolvedPath={state.resolvedPath} name={target.name} />
  }
  // Force a fresh EditorSurface per file so internal baseline/content/mtime
  // state cannot leak across switches. The polish commit that decoupled the
  // sync-from-props effect from initialContent changes made the editor sticky
  // to whatever it mounted with — a `key` on the target makes that intentional.
  const surfaceKey = `${target.mountId}::${target.relPath}`
  if (route.kind === 'markdown') {
    return (
      <>
        <EditorSurface
          key={surfaceKey}
          target={target}
          initialContent={text}
          mtimeMs={state.mtimeMs}
          isMarkdown={true}
        />
        <WriteApprovalDialog />
      </>
    )
  }
  if (route.kind === 'code') {
    return (
      <>
        <EditorSurface
          key={surfaceKey}
          target={target}
          initialContent={text}
          mtimeMs={state.mtimeMs}
          isMarkdown={false}
          language={route.language ?? 'text'}
        />
        <WriteApprovalDialog />
      </>
    )
  }
  if (route.kind === 'diff') {
    return (
      <DiffRenderer
        left={{ content: '', label: 'before' }}
        right={{ content: text, label: target.name }}
        language="diff"
      />
    )
  }
  if (route.kind === 'pdf') {
    return <PdfRenderer bytes={state.bytes} name={target.name} />
  }
  if (route.kind === 'docx') {
    return <DocxRenderer bytes={state.bytes} name={target.name} />
  }
  if (route.kind === 'xlsx') {
    return <XlsxRenderer bytes={state.bytes} name={target.name} />
  }
  if (route.kind === 'pptx') {
    return <PptxRenderer bytes={state.bytes} name={target.name} />
  }
  if (route.kind === 'legacyOffice') {
    return <LegacyOfficeHint name={target.name} ext={route.ext} />
  }
  return <BinaryFallback name={target.name} size={state.size} ext={route.ext} />
}
