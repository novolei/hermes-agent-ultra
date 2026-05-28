# Desktop AgentMessages Integration — Plan 2b.2.b.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port a **slim** version of uclaw's `AgentMessages.tsx` (~400 LOC effective) into `desktop/src/features/chat-agent/components/agent-messages.tsx`, with ~10 feature-local stub files replacing the ~20 unported transitive dependencies (tool rendering, chat-side atoms/chips, ancillaries). Result: a working message renderer that integrates with the atoms from Plan 2b.2.a.

**Architecture:** Bottom-up port: stubs (peripheral atoms + Tauri shims + stub components) → ported helpers → small render components → medium render components → reducer widening (closes Plan 2b.2.b.1 follow-up #2) → AgentMessageItem → main AgentMessages → integration tests. Each stub matches uclaw's exact named export shape so Plan 2b.2.c can swap real components in with zero AgentMessages changes.

**Tech Stack additions:** None — all deps already installed in 2b.2.b.1.

**Reference:** Spec — [docs/superpowers/specs/2026-05-28-desktop-message-rendering-ui-design.md](../specs/2026-05-28-desktop-message-rendering-ui-design.md) §3.2 + §13. Stacked on Plan 2b.2.b.1 (PR #5 — `feat/desktop-message-ui-primitives`).

---

## Scope Summary

| In-scope | Out-of-scope (stubbed; Plan 2b.2.c upgrades) |
|---|---|
| Message-list iteration over `messages: AgentMessage[]` | Real tool rendering (`ToolActivityList`, `ChatToolActivityIndicator`) |
| Welcome empty state via `WelcomeEmptyState` | Real `ThinkingBlock` + `NativeBlockRenderer` |
| `ScrollMinimap` + `MinimapItem` mapping | Real `SkillCitationChips` + `SkillRecallChips` |
| `StickyUserMessage` indicator | Real `MemoryRecallChip` + `ProactiveLearningChip` |
| Streaming partial-state rendering (assistant bubble with `streamState.content` + `reasoning`) | Real `CompactingIndicator` + `CompactBoundaryDivider` |
| Error-state rendering surfacing `streamState.error` (closes 2b.2.b.1 follow-up #2) | Real chat-side atoms (`channelsAtom`, `tabMinimapCacheAtom`, etc.) |
| Helpers: `formatDuration`, `buildUsageTooltip`, `DurationBadge`, `parseAttachedFiles`, `MessageMetaBar`, `CompactionFoldCard`, `RetryingNotice`, `AgentRunningIndicator` | Real `ScrollPositionManager` (scroll-memory hook) |
| ≥10 Vitest + RTL tests | Real Tauri attachment bridge (`readAttachment`, `saveImageAs`) |
| `App.tsx` untouched | `App.tsx` wiring (Plan 2b.2.c) |

---

## File Structure

```
desktop/src/features/chat-agent/
  atoms/
    agent-atoms.ts                          # MODIFY (Task 13): widen error case + add error?:string to AgentStreamState
  lib/
    peripheral-stubs.ts                     # NEW (Task 2): atoms + Tauri shims
    format-message-time.ts                  # NEW (Task 9): small helper
    agent-messages-utils.ts                 # NEW (Task 10): pure helpers ported from AgentMessages.tsx
  components/
    agent-messages.tsx                      # NEW (Tasks 11-15): the slim port
    agent-messages.test.tsx                 # NEW (Task 16): 10+ integration tests
    stubs/                                  # NEW directory — Plan 2b.2.c upgrades each
      scroll-position-manager.ts            # NEW (Task 3)
      sdk-message-renderer.tsx              # NEW (Task 4): CompactingIndicator + CompactBoundaryDivider
      content-block.tsx                     # NEW (Task 5): ThinkingBlock + NativeBlockRenderer
      tool-activity-list.tsx                # NEW (Task 6): ToolActivityList + ChatToolActivityIndicator
      skill-chips.tsx                       # NEW (Task 7): SkillCitationChips + SkillRecallChips
      learning-chips.tsx                    # NEW (Task 8): ProactiveLearningChip + MemoryRecallChip
```

**Anti-god-file invariants preserved:**
- Stubs live under `features/chat-agent/components/stubs/` — never `desktop/src/lib/` and never global barrel.
- `peripheral-stubs.ts` is feature-scoped; never re-introduces `desktop/src/lib/tauri-bridge.ts`.
- One file per stubbed concern (tool activity, content blocks, skill chips, learning chips, compaction) so Plan 2b.2.c can swap them one-by-one.

---

## Port Methodology (verbatim-with-retargets, same as 2b.2.b.1)

For ported files (helpers + render components):
1. Read uclaw source verbatim.
2. Apply retargets:
   - `@/lib/utils` → `@/shared/lib/cn`
   - `@/lib/agent-types` → `@/features/chat-agent/lib/agent-types`
   - `@/lib/chat-types` → `@/features/chat-agent/lib/chat-types`
   - `@/lib/model-logo` → `@/features/chat-agent/lib/model-logo`
   - `@/lib/normalize-agent-markdown` → `@/shared/lib/normalize-agent-markdown`
   - `@/lib/skill-citation` → `@/shared/lib/skill-citation`
   - `@/lib/proma-ui` → `@/shared/lib/use-smooth-stream` (uclaw's `proma-ui` is itself a placeholder re-exporting `useSmoothStream`)
   - `@/atoms/agent-atoms` (named atoms) → `@/features/chat-agent/atoms/agent-atoms` (only if our atoms file exports them; otherwise → `@/features/chat-agent/lib/peripheral-stubs` for stubbed ones)
   - `@/atoms/user-profile` → `@/features/chat-agent/atoms/user-profile`
   - `@/atoms/{tab-atoms,chat-atoms,agent-display-name,ui-preferences}` → `@/features/chat-agent/lib/peripheral-stubs`
   - `@/components/ui/<x>` → `@/shared/ui/<x>`
   - `@/components/ai-elements/<x>` → `@/features/chat-agent/components/ai-elements/<x>`
   - `@/components/chat/{UserAvatar,CopyButton}` → `@/features/chat-agent/components/{user-avatar,copy-button}`
   - `@/components/chat/{ProactiveLearningChip,MemoryRecallChip,ChatToolActivityIndicator}` → `@/features/chat-agent/components/stubs/<file>`
   - `@/components/welcome/WelcomeEmptyState` → `@/features/chat-agent/components/welcome-empty-state`
   - `./ToolActivityItem` (ToolActivityList) → `@/features/chat-agent/components/stubs/tool-activity-list`
   - `./ContentBlock` (ThinkingBlock) → `@/features/chat-agent/components/stubs/content-block`
   - `./NativeBlockRenderer` → `@/features/chat-agent/components/stubs/content-block`
   - `./SkillCitationChips`, `./SkillRecallChips` → `@/features/chat-agent/components/stubs/skill-chips`
   - `./SDKMessageRenderer` → `@/features/chat-agent/components/stubs/sdk-message-renderer`
   - `@/lib/tauri-bridge` (readAttachment, saveImageAs) → `@/features/chat-agent/lib/peripheral-stubs`
   - `@/hooks/useScrollPositionMemory` → `@/features/chat-agent/components/stubs/scroll-position-manager`
   - `@/components/chat/ChatMessageItem` (formatMessageTime) → `@/features/chat-agent/lib/format-message-time`
3. Resolve TS strict-mode warnings (`_`-prefix unused args; comment renames).
4. If a ported file references a symbol NOT in our scope, STOP and surface — do not silently widen scope.

---

## Task 1: Recon — confirm cuts + helper list + write recon doc

**Files:**
- Create: `docs/superpowers/plans/2026-05-28-desktop-agent-messages-recon.md`

- [ ] **Step 1: Confirm AgentMessages.tsx structure**

```bash
UCLAW=/Users/ryanliu/Documents/uclaw/ui/src
grep -nE "^function |^export function |^const [A-Z][a-zA-Z]* = " $UCLAW/components/agent/AgentMessages.tsx
```

Record the line numbers of each helper / sub-component so the porter knows where to read from.

- [ ] **Step 2: Confirm all atom imports (so we know what peripheral-stubs.ts needs to export)**

```bash
grep -E "useAtomValue\(|useSetAtom\(" $UCLAW/components/agent/AgentMessages.tsx | awk -F'[()]' '{print $2}' | sort -u
```

Capture the list of atom names referenced.

- [ ] **Step 3: Look up the actual signature of each stub-target component in uclaw**

```bash
for f in ToolActivityList ChatToolActivityIndicator ThinkingBlock NativeBlockRenderer SkillCitationChips SkillRecallChips ProactiveLearningChip MemoryRecallChip CompactingIndicator CompactBoundaryDivider; do
  echo "### $f"
  grep -rn "^export function $f\|^export const $f =\|export.*$f.*=" $UCLAW/components/ 2>/dev/null | head -3
done
```

Record each component's prop signature (or note "not exported" — meaning we need to infer from usage).

- [ ] **Step 4: Look up formatMessageTime + ScrollPositionManager**

```bash
grep -n "export function formatMessageTime\|export.*formatMessageTime\b" $UCLAW/components/chat/ChatMessageItem.tsx
grep -n "export class ScrollPositionManager\|export.*ScrollPositionManager" $UCLAW/hooks/useScrollPositionMemory.ts $UCLAW/hooks/useScrollPositionMemory.tsx 2>/dev/null
```

- [ ] **Step 5: Confirm AgentStreamState's current shape**

```bash
grep -n "export.*AgentStreamState\|interface AgentStreamState\|type AgentStreamState" /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages/desktop/src/features/chat-agent/atoms/agent-atoms.ts | head -5
```

Confirm the fields, especially that adding `error?: string` is a clean extension (no existing field with that name).

- [ ] **Step 6: Write recon doc with all the data above + a per-stub signature table**

Save to `docs/superpowers/plans/2026-05-28-desktop-agent-messages-recon.md` with sections:
- AgentMessages structure (helper → line range)
- Atom dependencies (each atom name + whether it's already ported or needs stub)
- Stub-target signatures (one row per stub component)
- Note any out-of-scope imports discovered (anything we haven't anticipated)

- [ ] **Step 7: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages
git add docs/superpowers/plans/2026-05-28-desktop-agent-messages-recon.md
git commit -m "docs(plan): recon AgentMessages structure + stub signatures for 2b.2.b.2"
```

---

## Task 2: peripheral-stubs.ts (atoms + Tauri shims)

**Files:**
- Create: `desktop/src/features/chat-agent/lib/peripheral-stubs.ts`
- Create: `desktop/src/features/chat-agent/lib/peripheral-stubs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// desktop/src/features/chat-agent/lib/peripheral-stubs.test.ts
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  channelsAtom,
  tabMinimapCacheAtom,
  proactiveLearningEventsAtom,
  memoryRecallEventAtom,
  skillRecallsMapAtom,
  agentDisplayNameForAtom,
  stickyUserMessageEnabledAtom,
  readAttachment,
  saveImageAs,
} from './peripheral-stubs'

describe('peripheral-stubs (Plan 2b.2.c will replace these)', () => {
  it('exports static-default atoms with safe initial values', () => {
    const store = createStore()
    expect(store.get(channelsAtom)).toEqual([])
    expect(store.get(tabMinimapCacheAtom)).toEqual({})
    expect(store.get(proactiveLearningEventsAtom)).toEqual([])
    expect(store.get(memoryRecallEventAtom)).toEqual({})
    expect(store.get(skillRecallsMapAtom)).toEqual({})
    expect(typeof store.get(agentDisplayNameForAtom)).toBe('function')
    expect(store.get(stickyUserMessageEnabledAtom)).toBe(true)
  })

  it('exports no-op Tauri attachment shims that resolve/reject explicitly', async () => {
    await expect(readAttachment('/x')).resolves.toBeNull()
    await expect(saveImageAs({ localPath: '/x', filename: 'x.png', mediaType: 'image/png' })).resolves.toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test peripheral-stubs 2>&1 | tail -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `desktop/src/features/chat-agent/lib/peripheral-stubs.ts`**

```ts
/**
 * Plan 2b.2.b.2 — feature-local stubs for the ~7 atoms and 2 Tauri bridge
 * helpers that AgentMessages.tsx imports from uclaw's chat-side modules.
 *
 * Each export here is a minimum-viable replacement so the slim AgentMessages
 * port compiles and renders. Plan 2b.2.c upgrades each to the real backend
 * implementation. The exported names + shapes match uclaw's signatures
 * exactly — no consumer changes needed when 2b.2.c swaps these out.
 */
import { atom } from 'jotai'
import type { Channel } from './chat-types'

// ---- Side-feature atoms ----------------------------------------------------

/** uclaw: channels for chat-mode model selection. Empty in agent-mode MVP. */
export const channelsAtom = atom<Channel[]>([])

/** uclaw: per-tab minimap scroll position cache. */
export const tabMinimapCacheAtom = atom<Record<string, { scrollTop: number }>>({})

/** uclaw: events emitted when the agent proactively recalls a learning. */
export const proactiveLearningEventsAtom = atom<unknown[]>([])

/** uclaw: per-message memory recall events keyed by message id. */
export const memoryRecallEventAtom = atom<Record<string, unknown>>({})

/** uclaw: per-message skill recall events keyed by message id. */
export const skillRecallsMapAtom = atom<Record<string, unknown>>({})

/** uclaw: returns a function that resolves agent id → display name. */
export const agentDisplayNameForAtom = atom<(agentId: string | undefined) => string | undefined>(
  () => () => undefined,
)

/** uclaw: user preference for the sticky-user-message indicator. */
export const stickyUserMessageEnabledAtom = atom<boolean>(true)

// ---- Tauri bridge shims ----------------------------------------------------
// Plan 3.5 ships the real file-preview window; until then these are no-ops
// so AgentMessages can compile without referencing a global tauri-bridge file.

export async function readAttachment(_localPath: string): Promise<string | null> {
  return null
}

export interface SaveImageArgs {
  localPath: string
  filename: string
  mediaType: string
}

export async function saveImageAs(_args: SaveImageArgs): Promise<boolean> {
  return false
}
```

If the `Channel` import target doesn't have the right export, adapt to whatever `chat-types.ts` actually exports.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test peripheral-stubs 2>&1 | tail -5
```

Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/lib/peripheral-stubs.ts desktop/src/features/chat-agent/lib/peripheral-stubs.test.ts
git commit -m "feat(desktop): peripheral-stubs for AgentMessages atoms + Tauri shims"
```

---

## Task 3: Stub — ScrollPositionManager

**Files:**
- Create: `desktop/src/features/chat-agent/components/stubs/scroll-position-manager.ts`

- [ ] **Step 1: Inspect uclaw's class surface**

```bash
grep -nE "class ScrollPositionManager|^  [a-z]" /Users/ryanliu/Documents/uclaw/ui/src/hooks/useScrollPositionMemory.ts | head -20
```

Record the public methods AgentMessages calls. Most likely: `constructor()`, `save(key)`, `restore(key)`, `dispose()`.

- [ ] **Step 2: Write the stub**

```ts
// desktop/src/features/chat-agent/components/stubs/scroll-position-manager.ts
/**
 * Plan 2b.2.b.2 stub for uclaw's ScrollPositionManager (real impl in
 * `hooks/useScrollPositionMemory.ts`). Plan 2b.2.c ports the full
 * scroll-memory hook.
 *
 * Adapt the method list to whatever uclaw exposes. The signatures here
 * are best-effort minimums; if AgentMessages calls a method not listed
 * here at port time, add it as a no-op.
 */
export class ScrollPositionManager {
  // Common surface — fill in from uclaw's class definition once recon (Task 1)
  // captured it. These no-ops keep AgentMessages compiling.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  save(_key: string, _value: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restore(_key: string): number | undefined { return undefined }
  dispose(): void {}
}
```

Update the method list based on Task 1 recon. If uclaw exports a hook (`useScrollPositionMemory`) rather than a class, mirror that too.

- [ ] **Step 3: Smoke test by importing in a one-liner test**

```ts
// desktop/src/features/chat-agent/components/stubs/scroll-position-manager.test.ts
import { describe, it, expect } from 'vitest'
import { ScrollPositionManager } from './scroll-position-manager'

describe('ScrollPositionManager (stub)', () => {
  it('instantiates and exposes no-op methods', () => {
    const m = new ScrollPositionManager()
    m.save('k', 100)
    expect(m.restore('k')).toBeUndefined()
    m.dispose()
  })
})
```

- [ ] **Step 4: Run + commit**

```bash
pnpm --dir desktop test scroll-position-manager 2>&1 | tail -5
git add desktop/src/features/chat-agent/components/stubs/scroll-position-manager.ts desktop/src/features/chat-agent/components/stubs/scroll-position-manager.test.ts
git commit -m "feat(desktop): stub ScrollPositionManager (Plan 2b.2.c upgrades)"
```

---

## Task 4: Stub — sdk-message-renderer (CompactingIndicator + CompactBoundaryDivider)

**Files:**
- Create: `desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.tsx`

- [ ] **Step 1: Write the stub**

```tsx
// desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.tsx
import * as React from 'react'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c ports the real compaction UI from
 * uclaw's components/agent/SDKMessageRenderer.tsx.
 */

export function CompactingIndicator(): React.ReactElement {
  return (
    <div data-stub="compacting-indicator" className="text-xs text-muted-foreground/60">
      ⌬ compacting…
    </div>
  )
}

export function CompactBoundaryDivider(): React.ReactElement {
  return (
    <div
      data-stub="compact-boundary-divider"
      role="separator"
      className="my-3 border-t border-dashed border-muted/30"
    />
  )
}
```

- [ ] **Step 2: Smoke test**

```tsx
// desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CompactingIndicator, CompactBoundaryDivider } from './sdk-message-renderer'

describe('sdk-message-renderer stubs', () => {
  it('CompactingIndicator renders with stub marker', () => {
    render(<CompactingIndicator />)
    expect(screen.getByText(/compacting/)).toHaveAttribute('data-stub', 'compacting-indicator')
  })

  it('CompactBoundaryDivider renders with separator role', () => {
    const { getByRole } = render(<CompactBoundaryDivider />)
    expect(getByRole('separator')).toHaveAttribute('data-stub', 'compact-boundary-divider')
  })
})
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test sdk-message-renderer 2>&1 | tail -5
git add desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.tsx desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.test.tsx
git commit -m "feat(desktop): stub CompactingIndicator + CompactBoundaryDivider"
```

---

## Task 5: Stub — content-block (ThinkingBlock + NativeBlockRenderer)

**Files:**
- Create: `desktop/src/features/chat-agent/components/stubs/content-block.tsx`

- [ ] **Step 1: Write the stub**

```tsx
// desktop/src/features/chat-agent/components/stubs/content-block.tsx
import * as React from 'react'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c upgrades to uclaw's real implementations.
 */

interface ThinkingBlockProps {
  thinking?: string
  signature?: string
}
export function ThinkingBlock({ thinking }: ThinkingBlockProps): React.ReactElement {
  // Real ThinkingBlock renders a collapsible reasoning trace with smooth
  // streaming + skill-citation highlights. Stub renders plain text.
  return (
    <pre
      data-stub="thinking-block"
      className="whitespace-pre-wrap text-xs text-muted-foreground/70 italic"
    >
      {thinking ?? ''}
    </pre>
  )
}

// Uclaw's NativeBlockRenderer dispatches over Anthropic content block types
// (`text` / `image` / `tool_use` / `tool_result` / etc.). Stub renders just
// the text variant; Plan 2b.2.c brings in tool/image handling.
interface NativeBlock {
  type: string
  text?: string
}
interface NativeBlockRendererProps {
  block: NativeBlock
}
export function NativeBlockRenderer({ block }: NativeBlockRendererProps): React.ReactElement | null {
  if (block.type === 'text' && block.text) {
    return <span data-stub="native-block-text">{block.text}</span>
  }
  return (
    <span data-stub="native-block-other" className="text-muted-foreground/40">
      [{block.type}]
    </span>
  )
}
```

- [ ] **Step 2: Smoke test**

```tsx
// desktop/src/features/chat-agent/components/stubs/content-block.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ThinkingBlock, NativeBlockRenderer } from './content-block'

describe('content-block stubs', () => {
  it('ThinkingBlock renders the thinking text', () => {
    render(<ThinkingBlock thinking="reasoning" />)
    expect(screen.getByText('reasoning')).toHaveAttribute('data-stub', 'thinking-block')
  })

  it('NativeBlockRenderer renders text blocks', () => {
    render(<NativeBlockRenderer block={{ type: 'text', text: 'hi' }} />)
    expect(screen.getByText('hi')).toHaveAttribute('data-stub', 'native-block-text')
  })

  it('NativeBlockRenderer shows non-text placeholder', () => {
    render(<NativeBlockRenderer block={{ type: 'tool_use' }} />)
    expect(screen.getByText('[tool_use]')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test content-block 2>&1 | tail -5
git add desktop/src/features/chat-agent/components/stubs/content-block.tsx desktop/src/features/chat-agent/components/stubs/content-block.test.tsx
git commit -m "feat(desktop): stub ThinkingBlock + NativeBlockRenderer"
```

---

## Task 6: Stub — tool-activity-list (ToolActivityList + ChatToolActivityIndicator)

**Files:**
- Create: `desktop/src/features/chat-agent/components/stubs/tool-activity-list.tsx`

- [ ] **Step 1: Write the stub**

```tsx
// desktop/src/features/chat-agent/components/stubs/tool-activity-list.tsx
import * as React from 'react'
import type { ToolActivity } from '../../lib/agent-types'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c brings in real tool-renderers/*.
 */

interface ToolActivityListProps {
  activities: ToolActivity[]
}
export function ToolActivityList({ activities }: ToolActivityListProps): React.ReactElement | null {
  if (activities.length === 0) return null
  return (
    <ul data-stub="tool-activity-list" className="space-y-1 text-xs text-muted-foreground/70">
      {activities.map((a) => (
        <li key={a.toolUseId} className="flex items-center gap-1">
          <span className="font-mono">{a.toolName}</span>
          <span className="opacity-60">{a.done ? '(done)' : '(running…)'}</span>
        </li>
      ))}
    </ul>
  )
}

interface ChatToolActivityIndicatorProps {
  activities: ToolActivity[]
}
export function ChatToolActivityIndicator({ activities }: ChatToolActivityIndicatorProps): React.ReactElement | null {
  const running = activities.filter((a) => !a.done)
  if (running.length === 0) return null
  return (
    <span data-stub="chat-tool-activity-indicator" className="text-xs text-muted-foreground/60">
      {running.length} tool{running.length > 1 ? 's' : ''} running
    </span>
  )
}
```

If the `ToolActivity` type doesn't have `toolUseId` or `toolName` or `done` (the field names may differ — confirm via `grep "interface ToolActivity\|type ToolActivity" desktop/src/features/chat-agent/lib/agent-types.ts`), adapt.

- [ ] **Step 2: Smoke test**

```tsx
// desktop/src/features/chat-agent/components/stubs/tool-activity-list.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToolActivityList, ChatToolActivityIndicator } from './tool-activity-list'
import { pendingToolUse, completedToolUse } from '../../__fixtures__/tool-activity-fixture'

describe('tool-activity-list stubs', () => {
  it('ToolActivityList renders nothing for empty', () => {
    const { container } = render(<ToolActivityList activities={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('ToolActivityList renders tool name + done state', () => {
    render(<ToolActivityList activities={[completedToolUse, pendingToolUse]} />)
    expect(screen.getByText(/done/)).toBeInTheDocument()
    expect(screen.getByText(/running…/)).toBeInTheDocument()
  })

  it('ChatToolActivityIndicator renders only when running activity present', () => {
    const { container } = render(<ChatToolActivityIndicator activities={[completedToolUse]} />)
    expect(container.firstChild).toBeNull()

    render(<ChatToolActivityIndicator activities={[pendingToolUse]} />)
    expect(screen.getByText(/1 tool running/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test tool-activity-list 2>&1 | tail -5
git add desktop/src/features/chat-agent/components/stubs/tool-activity-list.tsx desktop/src/features/chat-agent/components/stubs/tool-activity-list.test.tsx
git commit -m "feat(desktop): stub ToolActivityList + ChatToolActivityIndicator"
```

---

## Task 7: Stub — skill-chips (SkillCitationChips + SkillRecallChips)

**Files:**
- Create: `desktop/src/features/chat-agent/components/stubs/skill-chips.tsx`

- [ ] **Step 1: Write the stub**

```tsx
// desktop/src/features/chat-agent/components/stubs/skill-chips.tsx
import * as React from 'react'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c upgrades to the real chip components
 * (uclaw's SkillCitationChips + SkillRecallChips).
 */

interface SkillCitationChipsProps {
  citations: unknown[]
}
export function SkillCitationChips({ citations }: SkillCitationChipsProps): React.ReactElement | null {
  if (citations.length === 0) return null
  return (
    <div data-stub="skill-citation-chips" className="text-xs text-muted-foreground/60">
      {citations.length} citation{citations.length > 1 ? 's' : ''}
    </div>
  )
}

interface SkillRecallChipsProps {
  recalls: unknown[]
}
export function SkillRecallChips({ recalls }: SkillRecallChipsProps): React.ReactElement | null {
  if (recalls.length === 0) return null
  return (
    <div data-stub="skill-recall-chips" className="text-xs text-muted-foreground/60">
      {recalls.length} skill recall{recalls.length > 1 ? 's' : ''}
    </div>
  )
}
```

- [ ] **Step 2: Smoke test**

```tsx
// desktop/src/features/chat-agent/components/stubs/skill-chips.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SkillCitationChips, SkillRecallChips } from './skill-chips'

describe('skill-chips stubs', () => {
  it('SkillCitationChips renders nothing for empty list', () => {
    const { container } = render(<SkillCitationChips citations={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('SkillCitationChips shows count', () => {
    render(<SkillCitationChips citations={[{}, {}]} />)
    expect(screen.getByText(/2 citations/)).toBeInTheDocument()
  })

  it('SkillRecallChips shows count', () => {
    render(<SkillRecallChips recalls={[{}]} />)
    expect(screen.getByText(/1 skill recall/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test skill-chips 2>&1 | tail -5
git add desktop/src/features/chat-agent/components/stubs/skill-chips.tsx desktop/src/features/chat-agent/components/stubs/skill-chips.test.tsx
git commit -m "feat(desktop): stub SkillCitationChips + SkillRecallChips"
```

---

## Task 8: Stub — learning-chips (ProactiveLearningChip + MemoryRecallChip)

**Files:**
- Create: `desktop/src/features/chat-agent/components/stubs/learning-chips.tsx`

- [ ] **Step 1: Write the stub**

```tsx
// desktop/src/features/chat-agent/components/stubs/learning-chips.tsx
import * as React from 'react'

/**
 * Plan 2b.2.b.2 stubs. Plan 2b.2.c upgrades to the real chip components.
 */

interface ProactiveLearningChipProps {
  event: unknown
}
export function ProactiveLearningChip(_props: ProactiveLearningChipProps): React.ReactElement {
  return (
    <span data-stub="proactive-learning-chip" className="text-xs text-muted-foreground/60">
      💡 learning
    </span>
  )
}

interface MemoryRecallChipProps {
  event: unknown
}
export function MemoryRecallChip(_props: MemoryRecallChipProps): React.ReactElement {
  return (
    <span data-stub="memory-recall-chip" className="text-xs text-muted-foreground/60">
      🧠 recall
    </span>
  )
}
```

- [ ] **Step 2: Smoke test**

```tsx
// desktop/src/features/chat-agent/components/stubs/learning-chips.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProactiveLearningChip, MemoryRecallChip } from './learning-chips'

describe('learning-chips stubs', () => {
  it('ProactiveLearningChip renders', () => {
    render(<ProactiveLearningChip event={{}} />)
    expect(screen.getByText(/learning/)).toHaveAttribute('data-stub', 'proactive-learning-chip')
  })

  it('MemoryRecallChip renders', () => {
    render(<MemoryRecallChip event={{}} />)
    expect(screen.getByText(/recall/)).toHaveAttribute('data-stub', 'memory-recall-chip')
  })
})
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test learning-chips 2>&1 | tail -5
git add desktop/src/features/chat-agent/components/stubs/learning-chips.tsx desktop/src/features/chat-agent/components/stubs/learning-chips.test.tsx
git commit -m "feat(desktop): stub ProactiveLearningChip + MemoryRecallChip"
```

---

## Task 9: Helper — format-message-time

**Files:**
- Create: `desktop/src/features/chat-agent/lib/format-message-time.ts`
- Create: `desktop/src/features/chat-agent/lib/format-message-time.test.ts`

- [ ] **Step 1: Inspect uclaw's source**

```bash
grep -nA 20 "export function formatMessageTime" /Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatMessageItem.tsx
```

Read the body. Likely <30 LOC.

- [ ] **Step 2: Write failing test**

```ts
// desktop/src/features/chat-agent/lib/format-message-time.test.ts
import { describe, it, expect } from 'vitest'
import { formatMessageTime } from './format-message-time'

describe('formatMessageTime', () => {
  it('returns a string for a valid timestamp', () => {
    expect(typeof formatMessageTime(Date.now())).toBe('string')
  })

  it('handles null / undefined gracefully', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(formatMessageTime(undefined)).toBe('')
    expect(formatMessageTime(0)).toBeTruthy()
  })
})
```

Adapt the test to whatever uclaw's signature actually does. If it always returns a string (even for 0/null), the test still asserts type.

- [ ] **Step 3: Port verbatim**

Copy the function body from uclaw → `desktop/src/features/chat-agent/lib/format-message-time.ts`. No retargets unless the function imports something.

- [ ] **Step 4: Run + commit**

```bash
pnpm --dir desktop test format-message-time 2>&1 | tail -5
git add desktop/src/features/chat-agent/lib/format-message-time.ts desktop/src/features/chat-agent/lib/format-message-time.test.ts
git commit -m "feat(desktop): port formatMessageTime helper"
```

---

## Task 10: Pure utility helpers (port from AgentMessages.tsx)

**Files:**
- Create: `desktop/src/features/chat-agent/lib/agent-messages-utils.ts`
- Create: `desktop/src/features/chat-agent/lib/agent-messages-utils.test.ts`

These functions live inline in uclaw's `AgentMessages.tsx`. We extract them to a sibling module so they're independently testable AND so `agent-messages.tsx` stays focused on rendering.

Extracted symbols:
- `formatDuration(ms: number): string`
- `buildUsageTooltip(durationMs: number, usage?: AgentEventUsage): string`
- `formatRelativeShort(ts: number): string`
- `parseAttachedFiles(content: string): { files: AttachedFileRef[]; text: string }`
- `isImageFile(filename: string): boolean`
- `agentActivitiesToChatActivities(activities: ToolActivity[]): ChatToolActivity[]` — keep as `agentActivitiesToChatActivities` since uclaw exports it that way
- `extractToolActivities(events: AgentMessage['events']): ToolActivity[]`
- `AttachedFileRef` type

- [ ] **Step 1: Read each function body from uclaw**

```bash
UCLAW=/Users/ryanliu/Documents/uclaw/ui/src
sed -n '600,640p' $UCLAW/components/agent/AgentMessages.tsx   # formatDuration + buildUsageTooltip
sed -n '170,210p' $UCLAW/components/agent/AgentMessages.tsx   # agentActivitiesToChatActivities
sed -n '204,272p' $UCLAW/components/agent/AgentMessages.tsx   # extractToolActivities
sed -n '272,300p' $UCLAW/components/agent/AgentMessages.tsx   # parseAttachedFiles + isImageFile
sed -n '679,700p' $UCLAW/components/agent/AgentMessages.tsx   # formatRelativeShort
```

- [ ] **Step 2: Write failing tests**

```ts
// desktop/src/features/chat-agent/lib/agent-messages-utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  formatDuration,
  buildUsageTooltip,
  formatRelativeShort,
  parseAttachedFiles,
  isImageFile,
  agentActivitiesToChatActivities,
  extractToolActivities,
} from './agent-messages-utils'

describe('agent-messages-utils', () => {
  describe('formatDuration', () => {
    it('formats sub-second as ms', () => {
      expect(formatDuration(500)).toMatch(/ms|0\.5s|500/)
    })
    it('formats multi-second as s', () => {
      expect(formatDuration(1500)).toMatch(/s|1\.5/)
    })
  })

  describe('buildUsageTooltip', () => {
    it('returns a string mentioning duration', () => {
      expect(buildUsageTooltip(1234)).toMatch(/1|s|ms/)
    })
  })

  describe('formatRelativeShort', () => {
    it('returns a non-empty string for a recent timestamp', () => {
      expect(formatRelativeShort(Date.now() - 5_000)).toBeTruthy()
    })
  })

  describe('isImageFile', () => {
    it('detects common image extensions', () => {
      expect(isImageFile('x.png')).toBe(true)
      expect(isImageFile('x.jpg')).toBe(true)
      expect(isImageFile('x.txt')).toBe(false)
    })
  })

  describe('parseAttachedFiles', () => {
    it('returns empty files + content unchanged when no <attached_files>', () => {
      expect(parseAttachedFiles('hello').files).toEqual([])
      expect(parseAttachedFiles('hello').text.trim()).toBe('hello')
    })

    it('extracts file refs from the XML block', () => {
      const input = '<attached_files>\n<file path="/x.png" />\n</attached_files>\nbody'
      const out = parseAttachedFiles(input)
      expect(out.files.length).toBeGreaterThanOrEqual(1)
      expect(out.text.includes('body')).toBe(true)
    })
  })

  describe('extractToolActivities + agentActivitiesToChatActivities', () => {
    it('extractToolActivities returns array (even when no events)', () => {
      expect(extractToolActivities(undefined as any)).toEqual([])
    })

    it('agentActivitiesToChatActivities converts shape', () => {
      const out = agentActivitiesToChatActivities([])
      expect(Array.isArray(out)).toBe(true)
    })
  })
})
```

If any function's signature differs from what's asserted above, adapt the assertion — but keep ALL listed functions tested. Add fixture-driven assertions where useful.

- [ ] **Step 3: Run to verify failure**

```bash
pnpm --dir desktop test agent-messages-utils 2>&1 | tail -10
```

- [ ] **Step 4: Port the functions verbatim**

Copy each function from uclaw into `desktop/src/features/chat-agent/lib/agent-messages-utils.ts`. Apply retargets per methodology. The output file should be roughly:

```ts
import type { AgentMessage, AgentEventUsage, ToolActivity } from './agent-types'
import type { ChatToolActivity } from './chat-types'

export interface AttachedFileRef {
  path: string
  // ... whatever uclaw declares
}

export function formatDuration(ms: number): string { /* uclaw body verbatim */ }
export function buildUsageTooltip(durationMs: number, usage?: AgentEventUsage): string { /* verbatim */ }
export function formatRelativeShort(ts: number): string { /* verbatim */ }
export function isImageFile(filename: string): boolean { /* verbatim */ }
export function parseAttachedFiles(content: string): { files: AttachedFileRef[]; text: string } { /* verbatim */ }
export function agentActivitiesToChatActivities(activities: ToolActivity[]): ChatToolActivity[] { /* verbatim */ }
export function extractToolActivities(events: AgentMessage['events']): ToolActivity[] { /* verbatim */ }
```

If `AttachedFileRef`, `ChatToolActivity`, or `AgentEventUsage` aren't exported from our type files, look at uclaw's source to find where they live and either:
- Re-export from our type files if they exist there
- Inline the small type definitions if they're trivial
- Add to chat-types.ts / agent-types.ts if they're missing (one-line additions only — do not pull in unrelated types)

- [ ] **Step 5: Run tests**

```bash
pnpm --dir desktop test agent-messages-utils 2>&1 | tail -10
```

Expected: all 8 (or however many you wrote) PASS.

- [ ] **Step 6: Commit**

```bash
git add desktop/src/features/chat-agent/lib/agent-messages-utils.ts desktop/src/features/chat-agent/lib/agent-messages-utils.test.ts
git commit -m "feat(desktop): port AgentMessages pure utilities (formatDuration, parseAttachedFiles, etc.)"
```

---

## Task 11: Small render components (EmptyState, AssistantLogo, InlineImage, AttachedFileChip, ToolResultInlineImages, MessageMetaBar)

**Files:**
- Modify: extend `desktop/src/features/chat-agent/components/agent-messages.tsx` (create file if not exists)

These six small components live INSIDE `agent-messages.tsx` as private helpers — they're not exported. We create the file with these as the first inhabitants.

Source line ranges (from Task 1 recon): EmptyState 85-89, AssistantLogo 90-108, InlineImage 111-158, ToolResultInlineImages 160-175, AttachedFileChip 297-318, MessageMetaBar 640-678.

- [ ] **Step 1: Create the file skeleton**

```tsx
// desktop/src/features/chat-agent/components/agent-messages.tsx
import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Bot, FileText, FileImage, AlertTriangle } from 'lucide-react'
import { ImageLightbox } from '@/shared/ui/image-lightbox'
import { Spinner } from '@/shared/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/cn'
import { getModelLogo, resolveModelDisplayName } from '@/features/chat-agent/lib/model-logo'
import { userProfileAtom } from '@/features/chat-agent/atoms/user-profile'
import { useSmoothStream } from '@/shared/lib/use-smooth-stream'
import { WelcomeEmptyState } from '@/features/chat-agent/components/welcome-empty-state'
import { ScrollMinimap, type MinimapItem } from '@/features/chat-agent/components/ai-elements/scroll-minimap'
import { StickyUserMessage } from '@/features/chat-agent/components/ai-elements/sticky-user-message'
import { UserAvatar } from '@/features/chat-agent/components/user-avatar'
import { CopyButton } from '@/features/chat-agent/components/copy-button'
import {
  channelsAtom,
  tabMinimapCacheAtom,
  proactiveLearningEventsAtom,
  memoryRecallEventAtom,
  skillRecallsMapAtom,
  agentDisplayNameForAtom,
  stickyUserMessageEnabledAtom,
  saveImageAs,
} from '@/features/chat-agent/lib/peripheral-stubs'
import {
  formatDuration,
  buildUsageTooltip,
  formatRelativeShort,
  parseAttachedFiles,
  isImageFile,
  extractToolActivities,
  type AttachedFileRef,
} from '@/features/chat-agent/lib/agent-messages-utils'
import { formatMessageTime } from '@/features/chat-agent/lib/format-message-time'
import { ToolActivityList, ChatToolActivityIndicator } from '@/features/chat-agent/components/stubs/tool-activity-list'
import { ThinkingBlock, NativeBlockRenderer } from '@/features/chat-agent/components/stubs/content-block'
import { SkillCitationChips, SkillRecallChips } from '@/features/chat-agent/components/stubs/skill-chips'
import { ProactiveLearningChip, MemoryRecallChip } from '@/features/chat-agent/components/stubs/learning-chips'
import { CompactingIndicator, CompactBoundaryDivider } from '@/features/chat-agent/components/stubs/sdk-message-renderer'
import { ScrollPositionManager } from '@/features/chat-agent/components/stubs/scroll-position-manager'
import type { AgentMessage, AgentEventUsage, ToolActivity, AgentStreamState } from '@/features/chat-agent/lib/agent-types'

// ---- Small private helpers ------------------------------------------------

/** Welcome state delegate. */
function EmptyState(): React.ReactElement {
  return <WelcomeEmptyState />
}

/** Assistant logo with fallback to Bot icon for unknown providers. */
function AssistantLogo({ model }: { model?: string }): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:90-108>
}

/** Inline image attachment renderer. */
function InlineImage({ attachment }: { attachment: { localPath: string; filename: string; mediaType: string } }): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:111-158>
}

/** Collected images from tool results. */
function ToolResultInlineImages({ activities }: { activities: ToolActivity[] }): React.ReactElement | null {
  // <copy verbatim from uclaw AgentMessages.tsx:160-175>
}

/** File path chip for parsed <attached_files>. */
function AttachedFileChip({ file }: { file: AttachedFileRef }): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:297-318>
}

/** Duration + token usage display, hidden when both missing. */
function MessageMetaBar({ durationMs, usage }: { durationMs?: number; usage?: AgentEventUsage }): React.ReactElement | null {
  // <copy verbatim from uclaw AgentMessages.tsx:640-678>
}
```

The `<copy verbatim>` markers tell the implementer subagent: open uclaw's file at that line range and paste the body. Apply only the import retargets (already done at the top of our file).

- [ ] **Step 2: Smoke test that the file compiles**

```bash
pnpm --dir desktop test 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: tests still pass; tsc accepts the file (even though nothing imports it yet — confirms imports resolve).

If the build fails because of UNDECLARED imports from peripheral-stubs / stubs, fix the stub exports to match what AgentMessages expects.

- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent-messages.tsx
git commit -m "feat(desktop): scaffold agent-messages.tsx with 6 small render helpers"
```

---

## Task 12: Medium render components (CompactionFoldCard, RetryingNotice, RetryAttemptItem, AgentRunningIndicator, DurationBadge)

**Files:**
- Modify: `desktop/src/features/chat-agent/components/agent-messages.tsx`

Source line ranges (Task 1 recon): CompactionFoldCard 321-408, RetryingNotice 410-505, RetryAttemptItem 507-598, DurationBadge 624-638, AgentRunningIndicator 841-893.

- [ ] **Step 1: Append the 5 components after MessageMetaBar in `agent-messages.tsx`**

```tsx
// Add after MessageMetaBar:

/** Compaction-fold card — context summarization UI. */
function CompactionFoldCard({ markdown, createdAt }: { markdown: string; createdAt: number }): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:321-408>
}

/** Retrying notice banner. */
function RetryingNotice({ retrying }: { retrying: NonNullable<AgentStreamState['retrying']> }): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:410-505>
}

interface RetryAttemptItemProps {
  // <whatever uclaw declares>
}
function RetryAttemptItem(props: RetryAttemptItemProps): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:507-598>
}

/** Public DurationBadge — exported (uclaw exports this). */
export function DurationBadge({ durationMs, usage }: { durationMs: number; usage?: AgentEventUsage }): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:624-638>
}

interface AgentRunningIndicatorProps {
  // <whatever uclaw declares — startedAt, toolCount, etc.>
}
function AgentRunningIndicator(props: AgentRunningIndicatorProps): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:841-893>
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm --dir desktop test 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent-messages.tsx
git commit -m "feat(desktop): port 5 medium AgentMessages render components"
```

---

## Task 13: Reducer error widening + AgentStreamState extension

**Files:**
- Modify: `desktop/src/features/chat-agent/atoms/agent-atoms.ts`
- Modify: `desktop/src/features/chat-agent/atoms/agent-atoms.test.ts`

**Closes Plan 2b.2.b.1 final-review follow-up #2.**

- [ ] **Step 1: Locate AgentStreamState interface in agent-atoms.ts**

```bash
grep -nE "interface AgentStreamState|type AgentStreamState\s*=" /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages/desktop/src/features/chat-agent/atoms/agent-atoms.ts
```

Determine if `error?: string` is a clean addition. If `error` already exists with a different type, surface as a conflict.

- [ ] **Step 2: Add `error?: string` to AgentStreamState**

Edit the interface (or type alias):

```ts
export interface AgentStreamState {
  running: boolean
  content: string
  reasoning: string
  toolActivities: ToolActivity[]
  teammates: TeammateState[]
  // ... existing fields
  /** Set by the reducer when an `error` event is received. AgentMessages
   *  surfaces this to the user as an error banner. (Closes Plan 2b.2.b.1
   *  follow-up #2.) */
  error?: string
}
```

- [ ] **Step 3: Update reducer's `case 'error'` (agent-atoms.ts:800)**

```ts
case 'error':
  return { ...prev, running: false, error: event.message }
```

- [ ] **Step 4: Add a test asserting the new field is set**

In `agent-atoms.test.ts`, add (or extend an existing test) — replace the existing `error` integration test if there is one:

```ts
it('error events surface event.message into stream state', () => {
  const adapter = createBridgeAdapter()
  let state: AgentStreamState = { running: true, content: '', reasoning: '', toolActivities: [], teammates: [] } as AgentStreamState

  const errorEvent = adapter.translate('agent:error', { session_id: 's1', message: 'rate-limited' })
  if (errorEvent) state = applyAgentEvent(state, errorEvent)

  expect(state.running).toBe(false)
  expect(state.error).toBe('rate-limited')
})
```

- [ ] **Step 5: Run tests**

```bash
pnpm --dir desktop test agent-atoms 2>&1 | tail -10
```

Expected: all PASS (existing 7 + 1 new).

- [ ] **Step 6: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/agent-atoms.ts desktop/src/features/chat-agent/atoms/agent-atoms.test.ts
git commit -m "feat(desktop): reducer captures event.message into AgentStreamState.error (closes 2b.2.b.1 #2)"
```

---

## Task 14: AgentMessageItem (single-message renderer)

**Files:**
- Modify: `desktop/src/features/chat-agent/components/agent-messages.tsx`

`AgentMessageItem` is the single largest sub-component (uclaw lines 698-840, ~140 LOC). It dispatches over message role + content type and renders one turn at a time.

- [ ] **Step 1: Read uclaw lines 698-840 to understand the structure**

```bash
sed -n '698,840p' /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentMessages.tsx
```

Note where it references stubbed components (ToolActivityList, ThinkingBlock, NativeBlockRenderer, ChatToolActivityIndicator, SkillCitationChips, SkillRecallChips, MemoryRecallChip, ProactiveLearningChip, CompactingIndicator, CompactBoundaryDivider). Each call site uses the stub's signature defined in Tasks 4-8.

- [ ] **Step 2: Append `AgentMessageItem` to `agent-messages.tsx` after AgentRunningIndicator**

```tsx
interface AgentMessageItemProps {
  message: AgentMessage
  sessionPath?: string | null
  attachedDirs?: string[]
  sessionId: string
  sessionModelId?: string
}

function AgentMessageItem({ message, sessionPath, attachedDirs, sessionId, sessionModelId }: AgentMessageItemProps): React.ReactElement | null {
  // <copy verbatim from uclaw AgentMessages.tsx:698-840>
}
```

Apply retargets within the body — the stub imports are already at the top of the file.

If the copied body references `agentActivitiesToChatActivities` (not in our import list at the top of the file), add to the existing import from `agent-messages-utils`.

- [ ] **Step 3: Verify build**

```bash
pnpm --dir desktop test 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -10
```

If the build complains about missing stub-prop-shape mismatches, ADJUST the stub signatures to match (Tasks 4-8) rather than altering AgentMessageItem.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent-messages.tsx
git commit -m "feat(desktop): port AgentMessageItem (~140 LOC single-message renderer)"
```

---

## Task 15: Main AgentMessages component (export + orchestrator)

**Files:**
- Modify: `desktop/src/features/chat-agent/components/agent-messages.tsx`

uclaw's main `AgentMessages` is lines 895-1267 — ~370 LOC orchestrator including minimap data prep, sticky-user-message logic, scroll position management, fade-in animation, transitioning cooldown.

- [ ] **Step 1: Read uclaw lines 895-1267**

```bash
sed -n '895,1267p' /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentMessages.tsx
```

- [ ] **Step 2: Define AgentMessagesProps + append main component to `agent-messages.tsx`**

```tsx
/** AgentMessages props (mirrors uclaw verbatim). */
export interface AgentMessagesProps {
  sessionId: string
  sessionModelId?: string
  messages: AgentMessage[]
  messagesLoaded?: boolean
  streaming: boolean
  streamState?: AgentStreamState
  liveMessages?: unknown[]
  sessionPath?: string | null
  attachedDirs?: string[]
  stoppedByUser?: boolean
  onRetry?: () => void
  onRetryInNewSession?: () => void
  onFork?: (upToMessageUuid: string) => void
  onRewind?: (assistantMessageUuid: string) => void
  onCompact?: () => void
}

export function AgentMessages(props: AgentMessagesProps): React.ReactElement {
  // <copy verbatim from uclaw AgentMessages.tsx:895-end>
}
```

Verbatim copy with all the retargets already at the top of the file.

**Error display addition:** Where uclaw renders the assistant bubble during streaming, add a small adjacent error banner that reads `streamState?.error` and renders it when non-empty. Example (adapt placement to where streaming UI lives):

```tsx
{streamState?.error && (
  <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded my-2">
    {streamState.error}
  </div>
)}
```

Mark this with a comment: `// Plan 2b.2.b.2 — surfaces event.message via streamState.error (closes 2b.2.b.1 follow-up #2)`.

- [ ] **Step 3: Verify build**

```bash
pnpm --dir desktop test 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent-messages.tsx
git commit -m "feat(desktop): port AgentMessages main component (orchestrator + error display)"
```

---

## Task 16: AgentMessages integration tests (≥10 tests)

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent-messages.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// desktop/src/features/chat-agent/components/agent-messages.test.tsx
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { AgentMessages } from './agent-messages'
import { userTurn, assistantTurn, twoTurnConversation } from '../__fixtures__/message-fixtures'
import {
  emptyStreaming,
  partialStreaming,
  completedStreaming,
} from '../__fixtures__/streaming-fixture'

// ResizeObserver stub for jsdom (ScrollMinimap uses it)
beforeAll(() => {
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

beforeEach(() => {
  // requestAnimationFrame stub for fade-in setReady() effect
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)
    return 0
  })
})

function renderAgentMessages(propsOverride: Partial<React.ComponentProps<typeof AgentMessages>> = {}): ReturnType<typeof render> {
  const props: React.ComponentProps<typeof AgentMessages> = {
    sessionId: 's-test',
    messages: [],
    messagesLoaded: true,
    streaming: false,
    ...propsOverride,
  }
  return render(
    <Provider>
      <AgentMessages {...props} />
    </Provider>,
  )
}

describe('AgentMessages', () => {
  it('renders welcome empty state when messages is empty and not streaming', () => {
    renderAgentMessages()
    // WelcomeEmptyState renders a heading per its tests
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('renders a single user turn', () => {
    renderAgentMessages({ messages: [userTurn] })
    expect(screen.getByText(/sky blue/i)).toBeInTheDocument()
  })

  it('renders a single assistant turn', () => {
    renderAgentMessages({ messages: [assistantTurn] })
    expect(screen.getByText(/Rayleigh/i)).toBeInTheDocument()
  })

  it('renders multi-turn conversation in order', () => {
    renderAgentMessages({ messages: twoTurnConversation })
    expect(screen.getByText(/sky blue/i)).toBeInTheDocument()
    expect(screen.getByText(/Rayleigh/i)).toBeInTheDocument()
  })

  it('renders streaming partial content from streamState', () => {
    renderAgentMessages({ messages: [], streaming: true, streamState: partialStreaming })
    expect(screen.getByText(/partial ans/i)).toBeInTheDocument()
  })

  it('renders error banner when streamState.error is set', () => {
    const errState = { ...completedStreaming, error: 'rate-limited' }
    renderAgentMessages({ messages: [], streaming: false, streamState: errState })
    expect(screen.getByRole('alert')).toHaveTextContent('rate-limited')
  })

  it('shows tool-activity indicator stub when streamState has running activities', () => {
    const stateWithRunningTools = {
      ...partialStreaming,
      toolActivities: [
        { toolUseId: 'tu-1', toolName: 'web_search', input: {}, done: false },
      ],
    }
    renderAgentMessages({ messages: [], streaming: true, streamState: stateWithRunningTools })
    // Stub renders "N tool[s] running"
    expect(screen.getByText(/tool.*running/i)).toBeInTheDocument()
  })

  it('renders sticky user message indicator when enabled and a user message exists', () => {
    renderAgentMessages({ messages: twoTurnConversation })
    // StickyUserMessage renders a clickable bar with the most recent user message
    // (visibility depends on scroll state; assert the component is mounted)
    expect(screen.queryAllByText(/sky blue/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders scroll-minimap items for visible messages', () => {
    const { container } = renderAgentMessages({ messages: twoTurnConversation })
    // ScrollMinimap renders into a portal; this asserts mount, not portal target
    expect(container.firstChild).not.toBeNull()
  })

  it('exports DurationBadge for external consumers', async () => {
    const mod = await import('./agent-messages')
    expect(typeof mod.DurationBadge).toBe('function')
  })

  it('exports formatDuration via agent-messages-utils', async () => {
    const utils = await import('../lib/agent-messages-utils')
    expect(typeof utils.formatDuration).toBe('function')
  })
})
```

11 tests written. ≥10 required.

- [ ] **Step 2: Run the tests**

```bash
pnpm --dir desktop test agent-messages 2>&1 | tail -20
```

Expected: 11 PASS. If some fail because the fixture shape doesn't match what AgentMessages reads (e.g., `userTurn.content` vs `userTurn.text`), adapt the fixtures NOT the component. If genuine bugs surface in the port, fix them in the appropriate file and re-run.

- [ ] **Step 3: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent-messages.test.tsx
git commit -m "test(desktop): AgentMessages integration tests (welcome/turns/streaming/error/tools)"
```

---

## Task 17: Smoke verification

**Files:** None (verification only).

- [ ] **Step 1: Backend tests still pass**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages
cargo test -p hermes-desktop --lib 2>&1 | tail -3
```

Expected: 21 PASS (unchanged).

- [ ] **Step 2: Frontend tests all green**

```bash
pnpm --dir desktop test 2>&1 | tail -10
```

Expected: ≥215 PASS (195 carried forward + 20+ new across Tasks 2-16). Record actual count.

- [ ] **Step 3: Build clean**

```bash
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -10
```

Expected: both clean (no warnings, no tsc errors, vite bundle generated).

- [ ] **Step 4: Workspace regression check**

```bash
cargo check --workspace 2>&1 | tail -3
```

Expected: PASS (no Rust changes).

- [ ] **Step 5: App.tsx untouched**

```bash
git diff 998098c -- desktop/src/app/App.tsx
```

Expected: empty.

- [ ] **Step 6: No god-file regression**

```bash
ls desktop/src/lib/
```

Expected: only `bridge/` (from Plan 2b.1).

- [ ] **Step 7: Feature directory shape**

```bash
echo "=== stubs/ ==="
ls desktop/src/features/chat-agent/components/stubs/
echo "=== components/ (new top-level adds) ==="
ls desktop/src/features/chat-agent/components/ | head -20
echo "=== lib/ ==="
ls desktop/src/features/chat-agent/lib/
```

Expected stubs: scroll-position-manager, sdk-message-renderer, content-block, tool-activity-list, skill-chips, learning-chips (+ tests).
Expected components: agent-messages + test added.
Expected lib: peripheral-stubs, format-message-time, agent-messages-utils (+ tests).

- [ ] **Step 8: Repo state**

```bash
git status --short
git log --oneline 998098c..HEAD | wc -l
git log --oneline 998098c..HEAD | head -25
```

Expected: clean tree; ~18 task commits above `998098c` (the 2b.2.b.1 tip).

---

## Done When

- All 17 source-affecting tasks (Tasks 1–16 + Task 17 smoke) complete.
- ≥10 new AgentMessages integration tests pass (Task 16) on top of the prior 195.
- Backend untouched: 21 Rust tests unchanged; `cargo check --workspace` green.
- `App.tsx` untouched; MVP composer still renders.
- No god-file regression in `desktop/src/lib/`.
- Production build clean (tsc + vite).
- Final code review verdict: APPROVED or APPROVED_WITH_FOLLOWUPS.

## Next Plan

**Plan 2b.2.c — Tool renderers + App.tsx integration.** Replaces every stub in `features/chat-agent/components/stubs/` with the real component (`ToolActivityList`, `ChatToolActivityIndicator`, `ThinkingBlock`, `NativeBlockRenderer`, `SkillCitationChips`, `SkillRecallChips`, `ProactiveLearningChip`, `MemoryRecallChip`, `CompactingIndicator`, `CompactBoundaryDivider`, `ScrollPositionManager`) plus brings in the real chat-side atoms (`channelsAtom`, `tabMinimapCacheAtom`, etc.) and the composer module (RichTextInput + MentionChipNode + serializer). Then wires `App.tsx` to render `AgentMessages` driven by the Plan 2b.1 `listenAgent` → `applyAgentEvent` pipeline. End-to-end vertical slice: type a message → uclaw's full message view renders the streamed reply with tool activities and thinking. ~900 LOC ported (mostly the unstubbed real components).
