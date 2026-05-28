import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { MoveSessionDialog } from './move-session-dialog'

describe('MoveSessionDialog', () => {
  it('renders without throwing when closed', () => {
    const { container } = render(
      <Provider>
        <MoveSessionDialog
          open={false}
          onOpenChange={() => {}}
          sessionId="test-session-id"
          currentWorkspaceId="workspace-1"
          workspaces={[
            {
              id: 'workspace-1',
              name: 'Workspace 1',
              icon: '',
              path: null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            {
              id: 'workspace-2',
              name: 'Workspace 2',
              icon: '',
              path: null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ]}
          onMoved={() => {}}
        />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
