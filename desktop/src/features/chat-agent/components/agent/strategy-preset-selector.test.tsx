import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider as JotaiProvider } from 'jotai'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { StrategyPresetSelector } from './strategy-preset-selector'
import { agentSessionStrategyMapAtom, type AgentStrategy } from '@/features/chat-agent/atoms/agent-atoms'

const SESSION_ID = 'test-session-123'

interface ProviderRenderResult {
  store: ReturnType<typeof createStore>
  user: ReturnType<typeof userEvent.setup>
}

function renderWithProviders(
  ui: React.ReactElement,
  store = createStore(),
): ProviderRenderResult {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <JotaiProvider store={store}>
      <TooltipProvider>{children}</TooltipProvider>
    </JotaiProvider>
  )
  render(ui, { wrapper: Wrapper })
  const user = userEvent.setup()
  return { store, user }
}

describe('StrategyPresetSelector', () => {
  it('defaults to 平衡 when no strategy is set', () => {
    renderWithProviders(<StrategyPresetSelector sessionId={SESSION_ID} />)
    expect(screen.getByRole('button', { name: /🎯 平衡/i })).toBeInTheDocument()
  })

  it('reflects the current strategy from the atom map', () => {
    const store = createStore()
    store.set(agentSessionStrategyMapAtom, new Map<string, AgentStrategy>([[SESSION_ID, 'repair']]))
    renderWithProviders(<StrategyPresetSelector sessionId={SESSION_ID} />, store)
    expect(screen.getByRole('button', { name: /🔧 修 bug/i })).toBeInTheDocument()
  })

  it('updates the atom when a new strategy is selected', async () => {
    const store = createStore()
    const { user } = renderWithProviders(<StrategyPresetSelector sessionId={SESSION_ID} />, store)

    // Open the dropdown
    await user.click(screen.getByRole('button', { name: /🎯 平衡/i }))

    // Click "optimize" item
    const optimizeItem = await screen.findByText('⚡ 优化')
    await user.click(optimizeItem)

    await waitFor(() => {
      expect(store.get(agentSessionStrategyMapAtom).get(SESSION_ID)).toBe('optimize')
    })
  })

  it('removes the session from the map when balanced is selected', async () => {
    const store = createStore()
    store.set(agentSessionStrategyMapAtom, new Map<string, AgentStrategy>([[SESSION_ID, 'repair']]))
    const { user } = renderWithProviders(<StrategyPresetSelector sessionId={SESSION_ID} />, store)

    await user.click(screen.getByRole('button', { name: /🔧 修 bug/i }))
    const balancedItem = await screen.findByText('🎯 平衡')
    await user.click(balancedItem)

    await waitFor(() => {
      expect(store.get(agentSessionStrategyMapAtom).has(SESSION_ID)).toBe(false)
    })
  })
})
