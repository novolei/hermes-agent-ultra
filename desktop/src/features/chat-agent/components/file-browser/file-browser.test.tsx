import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { FileBrowser } from './file-browser'

// listDirectoryEntries is a stub that throws NOT_IMPLEMENTED — mock it so the
// component's load effect resolves with a small fixture.
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    listDirectoryEntries: vi.fn().mockResolvedValue([
      { name: 'src', path: '/root/src', isDirectory: true, isFile: false },
      { name: 'README.md', path: '/root/README.md', isDirectory: false, isFile: true, extension: 'md' },
    ]),
  }
})

describe('FileBrowser', () => {
  it('renders entries returned by listDirectoryEntries', async () => {
    render(<FileBrowser rootPath="/root" />)
    await waitFor(() => {
      expect(screen.getByText('README.md')).toBeTruthy()
    })
  })
})
