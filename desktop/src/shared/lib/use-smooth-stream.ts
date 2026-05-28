// Ported from uclaw hooks/useSmoothStream.ts. Filename normalized to kebab-case
// for consistency with the rest of shared/lib/. The exported symbol name is
// unchanged.

import { useState, useEffect } from 'react'

interface UseSmoothStreamOptions {
  content: string
  isStreaming: boolean
}

interface UseSmoothStreamResult {
  displayedContent: string
}

export function useSmoothStream({ content, isStreaming: _isStreaming }: UseSmoothStreamOptions): UseSmoothStreamResult {
  // 简化实现：直接返回原始内容
  const [displayedContent, setDisplayedContent] = useState(content)

  useEffect(() => {
    setDisplayedContent(content)
  }, [content])

  return { displayedContent }
}
