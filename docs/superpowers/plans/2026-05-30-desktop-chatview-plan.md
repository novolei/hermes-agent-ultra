# Plan chat.c — Desktop ChatView Root Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Third and FINAL PR of the **ChatView sub-stack** (chat.a ✅ #27 → chat.b ✅ #28 → chat.c). Port the `ChatView` root + `ChatHeader` + the `useGlobalChatListeners` streaming hook verbatim, add the 9 message-lifecycle IPC stubs, **replace the FB.c `chat-view-stub`** with the real ChatView, and **wire the global chat listeners at the app root** so chat tabs render real, streaming-capable chat content. After this PR, TabContent's chat tabs show the real ChatView and the ChatView sub-stack is complete.

**Architecture:** Verbatim port discipline (PRs #18–#28). Byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/` with standardized retargets. ChatView composes the already-ported `ChatMessages` + `ChatInput` (chat.b) + chat.a leaves/banners + a new `ChatHeader`. **The git workbench (`git/GitWorkbenchDialog` etc., ~1,500 LOC) is OUT OF SCOPE** — ChatView does NOT import it (it's reachable only via the not-yet-ported `app-shell/SidebarGitActions`); it's a documented carry-forward. `@/modules/git/api` is NOT a module to port — git APIs come from `tauri-bridge-stub` (established by the ported BranchPicker).

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 · Tailwind v3 · `@tauri-apps/api/event` (streaming listeners). Package manager **pnpm**. **No new npm deps.**

---

## Closure summary

| Group | Files | LOC |
|---|---|---|
| Foundation: 9 message IPC stubs + onStream*/generateTitle (verify) | tauri-bridge-stub additions | ~80 |
| Prereq hook | useGlobalChatListeners (232) | ~232 |
| ChatHeader | chat-header.tsx (150) | ~150 |
| ChatView root | chat-view.tsx (627) | ~627 |
| Stub swap + root wiring | tab-content retarget + delete stub + app-shell wires the hook | ~10 |
| Smoke tests | 2 mount tests (ChatHeader, ChatView) | ~120 |
| **Total** | **~6 files** | **~1,210 + tests** |

Everything ChatView/ChatHeader consume (ChatMessages, ChatInput, leaves, atoms, ConversationProvider, updateTabTitle) already exists. Net-new: the hook + 9+ IPC stubs + ChatHeader + ChatView.

---

## File Structure

### New files
```
desktop/src/features/chat-agent/
├── hooks/use-global-chat-listeners.ts              # NEW (Wave A2, 232 LOC — exports useGlobalChatListeners + registerPendingTitle + GenerateTitleInput)
└── components/chat/
    ├── chat-header.tsx                             # NEW (Wave B, 150 LOC) + smoke test
    └── chat-view.tsx                               # NEW (Wave C, 627 LOC) + smoke test
```

### Modified files
```
desktop/src/features/chat-agent/
├── lib/tauri-bridge-stub.ts                        # MODIFY (Wave A1: 9 message IPC stubs + verify/add onStream*/generateTitle)
└── components/
    ├── tabs/tab-content.tsx                        # MODIFY (Wave C: retarget ChatView import chat-view-stub → chat-view)
    └── app-shell/app-shell.tsx                     # MODIFY (Wave C: call useGlobalChatListeners() once at root)
```

### Deleted files
```
desktop/src/features/chat-agent/components/chat/chat-view-stub.tsx   # DELETE (Wave C: replaced by real ChatView)
```

### Existing prereqs (verified — DO NOT re-port)
- ✅ chat.b: chat-messages, chat-input (`components/chat/`)
- ✅ chat.a: agent-recommend-banner, prompt-editor-sidebar, system-prompt-selector, chat-appearance-popover (`components/chat/`)
- ✅ ConversationProvider (`contexts/session-context.tsx`); updateTabTitle (`atoms/tab-atoms.ts:199`)
- ✅ atoms: chat-atoms (conversationsAtom, streamingStatesAtom, chatStreamErrorsAtom, chatMessageRefreshAtom, pendingAgentRecommendationAtom, conversationModelsAtom, chatPendingMessageAtom, INITIAL_MESSAGE_LIMIT, ConversationStreamState type), system-prompt-atoms, chat-tool-atoms (activeToolIdsAtom), user-profile, draft-session-atoms, active-model, agent-atoms (agentSessionsAtom), tab-atoms (tabsAtom)
- ✅ hooks: use-conversation-settings (useConversationModel/ContextLength/ThinkingEnabled/PromptId/ParallelMode)
- ✅ lib: cn, chat-types (ChatMessage, FileAttachment, AttachmentSaveInput, ConversationMeta)
- ✅ IPC already stubbed: updateConversationTitle, togglePinConversation, listConversations
- ✅ git APIs come from tauri-bridge-stub (gitIsRepo, gitCurrentBranch, etc.) — NOT a `modules/git/api` module

---

## Standard Retargets Table

| uclaw import | hermes retarget |
|---|---|
| `@/components/ui/<x>` | `@/shared/ui/<x>` |
| `@/components/chat/<X>` (sibling) | relative `./<kebab>` |
| `@/contexts/session-context` (ConversationProvider) | `@/features/chat-agent/contexts/session-context` |
| `@/hooks/useConversationSettings` | `@/features/chat-agent/hooks/use-conversation-settings` |
| `@/hooks/useGlobalChatListeners` | `@/features/chat-agent/hooks/use-global-chat-listeners` |
| `@/atoms/<x>` | `@/features/chat-agent/atoms/<x>` |
| `@/lib/utils` (cn) | `@/shared/lib/cn` |
| `@/lib/chat-types` | `@/features/chat-agent/lib/chat-types` |
| `@/lib/tauri-bridge` | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@tauri-apps/api/core` (raw invoke), `@tauri-apps/api/event` | unchanged |

**Canonical NOT_IMPLEMENTED marker:** `NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: <snake_case>` (the ChatView sub-stack family).

**Anti-god-file:** `desktop/src/lib/` contains ONLY `bridge/`.

**Git hygiene:** NEVER `git add -A` — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted adds; verify each commit with `git show --stat HEAD`.

**Test shim:** inline `renderWithProviders` (no `@/test-utils/render`):
```tsx
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
import { TooltipProvider } from '@/shared/ui/tooltip'
function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}><TooltipProvider>{ui}</TooltipProvider></Provider>)
}
```

---

## Wave A — Foundation: message IPC stubs + global listeners hook

### Task A1: Add 9 message-lifecycle IPC stubs (+ verify onStream*/generateTitle)

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (append)

The 9 message-lifecycle IPCs ChatView calls (all MISSING — verified). Read uclaw `/Users/ryanliu/Documents/uclaw/ui/src/lib/tauri-bridge.ts` for EXACT signatures.

- [ ] **Step 1: Append the message-lifecycle stubs**
```ts
// === Plan chat.c additions ===
// ─── message-lifecycle IPC stubs ──────────────────────────────────────────────
// ChatView drives the message lifecycle via these. All throw
// NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND until the Rust commands ship.
// Signatures from uclaw lib/tauri-bridge.ts — copy exact shapes + any types.

export async function sendMessage(_input: SendMessageInput): Promise<SendMessageResponse> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: send_message')
}
export async function getRecentMessages(_conversationId: string, _limit: number): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: get_recent_messages')
}
export async function getConversationMessages(_conversationId: string): Promise<ChatMessage[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: get_conversation_messages')
}
export async function deleteMessage(_conversationId: string, _messageId: string): Promise<ChatMessage[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: delete_message')
}
export async function truncateMessagesFrom(_conversationId: string, _messageId: string, _preserveFirstMessageAttachments?: boolean): Promise<ChatMessage[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: truncate_messages_from')
}
export async function stopGeneration(_conversationId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: stop_generation')
}
export async function updateContextDividers(_conversationId: string, _dividers: string[]): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: update_context_dividers')
}
export async function saveAttachment(_input: AttachmentSaveInput): Promise<{ attachment: FileAttachment }> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: save_attachment')
}
export async function deleteAttachment(_localPath: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: delete_attachment')
}
```
**Types:** `SendMessageInput` + `SendMessageResponse` — find in uclaw `lib/tauri-bridge.ts`/`lib/types.ts` and port the exact bodies (SendMessageInput ≈ `{ conversationId, content, providerId?, modelId?, thinkingEnabled? }` — verify + include attachments/contextLength fields if present). `ChatMessage`/`FileAttachment`/`AttachmentSaveInput` already in chat-types — import them. Confirm the exact return shapes against uclaw (e.g. `getRecentMessages` returns `{ messages, hasMore }`).

- [ ] **Step 2: Commit (targeted)** `feat(desktop): add 9 message-lifecycle IPC stubs (chat.c Wave A1)`.

### Task A2: Port `useGlobalChatListeners` hook (232 LOC) + verify its stream IPC deps

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/hooks/useGlobalChatListeners.ts` (232)
- Create: `desktop/src/features/chat-agent/hooks/use-global-chat-listeners.ts`

The hook subscribes to Tauri streaming events + manages streaming atoms + title generation. Exports `useGlobalChatListeners()`, `registerPendingTitle(conversationId, input)`, `GenerateTitleInput` type. Its tauri-bridge imports: `onStreamChunk, onStreamReasoning, onStreamComplete, onStreamError, onStreamToolActivity` (stream-event subscribers — likely `listen()` wrappers returning unlisten fns), `listConversations` (exists), `generateTitle`, `updateConversationTitle` (exists).

- [ ] **Step 1: Verify which onStream*/generateTitle already exist**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chatview/desktop
for fn in onStreamChunk onStreamReasoning onStreamComplete onStreamError onStreamToolActivity generateTitle; do
  grep -qE "export (async function|const) $fn\b" src/features/chat-agent/lib/tauri-bridge-stub.ts && echo "EXISTS: $fn" || echo "MISSING: $fn"
done
```
For each MISSING `onStream*`: these are event subscribers — read the uclaw signature (likely `(cb) => Promise<UnlistenFn>` wrapping `listen('chat:stream-*', ...)`). Port them as REAL listen-wrappers (like the existing `onAskUserRequest`/`onStreamComplete` patterns in tauri-bridge-stub) — NOT throwing stubs, because they're event subscriptions that gracefully no-op when the backend never fires (match the existing `onNeedApproval` pattern which `.catch(() => () => {})`). For MISSING `generateTitle`: a throwing `NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: generate_title` stub. Add these to the tauri-bridge-stub `chat.c additions` section.

- [ ] **Step 2: Port the hook verbatim** with retargets (chat-atoms, agent-atoms, tab-atoms updateTabTitle, tauri-bridge-stub). Add attribution.

- [ ] **Step 3: tsc + tests + commit (targeted)** — `feat(desktop): port useGlobalChatListeners hook + stream IPC stubs (chat.c Wave A2, verbatim)`.

After A1/A2: `npx tsc -b 2>&1 | grep -c "error TS"` (expect 19) + `npm test` (1039, unchanged).

---

## Wave B — ChatHeader (+ smoke test)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatHeader.tsx` (150)
- Create: `desktop/src/features/chat-agent/components/chat/chat-header.tsx` + `.test.tsx`

- [ ] **Step 1: Port verbatim** with retargets. Imports: conversationsAtom, useConversationParallelMode, SystemPromptSelector (`./system-prompt-selector`), ChatAppearancePopover (`./chat-appearance-popover`), Button/Tooltip (`@/shared/ui/`), updateConversationTitle + togglePinConversation (exist). Add attribution.

- [ ] **Step 2: Smoke test** `chat-header.test.tsx`: mount `<ChatHeader conversation={...}>` (read the prop shape — likely a ConversationMeta-like object with `id`/`title`); seed a store; assert the title renders + a header control (pin/parallel button). Inline shim + TooltipProvider. ≥2 assertions.

- [ ] **Step 3: tsc + tests + commit (targeted)** — `feat(desktop): port chat-header + smoke test (chat.c Wave B, verbatim)`.

---

## Wave C — ChatView root + stub swap + root wiring (+ smoke test)

### Task C1: Port `ChatView.tsx` (627) → `chat-view.tsx` + smoke test

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatView.tsx` (627)
- Create: `desktop/src/features/chat-agent/components/chat/chat-view.tsx` + `.test.tsx`

- [ ] **Step 1: Port verbatim** with retargets. Imports: `./chat-header`, `./chat-messages`, `./chat-input`, `./agent-recommend-banner`, `./prompt-editor-sidebar`, ConversationProvider (`@/features/chat-agent/contexts/session-context`), use-conversation-settings hooks, `registerPendingTitle` from `@/features/chat-agent/hooks/use-global-chat-listeners`, atoms (chat-atoms, system-prompt-atoms, chat-tool-atoms, user-profile, draft-session-atoms, active-model), the 9 message IPCs (Wave A1), chat-types, cn. Raw `window.addEventListener('proma:stop-generation', ...)` stays verbatim. Exports `export function ChatView(...)`. Add attribution.

- [ ] **Step 2: Smoke test** `chat-view.test.tsx`: mount `<ChatView conversationId="conv-1">` inside the inline shim; mock `tauri-bridge-stub` (getRecentMessages→`{messages:[],hasMore:false}`, getConversationMessages→[], any other mount-effect IPC); assert it renders the 3-segment layout (ChatHeader + ChatMessages region + ChatInput — e.g. `[data-input-mode="chat"]` from ChatInput + a header element). ≥2 assertions, no unhandled rejection.

- [ ] **Step 3: tsc + tests + commit (targeted)** — `feat(desktop): port chat-view root + smoke test (chat.c Wave C1, verbatim)`.

### Task C2: Swap chat-view-stub → real ChatView + delete stub

**Files:** Modify `desktop/src/features/chat-agent/components/tabs/tab-content.tsx`; Delete `chat-view-stub.tsx`

- [ ] **Step 1: Retarget the import**

In `tab-content.tsx`, change:
```ts
import { ChatView } from '@/features/chat-agent/components/chat/chat-view-stub'
```
to:
```ts
import { ChatView } from '@/features/chat-agent/components/chat/chat-view'
```
The usage `<ChatView conversationId={tab.sessionId} />` is unchanged (the real ChatView exports the same named `ChatView` with a `conversationId` prop — verify the prop name matches; if the real ChatView needs more required props, supply sensible values from the tab or make them optional per the verbatim source).

- [ ] **Step 2: Delete the stub**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chatview
rm desktop/src/features/chat-agent/components/chat/chat-view-stub.tsx
grep -rn "chat-view-stub" desktop/src/ || echo "clean — stub fully removed"
```
If the integration test (`app-shell.integration.test.tsx`) asserted on the chat-view-stub's `data-deferred-stub="ChatView"` for chat tabs, update that assertion (the chat tab now renders the real ChatView — assert a real ChatView element instead, OR mock the message IPCs so it mounts). Read the test + the FB.c Group O/P chat-tab assertions; adjust so they pass with the real ChatView (mock getRecentMessages etc. in the integration mock block).

- [ ] **Step 3: tsc + tests + commit (targeted)** — `feat(desktop): swap chat-view-stub → real ChatView in TabContent (chat.c Wave C2)`.

### Task C3: Wire `useGlobalChatListeners()` at the app root

**Files:** Modify `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx`

uclaw calls `useGlobalChatListeners()` once in `App.tsx` (the root) so streaming events populate the atoms. Without this, the real ChatView renders but won't receive streaming updates.

- [ ] **Step 1: Call the hook at the AppShell root**

In `app-shell.tsx`, add near the top of the `AppShell` component body (after existing hook calls):
```ts
import { useGlobalChatListeners } from '@/features/chat-agent/hooks/use-global-chat-listeners'
// ... inside AppShell():
useGlobalChatListeners()
```
Place it alongside the other root-level hooks. It registers Tauri event listeners on mount + cleans up on unmount (the hook handles this). In tests, the listeners gracefully no-op (the onStream* subscribers `.catch()` when Tauri isn't available).

- [ ] **Step 2: tsc + tests** — confirm the app-shell integration tests still pass (the hook's listeners no-op in jsdom). If a test fails because the hook fires an IPC on mount, mock it in the integration mock block.

- [ ] **Step 3: Commit (targeted)** — `feat(desktop): wire useGlobalChatListeners at AppShell root (chat.c Wave C3)`.

---

## Wave D — Final sweep

- [ ] **Step 1: Anti-god-file** — `find desktop/src/lib -type f -not -path '*/bridge/*'` → empty.
- [ ] **Step 2: Storage-key audit** — `git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/chat-agent/components/chat/chat-view* desktop/src/features/chat-agent/components/chat/chat-header* desktop/src/features/chat-agent/hooks/use-global-chat-listeners* || echo clean`.
- [ ] **Step 3: Branch pollution** — `git diff main..HEAD --name-only | grep -vE "^desktop/|^docs/superpowers/" || echo "clean"`. If any `crates/`/`docs/parity/`, `git restore` it.
- [ ] **Step 4: Stub fully removed** — `grep -rn "chat-view-stub" desktop/src/` → empty.
- [ ] **Step 5: Un-retargeted scan** — `grep -rn "@/components/chat\|@/contexts/session-context\|@/hooks/useGlobalChatListeners\|@/hooks/useConversationSettings\|@/atoms/\|@/lib/tauri-bridge\b\|@/test-utils/render" desktop/src/features/chat-agent/components/chat/chat-view.tsx desktop/src/features/chat-agent/components/chat/chat-header.tsx desktop/src/features/chat-agent/hooks/use-global-chat-listeners.ts | grep -v "tauri-bridge-stub" || echo "all retargeted"`.
- [ ] **Step 6: tsc + final tests** — `cd desktop && npx tsc -b 2>&1 | grep -c "error TS"` (expect 19); `npm test -- --reporter=dot 2>&1 | tail -10` (0 failing).
- [ ] **Step 7: Commit only if a fixable issue surfaced** — targeted; `chore(desktop): Plan chat.c final sweep`.

---

## Final Self-Review Checklist

- [ ] Wave A: 9 message IPC stubs + onStream*/generateTitle + useGlobalChatListeners hook
- [ ] Wave B: ChatHeader (+ smoke test)
- [ ] Wave C: ChatView root (+ smoke test) + stub swap + delete chat-view-stub + wire hook at AppShell root
- [ ] Anti-god-file: `desktop/src/lib/` only `bridge/`
- [ ] `chat-view-stub.tsx` deleted; 0 remaining references; `[data-deferred-stub="ChatView"]` no longer in production
- [ ] TabContent renders the REAL ChatView for chat tabs
- [ ] Test count up by ≥4 (1039 → ≥1043: ChatHeader + ChatView smokes + any integration adjustments)
- [ ] tsc residual stable at 19 (no NEW errors)
- [ ] No branch pollution; every commit verified via `git show --stat`
- [ ] Canonical `NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND` marker for the new throwing stubs (onStream* are real listen-wrappers, not throwing)
- [ ] Git workbench NOT ported (documented carry-forward)

---

## Carry-Forward Follow-ups

After chat.c merges, the **ChatView sub-stack is COMPLETE** — chat.a/b/c ported the full chat experience; TabContent's chat tabs render the real ChatView. Remaining:
1. **Git workbench cluster** (~1,500 LOC): `git/GitWorkbenchDialog`, `GitActionsPicker`, `GitActionsPickerForms`, `GitActionsPickerDraftPr`, `useGitWorkbench` + the git IPC stubs (gitDiff, gitCommit, ghAvailable, parseBranchList, gitCommitPushPr). Reachable only via `app-shell/SidebarGitActions` (also unported) — port both together in a future "git workbench" PR. NOT needed for ChatView to function.
2. **Wire the tab shell into app-shell** (deferred from FB.c): replace/wrap `<AgentView>` with `TabBar` + `TabSwitcher` + `MainArea`/`TabContent`. Now that ChatView is real, TabContent renders real chat + agent content — this wiring is finally meaningful.
3. **Rust backends** for ALL accumulated chat IPC stubs: `send_message`, `get_recent_messages`, `get_conversation_messages`, `delete_message`, `truncate_messages_from`, `stop_generation`, `update_context_dividers`, `save_attachment`, `delete_attachment`, `generate_title`, the `chat:stream-*` events, + chat.a/b's stubs (list_channels, get_chat_tools, read_attachment, list_skills, etc.).
