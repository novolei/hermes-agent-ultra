# Plan chat.a — Desktop chat Leaf Components + Tool Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** First PR of the **ChatView sub-stack** (chat.a → chat.b → chat.c). Port the 13 genuinely-missing Layer-0 leaf components from the uclaw `chat/` cluster (selectors, popovers, dialogs, banners) verbatim, plus 5 IPC stubs. This is the foundation layer everything above (ChatMessages/ChatInput in chat.b, ChatView in chat.c) builds on. (The tool-rendering pair `ChatToolBlock`/`ChatToolActivityIndicator` + the chips `MemoryRecallChip`/`ProactiveLearningChip`/`CopyButton` are already ported — see the SKIP list.) Does NOT replace the `chat-view-stub` (that lands in chat.c when the ChatView root is ported).

**Architecture:** Verbatim port discipline (PRs #18–#26). Byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/` with standardized retargets + IPC-stub substitution. The leaves are mostly self-contained (popovers/dialogs/banners) reusing already-ported atoms + ai-elements + the existing `user-avatar`/`native-block-renderer` components. 5 new IPC stubs. No content stubs needed (the recon's flagged NativeBlockRenderer + ComposerMentionController already exist as real hermes components).

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 · Tailwind v3 · lucide-react · react-markdown. Package manager **pnpm**. **No new npm deps.**

---

## Sub-stack decomposition (for context — this PR is chat.a only)

| PR | Scope | LOC |
|---|---|---|
| **chat.a (THIS PR)** | Layer-0 leaf components + tool rendering + 5 IPC stubs | ~2,400 |
| chat.b | Core message rendering (ChatMessageItem, InlineEditForm, ParallelChatMessages, ChatMessages, ChatInput) | ~2,300 |
| chat.c | ChatView root (replaces chat-view-stub) + git workbench cluster | ~2,300 |

The chat/ cluster is a clean DAG (no circular deps); ChatView reuses 9 already-ported ai-elements components, so net port is ~5–6k LOC across the 3 PRs.

---

## Leaf component inventory (chat.a scope)

Port these from `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/` (verify each is NOT already ported first — see Wave B preamble):

**13 genuinely-missing leaf components** to port (the 5 struck-through are ALREADY PORTED in hermes `components/` — verified — do NOT re-port; consumers in chat.b/c retarget to the existing paths):

| uclaw file | LOC | Dest (kebab) | IPC used |
|---|---|---|---|
| `SafetyModeSelector.tsx` | 145 | `chat/safety-mode-selector.tsx` | getSafetyPolicy✓, setSafetyMode✓ |
| `ModelSelector.tsx` | 354 | `chat/model-selector.tsx` | listChannels, updateConversationModel |
| `ToolSelectorPopover.tsx` | 155 | `chat/tool-selector-popover.tsx` | getChatTools, updateChatToolState |
| `ContextSettingsPopover.tsx` | 110 | `chat/context-settings-popover.tsx` | — |
| `SystemPromptSelector.tsx` | 96 | `chat/system-prompt-selector.tsx` | getSystemPromptConfig✓ |
| `PromptEditorSidebar.tsx` | 292 | `chat/prompt-editor-sidebar.tsx` | getSystemPromptConfig✓ |
| `ContextStatsModal.tsx` | 176 | `chat/context-stats-modal.tsx` | — |
| `TurnCostBar.tsx` | 120 | `chat/turn-cost-bar.tsx` | — |
| `ContextRing.tsx` | 110 | `chat/context-ring.tsx` | — |
| `AgentRecommendBanner.tsx` | 145 | `chat/agent-recommend-banner.tsx` | createAgentSession✓, migrateChatToAgent |
| `MigrateToAgentButton.tsx` | 109 | `chat/migrate-to-agent-button.tsx` | createAgentSession✓, migrateChatToAgent |
| `ClearContextButton.tsx` | 54 | `chat/clear-context-button.tsx` | — |
| `DeleteMessageDialog.tsx` | 62 | `chat/delete-message-dialog.tsx` | — |

**ALREADY PORTED — SKIP (do NOT re-port; verified via `find`):**
- ~~`MemoryRecallChip`~~ → `components/memory-recall-chip.tsx`
- ~~`ProactiveLearningChip`~~ → `components/proactive-learning-chip.tsx`
- ~~`CopyButton`~~ → `components/copy-button.tsx`
- ~~`ChatToolBlock`~~ → `components/chat-tool-block.tsx`
- ~~`ChatToolActivityIndicator`~~ → `components/chat-tool-activity-indicator.tsx`

✓ = IPC already exists in hermes. The 5 MISSING IPC stubs (Wave A): `listChannels`, `updateConversationModel`, `getChatTools`, `updateChatToolState`, `migrateChatToAgent`.

**NOTE:** `UserAvatar` (`components/user-avatar.tsx`), `NativeBlockRenderer` (`components/native-block-renderer.tsx`), `ComposerMentionController` (`components/composer/composer-mention-controller.tsx`) also already exist — do NOT re-port.

**Test impact:** the 13 missing leaves are test-less popovers/selectors/banners (the only leaf tests, ChatToolBlock + ChatToolActivityIndicator, are already ported). To maintain coverage, write **2 mount smoke tests** for the heaviest leaves — `ModelSelector` and `ContextStatsModal` — in Wave D (see below).

---

## Standard Retargets Table

| uclaw import | hermes retarget |
|---|---|
| `@/components/ui/<x>` | `@/shared/ui/<x>` |
| `@/components/chat/<X>` (sibling) | relative `./<kebab>` (or `@/features/chat-agent/components/chat/<kebab>`) |
| `@/components/chat/UserAvatar` | `@/features/chat-agent/components/user-avatar` |
| `@/components/ai-elements/<X>` | `@/features/chat-agent/components/ai-elements/<kebab>` |
| `@/components/agent/NativeBlockRenderer` | `@/features/chat-agent/components/native-block-renderer` |
| `@/components/agent/<X>` (other) | `@/features/chat-agent/components/agent/<kebab>` (verify ported; if missing, escalate) |
| `@/atoms/<x>` | `@/features/chat-agent/atoms/<x>` |
| `@/lib/utils` (cn) | `@/shared/lib/cn` |
| `@/lib/<model-logo\|markdown\|...>` | `@/features/chat-agent/lib/<kebab>` (verify exists) |
| `@/lib/tauri-bridge` | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/hooks/<X>` | `@/features/chat-agent/hooks/<kebab>` |

**Canonical NOT_IMPLEMENTED marker:** new family for this sub-stack — `NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: <snake_case_command>`.

**Anti-god-file:** `desktop/src/lib/` contains ONLY `bridge/`.

**Git hygiene:** NEVER `git add -A` — worktree accumulates `crates/**/*.rs` + `docs/parity/*` pollution. Targeted adds; verify each commit with `git show --stat HEAD`.

**Test shim:** inline `renderWithProviders` (no `@/test-utils/render`):
```tsx
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'
function renderWithProviders(ui: React.ReactElement, opts?: { store?: ReturnType<typeof createStore> }) {
  return render(<Provider store={opts?.store}>{ui}</Provider>)
}
```
(Add `TooltipProvider`/`userEvent` extension if a ported test needs them — match the uclaw test's wrapper.)

---

## Wave A — Foundation: 5 IPC stubs

**Files:** Modify `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (append)

- [ ] **Step 1: Verify the 5 are absent + check the `Channel` type**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chat-leaves/desktop
grep -nE "export (async function|const) (listChannels|updateConversationModel|getChatTools|updateChatToolState|migrateChatToAgent)\b" src/features/chat-agent/lib/tauri-bridge-stub.ts || echo "all 5 absent"
grep -nE "interface Channel\b|type Channel\b" src/features/chat-agent/lib/tauri-bridge-stub.ts src/features/chat-agent/lib/chat-types.ts || echo "Channel type may need adding"
```

- [ ] **Step 2: Append the new section**

Append to `tauri-bridge-stub.ts`:
```ts
// === Plan chat.a additions ===
// ─── chat leaf-component IPC stubs ────────────────────────────────────────────
// ModelSelector/ToolSelectorPopover/AgentRecommendBanner/MigrateToAgentButton call
// these. All throw NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND until the Rust commands ship.
// Signatures from uclaw lib/tauri-bridge.ts (lines 1341, 1505, 1654, 1743, 1746).

/** A configured IM/model channel. Mirrors uclaw lib/types.ts Channel. */
export interface Channel {
  id: string
  name: string
  kind: string
  [key: string]: unknown
}

export async function listChannels(): Promise<Channel[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: list_channels')
}
export async function updateConversationModel(_conversationId: string, _modelId: string, _channelId: string): Promise<unknown> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: update_conversation_model')
}
export async function migrateChatToAgent(_conversationId: string, _sessionId: string): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: migrate_chat_to_agent')
}
export async function getChatTools(): Promise<unknown[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: get_chat_tools')
}
export async function updateChatToolState(_toolId: string, _patch: unknown): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND: update_chat_tool_state')
}
```
**Verify the `Channel` type:** read uclaw `lib/types.ts` for the real `Channel` shape and replace the permissive body above with the exact fields (keep the `[key: string]: unknown` index only if uclaw's is loose). If a `Channel` type already exists in hermes (grep found it), import/reuse it instead of redeclaring.

**Important:** the verbatim leaf components call these as `listChannels()` etc. (named wrappers). In uclaw the wrappers `.catch()` and return fallbacks (e.g. `getChatTools` returns `[]` on error). The hermes STUBS throw instead (standard discipline) — the COMPONENTS keep their verbatim call sites; at runtime the throw is caught by the component's own error handling OR surfaces as the standard not-implemented error. Do NOT replicate uclaw's `.catch()` fallback in the stub (the stub throws; that's the contract).

- [ ] **Step 3: tsc + tests**
```bash
npx tsc -b 2>&1 | grep -c "error TS"   # expect 28
npm test -- --reporter=dot 2>&1 | tail -4   # expect 1029
```

- [ ] **Step 4: Commit (targeted)**
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-chat-leaves
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add 5 chat leaf-component IPC stubs (chat.a Wave A)"
git show --stat HEAD | head -4
```

---

## Wave B — Selectors + popovers (port verbatim)

**Preamble (applies to EVERY leaf component in Waves B–D):** before porting each file, run `grep -rln "<KebabName>\|<PascalName>" desktop/src/features/chat-agent/components/ | grep -v '\.test\.'` to confirm it isn't already ported (the FB/agent ports covered some chat components). If an equivalent exists, SKIP it (note in the report). Otherwise port verbatim with the retarget table + 1-line attribution. After porting each, audit its import list — every `@/...` import must resolve to an existing hermes path or a Wave-A stub; if a leaf pulls in an unexpected unported dep, port it (if small + leaf) or report DONE_WITH_CONCERNS describing it.

Port these (one commit each, or batched by sub-group):
- [ ] **B1** `SafetyModeSelector.tsx` → `safety-mode-selector.tsx` (getSafetyPolicy/setSafetyMode exist). Commit `feat(desktop): port safety-mode-selector (chat.a Wave B1, verbatim)`.
- [ ] **B2** `ModelSelector.tsx` → `model-selector.tsx` (listChannels/updateConversationModel stubs; model-logo lib). Commit `feat(desktop): port model-selector (chat.a Wave B2, verbatim)`.
- [ ] **B3** `ToolSelectorPopover.tsx` → `tool-selector-popover.tsx` (getChatTools/updateChatToolState stubs; chat-tool-atoms). Commit `feat(desktop): port tool-selector-popover (chat.a Wave B3, verbatim)`.
- [ ] **B4** `ContextSettingsPopover.tsx` → `context-settings-popover.tsx`. Commit `feat(desktop): port context-settings-popover (chat.a Wave B4, verbatim)`.
- [ ] **B5** `SystemPromptSelector.tsx` → `system-prompt-selector.tsx` (getSystemPromptConfig exists). Commit `feat(desktop): port system-prompt-selector (chat.a Wave B5, verbatim)`.
- [ ] **B6** `PromptEditorSidebar.tsx` → `prompt-editor-sidebar.tsx`. Commit `feat(desktop): port prompt-editor-sidebar (chat.a Wave B6, verbatim)`.

After each: `cd desktop && npx tsc -b 2>&1 | grep -c "error TS"` (expect 28) + `npm test` + targeted commit + `git show --stat`.

---

## Wave C — Context/cost widgets + banners/chips

- [ ] **C1** `ContextStatsModal.tsx` → `context-stats-modal.tsx`. Commit `feat(desktop): port context-stats-modal (chat.a Wave C1, verbatim)`.
- [ ] **C2** `TurnCostBar.tsx` → `turn-cost-bar.tsx`. Commit `feat(desktop): port turn-cost-bar (chat.a Wave C2, verbatim)`.
- [ ] **C3** `ContextRing.tsx` → `context-ring.tsx`. Commit `feat(desktop): port context-ring (chat.a Wave C3, verbatim)`.
- [ ] **C4** `AgentRecommendBanner.tsx` → `agent-recommend-banner.tsx` (createAgentSession exists, migrateChatToAgent stub). Commit `feat(desktop): port agent-recommend-banner (chat.a Wave C4, verbatim)`.
- [ ] **C5** `MigrateToAgentButton.tsx` → `migrate-to-agent-button.tsx`. Commit `feat(desktop): port migrate-to-agent-button (chat.a Wave C5, verbatim)`.
- [ ] **C6** `ClearContextButton.tsx` → `clear-context-button.tsx`. Commit `feat(desktop): port clear-context-button (chat.a Wave C6, verbatim)`.
- [ ] **C7** `DeleteMessageDialog.tsx` → `delete-message-dialog.tsx` (`@/shared/ui/alert-dialog`). Commit `feat(desktop): port delete-message-dialog (chat.a Wave C7, verbatim)`.

(MemoryRecallChip, ProactiveLearningChip, CopyButton are ALREADY PORTED — skipped.)

After each: tsc (28) + test + targeted commit + `git show --stat`.

---

## Wave D — 2 mount smoke tests for the heaviest leaves

The 13 ported leaves are test-less in uclaw. Add 2 smoke tests to maintain coverage:

- [ ] **D1** `chat/model-selector.test.tsx` — mount `<ModelSelector>` inside the inline shim; mock `@/features/chat-agent/lib/tauri-bridge-stub` (`listChannels`→`[]`, `updateConversationModel`→resolves) + seed any atom it reads on mount. Assert it renders its trigger (read model-selector.tsx for the trigger text/role — e.g. the current model name or a "选择模型" label). ≥1 meaningful assertion. Commit `feat(desktop): add model-selector smoke test (chat.a Wave D1)`.
- [ ] **D2** `chat/context-stats-modal.test.tsx` — mount `<ContextStatsModal>` (read its props — likely `open`/`onClose` + a stats object) inside the shim; assert it renders the stats section when open. ≥1 meaningful assertion. Commit `feat(desktop): add context-stats-modal smoke test (chat.a Wave D2)`.

After each: tsc (28) + test (+2) + targeted commit + `git show --stat`.

---

## Wave E — Final sweep

- [ ] **Step 1: Anti-god-file** — `find desktop/src/lib -type f -not -path '*/bridge/*'` → empty.
- [ ] **Step 2: Storage-key audit** — `git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/chat-agent/components/chat/ || echo clean`.
- [ ] **Step 3: Branch pollution** — `git diff main..HEAD --name-only | grep -vE "^desktop/|^docs/superpowers/" || echo "clean"`. If any `crates/`/`docs/parity/`, `git restore` it.
- [ ] **Step 4: Un-retargeted scan** — `grep -rn "@/components/chat\|@/components/ai-elements\|@/lib/tauri-bridge\b\|@/atoms/\|@/test-utils/render" desktop/src/features/chat-agent/components/chat/ | grep -v "tauri-bridge-stub" || echo "all retargeted"`.
- [ ] **Step 5: tsc + final tests** — `cd desktop && npx tsc -b 2>&1 | grep -c "error TS"` (expect 28); `npm test -- --reporter=dot 2>&1 | tail -10` (0 failing).
- [ ] **Step 6: Commit only if a fixable issue surfaced** — targeted; `chore(desktop): Plan chat.a final sweep`.

---

## Final Self-Review Checklist

- [ ] Wave A: 5 IPC stubs (+ Channel type) under `NOT_IMPLEMENTED_IN_PLAN_CHAT_BACKEND`
- [ ] Waves B–C: 13 leaf components ported (each verified not-already-ported first)
- [ ] Wave D: 2 mount smoke tests (model-selector, context-stats-modal)
- [ ] Anti-god-file: `desktop/src/lib/` only `bridge/`
- [ ] Test count up by ≥2 (1029 → ≥1031; the 2 new smoke tests)
- [ ] tsc residual stable at 28
- [ ] No branch pollution; every commit verified via `git show --stat`
- [ ] No un-retargeted uclaw paths; UserAvatar/NativeBlockRenderer/ComposerMentionController NOT re-ported (already exist)
- [ ] chat-view-stub NOT touched (replaced in chat.c)
- [ ] Any leaf that turned out already-ported is documented (skipped, not duplicated)

---

## Carry-Forward Follow-ups

After chat.a merges:
1. **Plan chat.b — core message rendering** (~2,300 LOC): ChatMessageItem, InlineEditForm, ParallelChatMessages, ChatMessages, ChatInput (consume chat.a leaves + ported ai-elements). Adds message-lifecycle IPC stubs (sendMessage, getRecentMessages, getConversationMessages, deleteMessage, truncateMessagesFrom, updateContextDividers, stopGeneration).
2. **Plan chat.c — ChatView root + git workbench** (~2,300 LOC): ChatView (REPLACES chat-view-stub), ChatHeader, GitWorkbenchDialog + GitActionsPicker* + useGitWorkbench. After chat.c, TabContent's chat tabs render the real ChatView.
3. **Wire the tab shell into app-shell** (deferred from FB.c) — once ChatView is real, the tab-shell wiring surfaces real chat content.
4. **Rust backends** for the chat IPC stubs (`list_channels`, `update_conversation_model`, `migrate_chat_to_agent`, `get_chat_tools`, `update_chat_tool_state`, + chat.b/c message-lifecycle commands).
