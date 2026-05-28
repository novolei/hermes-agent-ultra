# Recon: Desktop Composer + Atoms + Chips Port
**Plan:** 2b.2.c.2 | **Task:** 1 (Reconnaissance) | **Date:** 2026-05-28

## Overview
This document captures the import surface, dependency graph, and porting decisions for bringing uclaw's `composer`, `atoms`, and `chip` components to the desktop codebase.

---

## Step 1: Per-File Import Surface

### Composer Components

#### `composer-serialize.ts`
```
import type { JSONContent } from '@tiptap/core'
import { chipToWireText, type MentionChipAttrs } from './MentionChipNode'
```

#### `MentionChipNode.ts`
```
import { Node, mergeAttributes } from '@tiptap/core'
```

#### `ComposerMentionController.tsx`
```
import * as React from 'react'
import { useAtomValue } from 'jotai'
import type { Editor } from '@tiptap/core'
import { activeWorkspaceIdAtom } from '@/atoms/workspace'
import { listInvocableSkills, searchWorkspaceFilesForMention } from '@/lib/tauri-bridge'
import type { InvocableSkill, WorkspaceFileMatch } from '@/lib/types'
import { useEditorMentionTrigger } from '@/hooks/useEditorMentionTrigger'
import { ComposerMentionPopup } from './ComposerMentionPopup'
import type { MentionChipKind } from './MentionChipNode'
import { Sparkles, FileText, AlertTriangle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
```
**Key dependencies:** `@/lib/types`, `@/lib/tauri-bridge`, `@/atoms/workspace`

#### `ComposerMentionPopup.tsx`
```
import * as React from 'react'
import { cn } from '@/lib/utils'
```

#### `rich-text-input.tsx`
```
import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { MentionChipNode } from '@/components/composer/MentionChipNode'
import { serializeDocToWireText } from '@/components/composer/composer-serialize'
```

### Atoms

#### `chat-atoms.ts`
```
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { ConversationMeta, PrimaChatMessage, FileAttachment, ChatToolActivity, Channel } from '@/lib/chat-types'
```

#### `tab-atoms.ts`
```
import { atom } from 'jotai'
import { activeWorkspaceIdAtom } from './workspace'
import { streamingConversationIdsAtom } from './chat-atoms'
import {
  agentRunningSessionIdsAtom,
  agentSessionIndicatorMapAtom,
  workingDoneSessionIdsAtom,
} from './agent-atoms'
import type { SessionIndicatorStatus } from './agent-atoms'
```

#### `agent-display-name.ts`
```
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
```

#### `ui-preferences.ts`
```
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import * as bridge from '@/lib/tauri-bridge'
```

### Chip Components

#### `SkillCitationChips.tsx`
```
import * as React from 'react'
import { useSetAtom } from 'jotai'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillCitation } from '@/lib/skill-citation'
import { recordSkillCited } from '@/lib/tauri-bridge'
import { settingsOpenAtom, settingsTabAtom } from '@/atoms/settings-tab'
```

#### `SkillRecallChips.tsx`
```
import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Search, BookOpen, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { skillRecallsMapAtom, type SkillRecall } from '@/atoms/agent-atoms'
import { settingsOpenAtom, settingsTabAtom } from '@/atoms/settings-tab'
```

#### `MemoryRecallChip.tsx`
```
import * as React from 'react'
import { Brain, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { MemoryRecallEvent } from '@/atoms/agent-atoms'
import { cn } from '@/lib/utils'
```

#### `ProactiveLearningChip.tsx`
```
import * as React from 'react'
import { Brain, BookOpen, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProactiveLearningEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
```

#### `ChatToolBlock.tsx`
```
import * as React from 'react'
import { ChevronRight, AlertTriangle, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getToolIcon } from '@/components/agent/tool-utils'
import { getToolPhrase } from '@/components/agent/tool-phrase'
import { ToolResultRenderer } from '@/components/agent/tool-renderers'
import { BashStreamView } from '@/components/agent/tool-renderers/BashStreamView'
import type { LiveOutput } from '@/atoms/agent-atoms'
```

#### `ChatToolActivityIndicator.tsx`
```
import * as React from 'react'
import { ChatToolBlock } from './ChatToolBlock'
import type { ChatToolActivity } from '@/lib/chat-types'
```

---

## Step 2: `lib/types.ts` Decision

**Status:** ✓ EXISTS & PORTING REQUIRED

**Finding:**
- File exists: `/Users/ryanliu/Documents/uclaw/ui/src/lib/types.ts`
- Contains: `ProactiveLearningEvent` interface (line 457)
- **Decision:** Must port `ProactiveLearningEvent` to our `lib/types.ts` or `agent-atoms.ts`
- **Note:** Our `agent-atoms.ts` already defines a duplicate `ProactiveLearningEvent` interface (line 983), but uclaw's version in `types.ts` is the canonical source. Chips import from `@/lib/types` in uclaw, suggesting we should expose it from a shared location.

---

## Step 3: `@/atoms/settings-tab` Mapping

### uclaw's `settings-tab.ts` Exports
```typescript
export type SettingsTab = 'connectivity' | 'workspace' | 'about' | 'accounts'
export const settingsTabAtom = atom<SettingsTab>('connectivity')
export const settingsOpenAtom = atom(false)
export const channelFormDirtyAtom = atom(false)  // NOT in our stub
export const settingsCloseRequestedAtom = atom(false)  // NOT in our stub
```

### Our `peripheral-stubs.ts` Exports
```typescript
export type SettingsTab = 'connectivity' | 'workspace' | 'about' | 'accounts'
export const settingsTabAtom = atom<SettingsTab>('connectivity')
export const settingsOpenAtom = atom(false)
```

**Mapping Status:** ⚠️ PARTIAL MATCH
- **Match:** `SettingsTab`, `settingsTabAtom`, `settingsOpenAtom` ✓
- **Gap:** `channelFormDirtyAtom`, `settingsCloseRequestedAtom` missing from our stub
- **Impact:** Chip components only import `settingsOpenAtom` and `settingsTabAtom`, so our stub is sufficient for Tasks 2–6.
- **Task 3 Responsibility:** Import the missing atoms if referenced elsewhere or note for future Task 11 cleanup.

---

## Step 4: agent-atoms Coverage

### Required Types/Atoms for Chips

| Type/Atom | in uclaw agent-atoms? | in Our agent-atoms? | Component(s) | Status |
|-----------|----------------------|-------------------|-------------|--------|
| `SkillRecall` (type) | ✓ | ✓ (line 273) | SkillRecallChips | ✓ READY |
| `skillRecallsMapAtom` | ✓ | ✓ (line 291) | SkillRecallChips | ✓ READY |
| `MemoryRecallEvent` (type) | ✓ | ✓ (line 1008) | MemoryRecallChip | ✓ READY |
| `memoryRecallEventAtom` | ✓ | ✓ (line 1022) | MemoryRecallChip | ✓ READY |
| `ProactiveLearningEvent` (type) | ✓ (in types.ts) | ✓ (line 983, duplicate) | ProactiveLearningChip | ⚠️ NEEDS HARMONIZATION |
| `proactiveLearningEventsAtom` | ✓ | ✓ (line 997) | (implicit in ProactiveLearningChip) | ✓ READY |
| `LiveOutput` (type) | ✓ | ✓ (line 16) | ChatToolBlock | ✓ READY |

**Coverage Status:** ✓ COMPLETE
- All atoms and types required by chip components are present in our `agent-atoms.ts`.
- **Caveat:** `ProactiveLearningEvent` exists in both uclaw's `types.ts` and our `agent-atoms.ts`; ProactiveLearningChip imports from uclaw's `types.ts`. Task 2 should verify if both versions are identical and harmonize if needed.

---

## Step 5: Stub-Replacement Mapping

**Current stubs actively imported:**

```
/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms/desktop/src/features/chat-agent/components/agent-messages.tsx:
  40: import { ChatToolActivityIndicator } from '@/features/chat-agent/components/stubs/chat-tool-activity-indicator'
  43: import { SkillCitationChips, SkillRecallChips } from '@/features/chat-agent/components/stubs/skill-chips'
  44: import { ProactiveLearningChip, MemoryRecallChip } from '@/features/chat-agent/components/stubs/learning-chips'
```

**Stub Locations (Task 2–6 Port Targets):**
1. `components/stubs/skill-chips.ts` → Task 2 (SkillCitationChips, SkillRecallChips)
2. `components/stubs/learning-chips.ts` → Task 2 (ProactiveLearningChip, MemoryRecallChip)
3. `components/stubs/chat-tool-activity-indicator.ts` → Task 2 (ChatToolActivityIndicator)

**Consumers:**
- `agent-messages.tsx` (all three)

---

## Step 6: peripheral-stubs.ts Inventory

### Current Exports
```typescript
Line 17: export interface ProactiveLearningEvent
Line 27: export interface MemoryRecallEvent
Line 43: export const channelsAtom = atom<Channel[]>([])
Line 46: export const tabMinimapCacheAtom = atom<Map<string, MinimapItem[]>>(new Map())
Line 49: export const proactiveLearningEventsAtom = atom<ProactiveLearningEvent[]>([])
Line 52: export const memoryRecallEventAtom = atom<Map<string, MemoryRecallEvent>>(new Map())
Line 55: export const skillRecallsMapAtom = atom<Map<string, unknown[]>>(new Map())
Line 58: export const agentDisplayNameForAtom = atom<(agentId: string | undefined) => string | undefined>(...)
Line 63: export const stickyUserMessageEnabledAtom = atom<boolean>(true)
Line 69: export type SettingsTab = ...
Line 86: export const settingsTabAtom = atom<SettingsTab>('connectivity')
Line 89: export const settingsOpenAtom = atom(false)
Line 92: export const environmentCheckDialogOpenAtom = atom(false)
Line 98: export async function readAttachment(_localPath: string): Promise<string | null>
Line 102: export interface SaveImageArgs
Line 109: export async function saveImageAs(_args: SaveImageArgs): Promise<boolean>
Line 115: export async function openExternal(_url: string): Promise<void>
```

### Deletion Candidate Map (Task 11)

| Export | Real Source (Tasks 3–5) | Delete in Task 11? |
|--------|------------------------|--------------------|
| `channelsAtom` | chat-atoms.ts (Task 4) | ✓ YES |
| `proactiveLearningEventsAtom` | agent-atoms.ts (pre-existing) | ✓ YES |
| `memoryRecallEventAtom` | agent-atoms.ts (pre-existing) | ✓ YES |
| `skillRecallsMapAtom` | agent-atoms.ts (pre-existing) | ✓ YES |
| `agentDisplayNameForAtom` | agent-display-name.ts (Task 3) | ✓ YES |
| `stickyUserMessageEnabledAtom` | ui-preferences.ts (Task 3) | ✓ YES |
| `tabMinimapCacheAtom` | tab-atoms.ts (Task 5) | ✓ YES |
| `ProactiveLearningEvent` | agent-atoms.ts or lib/types.ts (needs harmonization) | ✓ YES |
| `MemoryRecallEvent` | agent-atoms.ts (pre-existing) | ✓ YES |
| `SettingsTab`, `settingsTabAtom`, `settingsOpenAtom` | settings-tab.ts (Task 3) | ✓ YES |
| `environmentCheckDialogOpenAtom` | ? (not found in uclaw; local design) | ⚠️ INVESTIGATE |
| `readAttachment`, `saveImageAs`, `openExternal` | ? (Tauri bridge stubs; local design) | ⚠️ INVESTIGATE |

---

## Step 7: ui-preferences.ts Tauri Persistence

### Finding
File: `/Users/ryanliu/Documents/uclaw/ui/src/atoms/ui-preferences.ts`

**Key observations:**
1. **No `invoke()` calls** — Does not use direct Tauri IPC.
2. **Uses `localStorage` for caching** (lines 42–52, 77–84):
   - `getCachedStickyUserMessage()` reads from localStorage
   - `updateStickyUserMessageEnabled()` writes to localStorage
3. **Calls `bridge.getSettings()`** (line 66) — Uses the tauri-bridge adapter layer
4. **Atomics:**
   - `stickyUserMessageEnabledAtom` (line 19) — basic atom, no storage
   - `agentStatusBarEnabledAtom` (line 26) — uses `atomWithStorage` (persists to localStorage)
   - `planModeSuggestEnabledAtom` (line 35) — uses `atomWithStorage`

**Decision:** Task 3 must port the `atomWithStorage` pattern and localStorage keys, plus ensure `bridge.getSettings()` is called during initialization.

---

## Step 8: tabMinimapCacheAtom Location

**Finding:**
- **Location:** `/Users/ryanliu/Documents/uclaw/ui/src/atoms/tab-atoms.ts:95`
- **Type:** `atom<Map<string, TabMinimapItem[]>>`
- **Export:** Exported directly from `tab-atoms.ts` (not a separate file)

**Decision:** Task 5 must port `tabMinimapCacheAtom` from `tab-atoms.ts`. It will be deleted from `peripheral-stubs.ts` in Task 11.

---

## Step 9: Out-of-Scope / Red Flags

### Import Analysis Summary

✓ **In-scope, standard:**
- Jotai (`atom`, `useAtomValue`, `useSetAtom`, `atomWithStorage`)
- TipTap (`@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`)
- React, lucide-react, `cn` utility, Badge, Tooltip
- Tauri bridge (`@/lib/tauri-bridge`)
- Type imports from `@/lib/types`, `@/lib/chat-types`, `@/lib/skill-citation`

⚠️ **Conditional (check porting depth):**
- `useEditorMentionTrigger` hook (uclaw-specific; may need desktop-only stub)
- `getToolIcon`, `getToolPhrase`, `ToolResultRenderer`, `BashStreamView` (agent component suite; verify desktop has equivalents)
- `ComposerMentionPopup` (local composer component; in-scope)

✗ **None detected as hard blockers.**

---

## Summary: Key Findings

| Finding | Status | Impact |
|---------|--------|--------|
| **lib/types.ts exists** | ✓ | Must port `ProactiveLearningEvent` and other types as needed |
| **settings-tab mapping** | ✓ SUFFICIENT | Our stub covers chip imports; Task 3 may add missing atoms |
| **agent-atoms coverage gaps** | 0 gaps | All required atoms/types present; harmonize `ProactiveLearningEvent` |
| **tabMinimapCacheAtom location** | tab-atoms.ts | Task 5 ports it; Task 11 deletes stub |
| **ui-preferences Tauri pattern** | localStorage + bridge | Task 3 must replicate `atomWithStorage` + `bridge.getSettings()` pattern |
| **Stub replacements** | 3 files | Tasks 2–6 port components; Task 11 removes old stubs |
| **Out-of-scope imports** | None critical | Standard React/Jotai/TipTap stack; verify desktop has tool utility equivalents |

---

## Notes for Implementation Tasks

1. **Task 2:** Port SkillCitationChips, SkillRecallChips, ProactiveLearningChip, MemoryRecallChip, ChatToolActivityIndicator. Harmonize `ProactiveLearningEvent` between `types.ts` and `agent-atoms.ts` first.
2. **Task 3:** Port chat-atoms, agent-display-name, ui-preferences. Add missing SettingsTab atoms if referenced. Ensure `atomWithStorage` keys match uclaw's localStorage keys.
3. **Task 4:** (Not yet detailed in recon.)
4. **Task 5:** Port tab-atoms, including `tabMinimapCacheAtom`.
5. **Task 11:** Delete from `peripheral-stubs.ts`: all atom stubs that have real sources in Tasks 2–5.

---

**Generated:** 2026-05-28 | **Plan:** 2b.2.c.2 Task 1
