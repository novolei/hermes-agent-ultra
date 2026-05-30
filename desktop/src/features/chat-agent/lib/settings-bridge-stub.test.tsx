import { describe, it, expect } from 'vitest'
import * as stubs from './settings-bridge-stub'

describe('settings-bridge-stub', () => {
  it('exports 0 deferred-tab stub components (all real as of 3.5.s.d)', () => {
    const exportedFunctions = Object.values(stubs).filter((v) => typeof v === 'function')
    expect(exportedFunctions.length).toBe(0)
  })
})
