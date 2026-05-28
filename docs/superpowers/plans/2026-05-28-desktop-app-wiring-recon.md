# Recon: Plan 2b.2.c.3 (Desktop App Wiring)

**Executed:** 2026-05-28  
**Branch:** `feat/desktop-app-wiring`  
**Worktree:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring`

---

## 1. Tauri & tauri-plugin-dialog Version Compatibility

**Current Tauri Version (from Cargo.toml):**
```
tauri = { version = "2", features = [] }
tauri-build = { version = "2", features = [] }
```

**Available tauri-plugin-dialog on crates.io:**
```
tauri-plugin-dialog = "2.7.1"
```

**Cargo.toml Dependency to Add:**
```toml
tauri-plugin-dialog = "2"
```

**Status:** ✓ Compatible. Tauri v2 + tauri-plugin-dialog v2.7.1 are aligned.

---

## 2. peripheral-stubs.ts Exports & Consumers

**File:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring/desktop/src/features/chat-agent/lib/peripheral-stubs.ts`

### Exports (11 items):
1. `SettingsTab` (type)
2. `settingsTabAtom` (atom)
3. `settingsOpenAtom` (atom)
4. `environmentCheckDialogOpenAtom` (atom)
5. `readAttachment(_localPath: string)` → `Promise<string | null>`
6. `SaveImageArgs` (interface)
7. `saveImageAs(_args: SaveImageArgs)` → `Promise<boolean>`
8. `openExternal(_url: string)` → `Promise<void>`
9. `recordSkillCited(_skillName: string)` → `Promise<void>`
10. `listInvocableSkills(_spaceId?: string)` → `Promise<InvocableSkill[]>`
11. `searchWorkspaceFilesForMention(...)`

### Active Consumers (6 files):

| File | Imports | Line |
|------|---------|------|
| `skill-citation-chips.tsx` | `recordSkillCited, settingsOpenAtom, settingsTabAtom` | 35 |
| `skill-recall-chips.tsx` | `settingsOpenAtom, settingsTabAtom` | 30 |
| `tool-activity-item.tsx` | `readAttachment, saveImageAs` | 48 |
| `sdk-message-renderer.tsx` | (multiple: searchWorkspaceFilesForMention, etc.) | 49 |
| `composer-mention-controller.tsx` | `listInvocableSkills, searchWorkspaceFilesForMention` | 31 |
| `agent-messages.tsx` | `saveImageAs, readAttachment` | 27 |

**Consumer Count:** 6 active consumers + 1 comment reference (tab-atoms.ts line 6)

---

## 3. scroll-position-manager Consumers

**File:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring/desktop/src/features/chat-agent/components/stubs/scroll-position-manager.ts`

### Active Consumers (2):

| File | Type | Line |
|------|------|------|
| `agent-messages.tsx` | Import (production) | 47 |
| `scroll-position-manager.test.tsx` | Import (test) | 3 |

**Consumer Count:** 1 production + 1 test

---

## 4. useScrollPositionMemory from uclaw

**Source:** `/Users/ryanliu/Documents/uclaw/ui/src/hooks/useScrollPositionMemory.ts` (36 LOC)

```typescript
/**
 * ScrollPositionManager — 切换会话时把视图重置到底部
 *
 * 必须放在 <Conversation> 内部使用（依赖 useConversationContext）。
 * 当 `id` 变化或首次 ready 时，自动滚到底部，让用户进入任意会话默认看到最新消息。
 */

import * as React from 'react'
import { useConversationContext } from '@/components/ai-elements/conversation'

interface ScrollPositionManagerProps {
  /** 会话/Session ID — 变化时触发重置 */
  id: string
  /** 数据是否已加载就绪，false 时不重置（避免在空内容时滚动无效） */
  ready: boolean
}

export function ScrollPositionManager({ id, ready }: ScrollPositionManagerProps): React.ReactElement | null {
  const ctx = useConversationContext()
  const lastIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!ready || !ctx) return
    // 同 id 已处理过则跳过；id 变化或首次 ready 时滚到底
    if (lastIdRef.current === id) return
    lastIdRef.current = id

    // 等下一帧让消息列表先 paint，再滚动到底（否则 scrollHeight 还没更新到位）
    const raf = window.requestAnimationFrame(() => {
      ctx.scrollToBottom('auto')
    })
    return () => window.cancelAnimationFrame(raf)
  }, [id, ready, ctx])

  return null
}
```

**Key Props:**
- `id: string` — Session/conversation ID (triggers reset on change)
- `ready: boolean` — Data loaded flag (prevents scroll on empty content)

**Behavior:** Auto-scrolls to bottom on session ID change or first ready state; uses `requestAnimationFrame` to ensure layout paint before scroll.

---

## 5. scroll-minimap.tsx Dead Handlers

**File:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring/desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.tsx`

### Unused State & Handlers (5 items, lines 318–333):

| Line | Symbol | Type | Status |
|------|--------|------|--------|
| 318 | `canScroll` | state | dead |
| 319 | `isDragging` | state | dead |
| 320 | `handleThumbMouseDown` | handler | dead |
| 321 | `handleTrackMouseDown` | handler | dead |
| 333 | `thumbTopPct` | computed | dead |

**Context (line 317–323):**
```typescript
  // Suppress noUnusedLocals: these state values and handlers are wired in future sub-tasks.
  void canScroll
  void isDragging
  void handleThumbMouseDown
  void handleTrackMouseDown

  // 仅当无消息时隐藏；不再要求容器可滚动 — 即便消息很少也保留导航入口
  if (items.length < MIN_ITEMS) return null
```

**Dead Handler Count:** 5

---

## 6. MemoryRecallChip Restoration Surface

**Source:** `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/MemoryRecallChip.tsx` (166 LOC)

### Exported Symbols:
- `MemoryRecallChip` (function component)
- `MemoryRecallChipProps` (interface, implicit export via component)

### Internal Symbols (used in popover surface):
- `KIND_LABELS` — Record<string, string> (8 entries: procedure, user_profile, episode, knowledge, reference, identity, value, directive, curated, boot)
- `inferItemLayer(itemIdx: number, event: MemoryRecallEvent)` — string | null (closure over bootCount, triggeredCount, relevantCount, expandedCount)
- `LAYER_COLORS` — Record<string, string> (5 entries: Boot, Triggered, Relevant, Expanded, Recent)

### Popover Surface Details:
- **Trigger:** Brain icon + "已召回 N 条记忆" text (line 76–86)
- **Content Layout:**
  - Header section: "记忆召回详情" title + summary (lines 93–102)
  - Layer distribution badges section (lines 104–124, conditional on `layers.length > 0`)
  - Memory items list (lines 126–156, capped at 12 items with slice(0, 12))
- **Trigger Behavior:** Popover `side="top" align="start"` with `w-72 max-h-80 overflow-y-auto`
- **Item Rendering:** Displays item.title, inferred layer, and kind label

### Dependencies:
- `Popover, PopoverContent, PopoverTrigger` from `@/components/ui/popover`
- `Badge` from `@/components/ui/badge`
- `lucide-react` icons (Brain, Sparkles)

**LOC:** 166 total

---

## 7. Popover Primitive Availability

**Path Check:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring/desktop/src/shared/ui/popover.tsx`

**Status:** ❌ **MISSING**

**Implication:** Task 7 (port Popover primitive from uclaw) is **REQUIRED BLOCKER** for MemoryRecallChip restoration.

**Uclaw Source:** `/Users/ryanliu/Documents/uclaw/ui/src/components/ui/popover.tsx` (exists, ready for porting)

---

## 8. App.tsx SESSION_ID Configuration

**File:** `/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-app-wiring/desktop/src/app/App.tsx`

**Definition (line 6):**
```typescript
const SESSION_ID = "default";
```

**Usage Locations:**
- Line 32: Message stream filter in `onMessageStream` handler
- Line 40: Message completion filter in `onMessageComplete` handler
- Line 50: Error filter in `onError` handler
- Line 77: Agent bridge send (agentBridge.agentSendMessage(SESSION_ID, text))

**Session Management:** Hardcoded constant "default" used throughout message lifecycle and IPC bridge.

---

## Summary Table

| Item | Result | Notes |
|------|--------|-------|
| **Tauri Version** | v2 | Compatible with tauri-plugin-dialog v2.7.1 |
| **tauri-plugin-dialog Dep** | `"2"` | Ready to add to Cargo.toml |
| **peripheral-stubs Consumers** | 6 files | skill-citation-chips, skill-recall-chips, tool-activity-item, sdk-message-renderer, composer-mention-controller, agent-messages |
| **scroll-position-manager Consumers** | 1 production (agent-messages.tsx) | +1 test file |
| **scroll-minimap Dead Handlers** | 5 | Lines 318–321, 333 |
| **MemoryRecallChip LOC** | 166 | Requires KIND_LABELS, inferItemLayer, LAYER_COLORS, Popover imports |
| **Popover Primitive** | ❌ MISSING | Task 7 blocker; uclaw source ready for port |
| **App.tsx SESSION_ID** | Line 6, value "default" | Hardcoded throughout message flow |

---

## Key Findings & Blockers

1. **✓ Tauri + Plugin Compatibility:** No version conflicts; ready to proceed.
2. **✓ Consumer Surface:** peripheral-stubs has 6 active file consumers; all low-complexity imports.
3. **✓ scroll-position-manager:** Single production consumer (agent-messages.tsx); minimal integration footprint.
4. **✓ useScrollPositionMemory:** Already ported to stub; ready for activation in ScrollPositionManager.
5. **❌ BLOCKER:** Popover primitive missing from desktop app; Task 7 required before MemoryRecallChip restoration.
6. **✓ scroll-minimap Dead Handlers:** 5 suppressions cleanly documented; wiring points clear (lines 318–333).
7. **✓ SESSION_ID:** Hardcoded "default" at App.tsx line 6; consistent throughout message pipeline.
