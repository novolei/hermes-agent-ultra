import * as React from 'react'

/**
 * Plan 2b.2.b.2 stub. uclaw's `ScrollPositionManager` (from
 * `hooks/useScrollPositionMemory.ts`) is a React component that
 * persists scroll positions across session switches. Real implementation
 * lands in Plan 2b.2.c.
 *
 * This stub renders nothing — AgentMessages composes it as a side-effect
 * mounting component. Without scroll memory, the message list defaults to
 * top-of-view on session change (acceptable for MVP).
 */
interface ScrollPositionManagerProps {
  id: string
  ready: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ScrollPositionManager(
  _props: ScrollPositionManagerProps
): React.ReactElement | null {
  return null
}
