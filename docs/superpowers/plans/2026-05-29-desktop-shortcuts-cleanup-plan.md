# Plan: Desktop Shortcuts + Carry-Forward Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tightly-scoped side PR addressing 4 deferred carry-forwards from the AgentView 4-PR stack + Plan 3.5-slim:

1. **Real `useShortcut` + `shortcut-registry`** — closes Plan 4.c FU #2. Currently both are placeholder stubs; replace with the verbatim uclaw implementations.
2. **Wire `proma:` event dispatchers** — closes Plan 4.a FU #2. The shortcut-registry implementation dispatches `proma:stop-generation` + `proma:focus-input` window events; agent-view.tsx listeners (lines 1562-1573) start firing.
3. **Mock `@tauri-apps/api/event` in agent-heartbeat-banner.test.tsx** — closes Plan 4.b FU #3. Silences 16 unhandled rejection lines in stderr.
4. **TS6133 sweep** — clean up ~50 unused-import errors from verbatim ports across agent-view.tsx, left-sidebar.tsx, browser-atoms.test.ts, etc. Lowers tsc error count from 59 → ~5 (vite.config.ts + a few real type mismatches stay).

After this PR merges:
- Cmd+K opens SearchPalette (the just-shipped 3.5-slim deliverable)
- Esc dispatches `proma:stop-generation` → AgentView's stop handler runs
- Cmd+L dispatches `proma:focus-input` → composer focus
- `cargo test --workspace` and `pnpm vitest run` produce clean stderr
- `pnpm tsc -b` errors drop dramatically

**Architecture:** Verbatim port from uclaw for useShortcut + shortcut-registry. TS6133 cleanup is mechanical (delete the unused symbol or prefix with `_`).

**Tech Stack:** React 19, no new npm deps.

**Scope baseline (committed in `main` at `4748206d6` after PR #18 merge):**
- All plans through Plan 3.5-slim (AgentView 4-stack + SearchPalette)
- Stub `useShortcut.ts` at `desktop/src/features/chat-agent/hooks/useShortcut.ts` (NOTE: filename is camelCase — Plan 4.c B1 created it that way; we'll rename to kebab during the real port)
- Stub `shortcut-registry.ts` at `desktop/src/features/chat-agent/lib/shortcut-registry.ts`
- 832/832 tests passing, 59 tsc errors, 16 unhandled rejections in heartbeat test

**Cleanup targets:**

| Bucket | Items | LOC delta |
|---|---|---|
| Real port: `useShortcut` | uclaw 155 LOC (replaces 30 LOC stub) | +125 |
| Real port: `shortcut-registry` | uclaw 11 LOC (replaces 11 LOC stub) | 0 |
| Real port: `useShortcutCapture` | sibling hook size TBD | ~50 |
| Filename normalization | `useShortcut.ts` → `use-shortcut.ts` | (rename) |
| Heartbeat test mock | add 1 `vi.mock` block | +10 |
| TS6133 sweep | ~50 unused imports across ~15 files | -50 |
| New tests | useShortcut + shortcut-registry (uclaw ships tests) | +200 |
| Integration tests | end-to-end Cmd+K opens SearchPalette assertion | +30 |
| **Total** | | **~350** |

**Tests target:** 832 → ≥860 (+28 minimum from useShortcut tests).

**Manual launch gate:** `cd desktop && pnpm tauri dev` — pressing Cmd+K opens the SearchPalette overlay. Pressing Esc during agent streaming stops generation (visible via DevTools event-listener trace). Pressing Cmd+L focuses the composer.

---

## File Structure

```
desktop/src/features/chat-agent/
├── hooks/
│   ├── use-shortcut.ts                 # NEW (Wave A1 — kebab-case rename + real port)
│   ├── use-shortcut.test.ts            # NEW (port uclaw test)
│   ├── use-shortcut-capture.ts         # NEW (Wave A2 — sibling hook from uclaw)
│   ├── use-shortcut-capture.test.ts    # NEW (port uclaw test)
│   └── useShortcut.ts                  # DELETE (old stub — Plan 4.c B1)
├── lib/
│   └── shortcut-registry.ts            # MODIFY (Wave A1 — verbatim re-port from uclaw)
└── components/
    ├── agent/
    │   ├── agent-view.tsx              # MODIFY (Wave C — TS6133 cleanup + verify proma listeners work)
    │   └── agent-heartbeat-banner.test.tsx  # MODIFY (Wave B — add vi.mock for @tauri-apps/api/event)
    ├── app-shell/
    │   ├── left-sidebar.tsx            # MODIFY (Wave C — TS6133 cleanup)
    │   └── app-shell.integration.test.tsx   # MODIFY (Wave D — extend with shortcut assertion)
    └── ai-elements/
        └── speech-button.tsx           # MODIFY (Wave A1 — retarget useShortcut import to kebab)

desktop/src/features/chat-agent/atoms/
└── browser-atoms.test.ts               # MODIFY (Wave C — remove 4 unused type imports)
```

---

## Wave A — Real useShortcut + shortcut-registry ports

### Task A1: Port `useShortcut` + rename + retarget consumers

**Files:**
- Create: `desktop/src/features/chat-agent/hooks/use-shortcut.ts` (~155 LOC verbatim from uclaw)
- Create: `desktop/src/features/chat-agent/hooks/use-shortcut.test.ts` (port from uclaw)
- DELETE: `desktop/src/features/chat-agent/hooks/useShortcut.ts` (old stub)
- Modify: `desktop/src/features/chat-agent/lib/shortcut-registry.ts` (verbatim re-port from uclaw)
- Modify: `desktop/src/features/chat-agent/components/ai-elements/speech-button.tsx` (retarget `useShortcut` import path)

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src
cat $UC/hooks/useShortcut.ts $UC/hooks/useShortcut.test.ts
cat $UC/lib/shortcut-registry.ts
```

- [ ] **Step 2: Port `use-shortcut.ts` verbatim**

Apply standard retargets:
- `@/atoms/<name>` → `@/features/chat-agent/atoms/<name>`
- `@/lib/shortcut-registry` → `@/features/chat-agent/lib/shortcut-registry`

If the hook dispatches `proma:` events (the Plan 4.a FU #2 closure target), KEEP the event names as-is (verbatim) — agent-view.tsx already has matching listeners. Do NOT rebrand to `hermes:` unless uclaw also rebranded; this is a verbatim re-port, not a rebrand cycle.

- [ ] **Step 3: Verbatim re-port `shortcut-registry.ts`**

Replace the stub body with uclaw's 11-LOC real implementation. Apply retargets.

- [ ] **Step 4: Retarget `speech-button.tsx` import path**

```bash
grep -n "useShortcut" desktop/src/features/chat-agent/components/ai-elements/speech-button.tsx
```

The current import points at `@/features/chat-agent/hooks/useShortcut` (camelCase filename). Change to `@/features/chat-agent/hooks/use-shortcut` (kebab-case).

- [ ] **Step 5: Delete the old stub**

```bash
git rm desktop/src/features/chat-agent/hooks/useShortcut.ts
```

- [ ] **Step 6: Port the useShortcut test**

Create `desktop/src/features/chat-agent/hooks/use-shortcut.test.ts` by porting `uclaw/ui/src/hooks/useShortcut.test.ts` verbatim with retargets.

- [ ] **Step 7: Run tests + audit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup/desktop
pnpm vitest run src/features/chat-agent/hooks/use-shortcut.test.ts
pnpm vitest run 2>&1 | tail -5
```

Expected: useShortcut tests pass; full suite still passes (count goes up by however many cases uclaw's test has).

- [ ] **Step 8: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup
git add desktop/src/features/chat-agent/hooks/use-shortcut.{ts,test.ts} \
        desktop/src/features/chat-agent/hooks/useShortcut.ts \
        desktop/src/features/chat-agent/lib/shortcut-registry.ts \
        desktop/src/features/chat-agent/components/ai-elements/speech-button.tsx
git commit -m "feat(desktop): port real useShortcut + shortcut-registry (closes Plan 4.c FU #2)"
```

### Task A2: Port `useShortcutCapture` if it's a separate file

**Files (only if uclaw has a separate file):**
- Create: `desktop/src/features/chat-agent/hooks/use-shortcut-capture.ts`
- Create: `desktop/src/features/chat-agent/hooks/use-shortcut-capture.test.ts`

- [ ] **Step 1: Check whether it's a separate file**

```bash
ls /Users/ryanliu/Documents/uclaw/ui/src/hooks/useShortcutCapture* 2>/dev/null
```

If it doesn't exist, SKIP this task.

- [ ] **Step 2: Port verbatim if applicable**

Same recipe as A1.

```bash
git add desktop/src/features/chat-agent/hooks/use-shortcut-capture.{ts,test.ts}
git commit -m "feat(desktop): port use-shortcut-capture sibling hook (verbatim)"
```

---

## Wave B — Heartbeat test stderr fix

### Task B1: Mock `@tauri-apps/api/event` in agent-heartbeat-banner test

**File:**
- Modify: `desktop/src/features/chat-agent/components/agent/agent-heartbeat-banner.test.tsx`

- [ ] **Step 1: Read the current test file's imports + describe block**

```bash
head -30 desktop/src/features/chat-agent/components/agent/agent-heartbeat-banner.test.tsx
```

- [ ] **Step 2: Add the `vi.mock` block**

Add near the top of the file, after the imports:

```typescript
// Mock @tauri-apps/api/event so listen() resolves with a no-op unlisten
// instead of throwing in jsdom. AgentHeartbeatBanner subscribes to 5
// Tauri events on mount; without this mock the unhandled rejections
// pollute test stderr with 16 lines per run (Plan 4.b FU #3 closure).
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}))
```

- [ ] **Step 3: Run the test + verify stderr is clean**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup/desktop
pnpm vitest run src/features/chat-agent/components/agent/agent-heartbeat-banner.test.tsx 2>&1 | tail -10
pnpm vitest run src/features/chat-agent/components/agent/agent-heartbeat-banner.test.tsx 2>&1 | grep -cE "Unhandled" 2>/dev/null
```

Expected: tests still pass; unhandled-rejection count goes from 16 → 0.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup
git add desktop/src/features/chat-agent/components/agent/agent-heartbeat-banner.test.tsx
git commit -m "test(desktop): mock @tauri-apps/api/event in heartbeat test (closes Plan 4.b FU #3)"
```

---

## Wave C — TS6133 sweep

### Task C1: Targeted TS6133 cleanup

**Files (multiple):**
- Modify: `desktop/src/features/chat-agent/atoms/browser-atoms.test.ts` (4 unused type imports)
- Modify: `desktop/src/features/chat-agent/components/agent/agent-view.tsx` (8+ unused identifiers)
- Modify: `desktop/src/features/chat-agent/components/app-shell/left-sidebar.tsx` (per current tsc output)
- Possibly: `desktop/src/features/chat-agent/components/dock/bottom-dock.tsx` (per current tsc output)

- [ ] **Step 1: Get the full TS6133 list**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup/desktop
pnpm tsc -b 2>&1 | grep "error TS6133" > /tmp/ts6133-errors.txt
wc -l /tmp/ts6133-errors.txt
cat /tmp/ts6133-errors.txt
```

- [ ] **Step 2: Fix each error**

For each TS6133 error:
- If it's an unused IMPORT (most cases) — delete the import or remove from the import list
- If it's an unused PARAMETER — prefix with `_` (TypeScript treats `_-prefixed` as intentional)
- If it's an unused DESTRUCTURED variable — prefix with `_` or remove from destructure

DO NOT delete imports that are commented-out-but-referenced (e.g., the FeishuNotifyToggle case from Plan 4.d — that already shipped as un-commented). Check whether the symbol is referenced anywhere else in the file BEFORE deletion.

- [ ] **Step 3: Run tsc + verify drop**

```bash
cd desktop && pnpm tsc -b 2>&1 | grep -c "error TS6133"
```

Expected: 0 (or close to 0 — some `vite.config.ts` errors are real configuration issues that survive).

- [ ] **Step 4: Run full vitest — verify nothing broke**

```bash
cd desktop && pnpm vitest run 2>&1 | tail -5
```

Expected: 832 + Wave A test additions still pass.

- [ ] **Step 5: Commit (batched by file groups for review clarity)**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup
git add desktop/src/features/chat-agent/components/agent/agent-view.tsx
git commit -m "chore(desktop): TS6133 sweep on agent-view.tsx — drop 8 unused imports/vars"

git add desktop/src/features/chat-agent/atoms/browser-atoms.test.ts
git commit -m "chore(desktop): TS6133 sweep on browser-atoms.test.ts — drop 4 unused type imports"

git add desktop/src/features/chat-agent/components/app-shell/left-sidebar.tsx
git commit -m "chore(desktop): TS6133 sweep on left-sidebar.tsx"

# Add any other files batched similarly
```

If the sweep produces a SINGLE atomic chore commit instead of per-file, that's also acceptable. The orchestrator decides based on cleanliness.

---

## Wave D — Integration test + final sweep

### Task D1: Add Cmd+K-opens-SearchPalette integration assertion

**File:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

- [ ] **Step 1: Add a Group M case**

After Group L:

```typescript
describe('AppShell + global shortcuts (post-shortcut-registry-real-port)', () => {
  it('Cmd+K dispatches and opens SearchPalette via searchPaletteOpenAtom', () => {
    const store = createStore()
    const { container } = render(<Provider store={store}><AppShell /></Provider>)

    // Initially closed
    expect(container.querySelector('[data-search-palette]')).toBeNull()

    // Simulate Cmd+K (Meta+K on macOS or Ctrl+K elsewhere — uclaw's useShortcut handles both)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))

    // After dispatch, atom should flip — and palette becomes visible
    expect(store.get(searchPaletteOpenAtom)).toBe(true)
    // (DOM update may need an await; if React 19 needs flushing, wrap in act)
  })
})
```

ADJUST the assertion based on what useShortcut actually does for the search-open shortcut. uclaw's source might use a different mechanism (e.g., dispatch a `proma:` event, set the atom directly, or both).

If the test surfaces that the search-open binding isn't in useShortcut at all (and is wired elsewhere — e.g., a global keydown listener in main.tsx), adjust the test to assert via the actual mechanism, OR scope-down the assertion to just "shortcut-registry returns the configured binding for searchPalette".

- [ ] **Step 2: Run + commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup/desktop
pnpm vitest run src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
cd ..
git add desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "test(desktop): assert Cmd+K opens SearchPalette after real useShortcut port"
```

### Task D2: Final automated sweep

- [ ] **Step 1: Anti-god-file + storage-key sweep**

```bash
ls desktop/src/lib/                                                          # expect: only bridge/
git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/  # expect: only JSDoc
```

- [ ] **Step 2: Cargo fmt (defensive)**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup
cargo fmt --all --check
```

- [ ] **Step 3: Full vitest + tsc**

```bash
cd desktop
pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | grep -c "error TS"
```

Expected: 860+ tests pass; tsc errors drop from 59 → ≤5.

- [ ] **Step 4: Parity governance**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-shortcuts-cleanup
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3
```

- [ ] **Step 5: Commit any fmt/parity fixes**

```bash
git status
git add -A
git commit -m "chore(desktop): shortcuts-cleanup final sweep" 2>/dev/null || true
git log --oneline -5
```

---

## Final Self-Review Checklist (orchestrator-side, before opening PR)

- [ ] Wave A: use-shortcut.ts + use-shortcut-capture.ts (if applicable) + shortcut-registry.ts real ports; old camelCase stub deleted
- [ ] Wave B: heartbeat test stderr drops from 16 unhandled rejections → 0
- [ ] Wave C: tsc TS6133 count drops from ~50 → ≤2
- [ ] Wave D: Group M asserts Cmd+K → SearchPalette open; final sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] Test count up by ≥28 (was 832 → ≥860)
- [ ] All commits use conventional-commit prefixes (`feat`, `chore`, `test`)
- [ ] PR documents closed carry-forwards: Plan 4.a FU #2 (proma listeners), Plan 4.b FU #3 (heartbeat noise), Plan 4.c FU #2 (useShortcut)

---

## Carry-Forward Follow-ups (post-PR)

After this PR merges, the following carry-forwards remain:

1. **Rust backends** for ~30 NOT_IMPLEMENTED stubs (STT, search, model-selector, browser-screencast, banner respond*, git, feishu) — the big one
2. **SettingsDialog port** (Plan 3.5.s sub-stack) — 66 tab components, ~11,300 LOC
3. **Remaining tsc errors** that are NOT TS6133 — type drift between verbatim ports and generated bindings (FragmentItem.reviewStatus shape, WorkspaceInfo.path, etc.) — handle as a focused type-alignment PR if more of these surface
4. **`vite.config.ts` TS errors** for `node:path` + `import.meta.dirname` — pre-existing tooling-config issue from project setup, low priority
