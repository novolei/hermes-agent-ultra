# Desktop Message-Rendering UI — Design Spec (Plan 2b.2.b)

**Status:** Draft for user approval
**Date:** 2026-05-28
**Authors:** Subagent-coordinated brainstorming
**Stacked on:** Plan 2b.2.a (PR #4 — `feat/desktop-message-state`)
**Branches it produces:** `feat/desktop-message-ui-primitives` (2b.2.b.1) and `feat/desktop-agent-messages` (2b.2.b.2)

---

## 1. Goal

Port uclaw's message-view UI surface into the Hermes desktop app, so a later plan (2b.2.c) can wire the existing Plan 2b.2.a Jotai atoms to a `ChatAgentView` container that replaces `App.tsx`'s MVP composer with uclaw's full visual fidelity.

This spec covers everything between **"atoms exist"** (Plan 2b.2.a) and **"App.tsx renders the real view from Tauri events"** (Plan 2b.2.c) — the components, styles, primitives, helpers, and tests that let those atoms drive a screen.

## 2. Non-goals

- App.tsx wiring → **Plan 2b.2.c**
- Tool renderers (`tool-renderers/*`) → **Plan 2b.2.c**
- Multi-theme switcher UI, named themes (ocean, sunset, forest…), system preference auto-detect, per-workspace theme overrides → **Plan 3**
- Speech-to-text button + onnxruntime/Coqui stack → future audio-feature plan
- Workspace + ARC sidebar + Dock → **Plan 3**
- Settings page → **Plan 4.5**
- Cross-window state, file preview panel, focus mode → **Plan 3.5 / Plan 4**

## 3. Scope decomposition (two stacked plans)

The full port is ~3,500 LOC across ~18 files. Split into:

### 3.1 Plan 2b.2.b.1 — Foundation + ai-elements + helpers (`feat/desktop-message-ui-primitives`)
~2,300 LOC. Self-contained PR — every component compiles in isolation and has fixture-driven tests, even though no app surface consumes them yet.

### 3.2 Plan 2b.2.b.2 — `AgentMessages.tsx` integration (`feat/desktop-agent-messages`)

**Amended 2026-05-28 (after Plan 2b.2.b.2 brainstorming recon):** uclaw's `AgentMessages.tsx` is 1,267 LOC and transitively pulls in ~20 currently-unported files: tool rendering (`ToolActivityList`, `ThinkingBlock`, `NativeBlockRenderer`, `ChatToolActivityIndicator`, `CompactingIndicator`, `CompactBoundaryDivider`), chat-side atoms/chips (`channelsAtom`, `tabMinimapCacheAtom`, `proactiveLearningEventsAtom`, `memoryRecallEventAtom`, `skillRecallsMapAtom`, `agentDisplayNameForAtom`, `stickyUserMessageEnabledAtom`, `MemoryRecallChip`, `ProactiveLearningChip`, `SkillCitationChips`, `SkillRecallChips`), and ancillaries (`formatMessageTime`, `ScrollPositionManager`, `readAttachment`/`saveImageAs` from Tauri bridge).

Verbatim porting would balloon scope to ~3,000+ LOC across many files — defeating stacked-PR discipline. So 2b.2.b.2 ships a **slim AgentMessages** (~400 LOC effective port) covering only the message-list + Welcome + ScrollMinimap + StickyUserMessage + streaming + error rendering. The ~20 unported deps are replaced with **feature-local stubs** under `features/chat-agent/components/stubs/` and `features/chat-agent/lib/peripheral-stubs.ts` — each stub clearly marked for Plan 2b.2.c upgrade.

**Carry-forward follow-up addressed in this plan:** Follow-up #2 from Plan 2b.2.b.1's final review — AgentMessages's error-state branch surfaces `event.message` (now typed on `AgentEvent`).

**Carry-forward follow-ups NOT addressed (still deferred):** #1 (real `useSmoothStream` impl), #3 (scroll-minimap dead handlers), #4 (real preview-chips → Plan 3.5).

**Dependency:** 2b.2.b.2 depends on 2b.2.b.1 landing. Stacked PR pattern (#5 → #4, #6 → #5).

## 4. Architecture

uclaw's message-view stack:

```
AgentMessages.tsx               ← orchestrates per-turn rendering
   ↓ consumes
ai-elements/{message, conversation, reasoning, scroll-minimap, ...}
   ↓ uses
supporting helpers (UserAvatar, CopyButton, ChatToolActivityIndicator, WelcomeEmptyState)
   ↓ uses
shared utilities (CodeBlock, useSmoothStream, model-logo, normalize-agent-markdown, skill-citation)
   ↓ uses
shadcn primitives (Button, Input, Tooltip, Spinner, ImageLightbox, ScrollArea)
   ↓ uses
theme tokens (CSS variables + Tailwind config)
```

We port **bottom-up**: theme → shadcn primitives → utilities → helpers → ai-elements → AgentMessages. Each layer's tests pass before the next is ported. b.1 ships layers 1–5; b.2 ships layer 6.

## 5. File layout (anti-god-file enforced)

```
desktop/src/
  shared/                                        # cross-feature infrastructure
    ui/
      button.tsx                  — EXISTS       # audit uclaw signature compat in Task 1
      input.tsx                   — NEW          # RichTextInput dep
      tooltip.tsx                 — NEW          # 4+ ai-elements deps
      spinner.tsx                 — NEW          # Reasoning, ChatToolActivityIndicator
      image-lightbox.tsx          — NEW          # Message image rendering
      scroll-area.tsx             — NEW          # Conversation viewport
    lib/
      cn.ts                       — EXISTS
      model-logo.ts               — NEW          # provider-avatar provider→logo lookup
      normalize-agent-markdown.ts — NEW          # markdown sanitization + normalization
      skill-citation.ts           — NEW          # citation parsing
      use-smooth-stream.ts        — NEW          # token-streaming display hook
    components/
      code-block.tsx              — NEW          # markdown code-block with Shiki highlighting
  features/chat-agent/
    components/
      ai-elements/
        message.tsx               — NEW (b.1)
        conversation.tsx          — NEW (b.1)
        reasoning.tsx             — NEW (b.1)
        scroll-minimap.tsx        — NEW (b.1)
        provider-avatar.tsx       — NEW (b.1)
        sticky-user-message.tsx   — NEW (b.1)
        rich-text-input.tsx       — NEW (b.1)
        context-divider.tsx       — NEW (b.1)
      user-avatar.tsx             — NEW (b.1)
      copy-button.tsx             — NEW (b.1)
      chat-tool-activity-indicator.tsx — NEW (b.1)
      welcome-empty-state.tsx     — NEW (b.1)
      agent-messages.tsx          — NEW (b.2)    # the 1,267-LOC boss
    __fixtures__/
      message-fixtures.ts         — NEW (b.1)    # ported from uclaw message.fixtures
      streaming-fixture.ts        — NEW (b.1)
      tool-activity-fixture.ts    — NEW (b.1)
  styles/
    index.css                     — MODIFY (b.1) # import theme-tokens.css
    theme-tokens.css              — NEW (b.1)    # CSS variables ported from uclaw globals.css
  tailwind.config.js              — MODIFY (b.1) # theme.extend.colors mapped to CSS vars
  package.json                    — MODIFY (b.1) # npm deps below
```

### Anti-god-file invariants

- **No shared/ui barrel export** — each shadcn primitive imported by path. Barrel exports become god re-exporters.
- **Feature-local components stay feature-local** — ai-elements + agent-specific helpers live under `features/chat-agent/components/`, not in shared.
- **`__fixtures__/` is feature-scoped** — fixtures don't leak into shared because they encode chat-agent state shape.
- **Import path retargeting on port** — uclaw's `@/components/ui/*` → `@/shared/ui/*`; uclaw's `@/lib/utils` → `@/shared/lib/cn`. Pattern matches Plan 2b.2.a's `@/lib/agent-types` → `../lib/agent-types` retargeting.
- **CodeBlock is the only shared/components/ entry** — only because future plans (plan preview, file preview) reuse it. Other helpers stay feature-local until a second consumer materializes.

## 6. npm dependencies (version-pinned to uclaw)

Uclaw's `pnpm-lock.yaml` is the source of truth. Plan 2b.2.b.1 Task 1 (recon) reads the lockfile and pins exact versions. Expected additions:

| Dep | Version | Used by |
|---|---|---|
| `react-markdown` | `10.1.0` | Message, AgentMessages |
| `remark-gfm` | `4.0.0` | react-markdown plugin |
| `shiki` | `3.22.0` | CodeBlock syntax highlighting |
| `lowlight` | `3.3.0` | normalize-agent-markdown helper |
| `dompurify` | `3.4.1` | normalize-agent-markdown sanitization |
| `@tiptap/react` | `3.23.2` | RichTextInput |
| `@tiptap/starter-kit` | `3.23.2` | RichTextInput |
| `@tiptap/extension-placeholder` | `3.23.2` | RichTextInput |
| `motion` | `12.38.0` | ai-elements animations |
| `lucide-react` | `0.460.0` | icons across all components |
| `@radix-ui/react-tooltip` | pinned by b.1 Task 1 from `uclaw/ui/pnpm-lock.yaml` | shared/ui/tooltip |
| `@radix-ui/react-scroll-area` | pinned by b.1 Task 1 from `uclaw/ui/pnpm-lock.yaml` | shared/ui/scroll-area |
| `@radix-ui/react-dialog` | pinned by b.1 Task 1 from `uclaw/ui/pnpm-lock.yaml` | shared/ui/image-lightbox |

Dev deps:
| Dep | Version | Purpose |
|---|---|---|
| `@testing-library/react` | `^16.x` | RTL component tests |
| `@testing-library/jest-dom` | `^6.x` | DOM matchers |
| `@testing-library/user-event` | `^14.x` | User interaction simulation |
| `jsdom` | `^25.x` | DOM environment for Vitest |

**Bundle-size impact:** Shiki + TipTap dominate (~400 KB raw each, ~100 KB gzipped each). Acceptable for a desktop app. Smoke step verifies production build size doesn't exceed 4 MB raw / 1 MB gzipped (current baseline ~1.5 MB / 400 KB).

**Already installed (from Plan 1 + 2b.2.a):** `react`, `react-dom`, `tailwindcss@^3.4.19`, `clsx`, `tailwind-merge`, `class-variance-authority`, `jotai@2.17.1`, `vitest`, `@tauri-apps/api`.

## 7. Theme system

### 7.1 What ships in 2b.2.b.1

- `desktop/src/styles/theme-tokens.css` — CSS variables ported from `uclaw/ui/src/styles/globals.css`:
  - `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, plus uclaw's chat-specific tokens (`--user-bubble`, `--agent-bubble`, `--reasoning-bg`, etc.).
  - Two `:root` + `[data-theme="dark"]` blocks. **Only light and dark.**
- `desktop/src/styles/index.css` — `@import "./theme-tokens.css";` at top.
- `desktop/tailwind.config.js` — `theme.extend.colors` maps Tailwind utility names (`bg-background`, `text-primary`, …) to the CSS variables.
- A trivial `themeAtom` (Jotai) sets `<html data-theme="light|dark">`. No UI surface yet.

### 7.2 What's deferred to Plan 3

- Named themes (uclaw has 6+: ocean, sunset, forest, dusk, monochrome, vivid).
- Dock theme picker (the bottom-dock click target).
- System-preference detection.
- Persistence to `WindowState`.
- Per-workspace overrides.

By design, Plan 3 only adds **token sets and a switcher** — no component changes. Components ported in 2b.2.b.1 work in light/dark from day one.

## 8. Testing strategy

### 8.1 Per-component pattern

Every ported component gets a Vitest + RTL + jsdom test:

```ts
// example: features/chat-agent/components/ai-elements/message.test.tsx
import { render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import { createStore } from 'jotai/vanilla'
import { Message } from './message'
import { agentStreamStateAtomFamily } from '../../atoms/agent-atoms'
import { streamingMessage } from '../../__fixtures__/streaming-fixture'

test('renders streamed assistant content', () => {
  const store = createStore()
  store.set(agentStreamStateAtomFamily('s1'), streamingMessage)
  render(
    <Provider store={store}>
      <Message sessionId="s1" />
    </Provider>,
  )
  expect(screen.getByText(/streaming text/i)).toBeInTheDocument()
})
```

### 8.2 Assertion rules

- Assert **DOM structure and accessible text**, not class names or computed styles.
- For streaming components (Message with `text_delta`s, Reasoning), use Vitest fake timers to advance `useSmoothStream` deterministically.
- Snapshot tests forbidden (brittle).
- Reuse uclaw's existing tests verbatim where the contract is identical (`message.test.tsx`, `message.fixtures.test.tsx`) — port + retarget imports.

### 8.3 Fixture catalog (`features/chat-agent/__fixtures__/`)

- `message-fixtures.ts` — single user msg, single assistant msg, multi-turn conversation.
- `streaming-fixture.ts` — partial `content` + partial `reasoning`, mid-stream state.
- `tool-activity-fixture.ts` — `toolActivities[]` variants: start-only, start+result success, start+result error, multiple parallel.

### 8.4 Test count targets

- **2b.2.b.1:** ≥30 new tests (≈2 per component × 15 components, plus ported uclaw fixture tests).
- **2b.2.b.2:** ≥10 tests covering AgentMessages branches: welcome state, single turn, multi-turn, tool activity, reasoning expansion, error state.

## 9. Port methodology

For each ported file:

1. Read uclaw source verbatim.
2. Retarget imports:
   - `@/components/ui/*` → `@/shared/ui/*`
   - `@/lib/utils` → `@/shared/lib/cn`
   - `@/lib/agent-types` / `@/lib/chat-types` → `@/features/chat-agent/lib/agent-types` / `chat-types`
   - `@/components/chat/*` (helpers) → `@/features/chat-agent/components/*`
   - `@/components/welcome/*` → `@/features/chat-agent/components/*`
   - `@/components/shared/code-block/CodeBlock` → `@/shared/components/code-block`
   - `@/hooks/useSmoothStream` → `@/shared/lib/use-smooth-stream` (uclaw has a dead-code duplicate at `components/shared/hooks/useSmoothStream.ts` — confirmed 0 imports; skip it)
3. Resolve TS strictness diffs (uclaw uses `noUnusedParameters: false`; desktop uses `true`).
4. Document any non-import divergence with an inline comment + a follow-up note in the plan doc (matching the `thinking_delta` precedent from 2b.2.a).
5. Add fixture-driven test before next commit. Commit per file.

## 10. Decision log (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Plan granularity | 2-way split: b.1 (utilities + ai-elements + helpers) + b.2 (AgentMessages) | Original "Next Plan" hint underestimated scope by ~50%. Split keeps PR review focused; isolates the 1,267-LOC integration boss. |
| Component testing | Vitest + RTL + jsdom + mock-atom fixtures | Catches structural regressions; uclaw's existing tests reusable; no Storybook overhead. |
| Theme system | Tokens + light/dark in b.1; named themes + Dock switcher in Plan 3 | Components render correct from day one; Plan 3 adds tokens + UI only. |
| ai-elements coverage | Port 7 listed + `context-divider`; skip `speech-button` | `context-divider` is pure presentation; `speech-button` needs STT backend (out of MVP scope). |
| Dep version pinning | Exact uclaw versions from `uclaw/ui/pnpm-lock.yaml` | 1:1 behavior fidelity; avoids surprise visual/API drift. |
| shadcn placement | `desktop/src/shared/ui/` | Matches existing layout (`button.tsx` already there); avoids `components/ui` god directory. |
| Component placement | `features/chat-agent/components/` | Feature-scoped, matches anti-god-file pattern from Plan 2b.2.a. |
| Test fixtures location | `features/chat-agent/__fixtures__/` | Feature-scoped; fixtures encode chat-agent state shape. |

## 11. Open follow-ups carried into b.1 (from Plan 2b.2.a final review)

- Extend `AgentEvent` interface with optional `reason?` / `message?` fields (drops the adapter's `Record<string, unknown>` casts). **Address in b.1 alongside the agent-types touch points.**
- Add comment to `backgroundTasksAtomFamily` `_sessionId` rename matching `thinking_delta` precedent. **Cosmetic; do alongside the above.**

The other three follow-ups (status `'retrying'`, tool-result `isError`, LIFO tool pairing) belong to Plan 2b.2.c and are NOT addressed in b.1 or b.2.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Tailwind config divergence breaks visual fidelity | Task 1 recon diffs uclaw's `tailwind.config.js` against ours; b.1 Task 3 commits the merged config. |
| Shiki initialization blocks first render | Use `shiki/wasm` lazy loader; CodeBlock has a fallback `<pre>` until highlighter resolves. |
| TipTap SSR/CSR mismatch (we're CSR-only) | Tauri is CSR — no SSR concerns. |
| Markdown XSS via `dangerouslySetInnerHTML` | DOMPurify already in dep list; normalize-agent-markdown wraps it. |
| Fixture drift from real state shape | Fixtures construct `AgentStreamState` via the same exported type from `atoms/agent-atoms.ts` — type system catches drift. |
| Bundle-size regression | Smoke step records baseline + production size; flag if >2× current. |
| AgentMessages port surfaces hidden uclaw deps | b.2 Task 1 recon enumerates the full import graph before any port commits — same recon discipline that found the 4 missing imports in Plan 2b.2.a Task 3. |

## 13. Acceptance criteria

### 2b.2.b.1 ships when:
- All 18 b.1 files present at the layout above.
- ≥30 new tests pass; existing 17 + 21 (Rust) still pass.
- `pnpm --dir desktop build` clean (no warnings); `RUSTFLAGS="-D warnings" cargo build -p hermes-desktop` clean (Rust unchanged).
- `App.tsx` still untouched; MVP composer renders.
- Bundle size within budget (smoke step).
- Final code review: APPROVED or APPROVED_WITH_FOLLOWUPS.

### 2b.2.b.2 ships when (amended per §3.2 slim-with-stubs strategy):
- `agent-messages.tsx` present at `desktop/src/features/chat-agent/components/agent-messages.tsx` — slim port (~400 LOC effective) covering: message-list iteration, Welcome empty state, ScrollMinimap, StickyUserMessage, streaming partial state, error state surfacing `event.message`.
- Peripheral stubs present under `desktop/src/features/chat-agent/components/stubs/` (tool-activity-list, content-block, skill-chips, learning-chips, compaction-indicator, sdk-message-renderer) and `desktop/src/features/chat-agent/lib/peripheral-stubs.ts` (static-default atoms for channels / tab-minimap / proactive-learning / memory-recall / skill-recalls / display-name / sticky-enabled, plus no-op `readAttachment`/`saveImageAs` shims). Each stub clearly comment-marked for Plan 2b.2.c upgrade.
- `format-message-time.ts` ported as a small helper.
- ≥10 new Vitest + RTL tests covering all rendering branches (welcome, single user, single assistant, multi-turn, streaming partial state, tool-activity stub, error with `event.message`, sticky indicator, scroll-minimap integration, atom-driven re-render).
- Existing 195 frontend + 21 backend tests still pass.
- Build clean.
- `App.tsx` still untouched.
- Final code review: APPROVED or APPROVED_WITH_FOLLOWUPS.

### Implicit gate before 2b.2.c starts:
- Both PR #5 (b.1) and PR #6 (b.2) merged or stacked-approved.

## 14. Next plans

- **Plan 2b.2.c** — `ChatAgentView` container + `tool-renderers/*` + `App.tsx` integration. End-to-end vertical slice: type a message → uclaw's full message view renders the streamed reply with tool activities and thinking. ~900 LOC.
- **Plan 3** — Navigation spine: Workspace + ARC sidebar + bottom Dock + multi-theme.
- **Plan 3.5** — App Shell: right panel, file preview, focus mode.
- **Plan 4** — cn-desktop domain screens (Hermes领域屏幕).
- **Plan 4.5** — Settings window (openhuman-style).
- **Plan 7** — Packaging + distribution.
