# Plan 2b.2.c.4.c — Desktop AgentView STT (Speech-to-Text) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real ports for the 5 STT-related stubs in `agentview-bridge-stub.tsx` (SttModal + FirstRunDialog + SpeechButton + modelStatusAtom + smartJoin). After 4.c merges, AgentView's composer toolbar has a real microphone button, the SttModal renders during transcription with EQ bars + interim text, and the first-run download dialog can request the model download (Tauri command throws NOT_IMPLEMENTED until backend ships — graceful failure expected).

**Architecture:** Verbatim port from `uclaw/ui/src/{atoms,lib/stt,components/stt,components/ai-elements}/` following the conventions established through Plans 2b.2.c.2 → 4.b:
- kebab-case filenames, PascalCase exports
- `desktop/src/features/chat-agent/` layout
- Storage keys rebranded `'uclaw-*'` → `'hermes-*'`
- Anti-god-file invariant: `desktop/src/lib/` contains ONLY `bridge/`
- Stub discipline (Plan 3.3 C1 lesson): NEVER inline missing symbols, always create a stub file
- Pre-existing verbatim-ported files NEVER modified to add convenience exports (Plan 3.3 B2 lesson)

**Tech Stack:** React 19 + Jotai 2.17.1 + atomWithStorage + Vitest + jsdom. Verbatim TypeScript ports. shadcn primitives already in `desktop/src/shared/ui/`. The `@tauri-apps/api/event.listen` + `@tauri-apps/api/core.invoke` calls are kept as-is — they'll throw NOT_IMPLEMENTED at runtime when the user clicks the mic button, which is the expected stub behavior until the Rust STT backend ships.

**Scope baseline (committed in `main` at `8c3ec55c9` after PR #15 merge):**
- All of Plan 4.b (12 banner real ports, 5 new atom/lib/bridge-stub additions)
- All of Plan 4.a (full AgentView shell)
- Plan 3.3 navigation spine
- `agentview-bridge-stub.tsx` currently has these 5 STT-deferred symbols (per Plan 4.a D1 grouping): `SttModal`, `FirstRunDialog`, `SpeechButton`, `modelStatusAtom`, `smartJoin`

**4.c port targets:**

| Bucket | Items | LOC |
|---|---|---|
| Atom | `atoms/stt-atoms.ts` + test | ~120 |
| Lib | `lib/stt/punctuation.ts` + test | ~140 |
| Components | `components/ai-elements/speech-button.tsx`, `components/stt/stt-modal.tsx` + test + CSS, `components/stt/first-run-dialog.tsx` + test | ~830 |
| Bridge stubs | 2-4 new Rust-IPC stubs in `tauri-bridge-stub.ts` (`stt_download_model`, `stt_model_status`, possibly download-progress event names) | ~50 |
| `agentview-bridge-stub.tsx` cleanup | DELETE 5 STT stub exports + their test cases | -90 |
| `agent-view.tsx` import retarget | Switch 5 imports from `agentview-bridge-stub` to real paths | ~10 |
| **agent-messages catch-up** (Plan 4.b carry-forward #6) | port the 162 LOC delta between our 1,105 LOC version and uclaw's current 1,267 LOC | ~200 |
| Integration tests | extend `app-shell.integration.test.tsx` with STT-stub-gone assertion | ~50 |
| **Total** | | **~1,700** |

**Tests target:** 718 → ≥750 (+32 minimum).

**Manual launch gate (4.c PR acceptance):** `cd desktop && pnpm tauri dev` opens a window where:
- AgentView's composer toolbar shows a real SpeechButton (mic icon)
- Clicking the SpeechButton attempts to mount SttModal — the modal renders with the real component (not a stub placeholder)
- The first-run dialog can show when `modelStatusAtom` reports an unready model — clicking "Download" calls the Tauri `stt_download_model` stub which throws NOT_IMPLEMENTED (toast/error surface visible — expected until backend ships)
- DevTools assertion: `document.querySelectorAll('[data-deferred-to="4.c"]').length === 0`
- No red console errors

---

## File Structure

```
desktop/src/features/chat-agent/
├── atoms/
│   ├── stt-atoms.ts                    # NEW (Wave A, 59 LOC port)
│   └── stt-atoms.test.ts               # NEW (port from uclaw)
├── lib/
│   └── stt/                            # NEW directory
│       ├── punctuation.ts              # NEW (Wave A, 90 LOC port)
│       └── punctuation.test.ts         # NEW (port from uclaw)
├── components/
│   ├── stt/                            # NEW directory
│   │   ├── stt-modal.tsx               # NEW (Wave B, 165 LOC port)
│   │   ├── stt-modal.test.tsx          # NEW (port from uclaw)
│   │   ├── stt-modal.css               # NEW (Wave B, 65 LOC port)
│   │   ├── first-run-dialog.tsx        # NEW (Wave B, 239 LOC port)
│   │   └── first-run-dialog.test.tsx   # NEW (port from uclaw)
│   ├── ai-elements/
│   │   └── speech-button.tsx           # NEW (Wave B, 114 LOC port)
│   ├── agent/
│   │   └── agent-view.tsx              # MODIFY: retarget 5 STT imports (Wave D)
│   └── app-shell/
│       └── app-shell.integration.test.tsx  # MODIFY: extend with STT-stub-gone assertion (Wave E)
├── lib/
│   ├── tauri-bridge-stub.ts            # MODIFY: add Rust STT IPC stubs (Wave A)
│   └── agentview-bridge-stub.tsx       # MODIFY: REMOVE 5 STT exports (Wave D)
```

Plus the Plan 4.b carry-forward closure (Wave C):
```
desktop/src/features/chat-agent/components/
└── agent-messages.tsx                  # MODIFY: catch-up port to uclaw's 1,267 LOC (Wave C)
```

---

## Wave A — Atoms + lib + Rust IPC stubs

### Task A1: Port `stt-atoms`

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/stt-atoms.ts` (~59 LOC)
- Create: `desktop/src/features/chat-agent/atoms/stt-atoms.test.ts` (port from uclaw)

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src
cat $UC/atoms/stt-atoms.ts $UC/atoms/stt-atoms.test.ts
```

- [ ] **Step 2: Port both verbatim with retargets**

Storage-key rebrand any `'uclaw-...'` → `'hermes-...'`. Apply standard retargets. The file is jotai-only; no project-internal imports expected.

- [ ] **Step 3: Verify exports match what AgentView imports**

AgentView pulls `modelStatusAtom` from `@/atoms/stt-atoms`. Confirm the verbatim port exports it (plus likely `sttModalStateAtom`, `activeComposerAtom`, `sttSettingsAtom`).

- [ ] **Step 4: Run tests + storage-key audit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-stt/desktop
pnpm vitest run src/features/chat-agent/atoms/stt-atoms.test.ts

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-stt
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/atoms/stt-atoms.ts
```
Expected: tests pass, grep EMPTY.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/atoms/stt-atoms.{ts,test.ts}
git commit -m "feat(desktop): port stt-atoms (verbatim)"
```

### Task A2: Port `lib/stt/punctuation`

**Files:**
- Create: `desktop/src/features/chat-agent/lib/stt/punctuation.ts` (~90 LOC)
- Create: `desktop/src/features/chat-agent/lib/stt/punctuation.test.ts` (port from uclaw)

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src/lib/stt
cat $UC/punctuation.ts $UC/punctuation.test.ts
```

- [ ] **Step 2: Port both verbatim with retargets**

This is a pure-TypeScript utility. Expected imports: none beyond standard library. If retargets are needed, apply per the table.

- [ ] **Step 3: Verify the `smartJoin` export exists**

AgentView pulls `smartJoin` from `@/lib/stt/punctuation`. Confirm the verbatim port exports it.

- [ ] **Step 4: Run tests + storage-key audit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/lib/stt/punctuation.test.ts
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/lib/stt/punctuation.ts
```

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/lib/stt/
git commit -m "feat(desktop): port lib/stt/punctuation (verbatim)"
```

### Task A3: Add Rust STT IPC stubs to `tauri-bridge-stub.ts`

**File:**
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts`

The STT components call `invoke('stt_download_model', ...)` and `invoke('stt_model_status')` directly via `@tauri-apps/api/core`. Those are NOT routed through our typed bridge wrappers — they hit the raw `invoke()` function which returns `Promise<unknown>` and resolves/rejects at the Tauri runtime. We don't need typed wrappers here; the raw `invoke()` call will fail at runtime with "command not found" until the Rust backend implements them.

HOWEVER — if FirstRunDialog or SttModal subscribes to Tauri events (e.g., `listen('stt:download_progress', ...)`), those event names should be documented in a comment block in tauri-bridge-stub.ts for future Rust-side reference.

- [ ] **Step 1: Enumerate the STT Rust IPC surface**

```bash
grep -E "invoke\(['\"]stt|listen<.+>\(['\"]stt" \
  /Users/ryanliu/Documents/uclaw/ui/src/components/stt/FirstRunDialog.tsx \
  /Users/ryanliu/Documents/uclaw/ui/src/components/stt/SttModal.tsx \
  /Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/speech-button.tsx 2>/dev/null
```

Capture each `invoke('stt_*')` command name and each `listen('stt:*')` event name.

- [ ] **Step 2: Add a documentation comment block to `tauri-bridge-stub.ts`**

Append to the bottom of the file:

```typescript
// ─── Plan 2b.2.c.4.c — STT Rust IPC surface (documentation only) ──────────
// The STT components call the following Tauri commands and listen for these
// events directly via @tauri-apps/api/{core,event}, NOT through our typed
// bridge wrappers. Until the Rust STT backend ships, invoke() rejects with
// "command not found" and listen() never fires. This is the expected stub
// behavior: SpeechButton click → SttModal mount → invoke('stt_start_listen')
// rejects → SttModal shows error toast → modal closes. Document here so the
// Rust-side implementation has a checklist.
//
// Tauri commands required:
//   - stt_model_status() -> { ready: bool, ... }
//   - stt_download_model() -> Promise<string>  // path to downloaded model dir
//   - stt_start_listen({ composer: 'chat' | 'agent' }) -> Promise<void>
//   - stt_stop_listen() -> Promise<void>
//   - (add more as audit surfaces them)
//
// Tauri events emitted:
//   - stt:download_progress { downloaded: number, total: number, ... }
//   - stt:interim { text: string }
//   - stt:final { text: string }
//   - stt:volume { rms: number, bands: number[] }
//   - (add more as audit surfaces them)
```

ADJUST the comment to match what the audit actually surfaces. Do NOT add typed wrappers — the components call raw `invoke()` and don't need them.

- [ ] **Step 3: Verify tsc clean**

```bash
cd desktop && pnpm tsc -b 2>&1 | grep tauri-bridge-stub | head
```
Expected: no new errors (just a comment block addition).

- [ ] **Step 4: Commit**

```bash
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "docs(desktop): document STT Rust IPC surface in tauri-bridge-stub.ts"
```

---

## Wave B — STT components (real ports)

### Task B1: Port `SpeechButton`

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/speech-button.tsx` (~114 LOC)
- Test: `desktop/src/features/chat-agent/components/ai-elements/speech-button.test.tsx` (NEW minimal mount test — uclaw doesn't ship one)

- [ ] **Step 1: Read source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/speech-button.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Standard retargets:
- `@/atoms/stt-atoms` → `@/features/chat-agent/atoms/stt-atoms`
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- `@/lib/utils` → `@/shared/lib/cn`
- `@/lib/stt/punctuation` → `@/features/chat-agent/lib/stt/punctuation`
- `@tauri-apps/api/core` (invoke) and `@tauri-apps/api/event` (listen) — keep as-is

If ANY import has no target, report BLOCKED.

- [ ] **Step 3: Mount test**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { SpeechButton } from './speech-button'

describe('SpeechButton', () => {
  it('renders without throwing', () => {
    const { container } = render(
      <Provider>
        <SpeechButton /* required props */ />
      </Provider>,
    )
    expect(container).toBeDefined()
  })
})
```

Inspect props and adjust.

- [ ] **Step 4: Run + audit + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/ai-elements/speech-button.test.tsx
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/ai-elements/speech-button.{tsx,test.tsx}
git add desktop/src/features/chat-agent/components/ai-elements/speech-button.{tsx,test.tsx}
git commit -m "feat(desktop): port speech-button (verbatim)"
```

### Task B2: Port `SttModal` + CSS

**Files:**
- Create: `desktop/src/features/chat-agent/components/stt/stt-modal.tsx` (~165 LOC)
- Create: `desktop/src/features/chat-agent/components/stt/stt-modal.css` (~65 LOC verbatim)
- Test: `desktop/src/features/chat-agent/components/stt/stt-modal.test.tsx` (port from uclaw)

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src/components/stt
cat $UC/SttModal.tsx $UC/SttModal.test.tsx
wc -l $UC/SttModal.css
```

- [ ] **Step 2: Port verbatim + retargets**

CSS file is byte-identical copy (no retargets). The component's CSS import line will be `import './stt-modal.css'`.

- [ ] **Step 3: Run + audit + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/stt/stt-modal.test.tsx
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/stt/stt-modal.{tsx,test.tsx,css}
git add desktop/src/features/chat-agent/components/stt/stt-modal.{tsx,test.tsx,css}
git commit -m "feat(desktop): port stt-modal + css (verbatim)"
```

### Task B3: Port `FirstRunDialog`

**Files:**
- Create: `desktop/src/features/chat-agent/components/stt/first-run-dialog.tsx` (~239 LOC)
- Test: `desktop/src/features/chat-agent/components/stt/first-run-dialog.test.tsx` (port from uclaw)

- [ ] **Step 1: Read sources**

```bash
UC=/Users/ryanliu/Documents/uclaw/ui/src/components/stt
cat $UC/FirstRunDialog.tsx $UC/FirstRunDialog.test.tsx
```

- [ ] **Step 2: Port verbatim + retargets**

If a new bridge stub is needed for an unanticipated `invoke()` call, add it; don't inline.

- [ ] **Step 3: Run + audit + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/stt/first-run-dialog.test.tsx
cd ..
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/stt/first-run-dialog.{tsx,test.tsx}
git add desktop/src/features/chat-agent/components/stt/first-run-dialog.{tsx,test.tsx}
git commit -m "feat(desktop): port first-run-dialog (verbatim)"
```

---

## Wave C — `agent-messages.tsx` catch-up port (closes Plan 4.b carry-forward #6)

### Task C1: Catch-up `agent-messages.tsx` to uclaw's current 1,267 LOC

Our `desktop/src/features/chat-agent/components/agent-messages.tsx` is at 1,105 LOC (ported in Plan 2b.2.c.3 from an earlier uclaw snapshot). Current uclaw is 1,267 LOC = 162 LOC delta. Plan 4.b deferred this catch-up.

The 4.a barrel at `components/agent/agent-messages.tsx` re-exports from the older file. After catch-up, the barrel stays as the public entry point but the underlying file gets the new logic.

- [ ] **Step 1: Diff to identify the delta**

```bash
diff -u desktop/src/features/chat-agent/components/agent-messages.tsx \
        /Users/ryanliu/Documents/uclaw/ui/src/components/agent/AgentMessages.tsx | head -100
```

Capture the structure of the delta:
- New imports (atoms, components, hooks)
- New JSX blocks
- New helper functions
- Modified existing behavior

- [ ] **Step 2: Apply the delta surgically**

Use `Edit` tool calls to merge uclaw's newer logic into our file. Apply the standard retargets to any new imports. Keep storage keys as `'hermes-...'` (do NOT regress to `'uclaw-...'` from uclaw's source).

If the delta is structurally large (e.g., a major refactor in uclaw) and surgical merging is risky, instead REPLACE the file entirely with the uclaw bytes and re-apply all the Plan 2b.2.c.3 retargets. This is the "verbatim re-port" option. Cost more diff to review but cleaner outcome.

- [ ] **Step 3: Run existing tests + add new ones if uclaw added them**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/agent-messages.test.tsx 2>/dev/null
pnpm vitest run 2>&1 | tail -5
```
Expected: existing tests still pass; full suite still passes (zero regressions vs HEAD `8c3ec55c9`).

- [ ] **Step 4: Audit + commit**

```bash
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent-messages.tsx
git add desktop/src/features/chat-agent/components/agent-messages.tsx
git commit -m "feat(desktop): catch up agent-messages to uclaw 1,267 LOC (closes Plan 4.b FU #6)"
```

If the catch-up surfaces new dependencies (atoms, components) that aren't in our tree, port those first as separate task-prereq commits.

---

## Wave D — Bridge stub cleanup + AgentView import retargets

### Task D1: Remove 5 STT stubs from `agentview-bridge-stub.tsx`

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx`
- Modify: `desktop/src/features/chat-agent/lib/agentview-bridge-stub.test.tsx`

- [ ] **Step 1: Identify the 5 symbols to remove**

```bash
grep -nE "makeStub.+, ['\"]4\.c['\"]\)" desktop/src/features/chat-agent/lib/agentview-bridge-stub.tsx
```

Expected list (per Plan 4.a D1's grouping):
- `SttModal` (component)
- `FirstRunDialog` (component)
- `SpeechButton` (component)
- `modelStatusAtom` (atom — NOT a component stub; just `atom<...>(...)`)
- `smartJoin` (function — uses `makeStubFn`)

- [ ] **Step 2: Delete those 5 stub lines + the `// Plan 2b.2.c.4.c — STT` section comment header**

DO NOT delete:
- `makeStubComponent` + `makeStubFn` helpers (still used by 4.d/4.e stubs)
- The 4.d stubs (PetWidget, BrowserPreviewOverlay, AutoPreviewPopover, ProviderModelSelector)
- The 4.e stubs (FeishuNotifyToggle, GitChipsRow)
- The `import { atom } from 'jotai'` line if it's only used by the now-removed `modelStatusAtom` (clean up if no longer needed)

- [ ] **Step 3: Update the test file**

Remove the 3 STT component symbols from the `it.each` array. Remove the `modelStatusAtom` and `smartJoin` test cases. Update the `expect(componentKeys.length).toBeGreaterThanOrEqual(N)` to the new lower N (probably ≥6 if only 4.d/4.e stubs remain — verify by counting).

- [ ] **Step 4: Run test + commit D1**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/lib/agentview-bridge-stub.test.tsx
cd ..
git add desktop/src/features/chat-agent/lib/agentview-bridge-stub.{tsx,test.tsx}
git commit -m "refactor(desktop): remove 5 STT stubs from agentview-bridge-stub (now real in 4.c)"
```

### Task D2: Retarget AgentView's 5 STT imports

**File:**
- Modify: `desktop/src/features/chat-agent/components/agent/agent-view.tsx`

- [ ] **Step 1: Locate the stub imports**

```bash
grep -nE "from '@/features/chat-agent/lib/agentview-bridge-stub'" desktop/src/features/chat-agent/components/agent/agent-view.tsx
```

The current import block pulls the remaining 4.c/4.d/4.e stubs. Split into:
- 4.c real imports (5 symbols)
- 4.d/4.e stubs (remaining symbols, stay on `agentview-bridge-stub`)

- [ ] **Step 2: Apply the retargets**

```typescript
// Real STT imports (Plan 4.c)
import { SttModal } from '@/features/chat-agent/components/stt/stt-modal'
import { FirstRunDialog } from '@/features/chat-agent/components/stt/first-run-dialog'
import { SpeechButton } from '@/features/chat-agent/components/ai-elements/speech-button'
import { modelStatusAtom } from '@/features/chat-agent/atoms/stt-atoms'
import { smartJoin } from '@/features/chat-agent/lib/stt/punctuation'

// Remaining stubs (Plan 4.d/4.e)
import {
  PetWidget, BrowserPreviewOverlay, AutoPreviewPopover, ProviderModelSelector,
  FeishuNotifyToggle, GitChipsRow,
} from '@/features/chat-agent/lib/agentview-bridge-stub'
```

- [ ] **Step 3: Verify CSS import surfaces correctly**

If `SttModal.tsx` does `import './stt-modal.css'`, then importing `SttModal` will trigger vite to bundle the CSS automatically. No additional action needed.

- [ ] **Step 4: Run AgentView tests + full suite**

```bash
cd desktop
pnpm vitest run src/features/chat-agent/components/agent/agent-view.test.tsx
pnpm vitest run 2>&1 | tail -5
```
Expected: AgentView tests still pass; full suite passes (750+).

- [ ] **Step 5: Storage-key sweep + commit D2**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-stt
git grep -nE "'uclaw[:-]" desktop/src/features/chat-agent/components/agent/agent-view.tsx
git add desktop/src/features/chat-agent/components/agent/agent-view.tsx
git commit -m "feat(desktop): retarget AgentView's 5 STT imports from stubs to real (Plan 4.c)"
```

---

## Wave E — Integration tests + final sweep

### Task E1: Extend AppShell integration tests with STT-stub-gone assertion

**File:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

Add a new test group (J):

```typescript
describe('AppShell + AgentView STT (Plan 2b.2.c.4.c)', () => {
  it('no [data-deferred-to="4.c"] stubs remain in the DOM', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    expect(container.querySelectorAll('[data-deferred-to="4.c"]').length).toBe(0)
  })

  it('remaining stubs are only 4.d/4.e (banners + STT now real)', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    const stubs = container.querySelectorAll('[data-stub]')
    stubs.forEach((s) => {
      const plan = (s as HTMLElement).getAttribute('data-deferred-to')
      expect(['4.d', '4.e']).toContain(plan)
    })
  })

  it('SpeechButton is mounted in AgentView composer toolbar', () => {
    const { container } = render(<Provider><AppShell /></Provider>)
    // SpeechButton renders a button with mic icon — look for it
    // Adjust selector based on the actual component output
    expect(container.querySelector('button[aria-label*="speech"], button[aria-label*="语音"], [data-testid="speech-button"]')).not.toBeNull()
  })
})
```

Adjust the third test's selector to whatever SpeechButton's actual DOM looks like.

- [ ] **Step 1: Add the test group**

- [ ] **Step 2: Run + commit**

```bash
cd desktop && pnpm vitest run src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
cd ..
git add desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "test(desktop): extend AppShell integration suite for Plan 4.c STT real-ports"
```

### Task E2: Final automated sweep

- [ ] **Step 1: Frontend full sweep**

```bash
cd desktop
pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | grep -vE "vite.config.ts|updater.ts.*Cannot find|left-sidebar|bottom-dock|connection-indicator|dock-item|use-dock-bounce" | tail -10
```
Expected: 750+ tests pass; no NEW tsc errors in 4.c-touched files.

- [ ] **Step 2: Cargo fmt (defensive — no Rust changes in 4.c)**

```bash
cargo fmt --all --check
```

- [ ] **Step 3: Anti-god-file + storage-key audit**

```bash
ls desktop/src/lib/
# Expected: only `bridge/`

git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/ desktop/src/lib/
# Expected: only JSDoc rebrand notes
```

- [ ] **Step 4: Parity governance**

```bash
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3
```

- [ ] **Step 5: Manual launch gate**

```bash
cd desktop && pnpm tauri dev
```
Expected:
- Window opens with AgentView
- SpeechButton visible in composer toolbar
- Clicking SpeechButton attempts to mount SttModal (which may immediately error from the Tauri stub — expected)
- DevTools: `document.querySelectorAll('[data-deferred-to="4.c"]').length === 0`
- No red console errors during initial render

- [ ] **Step 6: Commit any fmt/parity fixes**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-stt
git status
git add -A
git commit -m "chore(desktop): Plan 2b.2.c.4.c final sweep" 2>/dev/null || true
git log --oneline -5
```

---

## Final Self-Review Checklist (orchestrator-side, before opening PR)

- [ ] Wave A: stt-atoms + lib/stt/punctuation ported with tests; tauri-bridge-stub.ts documented for Rust STT IPC
- [ ] Wave B: speech-button + stt-modal (with CSS) + first-run-dialog ported with tests
- [ ] Wave C: agent-messages.tsx caught up to uclaw 1,267 LOC (closes Plan 4.b FU #6)
- [ ] Wave D: 5 STT stubs removed from agentview-bridge-stub; AgentView imports retargeted
- [ ] Wave E: integration tests asserting no 4.c stubs remain; full sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] Storage-key audit: zero `'uclaw[:-]'` in any new file
- [ ] Test count up by ≥32 (was 718 → ≥750)
- [ ] Manual `pnpm tauri dev` launch passes
- [ ] All commits use conventional-commit prefixes
- [ ] PR carry-forwards documented for 4.d/4.e

---

## Carry-Forward Follow-ups (for Plan 4.d / 4.e / backend)

1. **Rust STT backend** — `stt_download_model`, `stt_model_status`, `stt_start_listen`, `stt_stop_listen` Tauri commands + `stt:download_progress` / `stt:interim` / `stt:final` / `stt:volume` events. Documented in tauri-bridge-stub.ts comment block. Real implementation arrives when audio capture + transcription pipeline is wired.
2. **Pet + browser preview + model selector** — `PetWidget`, `BrowserPreviewOverlay`, `AutoPreviewPopover`, `ProviderModelSelector` → Plan 4.d
3. **Chat-surface stubs** — `FeishuNotifyToggle`, `GitChipsRow` → Plan 4.e (may bundle into 4.d)
4. **agentview-bridge-stub.tsx retirement** — after 4.d/4.e ship, the file should be empty and deletable
5. **Slim ChatAgentView retirement** — `desktop/src/features/chat-agent/components/chat-agent-view.tsx` should be deleted in 4.d
6. **Plan 4.a #2** — `proma:stop-generation` / `proma:focus-input` dead listeners — still deferred to a focused shortcut-registry PR
7. **Plan 4.b #3** — `agent-heartbeat-banner.test.tsx` Tauri-listen-in-jsdom unhandled-rejection warnings — silence by mocking `@tauri-apps/api/event.listen` at the test-file level. Low priority; tests pass.
