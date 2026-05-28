/**
 * ToolActivityItem.test.tsx
 *
 * Tests for the 预览 (Preview) button on tool activity rows.
 * Covers: eligibility logic (tool name + path) and click-to-open behavior.
 *
 * Ported from uclaw/ui/src/components/agent/ToolActivityItem.test.tsx
 * Retargets:
 *   ./ToolActivityItem                  → ./tool-activity-item
 *   @/atoms/preview-panel-atoms         → @/features/chat-agent/atoms/preview-panel-atoms
 *   @/atoms/agent-atoms                 → @/features/chat-agent/atoms/agent-atoms
 *   @/test-utils/render renderWithProviders → local inline helper (jotai Provider + store)
 *   @/lib/tauri-bridge mock             → @/lib/bridge mock
 *   @/components/agent/tool-renderers mock → ./tool-renderers mock
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { ActivityRow } from './tool-activity-item'
import { previewTabsAtom } from '@/features/chat-agent/atoms/preview-panel-atoms'
import type { ToolActivity } from '@/features/chat-agent/atoms/agent-atoms'

// ── Module mocks ────────────────────────────────────────────────────────

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn().mockResolvedValue(() => {}) }))

vi.mock('@/lib/bridge', () => ({
  readAttachment: vi.fn(async () => null),
  saveImageAs: vi.fn(async () => false),
}))

vi.mock('./tool-renderers', () => ({
  ToolResultRenderer: () => <div data-testid="tool-result-renderer">result</div>,
}))

// ── renderWithProviders helper ──────────────────────────────────────────

type JotaiStore = ReturnType<typeof createStore>

function renderWithProviders(
  ui: React.ReactElement,
  store: JotaiStore = createStore(),
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )
  const result = render(ui, { wrapper: Wrapper })
  return { ...result, store }
}

// ── Fixture helpers ─────────────────────────────────────────────────────

function makeActivity(overrides: Partial<ToolActivity> = {}): ToolActivity {
  return {
    toolUseId: 'test-tool-use-id',
    toolName: 'write_file',
    input: { path: 'src/foo.ts', content: 'x' },
    done: true,
    result: 'ok',
    isError: false,
    ...overrides,
  }
}

function renderRow(activity: ToolActivity, onOpenDetails?: (a: ToolActivity) => void) {
  return renderWithProviders(
    <ActivityRow activity={activity} onOpenDetails={onOpenDetails} />,
  )
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('ToolActivityItem 预览 button', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows 预览 button for write_file tool with a path', () => {
    renderRow(makeActivity({ toolName: 'write_file', input: { path: 'src/foo.ts' } }))
    expect(screen.getByRole('button', { name: /预览/ })).toBeInTheDocument()
  })

  it('shows 预览 button for edit tool with a path', () => {
    renderRow(makeActivity({ toolName: 'edit', input: { path: 'src/bar.ts' } }))
    expect(screen.getByRole('button', { name: /预览/ })).toBeInTheDocument()
  })

  it('shows 预览 button for plan_write tool with a path', () => {
    renderRow(makeActivity({ toolName: 'plan_write', input: { path: 'docs/plan.md' } }))
    expect(screen.getByRole('button', { name: /预览/ })).toBeInTheDocument()
  })

  it('does NOT show 预览 button for read_file tool', () => {
    renderRow(makeActivity({ toolName: 'read_file', input: { path: 'src/foo.ts' } }))
    expect(screen.queryByRole('button', { name: /预览/ })).not.toBeInTheDocument()
  })

  it('does NOT show 预览 button for bash tool', () => {
    renderRow(makeActivity({ toolName: 'bash', input: { command: 'ls' } }))
    expect(screen.queryByRole('button', { name: /预览/ })).not.toBeInTheDocument()
  })

  it('does NOT show 预览 button for write_file without a path', () => {
    renderRow(makeActivity({ toolName: 'write_file', input: { content: 'x' } }))
    expect(screen.queryByRole('button', { name: /预览/ })).not.toBeInTheDocument()
  })

  it('clicking 预览 opens the preview tab via openPreviewTabAction', () => {
    const { store } = renderRow(
      makeActivity({ toolName: 'write_file', input: { path: 'src/foo.ts', content: 'x' } }),
    )
    fireEvent.click(screen.getByRole('button', { name: /预览/ }))
    const tabs = store.get(previewTabsAtom)
    expect(tabs.length).toBeGreaterThanOrEqual(1)
    const tab = tabs.find((t) => t.relPath === 'src/foo.ts')
    expect(tab).toBeDefined()
    expect(tab?.source).toBe('agent')
    expect(tab?.name).toBe('foo.ts')
  })

  it('clicking 预览 does not trigger onOpenDetails (stopPropagation)', () => {
    // NOTE: when canExpand=true the row is a div[role=button] and the preview button is
    // nested inside it. We identify the preview button by its specific aria-label.
    const onOpenDetails = vi.fn()
    renderRow(
      makeActivity({ toolName: 'write_file', input: { path: 'src/foo.ts' } }),
      onOpenDetails,
    )
    const previewBtn = screen.getByLabelText('预览 src/foo.ts')
    fireEvent.click(previewBtn)
    expect(onOpenDetails).not.toHaveBeenCalled()
  })
})
