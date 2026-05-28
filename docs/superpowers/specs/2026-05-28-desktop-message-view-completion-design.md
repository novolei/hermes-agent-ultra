# Desktop Message-View Completion — Design Spec (Plan 2b.2.c family)

**Status:** Draft for user approval (approved in brainstorming session 2026-05-28)
**Date:** 2026-05-28
**Stacked on:** main at `1138fad` (post-merge of PRs #1 / #3-7 / fmt cleanup)
**Branches produced:** `feat/desktop-tool-renderers` (c.1), `feat/desktop-composer-and-atoms` (c.2), `feat/desktop-app-wiring` (c.3)

---

## 1. Goal

Replace every peripheral stub introduced in Plan 2b.2.b.2 with real uclaw-fidelity implementations, then wire `App.tsx` to render the full message view driven by the Plan 2b.1 `listenAgent` → `applyAgentEvent` pipeline. After Plan 2b.2.c.3 ships, the desktop app delivers the **end-to-end vertical slice** the ADR promised: type a message → uclaw's full message view streams the reply with real tool activities + thinking.

## 2. Non-goals

- Full `AgentView.tsx` port (uclaw's 1,926-LOC top-level orchestrator including permission modes, plan mode, channel switcher, status bar, header) → Plan 3 / 3.5
- Speech-to-text button + onnxruntime STT stack → future audio plan
- Named multi-themes + Dock theme picker → Plan 3
- `gbrain-result.tsx` (uclaw-specific tool renderer) → never, unless Hermes adds a gbrain-equivalent
- File-preview window + focus mode → Plan 3.5
- Settings page → Plan 4.5

## 3. Scope: 3-plan family

uclaw's transitive dep surface from the 2b.2.b.2 stubs is ~9,200 LOC. The work is split into three stacked plans (each shipping working software):

### 3.1 Plan 2b.2.c.1 — Tool-rendering subsystem (~3,400 LOC)

Real tool result rendering + Anthropic content-block dispatch + compaction UI. After c.1, `AgentMessages` renders real tool activities (still not wired to `App.tsx`).

**Ports (verbatim from uclaw):**
- `components/agent/tool-renderers/` — 8 generic renderers + `index.tsx` dispatcher + `pierre-theme.ts`
  - `bash-result.tsx`, `BashStreamView.tsx`, `read-result.tsx`, `write-result.tsx`, `edit-result.tsx`, `collapsible-result.tsx`, `default-result.tsx`, `screenshot-result.tsx`
  - **SKIP** `gbrain-result.tsx` (uclaw-specific)
- `components/agent/ToolActivityItem.tsx` (693 LOC) + `tool-utils.ts` (553 LOC) + `tool-phrase.ts` (382 LOC)
- `components/agent/ContentBlock.tsx` (609 LOC) — ThinkingBlock + assorted content renderers
- `components/agent/NativeBlockRenderer.tsx` (97 LOC) — Anthropic block dispatcher
- `components/agent/SDKMessageRenderer.tsx` (1,150 LOC) — CompactingIndicator + CompactBoundaryDivider + raw SDK message rendering

**Stubs replaced (deleted from `features/chat-agent/components/stubs/`):**
- `tool-activity-list.tsx` (real ToolActivityList from ToolActivityItem)
- `content-block.tsx` (real ThinkingBlock + NativeBlockRenderer)
- `sdk-message-renderer.tsx` (real CompactingIndicator + CompactBoundaryDivider)

**Carry-forward followup addressed:** Plan 2b.2.b.1 #1 — port the real `useSmoothStream` implementation now that streaming content rendering matters for tool output.

**Target tests:** ≥40 new (8 renderers × ~3 tests + ToolActivityItem suite + ContentBlock/SDKMessageRenderer ports preserving uclaw tests).

### 3.2 Plan 2b.2.c.2 — Composer + chat-side atoms + real chips (~2,200 LOC)

Real input composer, real chat-side state, real chip components. After c.2, only the App.tsx wiring + ChatAgentView container remain stubbed.

**Ports (verbatim from uclaw):**
- Composer module (`components/composer/`): `composer-serialize.ts` (57) + `composer-serialize.test.ts` (134) + `MentionChipNode.ts` (137) + `ComposerMentionController.tsx` (381) + `ComposerMentionPopup.tsx` (117)
- `components/ai-elements/rich-text-input.tsx` (222 LOC) — deferred from Plan 2b.2.b.1
- Chat-side atoms: `atoms/chat-atoms.ts` (225) + `atoms/tab-atoms.ts` (195) + `atoms/agent-display-name.ts` (56) + `atoms/ui-preferences.ts` (84)
- Real chips: `agent/SkillCitationChips.tsx` (112), `agent/SkillRecallChips.tsx` (218), `chat/MemoryRecallChip.tsx` (166), `chat/ProactiveLearningChip.tsx` (96), `chat/ChatToolBlock.tsx` (155), `chat/ChatToolActivityIndicator.tsx` (71)

**Stubs replaced (deleted from `features/chat-agent/components/stubs/` + `lib/peripheral-stubs.ts`):**
- `skill-chips.tsx`, `learning-chips.tsx` (deleted; consumers import real chips)
- Atom shadows in `peripheral-stubs.ts` deleted; consumers repoint to real atoms in `atoms/`. The file shrinks to only the Tauri-bridge no-op shims (which c.3 also removes).

**Carry-forward followups addressed:**
- **2b.2.c-A** atom consolidation (real atoms replace stub shadows)
- **2b.2.c-C** recon doc inaccuracy (one-line edit to `2026-05-28-desktop-agent-messages-recon.md`)

**Target tests:** ≥20 new (composer suite preserving uclaw tests + chips smoke tests + atom default-value tests).

### 3.3 Plan 2b.2.c.3 — ChatAgentView + App.tsx wiring + ScrollPositionMemory (~600 LOC + integration)

The end-to-end gate. After c.3, the desktop app is functional.

**New (NOT a verbatim port):**
- `desktop/src/features/chat-agent/components/chat-agent-view.tsx` (~250 LOC) — slim container that mounts `RichTextInput` (composer) + `AgentMessages` (message view) + minimal session header. **Invented for desktop**; the equivalent uclaw `AgentView.tsx` is 1,926 LOC including permission/plan-mode/channel-switcher concerns that belong to Plan 3.

**Ports:**
- `hooks/useScrollPositionMemory.ts` (36 LOC) → `desktop/src/features/chat-agent/hooks/use-scroll-position-memory.ts` (filename kebab-cased)
- Real Tauri attachment bridge in Rust: `read_attachment` + `save_image_as` Tauri commands (or defer to Plan 3.5 if file-preview is the rightful owner)

**Modifications:**
- `desktop/src/app/App.tsx` — replace MVP composer with `<ChatAgentView />`; subscribe to `listenAgent`; map Tauri events → `applyAgentEvent`. **This is the first App.tsx change since Plan 1.**
- `desktop/src/features/chat-agent/components/agent-messages.tsx` — close **2b.2.c-B** (move error banner above EmptyState branch so first-turn errors surface)

**Stubs replaced (deleted):**
- `stubs/scroll-position-manager.tsx` (real hook in place)
- `peripheral-stubs.ts` (deleted entirely; Tauri shims become real commands or move to Plan 3.5)
- `lib/preview-chip-stubs.tsx` — if file-preview chips ship in c.3 (otherwise Plan 3.5)

**Acceptance gate:** After c.3 lands, manually launch `cargo tauri dev` (or `pnpm --dir desktop dev`), type a message, visually verify uclaw's message view renders the streamed reply with real tool activities and thinking blocks.

**Target tests:** ≥15 integration tests covering App.tsx + ChatAgentView end-to-end with a mock Tauri runtime fixture.

## 4. Architectural principles preserved across c.1 / c.2 / c.3

1. **Anti-god-file:** stub→real swap-in must NOT introduce barrel files. One component per file under `features/chat-agent/components/`. `desktop/src/lib/` stays at `bridge/` only. After c.3, `features/chat-agent/components/stubs/` directory is **empty**.

2. **Verbatim-port discipline:** every real component is a verbatim copy from uclaw with only import retargets + TS strict-mode tweaks. Any divergence carries an inline `// Plan-X follow-up:` comment.

3. **Stub-replacement protocol:** each sub-plan deletes specific stub files (listed in §3.1/§3.2/§3.3). Validation: `git log --diff-filter=D --name-only <sub-plan-parent>..HEAD -- desktop/src/features/chat-agent/components/stubs/` shows the right deletions.

4. **No App.tsx changes before c.3:** `git diff main -- desktop/src/app/App.tsx` returns empty until c.3 starts.

5. **Backend invariants:** `cargo test -p hermes-desktop --lib` continues to pass 21 tests across all three sub-plans. The only Rust changes happen in c.3 (Tauri attachment commands, if not deferred).

## 5. Cumulative test growth target

| Plan | Test floor (cumulative) | Delta |
|---|---|---|
| Plan 2b.2.b.2 (current main) | 282 | — |
| Plan 2b.2.c.1 | 322 | +40 |
| Plan 2b.2.c.2 | 342 | +20 |
| Plan 2b.2.c.3 | 357 | +15 |

Backend stays at 21 throughout (or grows minimally if c.3 adds Tauri command tests).

## 6. Acceptance criteria summary

### c.1 ships when:
- All real tool-rendering files present + 3 stub files deleted (`tool-activity-list`, `content-block`, `sdk-message-renderer`)
- ≥40 new frontend tests pass + existing 282 still pass
- Real `useSmoothStream` implementation in place (follow-up 2b.2.b.1 #1 closed)
- Build clean (tsc + vite + cargo)
- App.tsx untouched
- Final reviewer: APPROVED or APPROVED_WITH_FOLLOWUPS

### c.2 ships when:
- All composer + atom + chip files present + 2 stub files deleted (`skill-chips`, `learning-chips`) + atom shadows removed from `peripheral-stubs.ts`
- ≥20 new tests pass + existing pass
- Follow-ups 2b.2.c-A + 2b.2.c-C closed
- Build clean
- App.tsx still untouched
- Final reviewer: APPROVED or APPROVED_WITH_FOLLOWUPS

### c.3 ships when:
- `ChatAgentView` mounts in `App.tsx` (the first App.tsx change since Plan 1)
- `stubs/` directory is **empty** (all 6 stub files deleted across c.1/c.2/c.3)
- `peripheral-stubs.ts` deleted (real atoms + real Tauri bridge in place, or stubs migrated to Plan 3.5 for file preview)
- ≥15 new integration tests pass
- Follow-ups 2b.2.c-B closed (+ 2b.2.b.1 #3 if dead handlers cleaned)
- **Manual launch gate:** `pnpm --dir desktop dev` (or `cargo tauri dev`) launches the desktop app; typing a message renders the streamed reply with tool activities and thinking
- Build clean
- Final reviewer: APPROVED or APPROVED_WITH_FOLLOWUPS

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Tool renderers import a missing helper (e.g., a syntax-highlighting wrapper from uclaw's `lib/`) | c.1 Task 1 recon enumerates every import upfront — same pattern as Plans 2b.2.b.1/b.2 recon (which caught spec gaps before any port commits) |
| Composer module's TipTap Mention extension requires custom CSS not in our globals | c.2 Task 1 recon checks for `.mention-*` CSS classes referenced by MentionChipNode; ports them as part of theme-tokens.css if found |
| `App.tsx` wiring exposes a mismatch between `listenAgent`'s event shape and what `applyAgentEvent` expects | c.3 includes a "wire-up test" using a mock Tauri event stream (Plan 2b.2.a's integration test pattern extended to App.tsx) |
| Manual launch gate (c.3) fails because of a runtime issue not caught by tests | c.3 reserves time for manual smoke testing; if a blocker surfaces, scope to a fix-task before final review |
| `useScrollPositionMemory` race between session-switch and persistent message load | Port verbatim including uclaw's existing fade-in logic; existing AgentMessages port from 2b.2.b.2 already accounts for the `ready` state |
| Plan 2b.2.b.2 follow-ups (c-A, c-B, c-C) accidentally skipped | Each is explicitly listed in the "ships when" criteria for its sub-plan |

## 8. Decision log (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Scope split | 3-way: c.1 tool-rendering / c.2 composer+atoms+chips / c.3 wiring | Recon revealed 9,200 LOC transitive surface; single PR would defeat stacked-PR discipline |
| AgentView vs slim ChatAgentView | **Invent slim ChatAgentView** in c.3 | uclaw's AgentView.tsx is 1,926 LOC including permission/plan-mode/channel-switcher concerns that belong to Plan 3/3.5. Slim version (~250 LOC) is just the message-view container we need now. |
| `gbrain-result.tsx` | **Skip** | uclaw-specific tool renderer; no gbrain tool in Hermes |
| Tauri attachment bridge (`readAttachment`/`saveImageAs`) | Implement in c.3 IF straightforward, otherwise defer to Plan 3.5 | Real implementation needs file-system access patterns that may belong with the file-preview window |
| Real `useSmoothStream` | Land in c.1 | Tool output streaming exercises smooth-streaming visually; the stub from 2b.2.b.1 is no longer adequate when real tool results arrive |
| Scroll-minimap dead handlers (2b.2.b.1 #3) | Leave as-is unless upstream resolves; or trim in c.3 | Cosmetic; uclaw upstream parity preferred |
| Test fidelity | Port uclaw's existing tests where they exist (tool-renderers, composer-serialize) | 1:1 behavioral fidelity; cheaper than writing fresh tests |

## 9. Next plans (post-2b.2.c)

- **Plan 3** — Navigation spine: Workspace + ARC sidebar + bottom Dock + multi-theme + named theme palettes
- **Plan 3.5** — App Shell: right panel + file preview + focus mode (the real `readAttachment` / `saveImageAs` Tauri commands land here if not in c.3)
- **Plan 4** — cn-desktop domain screens (Hermes领域屏幕)
- **Plan 4.5** — Settings window (openhuman-style)
- **Plan 7** — Packaging + distribution
