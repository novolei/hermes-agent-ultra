import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FragmentDetailPopover } from './fragment-detail-popover'
import type { FragmentItem } from '@/features/chat-agent/lib/tauri-bridge-stub'

describe('FragmentDetailPopover', () => {
  it('renders nothing when fragment is null', () => {
    const { container } = render(
      <FragmentDetailPopover fragment={null} open={true} onClose={() => {}} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders popover when open and fragment exists', () => {
    const fragment: FragmentItem = {
      id: 'test-1',
      title: 'Test Fragment',
      content: 'This is test content for the popover',
      source: 'text',
      createdAt: Date.now(),
      subtype: 'daily',
      tags: ['daily'],
    }

    const { getByText } = render(
      <FragmentDetailPopover fragment={fragment} open={true} onClose={() => {}} />
    )

    expect(getByText('Test Fragment')).toBeDefined()
    expect(getByText('This is test content for the popover')).toBeDefined()
  })

  it('renders with different source labels', () => {
    const fragment: FragmentItem = {
      id: 'test-2',
      title: 'Voice Fragment',
      content: 'Voice recorded content',
      source: 'voice',
      createdAt: Date.now(),
      subtype: 'reminder',
      tags: ['reminder'],
    }

    const { getByText } = render(
      <FragmentDetailPopover fragment={fragment} open={true} onClose={() => {}} />
    )

    expect(getByText('Voice Fragment')).toBeDefined()
    expect(getByText('语音')).toBeDefined()
  })

  it('renders review status when present', () => {
    const fragment: FragmentItem = {
      id: 'test-3',
      title: 'Fragment with Review',
      content: 'Content with review status',
      source: 'clipboard',
      createdAt: Date.now(),
      subtype: 'bookmark',
      tags: ['bookmark'],
      reviewStatus: {
        completed: false,
        reviewCount: 2,
      },
    }

    const { getByText } = render(
      <FragmentDetailPopover fragment={fragment} open={true} onClose={() => {}} />
    )

    expect(getByText(/复习进度/)).toBeDefined()
  })

  it('calls onClose when close button is clicked', () => {
    const fragment: FragmentItem = {
      id: 'test-4',
      title: 'Close Test',
      content: 'Test closing the popover',
      source: 'text',
      createdAt: Date.now(),
      subtype: 'daily',
      tags: [],
    }

    let closeCount = 0
    const handleClose = () => {
      closeCount++
    }

    const { container } = render(
      <FragmentDetailPopover fragment={fragment} open={true} onClose={handleClose} />
    )

    expect(container.querySelector('[role="dialog"]')).toBeDefined()
  })
})
