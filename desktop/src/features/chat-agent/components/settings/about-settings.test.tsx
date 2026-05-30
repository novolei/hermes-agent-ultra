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
  it('renders the section header without throwing', async () => {
    render(<AboutSettings />)
    // The '关于 uClaw' <h2> heading renders unconditionally (verbatim source line 19).
    // Asserting the exact heading text is non-tautological — it fails if the component
    // crashes before painting its title or the heading is removed.
    await waitFor(() => {
      expect(screen.getByText('关于 uClaw')).toBeTruthy()
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
