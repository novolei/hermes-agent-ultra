import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DefaultResultRenderer } from './default-result'

describe('DefaultResultRenderer', () => {
  it('renders unknown tool result text', () => {
    render(
      <DefaultResultRenderer
        toolName="some_tool"
        input={{}}
        result="hello result"
        isError={false}
      />,
    )
    expect(screen.getByText(/hello result/)).toBeInTheDocument()
  })

  it('renders error variant', () => {
    render(
      <DefaultResultRenderer
        toolName="some_tool"
        input={{}}
        result="boom"
        isError={true}
      />,
    )
    expect(screen.getByText(/boom/)).toBeInTheDocument()
  })
})
