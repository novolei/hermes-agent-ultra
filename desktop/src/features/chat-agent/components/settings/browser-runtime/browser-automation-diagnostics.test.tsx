// Wave E4 minimal smoke test for BrowserAutomationDiagnostics
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserAutomationDiagnostics } from './browser-automation-diagnostics'
import { deriveBrowserRuntimeControlCenterViewModel } from '@/features/chat-agent/lib/browser-runtime/browser-runtime-control-center'

describe('BrowserAutomationDiagnostics', () => {
  it('renders without throwing with no report prop', () => {
    const model = deriveBrowserRuntimeControlCenterViewModel(undefined)
    const { container } = render(
      <BrowserAutomationDiagnostics
        model={model}
        rawOpen={false}
        onToggleRaw={vi.fn()}
      />
    )
    expect(container).toBeTruthy()
  })
})
