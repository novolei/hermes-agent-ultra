import { describe, it, expect, beforeEach } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider, createStore } from 'jotai'
import { ModeBanner } from './mode-banner'
import { safetyModeAtom } from '@/features/chat-agent/atoms/safety-atoms'

describe('ModeBanner', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  it('renders nothing in Auto mode', () => {
    const store = createStore()
    store.set(safetyModeAtom, 'supervised')
    const { container } = render(
      <Provider store={store}>
        <ModeBanner />
      </Provider>,
    )
    expect(container.textContent).toBe('')
  })

  it('renders nothing in Ask mode', () => {
    const store = createStore()
    store.set(safetyModeAtom, 'ask')
    const { container } = render(
      <Provider store={store}>
        <ModeBanner />
      </Provider>,
    )
    expect(container.textContent).toBe('')
  })

  it('renders nothing in Bypass mode', () => {
    const store = createStore()
    store.set(safetyModeAtom, 'yolo')
    const { container } = render(
      <Provider store={store}>
        <ModeBanner />
      </Provider>,
    )
    expect(container.textContent).toBe('')
  })

  it('renders the Plan mode banner in plan', () => {
    const store = createStore()
    store.set(safetyModeAtom, 'plan')
    render(
      <Provider store={store}>
        <ModeBanner />
      </Provider>,
    )
    expect(screen.getByText(/Plan mode — investigating only/i)).toBeInTheDocument()
  })

  it('renders the Accept edits banner in acceptedits', () => {
    const store = createStore()
    store.set(safetyModeAtom, 'acceptedits')
    render(
      <Provider store={store}>
        <ModeBanner />
      </Provider>,
    )
    expect(screen.getByText(/Accept edits — file edits auto-pass/i)).toBeInTheDocument()
  })
})
