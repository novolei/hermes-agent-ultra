// Ported verbatim from uclaw components/preview/hooks/usePreviewRouter.ts — Plan PV.b
/**
 * usePreviewRouter — Decide which renderer to mount for a given target.
 *
 * Pure: just dispatches on `target.name`'s extension. Heavy lifting
 * (fetching bytes, deciding text-vs-binary) lives in renderers themselves.
 */

import * as React from 'react'
import { classifyExtension, type RendererKind } from '@/features/chat-agent/components/preview/utils/ext-classifier'
import type { PreviewFileTarget } from '@/features/chat-agent/atoms/preview-panel-atoms'

export interface PreviewRoute {
  kind: RendererKind
  ext: string
  language?: string
}

export function usePreviewRouter(target: PreviewFileTarget | null): PreviewRoute | null {
  return React.useMemo(() => {
    if (!target) return null
    const result = classifyExtension(target.name)
    return result
  }, [target?.name])
}
