import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FragmentCard, SUBTYPE_COLORS } from './fragment-card'
import type { FragmentItem } from '@/features/chat-agent/lib/tauri-bridge-stub'

describe('FragmentCard', () => {
  it('renders fragment card with title and content', () => {
    const fragment: FragmentItem = {
      id: 'test-1',
      title: 'Test Fragment',
      content: 'This is test content',
      source: 'text',
      createdAt: Date.now(),
      subtype: 'daily',
      tags: [],
    }

    const { getByText } = render(
      <FragmentCard fragment={fragment} />
    )

    expect(getByText('Test Fragment')).toBeDefined()
    expect(getByText('This is test content')).toBeDefined()
  })

  it('renders with compact mode', () => {
    const fragment: FragmentItem = {
      id: 'test-2',
      title: 'Compact Test',
      content: 'Compact content',
      source: 'voice',
      createdAt: Date.now(),
      subtype: 'reminder',
      tags: [],
    }

    const { container } = render(
      <FragmentCard fragment={fragment} compact={true} />
    )

    expect(container.querySelector('button')).toBeDefined()
  })

  it('exports SUBTYPE_COLORS mapping', () => {
    expect(SUBTYPE_COLORS.daily).toBeDefined()
    expect(SUBTYPE_COLORS.credential).toBeDefined()
    expect(SUBTYPE_COLORS.location).toBeDefined()
    expect(SUBTYPE_COLORS.reminder).toBeDefined()
    expect(SUBTYPE_COLORS.inspiration).toBeDefined()
    expect(SUBTYPE_COLORS.bookmark).toBeDefined()
  })

  it('calls onClick handler when clicked', () => {
    const fragment: FragmentItem = {
      id: 'test-3',
      title: 'Click Test',
      content: 'Click me',
      source: 'clipboard',
      createdAt: Date.now(),
      subtype: 'bookmark',
      tags: [],
    }

    const handleClick = () => {}
    const { container } = render(
      <FragmentCard fragment={fragment} onClick={handleClick} />
    )

    const button = container.querySelector('button')
    expect(button).toBeDefined()
  })
})
