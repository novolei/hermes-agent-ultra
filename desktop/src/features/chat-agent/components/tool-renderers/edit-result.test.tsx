import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import * as React from 'react'
import { themeModeAtom, systemIsDarkAtom } from '@/features/chat-agent/atoms/theme'
import { EditResultRenderer } from './edit-result'

vi.mock('@pierre/diffs/react', () => ({
  MultiFileDiff: (props: Record<string, unknown>) => (
    <div data-testid="pierre-filediff" data-props={JSON.stringify(props)}>
      pierre stub
    </div>
  ),
}))

function renderWithTheme(theme: 'light' | 'dark', el: React.ReactElement) {
  const store = createStore()
  // Plan 3.1 — resolvedThemeAtom is derived from themeModeAtom + systemIsDarkAtom.
  // Setting these two drives pierre-theme's resolution path.
  store.set(themeModeAtom, theme)
  store.set(systemIsDarkAtom, theme === 'dark')
  return render(<Provider store={store}>{el}</Provider>)
}

describe('EditResultRenderer', () => {
  it('renders one FileDiff per edit in the array', () => {
    renderWithTheme('light',
      <EditResultRenderer
        input={{
          path: 'src/foo.ts',
          edits: [
            { old_text: 'foo', new_text: 'bar' },
            { old_text: 'baz', new_text: 'qux' },
          ],
        }}
        result=""
        isError={false}
      />,
    )
    const diffs = screen.getAllByTestId('pierre-filediff')
    expect(diffs).toHaveLength(2)
    // The first diff's props should contain 'foo' and 'bar'
    const props0 = JSON.parse(diffs[0].getAttribute('data-props') ?? '{}')
    expect(JSON.stringify(props0)).toContain('foo')
    expect(JSON.stringify(props0)).toContain('bar')
    expect(JSON.stringify(props0)).toContain('src/foo.ts')
  })

  it('handles single-edit (non-array) input shape defensively', () => {
    renderWithTheme('light',
      <EditResultRenderer
        input={{
          path: 'a.ts',
          edits: { old_text: 'only', new_text: 'one' }, // not an array
        }}
        result=""
        isError={false}
      />,
    )
    const diffs = screen.getAllByTestId('pierre-filediff')
    expect(diffs).toHaveLength(1)
    expect(JSON.stringify(JSON.parse(diffs[0].getAttribute('data-props') ?? '{}'))).toContain('only')
  })

  it('renders error state when isError', () => {
    renderWithTheme('light',
      <EditResultRenderer
        input={{ path: 'a.ts', edits: [{ old_text: 'x', new_text: 'y' }] }}
        result="text not found"
        isError={true}
      />,
    )
    expect(screen.getByText(/text not found/)).toBeInTheDocument()
    expect(screen.queryByTestId('pierre-filediff')).not.toBeInTheDocument()
  })

  it('handles missing edits array gracefully', () => {
    renderWithTheme('light',
      <EditResultRenderer input={{ path: 'a.ts' }} result="" isError={false} />,
    )
    expect(screen.getByText(/no edits/i)).toBeInTheDocument()
  })
})
