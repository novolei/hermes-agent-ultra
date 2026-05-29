# Plan 2b.2.c.4.a — AgentView Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the slim `<ChatAgentView />` (Plan 2b.2.c.3, ~174 LOC) in AppShell's main pane with uclaw's full `<AgentView />` (1,926 LOC) and the three of-its-direct-children that are unblocked today (`AgentMessages` + `AgentHeader` + `ContextUsageBadge`), plus the supporting `AttachmentPreviewItem`, `AgentSessionProvider` context, and two atom files (`active-model`, `shortcut-atoms`). All ~36 other AgentView imports that belong to 4.b/4.c/4.d get NOT_IMPLEMENTED stubs in a new `agentview-bridge-stub.tsx`.

**Architecture:** Verbatim port from `uclaw/ui/src/` following Hermes conventions established through Plans 2b.2.c.2 / c.3 / 3.1 / 3.2 / 3.3:
- kebab-case filenames, PascalCase exports
- `desktop/src/features/chat-agent/` layout (atoms / hooks / components / lib / contexts)
- `@/features/chat-agent/*` import path
- Storage keys rebranded `uclaw-*` → `hermes-*`
- Anti-god-file invariant: `desktop/src/lib/` contains ONLY `bridge/`
- Stub discipline: NOT_IMPLEMENTED throwers + typed placeholder components, NOT inlined values (Plan 3.3 C1 lesson)
- Pre-existing verbatim-ported files NEVER modified to add convenience exports (Plan 3.3 B2 lesson — port new symbols in NEW files)

**Tech Stack:** React 19 + Jotai 2.17.1 + atomWithStorage + Vitest + jsdom. Verbatim TypeScript ports from `/Users/ryanliu/Documents/uclaw/ui/src/`. The deeper dependency closure (UserAvatar, CopyButton, ChatToolActivityIndicator, MemoryRecallChip, ProactiveLearningChip, NativeBlockRenderer, scroll-minimap, sticky-user-message, use-smooth-stream, format-message-time, image-lightbox, welcome-empty-state, all the tool-renderers) is ALREADY in our tree from prior plans — recon confirmed at HEAD `eee46f8fd`.

**Scope baseline (committed in `main` at `eee46f8fd`):**
- Plan 3.3 navigation spine (full Dock + LeftSidebar + AppShell + App.tsx wiring) ✓
- Plan 2b.2.c.3 slim ChatAgentView ✓
- ai-elements: scroll-minimap, sticky-user-message, rich-text-input, conversation, message, reasoning, context-divider, message-action, provider-avatar ✓
- shared/lib: use-smooth-stream ✓
- features/chat-agent/lib: format-message-time, agent-types, chat-types, model-logo, tool-utils, tool-phrase, agent-messages-utils, skill-citation, workspace-icons ✓
- features/chat-agent/components: user-avatar, copy-button, chat-tool-activity-indicator, memory-recall-chip, proactive-learning-chip, native-block-renderer, content-block, tool-activity-item, welcome-empty-state, sdk-message-renderer, all tool-renderers, composer ✓
- features/chat-agent/atoms: chat-atoms, agent-atoms (1,029 LOC), tab-atoms, workspace, ui-preferences, theme, user-profile, top-level-view, dock-atoms, dock-placeholder-atoms, agent-display-name, draft-session-atoms, working-atoms, environment, system-prompt-atoms, home-office-atoms, kaleidoscope, search-atoms, updater, app-mode, active-view, settings-tab, sidebar-atoms, automation, automation-ui, symphony-graph, preview-panel-atoms ✓

**4.a port targets:**

| Bucket | Items | LOC |
|---|---|---|
| New atoms | `active-model.ts`, `shortcut-atoms.ts` | 57 |
| Atom extension | `ui-preferences.ts` — add `agentStatusBarEnabledAtom` | ~10 |
| New context | `contexts/session-context.tsx` (AgentSessionProvider) | 60 |
| Sub-components | `AgentHeader.tsx`, `ContextUsageBadge.tsx`, `AttachmentPreviewItem.tsx` | 680 |
| Big port | `AgentMessages.tsx` | 1,267 |
| Shell port | `AgentView.tsx` (verbatim, ~36 imports stubbed) | 1,926 |
| Stub file | `agentview-bridge-stub.tsx` (new) | ~500 (typed stubs for 36 symbols) |
| AppShell rewire | `app-shell.tsx` — swap ChatAgentView for AgentView | ~20 |
| App.tsx wiring | replace SESSION_ID constant with workspace-derived session | ~30 |
| Integration tests | new + extended | ~400 |
| **Total** | | **~5,000** |

**Tests target:** 611 → ≥640 (+29 minimum). Plan 3.3 baseline test count.

**Manual launch gate (4.a PR acceptance):** `cd desktop && pnpm tauri dev` opens a fully-chromed window — AppShell renders LeftSidebar + the FULL AgentView (header with model selector area, context badge, message stream, composer with attachment chips). Banners/STT/pet/browser-preview show visible-but-inert placeholder DOM. No console errors during render.

---

## File Structure

```
desktop/src/features/chat-agent/
├── atoms/
│   ├── active-model.ts          # NEW (28 LOC port, Wave A)
│   ├── shortcut-atoms.ts        # NEW (29 LOC port, Wave A)
│   └── ui-preferences.ts        # MODIFY: append agentStatusBarEnabledAtom (Wave A)
├── contexts/                     # NEW directory
│   ├── session-context.tsx      # NEW (60 LOC port, Wave A)
│   └── session-context.test.tsx # NEW (smoke test)
├── components/
│   ├── agent/                    # NEW directory (split from existing 'chat-agent' subdir naming)
│   │   ├── agent-view.tsx        # NEW (1,926 LOC port, Wave D)
│   │   ├── agent-view.test.tsx
│   │   ├── agent-messages.tsx    # NEW (1,267 LOC port, Wave C)
│   │   ├── agent-messages.test.tsx
│   │   ├── agent-header.tsx      # NEW (159 LOC port, Wave B)
│   │   ├── agent-header.test.tsx
│   │   ├── context-usage-badge.tsx     # NEW (419 LOC port, Wave B)
│   │   └── context-usage-badge.test.tsx
│   ├── chat/                     # NEW directory (peripheral chat-side bits not yet on Hermes side)
│   │   ├── attachment-preview-item.tsx  # NEW (102 LOC port, Wave B)
│   │   └── attachment-preview-item.test.tsx
│   └── app-shell/
│       └── app-shell.tsx         # MODIFY: swap ChatAgentView for AgentView (Wave E)
├── lib/
│   ├── agentview-bridge-stub.tsx # NEW (~500 LOC of typed stubs for 36 deferred imports, Wave D)
│   └── tauri-bridge-stub.ts      # MODIFY: extend with AgentView-specific bridge symbols if needed
└── desktop/src/app/
    └── App.tsx                   # MODIFY: derive session id from workspace atom (Wave E, closes Plan 3.3 FU #4)
```

NOTE: existing `desktop/src/features/chat-agent/components/chat-agent-view.tsx` stays in the tree until 4.d. The AppShell rewire just stops mounting it.

---

## Wave A — New atoms + context + ui-preferences extension

### Task A1: Port `active-model` and `shortcut-atoms` atoms

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/active-model.ts` (~28 LOC)
- Create: `desktop/src/features/chat-agent/atoms/shortcut-atoms.ts` (~29 LOC)
- Test: `desktop/src/features/chat-agent/atoms/active-model.test.ts`

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src/atoms
cat $UC/active-model.ts $UC/shortcut-atoms.ts
```

- [ ] **Step 2: Port each verbatim**

Retargets (per Hermes conventions established across Plans 3.1/3.2/3.3):
- `@/atoms/<name>` → `@/features/chat-agent/atoms/<name>` (or `./<name>` relative)
- `@/lib/<x>` → `@/features/chat-agent/lib/<x>` (or `../lib/<x>` relative)
- Storage-key rebrand: any `'uclaw-...'` → `'hermes-...'`

- [ ] **Step 3: Write test for active-model (atomWithStorage roundtrip pattern, mirrors `ui-preferences.test.ts`)**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { activeProviderModelAtom } from './active-model'

describe('active-model', () => {
  beforeEach(() => localStorage.clear())

  it('activeProviderModelAtom has a deterministic default', () => {
    const store = createStore()
    const v = store.get(activeProviderModelAtom)
    expect(v === null || typeof v === 'object').toBe(true)
  })

  it('persists writes through atomWithStorage with hermes namespace', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')
    const store = createStore()
    store.set(activeProviderModelAtom, { providerId: 'anthropic', modelId: 'claude-opus-4-7' })
    const hermesCall = setSpy.mock.calls.find(([k]) => typeof k === 'string' && k.startsWith('hermes-'))
    expect(hermesCall).toBeDefined()
    expect(hermesCall![0]).not.toContain('uclaw')
  })
})
```

If actual exports differ, adjust the test to match the verbatim source.

- [ ] **Step 4: Run tests + storage-key audit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agentview/desktop
pnpm vitest run src/features/chat-agent/atoms/active-model.test.ts

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agentview
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/atoms/{active-model,shortcut-atoms}.ts
```
Expected: tests pass, grep EMPTY.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/active-model.ts \
        desktop/src/features/chat-agent/atoms/shortcut-atoms.ts \
        desktop/src/features/chat-agent/atoms/active-model.test.ts
git commit -m "feat(desktop): port active-model + shortcut-atoms (verbatim)"
```

### Task A2: Extend `ui-preferences.ts` with `agentStatusBarEnabledAtom`

**Files:**
- Modify: `desktop/src/features/chat-agent/atoms/ui-preferences.ts`
- Modify: `desktop/src/features/chat-agent/atoms/ui-preferences.test.ts`

- [ ] **Step 1: Read uclaw's full ui-preferences.ts**

```bash
diff -u desktop/src/features/chat-agent/atoms/ui-preferences.ts \
        /Users/ryanliu/Documents/uclaw/ui/src/atoms/ui-preferences.ts
```

- [ ] **Step 2: Apply the uclaw → hermes patch for the missing atom only**

In the uclaw source, find the `agentStatusBarEnabledAtom` declaration. Locate the equivalent insertion point in our file (near the other atomWithStorage declarations) and add the atom + any helper code that goes with it, applying the storage-key rebrand `'uclaw-...'` → `'hermes-...'`.

DO NOT replace the file wholesale — only add the missing export. This preserves our verbatim port's history.

- [ ] **Step 3: Extend the test with a default + roundtrip assertion**

Append to `ui-preferences.test.ts`:
```typescript
it('agentStatusBarEnabledAtom defaults to true', () => {
  const store = createStore()
  expect(store.get(agentStatusBarEnabledAtom)).toBe(true)
})

it('agentStatusBarEnabledAtom persists with hermes namespace', () => {
  const setSpy = vi.spyOn(Storage.prototype, 'setItem')
  const store = createStore()
  store.set(agentStatusBarEnabledAtom, false)
  const hermesCall = setSpy.mock.calls.find(([k]) => typeof k === 'string' && k.includes('agent-status-bar'))
  expect(hermesCall).toBeDefined()
  expect(hermesCall![0]).not.toContain('uclaw')
})
```

Adjust assertion if uclaw's default is different from `true`.

- [ ] **Step 4: Run tests**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/atoms/ui-preferences.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/ui-preferences.ts \
        desktop/src/features/chat-agent/atoms/ui-preferences.test.ts
git commit -m "feat(desktop): extend ui-preferences with agentStatusBarEnabledAtom"
```

### Task A3: Port `AgentSessionProvider` context

**Files:**
- Create: `desktop/src/features/chat-agent/contexts/session-context.tsx` (~60 LOC)
- Test: `desktop/src/features/chat-agent/contexts/session-context.test.tsx`

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/contexts/session-context.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Likely needs `@/atoms/<name>` retargets and possibly `@/lib/<x>` retargets. If the source imports `@/lib/agent-types`, retarget to `@/features/chat-agent/lib/agent-types`.

- [ ] **Step 3: Smoke test the context provider**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AgentSessionProvider, useAgentSessionContext } from './session-context'
// Adjust hook name to whatever the file actually exports

function Probe() {
  const ctx = useAgentSessionContext()
  return <div data-testid="probe">{String(ctx?.sessionId ?? 'none')}</div>
}

describe('AgentSessionProvider', () => {
  it('renders children inside the provider', () => {
    const { getByTestId } = render(
      <AgentSessionProvider sessionId="test-session">
        <Probe />
      </AgentSessionProvider>,
    )
    expect(getByTestId('probe').textContent).toBe('test-session')
  })
})
```

Adjust prop name (`sessionId` vs `value` vs other) to match the verbatim source.

- [ ] **Step 4: Run tests**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/contexts/session-context.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/contexts/
git commit -m "feat(desktop): port AgentSessionProvider context (verbatim)"
```

---

## Wave B — AgentView's three direct child components (real ports)

### Task B1: Port `AttachmentPreviewItem`

**Files:**
- Create: `desktop/src/features/chat-agent/components/chat/attachment-preview-item.tsx` (~102 LOC)
- Test: `desktop/src/features/chat-agent/components/chat/attachment-preview-item.test.tsx`

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/chat/AttachmentPreviewItem.tsx
```

- [ ] **Step 2: Port verbatim + retargets**

Apply the full Hermes retarget table:
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- `@/atoms/<name>` → `@/features/chat-agent/atoms/<name>`
- `@/lib/utils` → `@/shared/lib/cn`
- `@/lib/<other>` → `@/features/chat-agent/lib/<other>`
- `@/lib/tauri-bridge` (real symbols) → `@/lib/bridge/<sub>` (probably `@/lib/bridge/files` for image URLs)
- `@/lib/tauri-bridge` (stub symbols) → `@/features/chat-agent/lib/tauri-bridge-stub`

If ANY import doesn't resolve, report BLOCKED — do not inline.

- [ ] **Step 3: Write mount test**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AttachmentPreviewItem } from './attachment-preview-item'

describe('AttachmentPreviewItem', () => {
  it('renders an image attachment without throwing', () => {
    const attachment = { kind: 'image', name: 'test.png', dataUrl: 'data:image/png;base64,xxx' }
    const { container } = render(
      <Provider>
        <AttachmentPreviewItem attachment={attachment as never} onRemove={() => {}} />
      </Provider>,
    )
    expect(container.firstChild).toBeTruthy()
  })
})
```

Inspect the actual prop signature from the source — if `attachment` has a different shape (e.g., a discriminated union with `kind: 'file'`, `kind: 'image'`, `kind: 'screenshot'`), supply a minimal placeholder that matches one variant.

- [ ] **Step 4: Run tests + audit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/chat/attachment-preview-item.test.tsx
cd .. && git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/chat/attachment-preview-item.tsx
```
Expected: pass + EMPTY.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/chat/
git commit -m "feat(desktop): port attachment-preview-item (verbatim)"
```

### Task B2: Port `AgentHeader`

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/agent-header.tsx` (~159 LOC)
- Test: `desktop/src/features/chat-agent/components/agent/agent-header.test.tsx`

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentHeader.tsx
```

- [ ] **Step 2: Enumerate imports + classify**

For each import:
- (a) npm/std lib — keep as-is
- (b) path mapping cleanly via convention table — apply retarget
- (c) path with NO target in our tree — STOP, classify the symbol:
  - if a tiny constant/type → stub in `@/features/chat-agent/lib/agentview-bridge-stub.tsx` (will be created in Wave D Task D1; for B2, create the file early if needed)
  - if a component/hook scheduled for 4.b/c/d → ALSO stub in agentview-bridge-stub.tsx
  - if a yet-unmapped bridge symbol → add to `tauri-bridge-stub.ts`

Report BLOCKED only if you find an import that doesn't match any category above.

- [ ] **Step 3: Port verbatim with retargets**

- [ ] **Step 4: Write mount test**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AgentHeader } from './agent-header'

describe('AgentHeader', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <AgentHeader />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
```

Inspect required props and supply minimal placeholders.

- [ ] **Step 5: Run tests + audit + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/agent/agent-header.test.tsx
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent/agent-header.{tsx,test.tsx}
git add desktop/src/features/chat-agent/components/agent/agent-header.tsx \
        desktop/src/features/chat-agent/components/agent/agent-header.test.tsx \
        desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx 2>/dev/null
git commit -m "feat(desktop): port agent-header (verbatim)"
```

### Task B3: Port `ContextUsageBadge`

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/context-usage-badge.tsx` (~419 LOC)
- Test: `desktop/src/features/chat-agent/components/agent/context-usage-badge.test.tsx`

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/agent/ContextUsageBadge.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Follow the same import-classification process as B2. Stub any out-of-scope sibling components in `agentview-bridge-stub.tsx`.

- [ ] **Step 3: Write mount test**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { ContextUsageBadge } from './context-usage-badge'

describe('ContextUsageBadge', () => {
  it('renders idle state without throwing', () => {
    const { container } = render(
      <Provider>
        <ContextUsageBadge />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
```

Supply minimal placeholder props if required.

- [ ] **Step 4: Run tests + audit + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/agent/context-usage-badge.test.tsx
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent/context-usage-badge.{tsx,test.tsx}
git add desktop/src/features/chat-agent/components/agent/context-usage-badge.tsx \
        desktop/src/features/chat-agent/components/agent/context-usage-badge.test.tsx \
        desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx 2>/dev/null
git commit -m "feat(desktop): port context-usage-badge (verbatim)"
```

---

## Wave C — `AgentMessages` (the 1,267-LOC big port)

### Task C1: Port `AgentMessages`

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/agent-messages.tsx` (~1,267 LOC)
- Test: `desktop/src/features/chat-agent/components/agent/agent-messages.test.tsx`

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentMessages.tsx
wc -l /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentMessages.tsx
```

- [ ] **Step 2: Apply the full retarget table**

The deep dependency closure is already in our tree:
- `@/components/ui/image-lightbox` → `@/shared/ui/image-lightbox`
- `@/components/welcome/WelcomeEmptyState` → `@/features/chat-agent/components/welcome-empty-state`
- `@/components/ai-elements/scroll-minimap` → `@/features/chat-agent/components/ai-elements/scroll-minimap`
- `@/components/ai-elements/sticky-user-message` → `@/features/chat-agent/components/ai-elements/sticky-user-message`
- `@/lib/proma-ui` (useSmoothStream) → `@/shared/lib/use-smooth-stream`
- `@/components/chat/UserAvatar` → `@/features/chat-agent/components/user-avatar`
- `@/components/chat/CopyButton` → `@/features/chat-agent/components/copy-button`
- `@/components/chat/ChatMessageItem` (formatMessageTime export) → `@/features/chat-agent/lib/format-message-time`
- `@/components/ui/button` → `@/shared/ui/button`
- `@/lib/model-logo` → `@/features/chat-agent/lib/model-logo`
- `./ToolActivityItem` (ToolActivityList export) → `@/features/chat-agent/components/tool-activity-item`
- `./ContentBlock` (ThinkingBlock export) → `@/features/chat-agent/components/content-block`
- `./NativeBlockRenderer` → `@/features/chat-agent/components/native-block-renderer`
- `@/components/chat/ChatToolActivityIndicator` → `@/features/chat-agent/components/chat-tool-activity-indicator`
- `@/atoms/<name>` → `@/features/chat-agent/atoms/<name>`
- `@/components/chat/ProactiveLearningChip` → `@/features/chat-agent/components/proactive-learning-chip`
- `@/components/chat/MemoryRecallChip` → `@/features/chat-agent/components/memory-recall-chip`
- `@/lib/skill-citation` → `@/features/chat-agent/lib/skill-citation`
- `@/lib/utils` → `@/shared/lib/cn`

Audit storage-key literals: any `'uclaw...'` → `'hermes...'`. The `uclaw:scroll-to-message` window event name (Plan 3.3 carry-forward #1) is ALSO addressed here — rebrand it to `hermes:scroll-to-message`. ALSO update the matching emitter in `desktop/src/features/chat-agent/components/ai-elements/conversation.tsx` to keep listener + dispatcher in sync.

- [ ] **Step 3: Write integration tests**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AgentMessages } from './agent-messages'

describe('AgentMessages', () => {
  it('renders empty state when no messages', () => {
    const { container } = render(
      <Provider>
        <AgentMessages messages={[]} sessionId="test" />
      </Provider>,
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('mounts WelcomeEmptyState when message list is empty', () => {
    const { queryByTestId, container } = render(
      <Provider>
        <AgentMessages messages={[]} sessionId="test" />
      </Provider>,
    )
    // welcome-empty-state SHOULD be reachable — verify by data-testid OR by element selector
    expect(container.querySelector('[data-testid="welcome-empty-state"], [data-welcome]')).not.toBeNull()
  })
})
```

Inspect AgentMessages' actual prop signature (likely `sessionId`, `messages`, `isStreaming`, possibly more) — match the test.

If the test needs WelcomeEmptyState to have a `data-testid`, add it as a one-line attribute edit (test seam pattern).

- [ ] **Step 4: Run tests + audit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/agent/agent-messages.test.tsx
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent/agent-messages.{tsx,test.tsx} \
  desktop/src/features/chat-agent/components/ai-elements/conversation.tsx
```
Expected: pass + EMPTY (the `uclaw:scroll-to-message` rebrand should drop conversation.tsx out of the grep).

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/agent-messages.tsx \
        desktop/src/features/chat-agent/components/agent/agent-messages.test.tsx \
        desktop/src/features/chat-agent/components/ai-elements/conversation.tsx
git commit -m "feat(desktop): port agent-messages (verbatim, 1,267 LOC); closes Plan 3.3 FU #1 (uclaw:scroll-to-message rebrand)"
```

---

## Wave D — `AgentView` shell + bridge stub

### Task D1: Create `agentview-bridge-stub.tsx`

**File:**
- Create: `desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx`

This file collects ALL ~36 typed placeholder symbols that AgentView imports but that belong to 4.b/4.c/4.d. Each is a typed function or React component. Components render a visible inert placeholder (so the UI is debuggable, not blank). Functions throw NOT_IMPLEMENTED.

- [ ] **Step 1: Enumerate AgentView's stubbed imports**

Run:
```bash
grep -E "^import" /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentView.tsx | grep -v "react\|jotai\|lucide-react\|sonner\|motion\|@tauri-apps"
```

Cross-reference against the 4.a real-port list (AgentMessages, AgentHeader, ContextUsageBadge, AttachmentPreviewItem, RichTextInput, AgentSessionProvider — these are NOT stubbed). Everything else gets a stub.

Group stubs by destination plan for clear documentation:
- **4.b** (banners + status + permission modes): `AgentHeartbeatBanner`, `AskUserBanner`, `ExitPlanModeBanner`, `PlanModeSuggestBanner`, `AutomationRunBanner`, `PlanModeDashedBorder`, `PermissionBanner`, `QueuedMessagesBanner`, `PermissionModeSelector`, `StrategyPresetSelector`, `AgentStatusBar`
- **4.c** (STT): `SttModal`, `FirstRunDialog`, `SpeechButton`, `modelStatusAtom` (atom, from stt-atoms), `smartJoin` (function, from lib/stt/punctuation)
- **4.d** (pet + browser preview + model selector): `PetWidget`, `BrowserPreviewOverlay`, `AutoPreviewPopover`, `ProviderModelSelector`
- **Tauri bridge** (likely real later but stubbed for now): `invoke` from `@tauri-apps/api/core` — keep as real npm import, do NOT stub

- [ ] **Step 2: Write the stub file**

```typescript
// desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx
//
// Plan 2b.2.c.4.a — placeholder symbols for the AgentView verbatim port.
// Every export here is scheduled for a real port in 4.b / 4.c / 4.d.
//
// Components render a visible inert placeholder DOM node (so the UI is
// debuggable in `pnpm tauri dev`, not silently blank). Functions throw
// NOT_IMPLEMENTED at call time so accidental invocations surface loudly.

import * as React from 'react'

// Helper for component stubs — renders a debug-visible placeholder
function makeStubComponent(symbol: string, plan: string) {
  return function StubComponent(_props: Record<string, unknown>): React.ReactElement {
    return (
      <div
        data-stub={symbol}
        data-deferred-to={plan}
        className="hermes-stub"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    )
  }
}

function makeStubFn(symbol: string, plan: string) {
  return (..._args: unknown[]): never => {
    throw new Error(`NOT_IMPLEMENTED_IN_PLAN_2_B_2_C_4_A:${symbol} (deferred to ${plan})`)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Plan 2b.2.c.4.b — banners + status + permission modes
// ────────────────────────────────────────────────────────────────────────────
export const AgentHeartbeatBanner = makeStubComponent('AgentHeartbeatBanner', '4.b')
export const AskUserBanner = makeStubComponent('AskUserBanner', '4.b')
export const ExitPlanModeBanner = makeStubComponent('ExitPlanModeBanner', '4.b')
export const PlanModeSuggestBanner = makeStubComponent('PlanModeSuggestBanner', '4.b')
export const AutomationRunBanner = makeStubComponent('AutomationRunBanner', '4.b')
export const PlanModeDashedBorder = makeStubComponent('PlanModeDashedBorder', '4.b')
export const PermissionBanner = makeStubComponent('PermissionBanner', '4.b')
export const QueuedMessagesBanner = makeStubComponent('QueuedMessagesBanner', '4.b')
export const PermissionModeSelector = makeStubComponent('PermissionModeSelector', '4.b')
export const StrategyPresetSelector = makeStubComponent('StrategyPresetSelector', '4.b')
export const AgentStatusBar = makeStubComponent('AgentStatusBar', '4.b')

// ────────────────────────────────────────────────────────────────────────────
// Plan 2b.2.c.4.c — STT
// ────────────────────────────────────────────────────────────────────────────
import { atom } from 'jotai'
export const SttModal = makeStubComponent('SttModal', '4.c')
export const FirstRunDialog = makeStubComponent('FirstRunDialog', '4.c')
export const SpeechButton = makeStubComponent('SpeechButton', '4.c')
export const modelStatusAtom = atom<'idle' | 'loading' | 'ready' | 'error'>('idle')
export const smartJoin = makeStubFn('smartJoin', '4.c') as (a: string, b: string) => string

// ────────────────────────────────────────────────────────────────────────────
// Plan 2b.2.c.4.d — pet + browser preview + model selector
// ────────────────────────────────────────────────────────────────────────────
export const PetWidget = makeStubComponent('PetWidget', '4.d')
export const BrowserPreviewOverlay = makeStubComponent('BrowserPreviewOverlay', '4.d')
export const AutoPreviewPopover = makeStubComponent('AutoPreviewPopover', '4.d')
export const ProviderModelSelector = makeStubComponent('ProviderModelSelector', '4.d')
```

Adjust the set + types based on what Step 1's grep surfaces. The list above is the expected baseline.

- [ ] **Step 3: Write a smoke test**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  AgentHeartbeatBanner,
  PetWidget,
  modelStatusAtom,
} from './agentview-bridge-stub'

describe('agentview-bridge-stub', () => {
  it('component stubs render hidden placeholders with data attributes', () => {
    const { container } = render(<AgentHeartbeatBanner />)
    const stub = container.querySelector('[data-stub="AgentHeartbeatBanner"]')
    expect(stub).not.toBeNull()
    expect(stub?.getAttribute('data-deferred-to')).toBe('4.b')
  })

  it('atom stubs have a default value usable by atomValue', () => {
    expect(modelStatusAtom).toBeDefined()
  })

  it('pet widget renders nothing visible', () => {
    const { container } = render(<PetWidget />)
    expect(container.querySelector('[data-stub="PetWidget"]')).not.toBeNull()
  })
})
```

- [ ] **Step 4: Run tests + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/lib/agentview-bridge-stub.test.tsx
cd ..
git add desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx \
        desktop/src/features/chat-agent/lib/agentview-bridge-stub.test.tsx
git commit -m "feat(desktop): create agentview-bridge-stub.tsx for Plan 2b.2.c.4.a (deferred 4.b/c/d symbols)"
```

### Task D2: Port `AgentView` shell

**Files:**
- Create: `desktop/src/features/chat-agent/components/agent/agent-view.tsx` (~1,926 LOC port)
- Test: `desktop/src/features/chat-agent/components/agent/agent-view.test.tsx`

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentView.tsx
wc -l /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentView.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Apply the comprehensive retarget table. For each import line, classify into one of:

| Category | Retarget |
|---|---|
| Already in tree (real) | use `@/features/chat-agent/atoms/*`, `@/features/chat-agent/components/agent/*`, `@/features/chat-agent/components/ai-elements/*`, `@/shared/ui/*`, `@/shared/lib/cn`, `@/features/chat-agent/lib/*`, `@/lib/bridge/<sub>` |
| Stubbed in agentview-bridge-stub.tsx (Plan 4.a stub) | `@/features/chat-agent/lib/agentview-bridge-stub` |
| Bridge symbol not yet shipped | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@tauri-apps/api/core` (invoke) | keep as-is (real npm package) |

If ANY import still doesn't resolve, classify it: add to agentview-bridge-stub.tsx with documented destination plan and a TODO comment.

- [ ] **Step 3: Storage-key rebrand sweep**

```bash
grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent/agent-view.tsx
```
Replace each occurrence with `'hermes[:-]'`.

- [ ] **Step 4: Write mount + smoke tests**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { AgentView } from './agent-view'

describe('AgentView', () => {
  it('mounts without throwing', () => {
    const { container } = render(
      <Provider>
        <AgentView sessionId="test-session" />
      </Provider>,
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('contains the agent message stream region', () => {
    const { container } = render(
      <Provider>
        <AgentView sessionId="test-session" />
      </Provider>,
    )
    // AgentView mounts AgentMessages which mounts welcome-empty-state for an empty session
    expect(container.querySelector('[data-testid="agent-view"], main, [role="main"]')).not.toBeNull()
  })

  it('stubbed banners render hidden placeholders not visible spinners', () => {
    const { container } = render(
      <Provider>
        <AgentView sessionId="test-session" />
      </Provider>,
    )
    const stubs = container.querySelectorAll('[data-stub]')
    expect(stubs.length).toBeGreaterThan(0)
    stubs.forEach((s) => {
      expect((s as HTMLElement).getAttribute('aria-hidden')).toBe('true')
    })
  })
})
```

Inspect AgentView's actual props (likely `sessionId`, possibly more) and supply minimal placeholders.

Add a `data-testid="agent-view"` attribute to AgentView's outer wrapper as a one-line test seam edit (Plan 3.3 precedent for LeftSidebar and AppShell).

- [ ] **Step 5: Run tests + audit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/agent/agent-view.test.tsx
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent/agent-view.{tsx,test.tsx}
```
Expected: pass + EMPTY.

EXPECT this step to surface multiple missing imports on first run. For each, classify per the convention table and either retarget or add to agentview-bridge-stub.tsx.

- [ ] **Step 6: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent/agent-view.tsx \
        desktop/src/features/chat-agent/components/agent/agent-view.test.tsx \
        desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx
git commit -m "feat(desktop): port agent-view shell (verbatim, 1,926 LOC; banners/STT/pet/preview stubbed)"
```

---

## Wave E — AppShell rewire + App.tsx session-id derivation + integration tests + final sweep

### Task E1: Rewire AppShell to mount AgentView

**Files:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx`
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.test.tsx`
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

- [ ] **Step 1: Read current app-shell.tsx**

- [ ] **Step 2: Swap the import + JSX**

Replace:
```typescript
import { ChatAgentView } from '@/features/chat-agent/components/chat-agent-view'
// ...
<ChatAgentView sessionId={SESSION_ID} />
```

With:
```typescript
import { AgentView } from '@/features/chat-agent/components/agent/agent-view'
import { AgentSessionProvider } from '@/features/chat-agent/contexts/session-context'
// ...
<AgentSessionProvider sessionId={SESSION_ID}>
  <AgentView />
</AgentSessionProvider>
```

The `SESSION_ID = 'default'` placeholder constant stays in app-shell.tsx for THIS PR — its replacement with workspace-derived session id is Task E2. Document the deferral with an inline comment.

Note: the existing `<ChatAgentView />` import + file are NOT deleted. They stay in the tree for rollback safety until Plan 2b.2.c.4.d retires the slim shell.

- [ ] **Step 3: Update app-shell tests**

The existing tests assert AppShell mounts `data-testid="left-sidebar"` and `data-testid="app-shell-main"` — those should still pass. Add a new assertion that the main pane now contains `data-testid="agent-view"`:

```typescript
// In app-shell.test.tsx — extend an existing test or add a new one
it('main pane contains AgentView', () => {
  const { container } = render(<Provider><AppShell /></Provider>)
  expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
})
```

Update the integration test similarly — replace any reference to `data-testid="chat-agent-view"` (if present) with `data-testid="agent-view"`.

- [ ] **Step 4: Run AppShell tests + full suite**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/app-shell/
pnpm vitest run 2>&1 | tail -5
```
Expected: AppShell tests pass; full suite still passes (zero regressions vs the base SHA — currently 611 tests at HEAD `eee46f8fd`).

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/app-shell/
git commit -m "feat(desktop): rewire AppShell main pane to mount AgentView (Plan 2b.2.c.4.a)"
```

### Task E2: Replace `SESSION_ID = 'default'` with workspace-derived id

**Files:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx`
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx` (add a test exercising the swap)

Closes Plan 3.3 carry-forward #4.

- [ ] **Step 1: Read existing workspace atoms**

```bash
grep -nE "^export.*(activeWorkspaceId|currentSessionId|currentAgentSessionId)" desktop/src/features/chat-agent/atoms/workspace.ts desktop/src/features/chat-agent/atoms/agent-atoms.ts
```

The likely derivation is: `currentAgentSessionIdAtom` from `agent-atoms`. If null, fall back to the previous `'default'` constant.

- [ ] **Step 2: Refactor app-shell.tsx**

```typescript
import { useAtomValue } from 'jotai'
import { currentAgentSessionIdAtom } from '@/features/chat-agent/atoms/agent-atoms'

// Inside AppShell():
const sessionId = useAtomValue(currentAgentSessionIdAtom) ?? 'default'

// ...
<AgentSessionProvider sessionId={sessionId}>
  <AgentView />
</AgentSessionProvider>
```

- [ ] **Step 3: Add an integration test**

```typescript
import { currentAgentSessionIdAtom } from '@/features/chat-agent/atoms/agent-atoms'

it('AppShell threads the currentAgentSessionId through to AgentView', () => {
  const store = createStore()
  store.set(currentAgentSessionIdAtom, 'my-custom-session-id')
  const { container } = render(<Provider store={store}><AppShell /></Provider>)
  // AgentSessionProvider sets a data attribute or context; assert against either
  expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  // The context is verified inside the AgentSessionProvider test (Task A3)
})
```

- [ ] **Step 4: Run + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/app-shell/
cd ..
git add desktop/src/features/chat-agent/components/app-shell/
git commit -m "feat(desktop): derive AppShell sessionId from currentAgentSessionIdAtom (closes Plan 3.3 FU #4)"
```

### Task E3: Cross-cutting integration tests for AgentView in AppShell

**Files:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx` (extend)

Add ≥5 new test cases covering the AgentView mount + interactions:

- [ ] **Step 1: Add the test cases**

```typescript
describe('AppShell + AgentView integration (Plan 2b.2.c.4.a)', () => {
  it('AgentView renders in main pane', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    const main = container.querySelector('[data-testid="app-shell-main"]')
    expect(main?.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })

  it('stubbed banners render hidden placeholders, not visible UI noise', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    const stubs = container.querySelectorAll('[data-stub]')
    expect(stubs.length).toBeGreaterThan(5) // expect at least the visible banner stubs
    stubs.forEach((s) => {
      expect((s as HTMLElement).getAttribute('aria-hidden')).toBe('true')
    })
  })

  it('end-to-end mount of AppShell produces zero console.error calls', () => {
    const errs: unknown[][] = []
    const orig = console.error
    console.error = (...args: unknown[]) => { errs.push(args); orig(...args) }
    render(<Provider><AppShell /></Provider>)
    console.error = orig
    expect(errs).toEqual([])
  })

  it('layout: LeftSidebar + AgentView siblings under app-shell root', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    expect(container.querySelector('[data-testid="left-sidebar"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })

  it('workspace-derived sessionId reaches AgentView context', () => {
    const store = createStore()
    store.set(currentAgentSessionIdAtom, 'session-foo')
    const { container } = render(<Provider store={store}><AppShell /></Provider>)
    expect(container.querySelector('[data-testid="agent-view"]')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
cd ..
git add desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "test(desktop): extend AppShell integration suite for AgentView mount"
```

### Task E4: Final sweep + manual launch gate

- [ ] **Step 1: Frontend full sweep**

```bash
cd desktop
pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | grep -v "vite.config.ts\|updater.ts(.*Cannot find module\|test files" | tail -20
```
Expected: 640+ tests pass; pre-existing TS errors only (`vite.config.ts` node:path / `import.meta.dirname` — those pre-date Plan 3.3).

- [ ] **Step 2: Backend sweep**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agentview
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings 2>&1 | tail -10
cargo test --workspace 2>&1 | tail -10
```
Expected: all green (no backend changes in 4.a, but verify nothing accidentally regressed).

- [ ] **Step 3: Anti-god-file + storage-key audit**

```bash
ls desktop/src/lib/
# Expected: only `bridge/`

git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/ desktop/src/lib/
# Expected: only JSDoc rebrand notes; the uclaw:scroll-to-message event must be GONE (Task C1 rebranded it)
```

- [ ] **Step 4: Parity governance**

```bash
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3
```
Expected: clean.

- [ ] **Step 5: Manual launch gate**

```bash
cd desktop && pnpm tauri dev
```
Expected:
- Window opens
- LeftSidebar visible
- Main pane renders AgentView (header with model picker placeholder area, message stream showing welcome empty state, composer at bottom)
- Banners/STT/pet/browser-preview surfaces are absent (their stubs render display:none)
- No red console errors

Document any visible-but-unexpected issues as carry-forward follow-ups.

- [ ] **Step 6: Commit any fmt/clippy fixes**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-agentview
git status
git add -A
git commit -m "chore(desktop): Plan 2b.2.c.4.a final fmt/clippy sweep" 2>/dev/null || true
git log --oneline -5
```

---

## Final Self-Review Checklist (orchestrator-side, before opening PR)

- [ ] Wave A: active-model, shortcut-atoms, ui-preferences extension, session-context all ported
- [ ] Wave B: attachment-preview-item, agent-header, context-usage-badge all ported with mount tests
- [ ] Wave C: agent-messages ported with `uclaw:scroll-to-message` → `hermes:scroll-to-message` rebrand on BOTH the listener (agent-messages.tsx) AND the dispatcher (conversation.tsx)
- [ ] Wave D: agentview-bridge-stub.tsx contains documented stubs for every AgentView import not landing in 4.a; agent-view.tsx ported verbatim
- [ ] Wave E: AppShell rewired to mount AgentView; sessionId derived from currentAgentSessionIdAtom (closes Plan 3.3 FU #4); integration tests extended; final sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains ONLY `bridge/`
- [ ] Storage-key audit: zero `'uclaw[:-]'` in any new file
- [ ] Slim `ChatAgentView` file NOT deleted (retired in 4.d)
- [ ] Test count up by ≥29 (was 611 → ≥640)
- [ ] Manual `pnpm tauri dev` launch passes
- [ ] All commits use conventional commit prefixes

---

## Carry-Forward Follow-ups (for the 4.b / 4.c / 4.d successors)

1. **9 banner components + 3 status/permission components** — stubbed in `agentview-bridge-stub.tsx`, real ports in 4.b
2. **STT module surface** (4 components + 2 lib files + 1 atom + 1 fn) — stubbed in `agentview-bridge-stub.tsx`, real ports in 4.c (may need Tauri-side microphone capture commands as backend prereq)
3. **PetWidget + BrowserPreviewOverlay + AutoPreviewPopover + ProviderModelSelector** — stubbed in `agentview-bridge-stub.tsx`, real ports in 4.d
4. **Slim ChatAgentView retirement** — `desktop/src/features/chat-agent/components/chat-agent-view.tsx` should be deleted in 4.d once the full AgentView has shipped end-to-end
5. **`agentview-bridge-stub.tsx` deletion** — once 4.d ships, the stub file should be empty/deletable
6. **Closes Plan 3.3 FU #1** (uclaw:scroll-to-message rebrand) via Task C1
7. **Closes Plan 3.3 FU #4** (SESSION_ID derivation) via Task E2
