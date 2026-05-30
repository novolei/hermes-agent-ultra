// Verbatim from uclaw ui/src/components/settings/SttSettings.test.tsx (Plan 3.5.s.c Wave B1)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { SttSettings } from './stt-settings'
import { createStore } from 'jotai'
import { modelStatusAtom } from '@/features/chat-agent/atoms/stt-atoms'

// SttSettings uses no atoms requiring store injection / no MotionConfig / no TooltipProvider;
// bare jotai Provider suffices. (uclaw's renderWithProviders also wraps MotionConfig +
// TooltipProvider — both unused by this component.)
function renderWithProviders(ui: React.ReactElement, options: { store?: ReturnType<typeof createStore> } = {}) {
  const { store = createStore() } = options
  return render(<Provider store={store}>{ui}</Provider>)
}

const invokeMock = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}))

beforeEach(() => {
  invokeMock.mockReset()
  // Default: stt_model_status never resolves (so we can control modelStatusAtom via store)
  invokeMock.mockReturnValue(new Promise(() => {}))
})

describe('SttSettings', () => {
  it('renders model status section with "未下载" when not downloaded', () => {
    const store = createStore()
    store.set(modelStatusAtom, { kind: 'not-downloaded', expectedDir: '/tmp/x' })
    renderWithProviders(<SttSettings />, { store })
    expect(screen.getByText('未下载')).not.toBeNull()
  })

  it('renders default language select with "auto" selected', () => {
    const store = createStore()
    renderWithProviders(<SttSettings />, { store })
    // "自动" appears as the selected language option value
    expect(screen.getAllByText(/自动/).length).toBeGreaterThan(0)
  })

  it('shows shortcut hint linking to keyboard settings', () => {
    const store = createStore()
    renderWithProviders(<SttSettings />, { store })
    expect(screen.getByText(/Alt\+S|⌥S/)).not.toBeNull()
  })

  it('renders silence threshold select with default value', () => {
    const store = createStore()
    renderWithProviders(<SttSettings />, { store })
    expect(screen.getByText('1.8 秒（默认）')).not.toBeNull()
  })
})
