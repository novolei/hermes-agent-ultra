import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BranchPicker } from './branch-picker'

describe('BranchPicker', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <BranchPicker
        cwd="/tmp/test-repo"
        currentBranch="main"
      />,
    )
    expect(container).toBeDefined()
  })
})
