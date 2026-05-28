import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { SidebarGitActions } from './sidebar-git-actions'

describe('SidebarGitActions', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <SidebarGitActions />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
