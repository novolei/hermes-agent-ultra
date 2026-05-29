/**
 * Ported verbatim from uclaw ui/src/components/settings/ShortcutSettings.test.tsx (Wave E, Plan 3.5.s.b)
 * Retargets:
 *   ./ShortcutSettings                    → ./shortcut-settings
 *   @/atoms/shortcut-atoms                → @/features/chat-agent/atoms/shortcut-atoms
 *   @/lib/shortcut-defaults               → @/features/chat-agent/lib/shortcut-defaults
 *   @/test-utils/render renderWithProviders → local inline helper (render + jotai Provider + optional store)
 * updateGlobalShortcut is mocked via vi.mock to prevent NOT_IMPLEMENTED throws during tests.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as React from 'react'
import { createStore } from 'jotai'
import { Provider } from 'jotai'
import { fireEvent, render } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { ShortcutSettings } from './shortcut-settings'
import { shortcutOverridesAtom } from '@/features/chat-agent/atoms/shortcut-atoms'
import { SHORTCUT_DEFINITIONS } from '@/features/chat-agent/lib/shortcut-defaults'

// Mock updateGlobalShortcut so tests don't throw NOT_IMPLEMENTED errors
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async () => {
  const actual = await vi.importActual<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>(
    '@/features/chat-agent/lib/tauri-bridge-stub',
  )
  return {
    ...actual,
    updateGlobalShortcut: vi.fn().mockResolvedValue(undefined),
  }
})

const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)

// ShortcutSettings uses jotai atoms; a bare Provider (with optional store) suffices.
// (uclaw's renderWithProviders also wrapped MotionConfig + TooltipProvider — both unused here.)
function renderWithProviders(
  ui: React.ReactElement,
  opts?: { store?: ReturnType<typeof createStore> },
) {
  return render(<Provider store={opts?.store}>{ui}</Provider>)
}

describe('ShortcutSettings — data-driven keybinding panel', () => {
  beforeEach(() => {
    // localStorage is wiped between tests by the global setup, but be defensive:
    localStorage.clear()
  })

  it('renders one row per SHORTCUT_DEFINITIONS entry', () => {
    renderWithProviders(<ShortcutSettings />)
    // Every label appears at least once. Spot-check 3.
    expect(screen.getAllByText('新建对话').length).toBeGreaterThan(0)
    expect(screen.getAllByText('全局搜索').length).toBeGreaterThan(0)
    expect(screen.getAllByText('专注模式').length).toBeGreaterThan(0)
  })

  it('displays the default binding when no override is set', () => {
    const store = createStore()
    renderWithProviders(<ShortcutSettings />, { store })
    // The "新建对话" row shows Cmd+N on Mac / Ctrl+N on Win.
    // formatShortcut on Mac compresses to "⌘N" — we just check the row exists.
    expect(screen.getByText('新建对话')).not.toBeNull()
  })

  it('writes an override when the user captures a new combo, and the row shows it', () => {
    const store = createStore()
    renderWithProviders(<ShortcutSettings />, { store })

    // Click "新建对话" row's combo chip to enter capture mode.
    // Multiple chips (one per shortcut); just pick the first.
    const chips = screen.getAllByRole('button', { name: /点击录入新组合/ })
    fireEvent.click(chips[0]!)

    // Press a combo that's not used by any other shortcut: Cmd+Shift+P
    fireEvent.keyDown(window, { code: 'KeyP', metaKey: true, shiftKey: true, bubbles: true })

    // After capture, the atom should hold an override for the FIRST shortcut id.
    // We don't assume which it is — the chip click was the first one found —
    // so we assert the atom has at least one entry.
    const next = store.get(shortcutOverridesAtom)
    expect(Object.keys(next).length).toBe(1)
    const onlyKey = Object.keys(next)[0]!
    const override = next[onlyKey]!
    if (isMac) {
      expect(override.mac).toBe('Cmd+Shift+P')
    } else {
      expect(override.win).toBe('Cmd+Shift+P')
    }
  })

  it('reset-all button clears every override and is disabled when there are none', () => {
    const store = createStore()
    // Seed an override directly.
    const firstId = SHORTCUT_DEFINITIONS[0]!.id
    store.set(shortcutOverridesAtom, {
      [firstId]: { mac: 'Cmd+Shift+P', win: 'Ctrl+Shift+P' },
    })
    renderWithProviders(<ShortcutSettings />, { store })

    const resetAll = screen.getByRole('button', { name: '重置全部' })
    expect(resetAll).not.toBeNull()
    fireEvent.click(resetAll)

    expect(store.get(shortcutOverridesAtom)).toEqual({})
  })

  it('Escape during capture cancels without writing', () => {
    const store = createStore()
    renderWithProviders(<ShortcutSettings />, { store })

    const chips2 = screen.getAllByRole('button', { name: /点击录入新组合/ })
    fireEvent.click(chips2[0]!)
    fireEvent.keyDown(window, { code: 'Escape', bubbles: true })

    expect(store.get(shortcutOverridesAtom)).toEqual({})
  })

  it('Backspace alone during capture clears the binding (sets to "未绑定")', () => {
    const store = createStore()
    renderWithProviders(<ShortcutSettings />, { store })

    const chips = screen.getAllByRole('button', { name: /点击录入新组合/ })
    fireEvent.click(chips[0]!)
    // Press Backspace alone (no modifiers) — should clear, not capture as Cmd+Backspace etc.
    fireEvent.keyDown(window, { code: 'Backspace', bubbles: true })

    const next = store.get(shortcutOverridesAtom)
    expect(Object.keys(next).length).toBe(1)
    const override = next[Object.keys(next)[0]!]!
    // The platform field is set to empty string — empty string means "explicitly unbound",
    // distinct from "no override" (default). Row should now show 未绑定 button.
    if (isMac) {
      expect(override.mac).toBe('')
    } else {
      expect(override.win).toBe('')
    }
  })

  it('does NOT include shortcuts that were removed from SHORTCUT_DEFINITIONS', () => {
    // The 9 "ghost" entries (no handler anywhere) were cleaned out. Settings
    // must not surface them anymore — otherwise users could "rebind" a key
    // combo that points to nothing.
    renderWithProviders(<ShortcutSettings />)
    expect(screen.queryByText('关闭标签页')).toBeNull()
    expect(screen.queryByText('搜索对话')).toBeNull()
    expect(screen.queryByText('停止生成')).toBeNull()
    expect(screen.queryByText('切换思考模式')).toBeNull()
    expect(screen.queryByText('切换侧面板')).toBeNull()
  })
})
