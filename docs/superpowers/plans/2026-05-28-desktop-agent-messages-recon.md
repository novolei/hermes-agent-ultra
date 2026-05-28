# Plan 2b.2.b.2 Recon: Desktop AgentMessages Integration

**Date:** 2026-05-28  
**Task:** Task 1 — Gather structural and signature information from uclaw's AgentMessages.tsx

## AgentMessages.tsx structure

| Symbol | Lines | Visibility | Notes |
|---|---|---|---|
| EmptyState | 86-89 | private | wraps WelcomeEmptyState |
| AssistantLogo | 90-108 | private | renders model logo, accepts optional `model` prop |
| InlineImage | 111-158 | private | inline image renderer with media type support |
| ToolResultInlineImages | 160-175 | private | extracts images from ToolActivity array |
| agentActivitiesToChatActivities | 177-202 | private | transforms ToolActivity[] → ChatToolActivity[] |
| extractToolActivities | 204-270 | private | pulls tool activities from AgentMessage events |
| parseAttachedFiles | 272-290 | private | parses `<attached_files>` XML blocks |
| isImageFile | 292-295 | private | MIME type predicate |
| AttachedFileChip | 297-319 | private | renders single file chip with download UI |
| CompactionFoldCard | 321-408 | private | compacted-message fold card with expand/collapse |
| RetryingNotice | 410-505 | private | retry UI (current attempt, progress bar, ETA) |
| RetryAttemptItem | 507-598 | private | individual retry attempt record |
| formatDuration | 600-608 | **exported** | ms → "Xh Ym Zs" format |
| buildUsageTooltip | 610-622 | **exported** | usage → tooltip string |
| DurationBadge | 624-638 | **exported** | renders durationMs + usage in badge |
| MessageMetaBar | 640-677 | private | renders DurationBadge + agent model logo bar |
| formatRelativeShort | 679-697 | private | timestamp → relative short format ("23min ago" etc) |
| AgentMessageItem | 698-839 | private | single message renderer (role + content + meta) |
| AgentRunningIndicator | 841-893 | private | pulsing "Agent is thinking..." indicator |
| AgentMessages | 895-??? | **exported** | main export, full message list + stream state |

**Key:** AgentMessages is the primary export; most helpers are internal to the component file.

## Atom dependencies

| Atom | Already ported | Stubbed here | Notes |
|---|---|---|---|
| userProfileAtom | ✓ in features/chat-agent/atoms/user-profile | | real user profile data |
| agentDisplayNameForAtom | ✓ in atoms/agent-display-name.ts | — | real; Task 11 retargeted consumer |
| channelsAtom | ✓ in atoms/chat-atoms.ts | — | real; Task 11 retargeted consumer |
| tabMinimapCacheAtom | ✓ in atoms/tab-atoms.ts | — | real; Task 11 retargeted consumer |
| proactiveLearningEventsAtom | ✓ in atoms/agent-atoms.ts | — | real; Task 11 retargeted consumer |
| memoryRecallEventAtom | ✓ in atoms/agent-atoms.ts | — | real; Task 11 retargeted consumer |
| skillRecallsMapAtom | ✓ in atoms/agent-atoms.ts | — | real; Task 11 retargeted consumer |
| stickyUserMessageEnabledAtom | ✓ in features/chat-agent/atoms/ui-preferences | | UI preference flag |

**Amended 2b.2.c.2 Task 11:** all atom shadows removed from peripheral-stubs; consumers now point at real atoms. The original recon misclassified proactiveLearningEventsAtom, memoryRecallEventAtom, and skillRecallsMapAtom as needing stubs — they were already in agent-atoms.ts at the time (2b.2.c-A bug). Task 11 closes both 2b.2.c-A and 2b.2.c-C.

## Stub-target component signatures

Each stub-target component found in uclaw is listed below with its import path and full prop interface:

### 1. ToolActivityList
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/ToolActivityItem.tsx:527`
- **Prop interface:**
  ```typescript
  interface ToolActivityListProps {
    activities: ToolActivity[]
    animate?: boolean
  }
  ```

### 2. ChatToolActivityIndicator
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatToolActivityIndicator.tsx:21`
- **Prop interface:**
  ```typescript
  {
    activities: ChatToolActivity[]
    isStreaming?: boolean
  }
  ```

### 3. ThinkingBlock
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/ContentBlock.tsx:515`
- **Prop interface:**
  ```typescript
  interface ThinkingBlockProps {
    block: SDKThinkingBlock
    dimmed?: boolean
    sessionId?: string | null
  }
  ```

### 4. NativeBlockRenderer
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/NativeBlockRenderer.tsx:25`
- **Prop interface:**
  ```typescript
  interface NativeBlockRendererProps {
    blocks: ContentBlock[]
    conversationId?: string
    className?: string
  }
  ```

### 5. SkillCitationChips
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SkillCitationChips.tsx:44`
- **Prop interface:**
  ```typescript
  interface SkillCitationChipsProps {
    citations: SkillCitation[]
    messageKey: string
    className?: string
  }
  ```

### 6. SkillRecallChips
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SkillRecallChips.tsx:69`
- **Prop interface:**
  ```typescript
  interface SkillRecallChipsProps {
    sessionId: string
    className?: string
  }
  ```

### 7. ProactiveLearningChip
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ProactiveLearningChip.tsx:41`
- **Prop interface:**
  ```typescript
  interface ProactiveLearningChipProps {
    event: ProactiveLearningEvent
    className?: string
  }
  ```

### 8. MemoryRecallChip
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/MemoryRecallChip.tsx:60`
- **Prop interface:**
  ```typescript
  interface MemoryRecallChipProps {
    event: MemoryRecallEvent
    inline?: boolean
    className?: string
  }
  ```

### 9. CompactingIndicator
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SDKMessageRenderer.tsx:90`
- **Prop interface:**
  ```typescript
  // No props
  () => React.ReactElement
  ```

### 10. CompactBoundaryDivider
- **File:** `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SDKMessageRenderer.tsx:70`
- **Prop interface:**
  ```typescript
  {
    removed?: number
    remaining?: number
  }
  ```

**Complexity Assessment:**
- All 10 stub-target components have **simple to moderate** prop interfaces (≤3 props, mostly type-refs)
- No complex state management or hooks within the props
- **No surprises:** stubs in Task 4–8 can use the simple placeholder patterns from the plan

## formatMessageTime

**Location:** `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatMessageItem.tsx:49`

**Signature & Body:**
```typescript
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()

  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const time = `${hh}:${mm}`

  if (date.getFullYear() === now.getFullYear()) {
    return `${month}/${day} ${time}`
  }

  return `${date.getFullYear()}/${month}/${day} ${time}`
}
```

**Notes:**  
- Converts timestamp to 12-hour HH:MM format with MM/DD date (or YYYY/MM/DD if not current year)
- Pure function, no side effects
- **Task 10:** Can be stubbed verbatim or as a simple placeholder returning ISO string

## ScrollPositionManager

**Location:** `/Users/ryanliu/Documents/uclaw/ui/src/hooks/useScrollPositionMemory.ts:18`

**Type:** React component (not a class)

**Signature & Props:**
```typescript
interface ScrollPositionManagerProps {
  /** 会话/Session ID — 变化时触发重置 */
  id: string
  /** 数据是否已加载就绪，false 时不重置 */
  ready: boolean
}

export function ScrollPositionManager({ id, ready }: ScrollPositionManagerProps): React.ReactElement | null
```

**Behavior:**
- Must be placed inside `<Conversation>` component (uses `useConversationContext`)
- On `id` change or first time `ready=true`, scrolls to bottom via `ctx.scrollToBottom('auto')`
- Returns `null` (invisible component)

**Usage in AgentMessages:**
```jsx
<ScrollPositionManager id={sessionId} ready={ready} />
```

**Task 3 Note:** This is a **component**, not a class. The stub should mirror this signature exactly.

## AgentStreamState confirmation

**Location:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages/desktop/src/features/chat-agent/atoms/agent-atoms.ts:100`

**Current fields:**
```typescript
export interface AgentStreamState {
  running: boolean
  content: string
  reasoning?: string
  toolActivities: ToolActivity[]
  model?: string
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  costUsd?: number
  contextWindow?: number
  skillsTokens?: number
  isCompacting?: boolean
  compactInFlight?: boolean
  startedAt?: number
  retrying?: {
    currentAttempt: number
    maxAttempts: number
    history: RetryAttempt[]
    failed: boolean
  }
  teammates: TeammateState[]
  waitingResume?: boolean
  truncated?: boolean
}
```

**`error?: string` extension assessment:**  
- ✓ **CLEAN** — No existing `error` field in current AgentStreamState
- Adding `error?: string` does not conflict with any existing field
- Follows existing optional-field pattern (e.g., `reasoning?: string`)

**Result:** Extension is safe to add in Task 7.

## Type definitions confirmation

| Type | Export location | Notes |
|---|---|---|
| AgentMessage | `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages/desktop/src/features/chat-agent/lib/agent-types.ts:54` | role, content, usage, events, contentBlocks, etc. |
| AgentEventUsage | `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages/desktop/src/features/chat-agent/lib/agent-types.ts:164` | inputTokens, outputTokens?, cacheReadTokens?, costUsd? |
| ChatToolActivity | `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages/desktop/src/features/chat-agent/lib/chat-types.ts:80` | toolCallId, type, toolName, input?, result?, liveOutput? |
| AttachedFileRef | **NOT in desktop/src** — defined locally in uclaw | filename, path |
| ToolActivity | `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agent-messages/desktop/src/features/chat-agent/atoms/agent-atoms.ts:23` | toolUseId, toolName, input, result?, isError?, done, liveOutput? |

**AttachedFileRef Action:**  
- **Task 10:** Must inline-declare in peripheral-stubs.ts or agent-stubs.ts since uclaw defines it locally in AgentMessages.tsx, not exported
- Definition: `{ filename: string; path: string }`

## Out-of-scope findings

None. All imports from uclaw (components, hooks, types) have been accounted for in the plan:
- **Components:** ToolActivityList, ChatToolActivityIndicator, ThinkingBlock, NativeBlockRenderer, SkillCitationChips, SkillRecallChips, ProactiveLearningChip, MemoryRecallChip, CompactingIndicator, CompactBoundaryDivider
- **Functions:** formatMessageTime
- **Components:** ScrollPositionManager (in hooks, but it's a React component)
- **Types:** All referenced types are exported from plan-scoped modules

## Summary for implementers

**Key for Tasks 2–10:**
1. **Atoms (Task 2):** 6 stubs needed (agentDisplayNameForAtom, channelsAtom, tabMinimapCacheAtom, proactiveLearningEventsAtom, memoryRecallEventAtom, skillRecallsMapAtom)
2. **Components (Tasks 4–8):** 10 stubs, all with **simple props** ≤3 fields
3. **Helper stub (Task 3):** ScrollPositionManager is a **component**, not a class
4. **AttachedFileRef (Task 10):** Inline-declare in stubs
5. **AgentStreamState extension:** `error?: string` is a clean addition
6. **formatMessageTime (Task 9):** Can be imported or stubbed verbatim

No blockers. Proceed with implementation.
