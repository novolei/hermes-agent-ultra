# Desktop AgentView 4-Way Stack Design

> Spec drafted 2026-05-29, supersedes the original "Plan 2b.2.c.4 = full AgentView port" scope item from `2026-05-28-desktop-navigation-spine-design.md`. The original 7,000 LOC estimate undercounted; actual dependency closure is ~15,000 LOC across 41 import targets. Splitting into 4 stacked PRs to keep each deliverable mergeable, reviewable, and independently shippable.

**Parent goal:** Replace the slim `<ChatAgentView />` (Plan 2b.2.c.3, ~174 LOC) in AppShell's main pane with the full uclaw `<AgentView />` (1,926 LOC + ~40 sibling components), restoring the complete agent chat experience: banners, status bar, permission modes, plan mode, STT, pet widget, browser preview, model selector.

## Why split (recon evidence)

Recon at HEAD `eee46f8fd` (post-Plan 3.3 + 5 hotfixes):

| Source | LOC | Files |
|---|---|---|
| `uclaw/ui/src/components/agent/AgentView.tsx` alone | 1,926 | 1 |
| `uclaw/ui/src/components/agent/` full dir (excl. tests) | 11,773 | 51 |
| `uclaw/ui/src/components/chat/` full dir (excl. tests) | 7,365 | 36 |
| AgentView's direct imports | ~30 from agent/ + 5 from chat/ + 3 from ai-elements + 2 from stt + 1 context | ~41 files |
| Estimated verbatim closure (port targets + their transitive deps + tests) | ~15,000 | ~80 files |

Plan 3.3 (the prior mega-PR) landed ~4,330 LOC + tests over 24 commits and surfaced 5 post-merge hotfixes (mostly bundler/runtime issues subagent tests didn't catch). A 3.5× larger PR would amplify those failure modes. The 4-way split lets each stack member ship the user-visible improvement that PR promises without coupling 41 verbatim ports into one review surface.

## The Four PRs

Each is independently mergeable. Each carries its own implementation plan doc, follows the established Hermes verbatim-port conventions (kebab-case files, `@/features/chat-agent/*` layout, anti-god-file invariant), and includes integration tests.

### Plan 2b.2.c.4.a — AgentView Shell (THIS STACK MEMBER)

Mounts `<AgentView />` in AppShell's main pane immediately. The shell renders the core chat experience: header, message stream, composer. Everything else (banners, STT, pet, browser preview, model selector) is stubbed with NOT_IMPLEMENTED placeholders that render as visible-but-inert DOM nodes. User can chat with agent; banners/STT/pet/etc. surfaces are visibly missing but the spine works.

**Real ports (~3,933 LOC plus closure):**
- `components/agent/AgentView.tsx` (1,926 LOC) — verbatim, ALL ~36 stubbed imports redirected to `agentview-bridge-stub.tsx`
- `components/agent/AgentMessages.tsx` (1,267 LOC) — verbatim, may need `ScrollMinimap` + `StickyUserMessage` from `ai-elements/` as prereq
- `components/agent/AgentHeader.tsx` (159 LOC)
- `components/agent/ContextUsageBadge.tsx` (419 LOC) — used in the header, real here so the badge is functional from PR 4.a
- `components/chat/AttachmentPreviewItem.tsx` (102 LOC)
- `contexts/session-context.tsx` (60 LOC) → `desktop/src/features/chat-agent/contexts/session-context.tsx`
- `atoms/active-model.ts` (28 LOC)
- `atoms/shortcut-atoms.ts` (29 LOC)
- `atoms/ui-preferences.ts` extension — add `agentStatusBarEnabledAtom`

**Stubbed (real ports in 4.b/4.c/4.d), placed in `desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx`:**
- 9 banner components (Heartbeat, AskUser, ExitPlanMode, PlanModeSuggest, AutomationRun, PlanModeDashedBorder, PermissionBanner, QueuedMessages) → 4.b
- PermissionModeSelector, StrategyPresetSelector, AgentStatusBar → 4.b
- SttModal, FirstRunDialog, SpeechButton, stt-atoms, lib/stt/punctuation, modelStatusAtom → 4.c
- PetWidget, BrowserPreviewOverlay, AutoPreviewPopover, ProviderModelSelector → 4.d

**AppShell rewire:** main pane mounts `<AgentView />` instead of `<ChatAgentView />`. The slim ChatAgentView stays in the repo (no deletion) until 4.d ships — gives us a rollback target.

**Bridge/RPC promotions:** none. All net-new bridge symbols stay as `NOT_IMPLEMENTED_IN_PLAN_2_B_2_C_4_A:<symbol>` stubs.

**Carry-forwards into the stack:** every stubbed import is a tracked debt for 4.b/c/d.

### Plan 2b.2.c.4.b — Banners + Status + Permission Modes

Replaces all stubs in `agentview-bridge-stub.tsx` corresponding to:
- 9 banner components: `AgentHeartbeatBanner`, `AskUserBanner`, `ExitPlanModeBanner`, `PlanModeSuggestBanner`, `AutomationRunBanner`, `PlanModeDashedBorder`, `PermissionBanner`, `QueuedMessagesBanner`
- `PermissionModeSelector`, `StrategyPresetSelector` (header controls)
- `AgentStatusBar` (bottom status row)

Estimated ~3,000 LOC. Real banner behavior wires permission/plan-mode atoms, automation events, queued-message state. May surface new atoms (`permission-atoms`, `plan-mode-atoms`, etc.) — port each as a new file per Plan 3.3 B2 lesson (never modify pre-existing verbatim files).

### Plan 2b.2.c.4.c — STT (Speech to Text) Module

- `atoms/stt-atoms.ts` (size TBD)
- `lib/stt/punctuation.ts` (size TBD)
- `components/stt/SttModal.tsx`, `components/stt/FirstRunDialog.tsx`
- `components/ai-elements/speech-button.tsx`

Estimated ~2,500 LOC. STT is a self-contained feature surface — real port may also need backend Tauri commands for microphone capture; if so, treat them as a prereq commit like Plan 3.3 F1.

### Plan 2b.2.c.4.d — Pet + Browser Preview + Model Selector

- `components/agent/PetWidget.tsx` — animated state visualizer tied to memory consolidation
- `components/agent/BrowserPreviewOverlay.tsx`, `components/agent/BrowserViewer.tsx`
- `components/agent/AutoPreviewPopover.tsx`
- `components/chat/ProviderModelSelector.tsx` — the model picker in the composer toolbar

Estimated ~3,000 LOC. After 4.d, `agentview-bridge-stub.tsx` should be empty and can be deleted. The slim ChatAgentView from Plan 2b.2.c.3 can also be retired at this point (delete the file).

## Anti-God-File Invariants (carried from Plan 3.3)

- `desktop/src/lib/` MUST contain ONLY `bridge/`. New shared utilities go under `desktop/src/features/chat-agent/lib/`. (B2 lesson: separate file > consolidation into existing verbatim files.)
- One module per file. kebab-case filenames, PascalCase exports.
- Storage keys rebranded `'uclaw-*'` → `'hermes-*'` in every `atomWithStorage` call.
- DO NOT modify pre-existing verbatim-ported files. If a missing symbol is needed by a new port, create a NEW stub file at `desktop/src/features/chat-agent/lib/<symbol>-stub.ts` and retarget the import.

## Bridge Stub Discipline (carried from Plan 3.3 E1)

Every stub is a typed function or component that throws `NOT_IMPLEMENTED_IN_PLAN_2_B_2_C_4_A:<symbol>` (or appropriate plan ID) at call time. The verbatim ports import the stub by its real symbol name; only the source module path changes. The Hermes bridge realization sequence (Plan 3.3 F1's pattern) graduates a stub to a real Tauri command + typed wrapper in `@/lib/bridge/<sub>.ts`, then deletes the stub. The same sequence applies here for stt/automation/permission RPCs.

## Test Discipline

Each PR ships with:
- Component unit tests (vitest, `jotai/vanilla` for atom-only tests, `jotai` for mixed Provider tests)
- Integration tests (`app-shell.integration.test.tsx` extensions covering new surfaces)
- Manual launch gate (`pnpm tauri dev` opens a window the user can visually verify)

## Risk Reduction vs Single Mega-PR

| Risk | Mega-PR | 4-Way Stack |
|---|---|---|
| Post-merge bundler hotfixes (Plan 3.3 had 5) | likely 10+ | bounded per stack member |
| Verbatim diff review surface | ~15,000 LOC | 3,500-3,000-2,500-3,000 per PR |
| Stub-vs-real classification errors | compound across PR | bounded per stack |
| Rollback granularity | all-or-nothing | per-stack-member |
| User-visible progress checkpoints | only at merge | after each PR |
| Manual launch gate cadence | only at end | after every PR |

## Acceptance per Stack Member

Each PR's plan doc defines its own self-review checklist. The parent stack is "done" when 4.d merges and `agentview-bridge-stub.tsx` is empty/deleted.

## Carry-Forwards from Plan 3.3 (still relevant)

These follow-ups remain open after Plan 3.3 and should be picked up by whichever stack member touches the relevant surface:

1. **`uclaw:scroll-to-message` window event** in `conversation.tsx` — rebrand to `hermes:scroll-to-message`. Likely touched by 4.a's AgentMessages port.
2. **`moveAgentSessionToWorkspace` return type `any`** in `tauri-bridge-stub.ts` — type properly when the real Tauri command ships. Not in scope for 4.a-d.
3. **hermes-agent test flakiness** (`test_repo_review_tool_profile_keeps_todo_filters_messaging`, `test_prefetch_all_wraps_in_fence`) — needs `#[serial_test]`. Not in scope for 4.a-d unless a backend commit touches the same test file.
4. **`SESSION_ID = 'default'` constant** in `app-shell.tsx` — replace with derived workspace atom. 4.a should address this since AgentView consumes the active session id from context.
