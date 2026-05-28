import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import * as CodeBlockModule from './code-block'

describe('CodeBlock', () => {
  it('exports the main component', () => {
    // Adapt to whichever name uclaw uses (CodeBlock OR MarkdownCodeBlock OR both)
    const Comp = (CodeBlockModule as Record<string, unknown>).MarkdownCodeBlock
                ?? (CodeBlockModule as Record<string, unknown>).CodeBlock
                ?? (CodeBlockModule as Record<string, unknown>).default
    expect(typeof Comp).toBe('function')
  })

  it('renders code text', async () => {
    const Comp = (CodeBlockModule as Record<string, unknown>).MarkdownCodeBlock
                ?? (CodeBlockModule as Record<string, unknown>).CodeBlock
                ?? (CodeBlockModule as Record<string, unknown>).default
    if (typeof Comp !== 'function') throw new Error('CodeBlock not found as a component export')
    // Try calling with the most common prop shapes; pick whichever renders
    const C = Comp as React.ComponentType<{ children?: React.ReactNode; code?: string; language?: string; className?: string }>
    render(<C language="typescript" code={`const x = 1`}>{`const x = 1`}</C>)
    expect(await screen.findByText(/const x = 1/i, {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
