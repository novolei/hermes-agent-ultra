import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { AutoPreviewPopover } from './auto-preview-popover'

describe('AutoPreviewPopover', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <TooltipProvider>
          <AutoPreviewPopover />
        </TooltipProvider>
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
