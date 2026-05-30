# Plan chat.b — Desktop chat Core Message Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Second PR of the **ChatView sub-stack** (chat.a ✅ #27 → chat.b → chat.c). Port the 5 core message-rendering files from the uclaw `chat/` cluster verbatim: `InlineEditForm`, `ChatMessageItem`, `ParallelChatMessages`, `ChatMessages`, `ChatInput`. Plus 2 small prereq components (`WelcomeEmptyState`, `SkillSuggestionBar`) and 3 IPC stubs. After this PR, `ChatMessages` + `ChatInput` exist as the message pipeline that chat.c's `ChatView` root composes.

**Architecture:** Verbatim port discipline (PRs #18–#27). Byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/` with standardized retargets. The layer is ~99% unblocked — chat.a + earlier ports landed every leaf component, ai-element, atom, and hook these 5 files consume. Linear DAG (no circular deps): InlineEditForm → ChatMessageItem → ParallelChatMessages/ChatMessages; ChatInput independent.

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 · Tailwind v3 · lucide-react · TipTap (RichTextInput, already ported) · sonner. Package manager **pnpm**. **No new npm deps.**

---

## Closure summary

| Group | Files | LOC |
|---|---|---|
| Foundation: 3 IPC stubs | readAttachment, listSkills, listLearnedSkills | ~20 |
| Prereq component (port real, small) | SkillSuggestionBar (125) | ~125 |
| Core message files | InlineEditForm (259), ChatMessageItem (258), ParallelChatMessages (383), ChatMessages (353), ChatInput (463) | ~1,716 |
| Smoke tests | 2 mount tests (uclaw ships none for these 5) | ~120 |
| **Total** | **~8 files** | **~1,980 + tests** |

All atoms/hooks/leaves/ai-elements already exist (verified). **`WelcomeEmptyState` is ALREADY PORTED** at `components/welcome-empty-state.tsx` (flat path — do NOT re-port; ChatMessages retargets to it). Only `readAttachment`/`listSkills`/`listLearnedSkills` IPC stubs + `SkillSuggestionBar` are net-new prereqs.

---

## File Structure

### New files
```
desktop/src/features/chat-agent/
├── components/
│   ├── agent/skill-suggestion-bar.tsx                 # NEW (Wave A2, 125 LOC verbatim — port real, not stub)
│   └── chat/
│       ├── inline-edit-form.tsx                       # NEW (Wave B1, 259 LOC)
│       ├── chat-message-item.tsx                      # NEW (Wave B2, 258 LOC)
│       ├── parallel-chat-messages.tsx                 # NEW (Wave B3, 383 LOC)
│       ├── chat-messages.tsx                          # NEW (Wave B4, 353 LOC) + smoke test
│       └── chat-input.tsx                             # NEW (Wave B5, 463 LOC) + smoke test
```

### Modified files
```
desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts   # MODIFY (Wave A1: readAttachment + listSkills + listLearnedSkills)
```

### Existing prereqs (verified — DO NOT re-port)
- ✅ ai-elements: message, reasoning, context-divider, conversation, scroll-minimap, provider-avatar, rich-text-input, speech-button (`components/ai-elements/`)
- ✅ chat.a leaves: provider-model-selector, clear-context-button, context-settings-popover, tool-selector-popover, feishu-notify-toggle, attachment-preview-item, migrate-to-agent-button, delete-message-dialog (`components/chat/`)
- ✅ already-ported: copy-button, chat-tool-activity-indicator, native-block-renderer, user-avatar (`components/`), composer-mention-controller (`components/composer/`), git-chips-row (`components/chat/git/`)
- ✅ stt: stt-modal, first-run-dialog (`components/stt/`)
- ✅ atoms: user-profile, chat-atoms (channelsAtom, streamingModelAtom, conversationDraftsAtom, PendingAttachment), agent-display-name, tab-atoms (tabMinimapCacheAtom), stt-atoms (modelStatusAtom), active-model (activeProviderModelAtom), shortcut-atoms (sendWithCmdEnterAtom)
- ✅ hooks: use-conversation-settings (useConversationParallelMode, useConversationThinkingEnabled), use-scroll-position-memory (ScrollPositionManager), use-smooth-stream (`shared/lib/`)
- ✅ lib: model-logo (resolveModelDisplayName), file-utils (fileToBase64), clipboard-attachment (createClipboardTextFile), stt/punctuation (smartJoin), shortcut-registry, tips (getAgentWelcomeMessage), chat-types (ChatMessage, FileAttachment, ChatToolActivity)
- ✅ IPC: `openFileDialog` (exists)

---

## Standard Retargets Table

| uclaw import | hermes retarget |
|---|---|
| `@/components/ui/<x>` | `@/shared/ui/<x>` |
| `@/components/chat/<X>` (sibling) | relative `./<kebab>` |
| `@/components/ai-elements/<X>` | `@/features/chat-agent/components/ai-elements/<kebab>` |
| `@/components/agent/NativeBlockRenderer` | `@/features/chat-agent/components/native-block-renderer` |
| `@/components/agent/SkillSuggestionBar` | `@/features/chat-agent/components/agent/skill-suggestion-bar` (ported Wave A2) |
| `@/components/welcome/WelcomeEmptyState` | `@/features/chat-agent/components/welcome-empty-state` (ALREADY PORTED — flat path, do NOT re-port) |
| `@/components/composer/<X>` | `@/features/chat-agent/components/composer/<kebab>` |
| `@/components/stt/<X>` | `@/features/chat-agent/components/stt/<kebab>` |
| `@/components/<other>/<X>` (copy-button, user-avatar, etc.) | `@/features/chat-agent/components/<kebab>` |
| `@/atoms/<x>` | `@/features/chat-agent/atoms/<x>` |
| `@/lib/utils` (cn) | `@/shared/lib/cn` |
| `@/lib/<model-logo\|file-utils\|clipboard-attachment\|shortcut-registry\|tips\|stt/punctuation\|chat-types>` | `@/features/chat-agent/lib/<kebab>` |
| `@/lib/tauri-bridge` | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/hooks/<X>` | `@/features/chat-agent/hooks/<kebab>` (or `@/shared/lib/use-smooth-stream` for that one) |
| `@tauri-apps/api/core` (raw invoke), `sonner`, `motion/react` | unchanged |

**Canonical NOT_IMPLEMENTED marker:** `NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: <snake_case>` (the ChatView sub-stack family, started in chat.a).

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

## Wave A — Foundation: 3 IPC stubs + 2 prereq components

### Task A1: Add `readAttachment` + `listSkills` + `listLearnedSkills` IPC stubs

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (append)

- [ ] **Step 1: Verify absent + check SkillInfo/LearnedSkill types**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chat-messages/desktop
grep -nE "export (async function|const) (readAttachment|listSkills|listLearnedSkills)\b" src/features/chat-agent/lib/tauri-bridge-stub.ts || echo "all 3 absent"
grep -nE "interface SkillInfo\b|type SkillInfo\b|interface LearnedSkill\b|type LearnedSkill\b" src/features/chat-agent/lib/tauri-bridge-stub.ts src/features/chat-agent/lib/chat-types.ts || echo "Skill types may need adding"
```

- [ ] **Step 2: Append the new section**
```ts
// === Plan chat.b additions ===
// ─── message-attachment + skill IPC stubs ─────────────────────────────────────
// InlineEditForm/ChatInput call readAttachment; SkillSuggestionBar calls listSkills/
// listLearnedSkills. All throw NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND until the Rust
// commands ship. Signatures from uclaw lib/tauri-bridge.ts (lines 1532, 1263, 706).

export async function readAttachment(_localPath: string): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: read_attachment')
}
export async function listSkills(): Promise<SkillInfo[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: list_skills')
}
export async function listLearnedSkills(_spaceId: string = 'default'): Promise<LearnedSkill[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: list_learned_skills')
}
```
**SkillInfo / LearnedSkill types:** find them in uclaw (`grep -rn "interface SkillInfo\b\|interface LearnedSkill\b" /Users/ryanliu/Documents/uclaw/ui/src/lib/`). If they exist in hermes already (grep found them), import/reuse. If not, port the exact interface bodies from uclaw into this section (or `chat-types.ts`) — SkillSuggestionBar consumes specific fields, so the shape must match its verbatim usage. If the shape is loose in uclaw (uses `any`), a permissive `{ id: string; name: string; [key: string]: unknown }` is acceptable — but prefer the exact uclaw shape.

- [ ] **Step 3: tsc + tests**
```bash
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4   # expect 1035
```

- [ ] **Step 4: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chat-messages
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add readAttachment + listSkills + listLearnedSkills IPC stubs (chat.b Wave A1)"
git show --stat HEAD | head -4
```

### Task A2: Port `SkillSuggestionBar` (small real component)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SkillSuggestionBar.tsx` (125)
- Create: `desktop/src/features/chat-agent/components/agent/skill-suggestion-bar.tsx`

(`WelcomeEmptyState` is ALREADY PORTED at `components/welcome-empty-state.tsx` — do NOT re-port; ChatMessages retargets to it in B4.)

Small + self-contained — port REAL (not stub). It renders nothing when `listSkills`/`listLearnedSkills` reject/return [] (so it's empty on the throwing stubs, gracefully).

- [ ] **Step 1: Port `skill-suggestion-bar.tsx` verbatim**

Retargets: cn, `@/lib/tauri-bridge` (listSkills, listLearnedSkills)→`@/features/chat-agent/lib/tauri-bridge-stub`. Read the source to confirm it `.catch()`es the IPC rejections (so it renders empty on the throwing stubs). If it doesn't gracefully handle rejection, the verbatim port still compiles + the throw is caught by its effect's error handling — but verify it doesn't crash on mount. Add attribution.

- [ ] **Step 2: tsc + tests**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chat-messages/desktop
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4
```

- [ ] **Step 3: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chat-messages
git add desktop/src/features/chat-agent/components/agent/skill-suggestion-bar.tsx
git commit -m "feat(desktop): port SkillSuggestionBar prereq (chat.b Wave A2, verbatim)"
git show --stat HEAD | head -4
```

---

## Wave B — The 5 core message files (DAG order, verbatim)

Port each verbatim with the retarget table + 1-line attribution. After porting each, audit its imports — every `@/...` must resolve to an existing hermes path or a Wave-A stub/component. Raw `invoke('stt_model_status')` in ChatInput stays verbatim. `window.addEventListener('proma:clear-context'/'proma:focus-input')` in ChatInput stays verbatim.

### Task B1: `InlineEditForm.tsx` (259) → `inline-edit-form.tsx`
No chat.b sibling deps. Retargets: MessageAction (ai-elements/message), attachment-preview-item, cn, chat-types, file-utils (fileToBase64), tauri-bridge-stub (readAttachment, openFileDialog). Exports `InlineEditForm` + `InlineEditSubmitPayload` type. Commit `feat(desktop): port inline-edit-form (chat.b Wave B1, verbatim)`.

### Task B2: `ChatMessageItem.tsx` (258) → `chat-message-item.tsx`
Imports `./inline-edit-form` (InlineEditForm + re-exports InlineEditSubmitPayload), plus ai-elements/message+reasoning, copy-button, migrate-to-agent-button, delete-message-dialog, user-avatar, provider-avatar, native-block-renderer, chat-tool-activity-indicator, model-logo, atoms (user-profile, chat-atoms channelsAtom, agent-display-name), chat-types. Exports `ChatMessageItem` + `formatMessageTime`. Commit `feat(desktop): port chat-message-item (chat.b Wave B2, verbatim)`.

### Task B3: `ParallelChatMessages.tsx` (383) → `parallel-chat-messages.tsx`
Imports `./chat-message-item` (ChatMessageItem, formatMessageTime, InlineEditSubmitPayload), ai-elements (context-divider, message, reasoning, provider-avatar), atoms (chat-atoms streamingModelAtom, agent-display-name), chat-types. Commit `feat(desktop): port parallel-chat-messages (chat.b Wave B3, verbatim)`.

### Task B4: `ChatMessages.tsx` (353) → `chat-messages.tsx` + smoke test
Imports `./chat-message-item`, `./parallel-chat-messages`, ai-elements (message, conversation, scroll-minimap, context-divider, reasoning), chat-tool-activity-indicator, welcome-empty-state (already ported), use-smooth-stream (`@/shared/lib/use-smooth-stream`), use-scroll-position-memory (ScrollPositionManager), use-conversation-settings (useConversationParallelMode), provider-avatar, atoms (user-profile, tab-atoms, agent-display-name), chat-types. Commit `feat(desktop): port chat-messages + smoke test (chat.b Wave B4, verbatim)`.

Smoke test `chat-messages.test.tsx`: mount `<ChatMessages>` with a store seeded with 1–2 messages (read the props — likely `messages`, `conversationId`, callbacks); assert a message renders + empty-state path. Inline shim. ≥2 assertions.

### Task B5: `ChatInput.tsx` (463) → `chat-input.tsx` + smoke test
The most complex. Imports the chat.a leaves (provider-model-selector, clear-context-button, context-settings-popover, tool-selector-popover, attachment-preview-item, feishu-notify-toggle), git-chips-row, ai-elements (rich-text-input, speech-button), composer-mention-controller, stt (stt-modal, first-run-dialog), skill-suggestion-bar (Wave A2), shortcut-registry, lib (file-utils, clipboard-attachment, stt/punctuation), atoms (chat-atoms conversationDraftsAtom + PendingAttachment, stt-atoms modelStatusAtom, active-model, shortcut-atoms), use-conversation-settings (useConversationThinkingEnabled), tauri-bridge-stub (openFileDialog), raw `invoke('stt_model_status')`. Commit `feat(desktop): port chat-input + smoke test (chat.b Wave B5, verbatim)`.

Smoke test `chat-input.test.tsx`: mount `<ChatInput>` (read props — likely `conversationId`, `onSend`, disabled flags); mock `tauri-bridge-stub` + `@tauri-apps/api/core` (stt_model_status); assert the input textarea/RichTextInput + send button render. Inline shim + TooltipProvider. ≥2 assertions.

After each: `cd desktop && npx tsc -b 2>&1 | grep -c "error TS"` (expect 28) + `npm test` + targeted commit + `git show --stat`.

---

## Wave C — Final sweep

- [ ] **Step 1: Anti-god-file** — `find desktop/src/lib -type f -not -path '*/bridge/*'` → empty.
- [ ] **Step 2: Storage-key audit** — `git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/chat-agent/components/chat/ desktop/src/features/chat-agent/components/welcome/ desktop/src/features/chat-agent/components/agent/skill-suggestion-bar* || echo clean`.
- [ ] **Step 3: Branch pollution** — `git diff main..HEAD --name-only | grep -vE "^desktop/|^docs/superpowers/" || echo "clean"`. If any `crates/`/`docs/parity/`, `git restore` it.
- [ ] **Step 4: Un-retargeted scan** — `grep -rn "@/components/chat\|@/components/ai-elements\|@/components/agent/SkillSuggestionBar\|@/components/welcome/WelcomeEmptyState\|@/atoms/\|@/lib/tauri-bridge\b\|@/test-utils/render" desktop/src/features/chat-agent/components/chat/inline-edit-form.tsx desktop/src/features/chat-agent/components/chat/chat-message-item.tsx desktop/src/features/chat-agent/components/chat/parallel-chat-messages.tsx desktop/src/features/chat-agent/components/chat/chat-messages.tsx desktop/src/features/chat-agent/components/chat/chat-input.tsx | grep -v "tauri-bridge-stub" || echo "all retargeted"`.
- [ ] **Step 5: tsc + final tests** — `cd desktop && npx tsc -b 2>&1 | grep -c "error TS"` (expect 28); `npm test -- --reporter=dot 2>&1 | tail -10` (0 failing).
- [ ] **Step 6: Commit only if a fixable issue surfaced** — targeted; `chore(desktop): Plan chat.b final sweep`.

---

## Final Self-Review Checklist

- [ ] Wave A: 3 IPC stubs + SkillSuggestionBar (WelcomeEmptyState already ported)
- [ ] Wave B: 5 core files ported in DAG order (InlineEditForm → ChatMessageItem → ParallelChatMessages → ChatMessages → ChatInput) + 2 smoke tests
- [ ] Anti-god-file: `desktop/src/lib/` only `bridge/`
- [ ] Test count up by ≥2 (1035 → ≥1037; the 2 smoke tests)
- [ ] tsc residual stable at 28
- [ ] No branch pollution; every commit verified via `git show --stat`
- [ ] No un-retargeted uclaw paths; chat-view-stub NOT touched (replaced in chat.c)
- [ ] `InlineEditSubmitPayload` type flows correctly (defined in inline-edit-form, re-exported by chat-message-item, consumed by parallel + messages)
- [ ] Canonical `NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND` marker for the 3 new stubs

---

## Carry-Forward Follow-ups

After chat.b merges:
1. **Plan chat.c — ChatView root + git workbench** (~2,300 LOC): `ChatView` (REPLACES `chat-view-stub`), `ChatHeader`, `GitWorkbenchDialog` + `GitActionsPicker*` + `useGitWorkbench`. ChatView composes `ChatMessages` + `ChatInput` (this PR) + the chat.a leaves. After chat.c, TabContent's chat tabs render the real ChatView.
2. **Wire the tab shell into app-shell** (deferred from FB.c) — once ChatView is real.
3. **Rust backends** for the chat IPC stubs: `read_attachment`, `list_skills`, `list_learned_skills` (this PR) + `list_channels`/`update_conversation_model`/`migrate_chat_to_agent`/`get_chat_tools`/`update_chat_tool_state` (chat.a) + chat.c message-lifecycle (`send_message`, `get_conversation_messages`, `delete_message`, etc.).
