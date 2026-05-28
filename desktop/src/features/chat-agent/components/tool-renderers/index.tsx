import * as React from 'react'
import { WriteResultRenderer } from './write-result'
import { EditResultRenderer } from './edit-result'
import { ReadResultRenderer } from './read-result'
import { BashResultRenderer } from './bash-result'
import { ScreenshotResultRenderer } from './screenshot-result'
import { DefaultResultRenderer } from './default-result'

// Plan 2b.2.c.1 — Gbrain branch + import removed (uclaw-specific tool; no
// gbrain in Hermes). If a future Hermes tool needs a custom renderer, add
// a new case here.

export interface ToolResultRendererProps {
  toolName: string
  input: Record<string, unknown>
  result: string
  isError: boolean
}

export function ToolResultRenderer({
  toolName,
  input,
  result,
  isError,
}: ToolResultRendererProps): React.ReactElement {
  const props = { input, result, isError }
  switch (toolName) {
    case 'write_file':
      return <WriteResultRenderer {...props} />
    case 'edit':
      return <EditResultRenderer {...props} />
    case 'read_file':
      return <ReadResultRenderer {...props} />
    case 'bash':
      return <BashResultRenderer {...props} />
    case 'browser_screenshot':
      return <ScreenshotResultRenderer result={result} isError={isError} />
    default:
      return <DefaultResultRenderer toolName={toolName} {...props} />
  }
}
