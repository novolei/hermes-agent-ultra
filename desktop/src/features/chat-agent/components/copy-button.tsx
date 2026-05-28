/**
 * CopyButton - Copy message content button
 *
 * Uses MessageAction + Copy/Check icon toggle.
 */

import { useState, useCallback } from 'react'
import { CopyIcon, CheckIcon } from 'lucide-react'
import { MessageAction } from './ai-elements/message-action'

interface CopyButtonProps {
  /** Content to copy */
  content: string
}

export function CopyButton({ content }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }, [content])

  return (
    <MessageAction
      tooltip={copied ? 'Copied' : 'Copy'}
      onClick={handleCopy}
    >
      {copied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </MessageAction>
  )
}
