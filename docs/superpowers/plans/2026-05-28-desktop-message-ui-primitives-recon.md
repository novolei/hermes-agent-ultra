# Plan 2b.2.b.1 Recon

## Radix peer versions (from uclaw/ui/package.json)

- @radix-ui/react-tooltip: ^1.1.8
- @radix-ui/react-scroll-area: ^1.2.3
- @radix-ui/react-dialog: ^1.1.6
- @radix-ui/react-slot: ^1.2.4

## Per-file import surface

### components/ai-elements/provider-avatar.tsx
```
import * as React from 'react'
import { Bot } from 'lucide-react'
import { getModelLogo } from '@/lib/model-logo'
import { cn } from '@/lib/utils'
```

### components/ai-elements/context-divider.tsx
```
import * as React from 'react'
import { Scissors, X } from 'lucide-react'
```

### components/ai-elements/sticky-user-message.tsx
```
import * as React from 'react'
import { User, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
```

### components/ai-elements/scroll-minimap.tsx
```
import * as React from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertTriangle, Search } from 'lucide-react'
import { useConversationContext } from '@/components/ai-elements/conversation'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/chat/UserAvatar'
import { getModelLogo } from '@/lib/model-logo'
import { cn } from '@/lib/utils'
```

### components/ai-elements/rich-text-input.tsx
```
import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { MentionChipNode } from '@/components/composer/MentionChipNode'
import { serializeDocToWireText } from '@/components/composer/composer-serialize'
```

### components/ai-elements/reasoning.tsx
```
import * as React from 'react'
import { ChevronRight } from 'lucide-react'
```

### components/ai-elements/message.tsx
```
import * as React from 'react'
import type { ComponentProps } from 'react'
import Markdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { MarkdownCodeBlock } from '@/components/shared/code-block/CodeBlock'
import { markdownFileChipPlugin } from '@/components/preview/chips/markdownFileChipPlugin'
import { FilePathChip } from '@/components/preview/chips/FilePathChip'
import { useFileChipResolver, useChipCacheInvalidator } from '@/components/preview/chips/useFileChipResolver'
import type { PluggableList } from 'unified'
```

### components/ai-elements/conversation.tsx
```
import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

### components/chat/UserAvatar.tsx
```
import * as React from 'react'
import { cn } from '@/lib/utils'
```

### components/chat/CopyButton.tsx
```
import { useState, useCallback } from 'react'
import { CopyIcon, CheckIcon } from 'lucide-react'
import { MessageAction } from '@/components/ai-elements/message'
```

### components/chat/ChatToolActivityIndicator.tsx
```
import * as React from 'react'
import { ChatToolBlock } from './ChatToolBlock'
import type { ChatToolActivity } from '@/lib/chat-types'
```

### components/welcome/WelcomeEmptyState.tsx
```
import * as React from 'react'
import { useAtomValue } from 'jotai'
import { MessageSquare, Sparkles, Code, FileText, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { userProfileAtom } from '@/atoms/user-profile'
import { getAgentWelcomeMessage } from '@/lib/tips'
```

### components/shared/code-block/CodeBlock.tsx
```
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { highlightCode, escapeHtml } from '@/lib/highlight'
import { cn } from '@/lib/utils'
```

### hooks/useSmoothStream.ts
```
import { useState, useEffect } from 'react'
```

### lib/model-logo.ts
```
import type { Channel } from '@/lib/chat-types'
```

### lib/skill-citation.ts
(no imports)

### lib/normalize-agent-markdown.ts
(no imports)

## Button audit

### Existing desktop/src/shared/ui/button.tsx variants:
- default
- outline
- ghost

### Existing sizes:
- default (h-9 px-4 py-2)
- sm (h-8 px-3)
- icon (h-9 w-9)

### uclaw/src/components/ui/button.tsx additions:
- **New variants:** destructive, secondary, link
- **New sizes:** lg (h-10 rounded-md px-8), icon-sm (h-7 w-7)
- **New feature:** asChild prop (via @radix-ui/react-slot)
- **Base class changes:** Added gap-2, updated shadow styling, SVG sizing utilities
- **Radix dependency:** @radix-ui/react-slot (^1.2.4)

### Plan for Task 5:
Task 5 will replace the existing desktop button.tsx with the uclaw signature verbatim, including:
1. Import Slot from @radix-ui/react-slot
2. Add destructive, secondary, link variants
3. Add lg, icon-sm sizes
4. Add asChild prop to ButtonProps interface
5. Update classname composition to use Slot for polymorphism

## Input.tsx status

uclaw/src/components/ui/input.tsx is a simple stateless input wrapper. Desktop branch does not have input.tsx yet (will need to be created in Task 5 or related step).

## Out-of-scope imports flagged

No out-of-scope @/components/ui/ imports found. The ported files use only:
- @/components/ui/button (Task 5)
- @/components/ui/input (to be added)

All other imports (lucide-react, jotai, tiptap, react-markdown, etc.) are external dependencies not in the UI primitives scope.

### Flagged dependencies not in spec scope:
- @tiptap/react, @tiptap/core, @tiptap/starter-kit (rich-text-input.tsx) → requires MentionChipNode and serializeDocToWireText ports
- @/components/composer/* (rich-text-input.tsx) → out of scope, will need review
- @/components/preview/chips/* (message.tsx) → out of scope, will need review
- @/components/chat/ChatToolBlock (ChatToolActivityIndicator.tsx) → will need to be ported or created
- jotai (WelcomeEmptyState.tsx) → external library, out of scope
- react-markdown, remark-gfm (message.tsx, scroll-minimap.tsx) → external dependencies, out of scope

These should be reviewed by the plan controller to confirm whether they require special handling or are expected cross-module dependencies.
