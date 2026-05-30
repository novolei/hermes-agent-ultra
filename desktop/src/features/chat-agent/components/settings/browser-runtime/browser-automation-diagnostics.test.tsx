// Wave E4 minimal smoke test for BrowserAutomationDiagnostics
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserAutomationDiagnostics } from './browser-automation-diagnostics'
import { deriveBrowserRuntimeControlCenterViewModel } from '@/features/chat-agent/lib/browser-runtime/browser-runtime-control-center'

describe('BrowserAutomationDiagnostics', () => {
  it('renders the Diagnostics section title with a derived empty view model', () => {
    const model = deriveBrowserRuntimeControlCenterViewModel(undefined)
    render(
      <BrowserAutomationDiagnostics
        model={model}
        rawOpen={false}
        onToggleRaw={vi.fn()}
      />,
    )
    // SettingsSection title surfaces as visible text — confirms the component
    // actually executed its JSX, not merely mounted.
    expect(screen.getByText('Diagnostics')).toBeTruthy()
  })
})
