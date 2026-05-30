/**
 * IntelligenceTab — mount smoke test.
 * Ported from uclaw IntelligenceTab.test.tsx with retargets applied.
 */
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { IntelligenceTab } from './intelligence-tab'

vi.mock('./model-settings', () => ({
  ModelSettings: () => <div data-testid="model-settings" />,
}))

vi.mock('./agent-settings', () => ({
  AgentSettings: () => <div data-testid="agent-settings" />,
}))

vi.mock('./prompts-settings', () => ({
  PromptsSettings: () => <div data-testid="prompts-settings" />,
}))

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    proactiveStatus: vi.fn(async () => ({ status: { status: 'Stopped' } })),
    proactiveStart: vi.fn(async () => undefined),
    proactiveStop: vi.fn(async () => undefined),
  }
})

describe('IntelligenceTab', () => {
  it('renders without throwing and contains data-settings-section markers', () => {
    const { container } = render(
      <Provider>
        <IntelligenceTab />
      </Provider>,
    )
    const markers = container.querySelectorAll('[data-settings-section]')
    expect(markers.length).toBe(4)
    const names = Array.from(markers).map((m) => (m as HTMLElement).dataset.settingsSection)
    expect(names).toContain('模型分配')
    expect(names).toContain('Agent 行为')
    expect(names).toContain('提示词')
    expect(names).toContain('Gene 自进化')
  })
})
