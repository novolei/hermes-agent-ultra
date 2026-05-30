import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as React from 'react'
import * as stubs from './settings-bridge-stub'

describe('settings-bridge-stub', () => {
  it('exports 7 deferred-tab stub components', () => {
    const exportedFunctions = Object.values(stubs).filter((v) => typeof v === 'function')
    expect(exportedFunctions.length).toBe(7)
  })

  it.each([
    ['SttSettings', '3.5.s.c'],
    ['ImChannelsSettings', '3.5.s.c'],
    ['PetSettings', '3.5.s.c'],
    ['BrowserRuntimeSettings', '3.5.s.c'],
    ['ProxySetting', '3.5.s.d'],
    ['SystemTab', '3.5.s.d'],
    ['AboutSettings', '3.5.s.d'],
  ])('%s renders with data-stub + data-deferred-to=%s', (name, plan) => {
    const Comp = (stubs as unknown as Record<string, React.ComponentType>)[name]
    expect(Comp).toBeDefined()
    const { container } = render(<Comp />)
    const stub = container.querySelector(`[data-stub="${name}"]`)
    expect(stub).not.toBeNull()
    expect(stub?.getAttribute('data-deferred-to')).toBe(plan)
  })

  it('placeholder content includes the symbol name and the plan reference', () => {
    const { container } = render(<stubs.SttSettings />)
    expect(container.textContent).toContain('SttSettings')
    expect(container.textContent).toContain('3.5.s.c')
  })
})
