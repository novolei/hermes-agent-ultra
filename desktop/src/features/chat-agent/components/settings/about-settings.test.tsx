import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AboutSettings } from './about-settings'

vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getVersion: vi.fn().mockResolvedValue({ appVersion: '0.14.2', tauriVersion: '2.0.0', rustVersion: '1.80.0' }),
    getPlatform: vi.fn().mockResolvedValue({ os: 'macos', arch: 'aarch64', version: '15.0' }),
  }
})

describe('AboutSettings', () => {
  it('renders without throwing and shows section content', async () => {
    const { container } = render(<AboutSettings />)
    await waitFor(() => {
      expect(container.querySelector('[data-settings-section], h2, h3')).not.toBeNull()
    })
  })

  it('displays the resolved app version after the mount effect', async () => {
    render(<AboutSettings />)
    await waitFor(() => {
      // appVersion '0.14.2' appears twice: 'v0.14.2' in the hero card and '0.14.2' in 系统信息
      expect(screen.getAllByText(/0\.14\.2/).length).toBeGreaterThanOrEqual(1)
    })
  })
})
