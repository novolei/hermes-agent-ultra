import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { SpeechButton } from './speech-button'

describe('SpeechButton', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <TooltipProvider>
          <SpeechButton />
        </TooltipProvider>
      </Provider>,
    )
    expect(container).toBeDefined()
  })

  it('renders with composer prop', () => {
    const { container } = render(
      <Provider>
        <TooltipProvider>
          <SpeechButton composer="agent" />
        </TooltipProvider>
      </Provider>,
    )
    expect(container).toBeDefined()
  })

  it('renders with onShowDownloadDialog callback', () => {
    const mockCallback = () => {}
    const { container } = render(
      <Provider>
        <TooltipProvider>
          <SpeechButton onShowDownloadDialog={mockCallback} />
        </TooltipProvider>
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
