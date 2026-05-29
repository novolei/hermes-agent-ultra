# Plan 3.5-slim — Desktop SearchPalette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port uclaw's `SearchPalette` (609 LOC + 330 LOC test) verbatim and wire it into AppShell. After this PR merges, Cmd+K opens a global command-palette UI for searching workspaces / threads / memory fragments. The Tauri backends for `listRecentThreads`, `listSpaces`, and `searchFragments` aren't shipping in this PR (the palette degrades to empty state when they reject with NOT_IMPLEMENTED — expected behavior until backend ships).

This is the "slim" variant of Plan 3.5 (per user scope decision 2026-05-29). The full SettingsDialog port (~11,300 LOC across 66 tab components) is deferred to a separate sub-stack.

**Architecture:** Verbatim port from `uclaw/ui/src/{components/search,components/memory,lib}/` following the established Hermes conventions (kebab-case filenames, `desktop/src/features/chat-agent/` layout, anti-god-file invariant, stub discipline). One new npm dep (`cmdk`).

**Tech Stack:** React 19 + Jotai 2.17.1 + Vitest + jsdom + cmdk (NEW). The existing `search-atoms.ts` already provides `searchPaletteOpenAtom` + `searchPaletteScopeAtom` (ported in an earlier plan — recon-confirmed at HEAD `b9153b4a7`).

**Scope baseline (committed in `main` at `b9153b4a7` after PR #17 merge):**
- All of Plan 4.a-4.d (AgentView 4-PR stack complete — zero stubs in DOM)
- Plan 3.3 navigation spine (AppShell, LeftSidebar, Dock)
- `search-atoms.ts` already exports `searchPaletteOpenAtom`, `searchPaletteScopeAtom`, `SearchScope` type ✓

**3.5-slim port targets:**

| Bucket | Items | LOC |
|---|---|---|
| New npm dep | `cmdk` (command-menu primitive) | (transitive) |
| New types | `FragmentSearchHit`, `FragmentItem`, `RecentThread`, `SpaceSummary` in `tauri-bridge-stub.ts` or `agent-types.ts` | ~40 |
| Bridge stubs (new) | `listRecentThreads`, `listSpaces`, `searchFragments` — NOT_IMPLEMENTED stubs | ~30 |
| Lib (new) | `group-search-hits.ts` (85 LOC) + smoke test | ~120 |
| Memory closure (new) | `FragmentCard.tsx` (124 LOC — only the `SUBTYPE_COLORS` const is consumed by SearchPalette, but port the full file for verbatim discipline) + `FragmentDetailPopover.tsx` (104 LOC) | ~230 |
| Component | `SearchPalette.tsx` (609 LOC) + verbatim test (330 LOC) | ~939 |
| AppShell wiring | mount `<SearchPalette onSelect={...} />` always-on, wire `Cmd+K` event listener | ~30 |
| Integration tests | extend `app-shell.integration.test.tsx` with SearchPalette assertions | ~80 |
| **Total** | | **~1,470** |

**Tests target:** 796 → ≥830 (+34 minimum).

**Manual launch gate (3.5-slim PR acceptance):** `cd desktop && pnpm tauri dev` opens a window where:
- Cmd+K (or whatever shortcut SearchPalette listens for) opens the SearchPalette overlay
- Typing in the input triggers `searchFragments` invoke — which throws NOT_IMPLEMENTED, the palette shows empty state ("no results" or similar — match uclaw's behavior)
- Esc closes the palette
- Tab switches scope (per the existing `searchPaletteScopeAtom`)
- DevTools assertion: `document.querySelector('[data-search-palette]')` returns the mounted (initially hidden) element
- No red console errors

---

## File Structure

```
desktop/
├── package.json                                          # MODIFY (Wave A): pnpm add cmdk
├── pnpm-lock.yaml                                        # auto-updated by pnpm
└── src/features/chat-agent/
    ├── lib/
    │   ├── tauri-bridge-stub.ts                          # MODIFY (Wave A1): add 3 stubs + 4 types
    │   ├── group-search-hits.ts                          # NEW (Wave A2, 85 LOC)
    │   └── group-search-hits.test.ts                     # NEW smoke test
    └── components/
        ├── memory/                                       # NEW directory (Wave B1-B2)
        │   ├── fragment-card.tsx                         # NEW (Wave B1, 124 LOC verbatim)
        │   ├── fragment-card.test.tsx                    # NEW smoke test
        │   ├── fragment-detail-popover.tsx               # NEW (Wave B2, 104 LOC verbatim)
        │   └── fragment-detail-popover.test.tsx          # NEW smoke test
        ├── search/                                       # NEW directory (Wave B3)
        │   ├── search-palette.tsx                        # NEW (Wave B3, 609 LOC verbatim)
        │   └── search-palette.test.tsx                   # NEW (port uclaw's 330 LOC test verbatim)
        └── app-shell/
            └── app-shell.tsx                             # MODIFY (Wave C1): mount <SearchPalette onSelect={...} />
            └── app-shell.integration.test.tsx            # MODIFY (Wave C1): Group L assertions
```

---

## Wave A — Bridge stubs + group-search-hits lib

### Task A1: Install `cmdk` + add bridge stubs + type aliases

**Files:**
- Modify: `desktop/package.json` (add `cmdk` dep)
- Modify: `desktop/pnpm-lock.yaml` (auto-updated)
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (add 3 stubs + 4 types)

- [ ] **Step 1: Install cmdk**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-search/desktop
pnpm add cmdk
```

Verify with `grep cmdk package.json`.

- [ ] **Step 2: Read uclaw's signatures for the 3 IPC commands + 4 types**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src
grep -nA6 "^export.*function (listRecentThreads|listSpaces|searchFragments)" $UC/lib/tauri-bridge.ts | head -40
grep -nE "^export (type|interface) (FragmentSearchHit|FragmentItem|RecentThread|SpaceSummary)" $UC/lib/tauri-bridge.ts $UC/lib/agent-types.ts $UC/lib/types.ts | head -10
```

Capture the exact shapes.

- [ ] **Step 3: Append a Plan 3.5-slim section to `tauri-bridge-stub.ts`**

```typescript

// ─── Plan 3.5-slim — SearchPalette IPC stubs + types ──────────────────────
// All throw NOT_IMPLEMENTED until the Rust search backends ship.

export interface FragmentSearchHit {
  /* exact shape from uclaw */
}
export interface FragmentItem {
  /* exact shape from uclaw */
}
export interface RecentThread {
  /* exact shape from uclaw — may live in agent-types.ts in uclaw */
}
export interface SpaceSummary {
  /* exact shape from uclaw */
}

export async function listRecentThreads(/* exact params */): Promise<RecentThread[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_BACKEND: listRecentThreads')
}
export async function listSpaces(): Promise<SpaceSummary[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_BACKEND: listSpaces')
}
export async function searchFragments(/* exact params */): Promise<FragmentSearchHit[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_BACKEND: searchFragments')
}
```

ADJUST signatures + type bodies to match uclaw verbatim. If a type's "right home" is `agent-types.ts` (per uclaw's organization), put it there instead — match uclaw's import paths.

- [ ] **Step 4: Verify tsc clean**

```bash
cd desktop && pnpm tsc -b 2>&1 | grep tauri-bridge-stub | head
```

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
cd desktop && pnpm vitest run 2>&1 | tail -5
```

Expected: 796 still passing.

- [ ] **Step 6: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-search
git add desktop/package.json desktop/pnpm-lock.yaml \
        desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts \
        desktop/src/features/chat-agent/lib/agent-types.ts 2>/dev/null
git commit -m "feat(desktop): install cmdk + add SearchPalette bridge stubs + types"
```

### Task A2: Port `group-search-hits.ts`

**Files:**
- Create: `desktop/src/features/chat-agent/lib/group-search-hits.ts` (~85 LOC)
- Create: `desktop/src/features/chat-agent/lib/group-search-hits.test.ts` (NEW smoke test — port from uclaw if exists)

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/lib/group-search-hits.ts
ls /Users/ryanliu/Documents/uclaw/ui/src/lib/group-search-hits.test.ts 2>/dev/null
```

- [ ] **Step 2: Port verbatim with retargets**

Standard retargets. Likely imports `FragmentSearchHit` from tauri-bridge — retarget to our `tauri-bridge-stub`.

- [ ] **Step 3: Smoke test**

If uclaw ships a test, port it. Otherwise write a minimal one:

```typescript
import { describe, it, expect } from 'vitest'
import { groupHitsByWorkspace } from './group-search-hits'

describe('group-search-hits', () => {
  it('groups an empty array into empty groups', () => {
    const result = groupHitsByWorkspace([])
    expect(result).toBeDefined()
  })

  it('exposes a stable export signature', () => {
    expect(typeof groupHitsByWorkspace).toBe('function')
  })
})
```

Adjust to match real signature.

- [ ] **Step 4: Run + audit + commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-search/desktop
pnpm vitest run src/features/chat-agent/lib/group-search-hits.test.ts

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-search
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/lib/group-search-hits.ts

git add desktop/src/features/chat-agent/lib/group-search-hits.{ts,test.ts}
git commit -m "feat(desktop): port group-search-hits lib (verbatim)"
```

---

## Wave B — Memory closure + SearchPalette

### Task B1: Port `FragmentCard`

**Files:**
- Create: `desktop/src/features/chat-agent/components/memory/fragment-card.tsx` (~124 LOC)
- Test: `desktop/src/features/chat-agent/components/memory/fragment-card.test.tsx` (NEW minimal mount test)

Even though SearchPalette only consumes the `SUBTYPE_COLORS` const from this file, port the full file for verbatim discipline.

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/memory/FragmentCard.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Standard retargets. If FragmentCard has its own deps (e.g., `FragmentDetailPopover` — likely YES since they're paired), report BLOCKED and defer to B2 first.

Actually B2 should come first if FragmentCard imports FragmentDetailPopover. Reorder if needed — read both files first to determine the dependency direction.

- [ ] **Step 3: Mount test** — supply minimal placeholder props.

- [ ] **Step 4: Run + audit + commit**

```bash
git add desktop/src/features/chat-agent/components/memory/fragment-card.{tsx,test.tsx}
git commit -m "feat(desktop): port memory/fragment-card (verbatim)"
```

### Task B2: Port `FragmentDetailPopover`

Same recipe. If B1's FragmentCard imports FragmentDetailPopover, do B2 first.

**Files:**
- Create: `desktop/src/features/chat-agent/components/memory/fragment-detail-popover.tsx` (~104 LOC)
- Test: minimal mount test

```bash
git add desktop/src/features/chat-agent/components/memory/fragment-detail-popover.{tsx,test.tsx}
git commit -m "feat(desktop): port memory/fragment-detail-popover (verbatim)"
```

### Task B3: Port `SearchPalette` (the big one — 609 LOC + 330 LOC test)

**Files:**
- Create: `desktop/src/features/chat-agent/components/search/search-palette.tsx` (~609 LOC)
- Create: `desktop/src/features/chat-agent/components/search/search-palette.test.tsx` (port uclaw's test verbatim, ~330 LOC)

- [ ] **Step 1: Read source + test**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src/components/search
cat $UC/SearchPalette.tsx
cat $UC/SearchPalette.test.tsx
```

- [ ] **Step 2: Comprehensive retarget**

| uclaw path | hermes target |
|---|---|
| `cmdk` | keep as-is (real npm dep installed in A1) |
| `@/atoms/search-atoms` | `@/features/chat-agent/atoms/search-atoms` (already in tree) |
| `@/atoms/app-mode` | `@/features/chat-agent/atoms/app-mode` |
| `@/atoms/chat-atoms` | `@/features/chat-agent/atoms/chat-atoms` |
| `@/atoms/agent-atoms` | `@/features/chat-agent/atoms/agent-atoms` |
| `@/atoms/workspace` | `@/features/chat-agent/atoms/workspace` |
| `@/atoms/settings-tab` | `@/features/chat-agent/atoms/settings-tab` |
| `@/lib/workspace-icons` | `@/features/chat-agent/lib/workspace-icons` |
| `@/lib/group-search-hits` | `@/features/chat-agent/lib/group-search-hits` (A2) |
| `@/lib/tauri-bridge` (stubs) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/lib/utils` | `@/shared/lib/cn` |
| `@/lib/agent-types` | `@/features/chat-agent/lib/agent-types` |
| `@/lib/types` | wherever `SpaceSummary` ends up (A1) |
| `@/components/memory/FragmentDetailPopover` | `@/features/chat-agent/components/memory/fragment-detail-popover` (B2) |
| `@/components/memory/FragmentCard` (SUBTYPE_COLORS) | `@/features/chat-agent/components/memory/fragment-card` (B1) |

If any unanticipated import surfaces, classify and stub/BLOCKED. The 609 LOC is mostly state machine + JSX so don't expect surprises.

- [ ] **Step 3: Storage-key + uclaw event audit**

```bash
grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/search/search-palette.tsx
```
Expected: EMPTY. Rebrand any `'uclaw:'` window-event names to `'hermes:'` (Plan 3.3 carry-forward pattern).

- [ ] **Step 4: Run tests + full suite**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/search/search-palette.test.tsx
pnpm vitest run 2>&1 | tail -5
```
Expected: SearchPalette tests pass. Full suite up by however many cases uclaw's test has (likely 10-15).

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-search
git add desktop/src/features/chat-agent/components/search/
git commit -m "feat(desktop): port search-palette + verbatim test (609 LOC + 330 LOC test)"
```

---

## Wave C — AppShell wiring + integration tests + final sweep

### Task C1: Wire SearchPalette into AppShell

**Files:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.tsx` (mount `<SearchPalette onSelect={...} />`)

- [ ] **Step 1: Read uclaw's AppShell wiring**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src
grep -nE "SearchPalette|handleSearchResultSelect|onSelect" $UC/components/app-shell/AppShell.tsx | head -10
```

Note the `handleSearchResultSelect` handler signature — what it dispatches on the result.

- [ ] **Step 2: Add the wiring to our `app-shell.tsx`**

Add import:
```typescript
import { SearchPalette } from '@/features/chat-agent/components/search/search-palette'
```

Add a handler:
```typescript
const handleSearchResultSelect = React.useCallback(/* port uclaw's body — likely opens workspace/conversation/session via existing atoms */, [...])
```

Mount `<SearchPalette onSelect={handleSearchResultSelect} />` as a sibling of LeftSidebar / main (always-mounted, hidden via internal `searchPaletteOpenAtom`).

- [ ] **Step 3: Verify tests don't regress**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/app-shell/
```

Existing AppShell tests should still pass. If a test mocked the absence of SearchPalette via `[data-stub]` assertions, audit + adjust.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/components/app-shell/app-shell.tsx
git commit -m "feat(desktop): wire SearchPalette into AppShell"
```

### Task C2: Extend AppShell integration tests with Group L

**File:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

Add a Group L for SearchPalette assertions:

```typescript
describe('AppShell + SearchPalette (Plan 3.5-slim)', () => {
  it('SearchPalette mounts in AppShell tree (initially closed)', () => {
    const { container } = mountAppShell()
    // SearchPalette renders a Command component from cmdk; its outer element
    // typically has a data-cmdk-root attribute when open. When closed it may
    // render nothing or a hidden placeholder. Verify by component presence in
    // the React tree if a stable selector exists, otherwise verify by atom state.
    // Adjust the selector based on what the real component renders.
    expect(container.querySelector('[data-cmdk-root], [data-search-palette]')).not.toBeNull()
  })

  it('searchPaletteOpenAtom controls visibility', () => {
    const store = createStore()
    store.set(searchPaletteOpenAtom, true)
    const { container } = render(<Provider store={store}><AppShell /></Provider>)
    // When open, cmdk's portal should render the dialog element somewhere.
    // If cmdk renders into a portal, query document instead of container.
    expect(document.body.querySelector('[role="dialog"], [data-cmdk-root]')).not.toBeNull()
  })

  it('end-to-end mount with SearchPalette wired produces zero new console.error calls', () => {
    const errs: unknown[][] = []
    const orig = console.error
    console.error = (...args: unknown[]) => { errs.push(args); orig(...args) }
    render(<Provider><AppShell /></Provider>)
    console.error = orig
    expect(errs).toEqual([])
  })
})
```

If `searchPaletteOpenAtom` isn't already imported in the integration test file, add the import. Adjust selectors based on actual SearchPalette DOM output.

- [ ] **Step 1: Add the test group**

- [ ] **Step 2: Run + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
cd ..
git add desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "test(desktop): extend AppShell integration suite for Plan 3.5-slim SearchPalette"
```

### Task C3: Final automated sweep

- [ ] **Step 1: Anti-god-file check**

```bash
ls desktop/src/lib/
```
Expected: ONLY `bridge`.

- [ ] **Step 2: Storage-key sweep**

```bash
git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/ desktop/src/lib/ desktop/src/test-utils/
```
Expected: ONLY JSDoc rebrand-history comments.

- [ ] **Step 3: Cargo fmt (defensive — no Rust changes)**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-search
cargo fmt --all --check
```

- [ ] **Step 4: Frontend full vitest + tsc**

```bash
cd desktop
pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | tail -30
```

Expected: 830+ tests pass; no NEW tsc errors in 3.5-touched files (pre-existing errors carry forward from earlier plans).

- [ ] **Step 5: Parity governance**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-search
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3
```

If a new shared-different path needs classification, add it.

- [ ] **Step 6: Commit any fmt/parity fixes**

```bash
git status
git add -A
git commit -m "chore(desktop): Plan 3.5-slim final sweep" 2>/dev/null || true
git log --oneline -5
```

---

## Final Self-Review Checklist (orchestrator-side, before opening PR)

- [ ] Wave A: cmdk installed; 4 new types + 3 bridge stubs added to tauri-bridge-stub.ts; group-search-hits.ts ported with test
- [ ] Wave B: fragment-card + fragment-detail-popover + search-palette + verbatim test all ported
- [ ] Wave C: AppShell wired with `<SearchPalette onSelect={...} />`; Group L integration tests pass; final sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] Storage-key audit: zero `'uclaw[:-]'` in any new file
- [ ] Test count up by ≥34 (was 796 → ≥830)
- [ ] Manual `pnpm tauri dev` launch passes — Cmd+K opens the palette
- [ ] All commits use conventional-commit prefixes
- [ ] PR documents the deferred SettingsDialog (~11.3k LOC across 66 tab components — future Plan 3.5.s sub-stack)

---

## Carry-Forward Follow-ups

1. **SettingsDialog port** (deferred) — 66 tab components, ~11,300 LOC. Future Plan 3.5.s sub-stack split per the recon options:
   - 3.5.s.a: SettingsDialog shell + 3-4 most-used tabs (General, Connectivity, Tools)
   - 3.5.s.b: Intelligence + Permissions + Prompts + Shortcuts
   - 3.5.s.c: Provider integrations (Feishu, WeChat, BotHub, ImChannels)
   - 3.5.s.d: Developer + advanced tabs
2. **Rust search backends** — `listRecentThreads`, `listSpaces`, `searchFragments`. SearchPalette degrades to empty state until these ship. Real impls = full-text search over conversations + memory fragments + workspace metadata.
3. **Pre-existing carry-forwards** (rolled over from AgentView stack) — `proma:` dead listeners, agent-heartbeat Tauri-listen stderr noise, useShortcut.ts full impl, pre-existing tsc errors in left-sidebar/bottom-dock.
4. **Additional memory components** — the recon showed `components/memory/` has 20+ files (DualNebula, MemoryNebulaView, MemoryTimeline, FeedPanel, etc.) — only FragmentCard + FragmentDetailPopover are SearchPalette deps. The rest defer to future memory-focused plans.
