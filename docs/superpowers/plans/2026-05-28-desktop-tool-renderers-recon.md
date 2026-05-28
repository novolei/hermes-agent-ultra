# Plan 2b.2.c.1 Recon: Desktop Tool-Rendering Subsystem Port

## Per-file import surface

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/bash-result.tsx
```
import * as React from 'react'
import { invoke } from '@tauri-apps/api/core'
import { cn } from '@/lib/utils'
import { CollapsibleResult } from './collapsible-result'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/BashStreamView.tsx
```
import * as React from 'react'
import { cn } from '@/lib/utils'
import { invoke } from '@tauri-apps/api/core'
import type { LiveOutput } from '@/atoms/agent-atoms'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/read-result.tsx
```
import * as React from 'react'
import { File as PierreFile } from '@pierre/diffs/react'
import { usePierreTheme, detectLang } from './pierre-theme'
import { CollapsibleResult } from './collapsible-result'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/write-result.tsx
```
import * as React from 'react'
import { MultiFileDiff } from '@pierre/diffs/react'
import { usePierreTheme, detectLang } from './pierre-theme'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/edit-result.tsx
```
import * as React from 'react'
import { MultiFileDiff } from '@pierre/diffs/react'
import { usePierreTheme, detectLang } from './pierre-theme'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/collapsible-result.tsx
```
import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/default-result.tsx
```
import * as React from 'react'
import { cn } from '@/lib/utils'
import { CollapsibleResult } from './collapsible-result'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/screenshot-result.tsx
```
import * as React from 'react'
import { cn } from '@/lib/utils'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/index.tsx
```
import * as React from 'react'
import { WriteResultRenderer } from './write-result'
import { EditResultRenderer } from './edit-result'
import { ReadResultRenderer } from './read-result'
import { BashResultRenderer } from './bash-result'
import { ScreenshotResultRenderer } from './screenshot-result'
import { DefaultResultRenderer } from './default-result'
import { GbrainResultRenderer } from './gbrain-result'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/pierre-theme.ts
```
import { useAtomValue } from 'jotai'
import { resolvedThemeAtom } from '@/atoms/theme'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/ToolActivityItem.tsx
```
import * as React from 'react'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ChevronRight,
  MessageCircleDashed,
  Download,
} from 'lucide-react'
import { useSetAtom } from 'jotai'
import { cn } from '@/lib/utils'
import { getToolIcon, formatElapsed } from './tool-utils'
import { getToolPhrase } from './tool-phrase'
import { ToolResultRenderer } from './tool-renderers'
import {
  type ToolActivity,
  type ActivityGroup,
  type ActivityStatus,
  getActivityStatus,
  groupActivities,
  isActivityGroup,
} from '@/atoms/agent-atoms'
import { TaskProgressCard, TASK_TOOL_NAMES } from './TaskProgressCard'
import { readAttachment, saveImageAs } from '@/lib/tauri-bridge'
import { BashStreamView } from './tool-renderers/BashStreamView'
import { openPreviewTabAction } from '@/atoms/preview-panel-atoms'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-utils.ts
```
import type { LucideIcon } from 'lucide-react'
import {
  // (truncated in original, icon imports)
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-phrase.ts
```
import { computeDiffStats } from './tool-utils'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/ContentBlock.tsx
```
import * as React from 'react'
import type { ComponentProps } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownFileChipPlugin } from '@/components/preview/chips/markdownFileChipPlugin'
import { FilePathChip } from '@/components/preview/chips/FilePathChip'
import { useFileChipResolver } from '@/components/preview/chips/useFileChipResolver'
import {
  ChevronRight,
  ChevronDown,
  XCircle,
  Loader2,
  Brain,
  MessageSquareText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageResponse } from '@/components/ai-elements/message'
import { getToolIcon } from './tool-utils'
import { getToolPhrase } from './tool-phrase'
import { ToolResultRenderer } from './tool-renderers'
import { formatDuration } from './AgentMessages'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/NativeBlockRenderer.tsx
```
import * as React from 'react'
import type { ContentBlock } from '@/lib/chat-types'
import { ThinkingBlock } from './ContentBlock'
import { ChatToolBlock } from '@/components/chat/ChatToolBlock'
import { MessageResponse } from '@/components/ai-elements/message'
```

### /Users/ryanliu/Documents/uclaw/ui/src/components/agent/SDKMessageRenderer.tsx
```
import * as React from 'react'
import { Bot, Loader2, AlertTriangle, FileText, FileImage, Download, Split, Undo2, RotateCw, Plus, Minimize2, Wrench, Settings, ExternalLink } from 'lucide-react'
import { useAtomValue, useSetAtom } from 'jotai'
import { cn } from '@/lib/utils'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { ContentBlock } from './ContentBlock'
import { TaskProgressCard, TASK_TOOL_NAMES } from './TaskProgressCard'
import { DurationBadge } from './AgentMessages'
import {
  Message,
  MessageHeader,
  MessageContent,
  MessageActions,
  MessageAction,
  MessageResponse,
  UserMessageContent,
} from '@/components/ai-elements/message'
import { UserAvatar } from '@/components/chat/UserAvatar'
import { CopyButton } from '@/components/chat/CopyButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMessageTime } from '@/components/chat/ChatMessageItem'
import { getModelLogo, resolveModelDisplayName } from '@/lib/model-logo'
import { userProfileAtom } from '@/atoms/user-profile'
import { channelsAtom } from '@/atoms/chat-atoms'
import { environmentCheckDialogOpenAtom } from '@/atoms/environment'
import { settingsOpenAtom, settingsTabAtom } from '@/atoms/settings-tab'
import type { AgentEventUsage, RecoveryAction } from '@/lib/agent-types'
import type { ToolActivity } from '@/atoms/agent-atoms'
import { readAttachment, saveImageAs, openExternal } from '@/lib/tauri-bridge'
```

## Stub-replacement mapping (Step 2)

```
/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers/desktop/src/features/chat-agent/components/agent-messages.tsx:40:import { ChatToolActivityIndicator } from '@/features/chat-agent/components/stubs/tool-activity-list'
/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers/desktop/src/features/chat-agent/components/agent-messages.tsx:41:import { ThinkingBlock, NativeBlockRenderer } from '@/features/chat-agent/components/stubs/content-block'
/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers/desktop/src/features/chat-agent/components/agent-messages.tsx:44:import { CompactingIndicator, CompactBoundaryDivider } from '@/features/chat-agent/components/stubs/sdk-message-renderer'
```

## Public-surface exports

- **ToolActivityItem.tsx** exports:
  - `interface ActivityRowProps`
  - `function ActivityRow(...)`
  - `function ToolActivityList(...)`
  - `function ToolActivityItem(...)`
  - re-export `{ formatElapsed }`

- **ContentBlock.tsx** exports:
  - `interface ContentBlockProps`
  - `function ThinkingBlock(...)`
  - `function ContentBlock(...)`

- **SDKMessageRenderer.tsx** exports:
  - `interface SDKMessage`
  - `interface SDKMessageRendererProps`
  - `function CompactBoundaryDivider(...)`
  - `function CompactingIndicator(...)`
  - `function extractUserText(...)`
  - `interface AssistantTurn`
  - `type MessageGroup`
  - `function groupIntoTurns(...)`
  - `interface AssistantTurnRendererProps`
  - `function AssistantTurnRenderer(...)`

## Type coverage gaps (Step 6)

| uclaw type | Imported by | In our agent-types? | Action |
|---|---|---|---|
| `AgentEventUsage` | SDKMessageRenderer | **yes** | use as-is |
| `RecoveryAction` | SDKMessageRenderer | **yes** | use as-is |
| `ToolActivity` | ToolActivityItem, SDKMessageRenderer | **yes** | use as-is |
| `ContentBlock` | NativeBlockRenderer | **yes** | use as-is |

**Result:** No type coverage gaps. All types imported by the heavy files (ToolActivityItem, ContentBlock, SDKMessageRenderer) are already exported from our `agent-types.ts`.

## Gbrain isolation check (Step 7)

Confirmed: Only 2 references to Gbrain in uclaw's tool-renderers/index.tsx:
1. Line 8: `import { GbrainResultRenderer } from './gbrain-result'`
2. Line 31: `return <GbrainResultRenderer result={result} isError={isError} />`

When porting tool-renderers/index.tsx, removing both lines (skip the import + remove the conditional branch) is sufficient for Plan 2b.2.c.1 scope. No other files reference gbrain-result or GbrainResultRenderer.

## useSmoothStream interface contract

Both implementations expose identical interface:

**uclaw (`/Users/ryanliu/Documents/uclaw/ui/src/hooks/useSmoothStream.ts`):**
```typescript
interface UseSmoothStreamOptions {
  content: string
  isStreaming: boolean
}

interface UseSmoothStreamResult {
  displayedContent: string
}

export function useSmoothStream({ content, isStreaming }: UseSmoothStreamOptions): UseSmoothStreamResult
```

**ours (`/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers/desktop/src/shared/lib/use-smooth-stream.ts`):**
```typescript
interface UseSmoothStreamOptions {
  content: string
  isStreaming: boolean
}

interface UseSmoothStreamResult {
  displayedContent: string
}

export function useSmoothStream({ content, isStreaming: _isStreaming }: UseSmoothStreamOptions): UseSmoothStreamResult
```

**Status:** ✓ MATCH (parameter renaming from `isStreaming` → `_isStreaming` is compatible; both stubs ignore the parameter as placeholders)

## Out-of-scope imports flagged

**Note:** The following import categories appear in uclaw files but are intentionally out-of-scope for this task:

- **Tauri bridge** (`@tauri-apps/api/core`, `readAttachment`, `saveImageAs`, `openExternal`) — handled separately; Desktop already has stubs
- **Atom imports** (`@/atoms/agent-atoms`, `@/atoms/preview-panel-atoms`, etc.) — already integrated into Desktop
- **lucide-react icons** — available in Desktop; no action needed
- **UI components** (@/components/ui/*, @/components/ai-elements/*) — Desktop infrastructure; no action needed
- **Tauri bridge utilities** — Desktop equivalents already exist
- **Pierre diff library** (`@pierre/diffs/react`) — already available in Desktop package.json

These are all infrastructure/external dependencies or already-ported pieces; they do not block the tool-renderer port itself.

## Summary

✓ All type dependencies resolved (AgentEventUsage, RecoveryAction, ToolActivity, ContentBlock all exported from agent-types)
✓ useSmoothStream interfaces match perfectly
✓ Gbrain isolation confirmed (2 lines to remove)
✓ Stub targets identified (ChatToolActivityIndicator, ThinkingBlock, NativeBlockRenderer, CompactingIndicator, CompactBoundaryDivider)
✓ All required tool-renderer files identified and import surface fully catalogued

**Ready for Plan 2b.2.c.1 Tasks 2–12 implementation.**
