import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProxySetting } from './proxy-setting'

describe('ProxySetting', () => {
  it('renders the proxy settings section header', () => {
    render(<ProxySetting />)
    expect(screen.getByText('代理设置')).toBeTruthy()
  })

  it('renders the proxy-type selector with the default "无代理" value visible', () => {
    render(<ProxySetting />)
    // SettingsSelect uses Radix <Select>; the trigger shows the current value label.
    // Default value is 'none' → label '无代理' is rendered in the SelectTrigger/SelectValue.
    expect(screen.getByText('无代理')).toBeTruthy()
  })
})
