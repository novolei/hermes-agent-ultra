import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { ChatAppearancePopover } from './chat-appearance-popover'

describe('ChatAppearancePopover', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <TooltipProvider>
          <ChatAppearancePopover />
        </TooltipProvider>
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
