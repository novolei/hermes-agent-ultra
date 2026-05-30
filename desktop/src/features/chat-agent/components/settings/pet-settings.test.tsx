/**
 * PetSettings — mount smoke tests.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { petEnabledAtom } from '@/features/chat-agent/atoms/pet-atoms'
import { PetSettings } from './pet-settings'

describe('PetSettings', () => {
  it('renders the 桌面宠物 section header', () => {
    render(
      <Provider>
        <PetSettings />
      </Provider>,
    )
    expect(screen.getByText('桌面宠物')).toBeInTheDocument()
  })

  it('renders both character options when pet is enabled', () => {
    const store = createStore()
    store.set(petEnabledAtom, true)
    render(
      <Provider store={store}>
        <PetSettings />
      </Provider>,
    )
    // Both PetCharacter values ('astro' | 'clawby') render as radio buttons
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(screen.getByText('小宇 Astro')).toBeInTheDocument()
    expect(screen.getByText('爪宝 Clawby')).toBeInTheDocument()
  })
})
