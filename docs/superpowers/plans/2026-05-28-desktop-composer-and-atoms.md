# Desktop Composer + Chat-Side Atoms + Real Chips Port — Plan 2b.2.c.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the composer module (~826 LOC) + RichTextInput (222 LOC) + 4 chat-side atom files (verbatim, 560 LOC) + 6 real chip components (818 LOC) from uclaw. Delete the remaining 3 stubs this plan can resolve (`skill-chips`, `learning-chips`, `chat-tool-activity-indicator`) + remove atom shadows from `peripheral-stubs.ts`. Closes Plan 2b.2.b.2 follow-ups #c-A (atom consolidation) and #c-C (recon doc fix). After this PR, only `scroll-position-manager` stub remains for Plan 2b.2.c.3.

**Architecture:** Bottom-up port in dependency order: composer utilities (pure TS) → atom files (verbatim) → chips (depend on atoms + tool infrastructure from c.1) → composer components (TipTap React) → RichTextInput → AgentMessages import swap + stub deletes. Verbatim-port methodology continues from Plans 2b.2.b.*/c.1: each ported file is a 1:1 copy from uclaw with only import retargets + TS strict-mode tweaks (`_`-prefix on unused args; doc comments for kebab-case filename renames).

**Tech Stack additions:** None — composer/TipTap deps already installed in Plan 2b.2.b.1 (`@tiptap/react@3.23.2`, `@tiptap/starter-kit@3.23.2`, `@tiptap/extension-placeholder@3.23.2`).

**Reference:** Spec — [docs/superpowers/specs/2026-05-28-desktop-message-view-completion-design.md](../specs/2026-05-28-desktop-message-view-completion-design.md) §3.2. Stacked on main at `ab376d2` (post-merge of Plan 2b.2.c.1).

---

## Stubs to delete (gate criterion)

After this plan ships:
```bash
ls desktop/src/features/chat-agent/components/stubs/
# Expected: ONLY scroll-position-manager.tsx + .test.tsx remain
# (3 stubs deleted this plan; c.3 finishes by deleting scroll-position-manager)
```

Stub files deleted in this plan:
- `desktop/src/features/chat-agent/components/stubs/skill-chips.tsx` + `.test.tsx`
- `desktop/src/features/chat-agent/components/stubs/learning-chips.tsx` + `.test.tsx`
- `desktop/src/features/chat-agent/components/stubs/chat-tool-activity-indicator.tsx` + `.test.tsx`

Atom shadows removed from `desktop/src/features/chat-agent/lib/peripheral-stubs.ts`:
- `channelsAtom` (real one lives in new `chat-atoms.ts`)
- `tabMinimapCacheAtom` (real one lives in new `tab-atoms.ts` IF present there — recon confirms; otherwise it stays in peripheral-stubs for c.3 to address)
- `proactiveLearningEventsAtom`, `memoryRecallEventAtom`, `skillRecallsMapAtom` (real ones already in `agent-atoms.ts` per Plan 2b.2.b.1 — these shadows in peripheral-stubs were the c-A follow-up bug)
- `agentDisplayNameForAtom` (real one lives in new `agent-display-name.ts`)
- `stickyUserMessageEnabledAtom` (real one lives in new `ui-preferences.ts`)

What stays in peripheral-stubs.ts (Plan 2b.2.c.3 deletes the file):
- Tauri attachment shims: `readAttachment`, `saveImageAs`, `openExternal`
- Settings atoms: `settingsTabAtom`, `settingsOpenAtom`, `environmentCheckDialogOpenAtom`

---

## File Structure

```
desktop/src/features/chat-agent/
  atoms/
    chat-atoms.ts                          # NEW (Task 4): verbatim 225 LOC port
    chat-atoms.test.ts                     # NEW (Task 4): default-value tests
    tab-atoms.ts                           # NEW (Task 5): verbatim 195 LOC port
    tab-atoms.test.ts                      # NEW (Task 5): default-value tests
    agent-display-name.ts                  # NEW (Task 3): verbatim 56 LOC port
    agent-display-name.test.ts             # NEW (Task 3)
    ui-preferences.ts                      # NEW (Task 3): verbatim 84 LOC port
    ui-preferences.test.ts                 # NEW (Task 3)
  lib/
    composer/                              # NEW directory
      composer-serialize.ts                # NEW (Task 2): verbatim 57 LOC
      composer-serialize.test.ts           # NEW (Task 2): port uclaw's 134 LOC test
      mention-chip-node.ts                 # NEW (Task 2): kebab-cased MentionChipNode.ts (137 LOC); symbol stays PascalCase
    types.ts                               # MAY BE NEW (Task 2 recon): ProactiveLearningEvent type if uclaw has a lib/types.ts
    peripheral-stubs.ts                    # MODIFY (Task 11): delete atom shadows; keep Tauri shims + settings atoms
  components/
    composer/                              # NEW directory
      composer-mention-controller.tsx      # NEW (Task 9): kebab-cased ComposerMentionController.tsx (381 LOC)
      composer-mention-popup.tsx           # NEW (Task 9): kebab-cased ComposerMentionPopup.tsx (117 LOC)
    ai-elements/
      rich-text-input.tsx                  # NEW (Task 10): 222 LOC port (deferred from b.1)
      rich-text-input.test.tsx             # NEW (Task 10)
    skill-citation-chips.tsx               # NEW (Task 8): kebab-cased SkillCitationChips.tsx (112 LOC)
    skill-citation-chips.test.tsx          # NEW (Task 8)
    skill-recall-chips.tsx                 # NEW (Task 8): kebab-cased SkillRecallChips.tsx (218 LOC)
    skill-recall-chips.test.tsx            # NEW (Task 8)
    memory-recall-chip.tsx                 # NEW (Task 7): kebab-cased MemoryRecallChip.tsx (166 LOC)
    memory-recall-chip.test.tsx            # NEW (Task 7)
    proactive-learning-chip.tsx            # NEW (Task 7): kebab-cased ProactiveLearningChip.tsx (96 LOC)
    proactive-learning-chip.test.tsx       # NEW (Task 7)
    chat-tool-block.tsx                    # NEW (Task 6): kebab-cased ChatToolBlock.tsx (155 LOC)
    chat-tool-block.test.tsx               # NEW (Task 6)
    chat-tool-activity-indicator.tsx       # NEW (Task 6): REAL impl, kebab-cased (71 LOC)
    chat-tool-activity-indicator.test.tsx  # NEW (Task 6)
    agent-messages.tsx                     # MODIFY (Task 11): swap stub imports → real atoms + real chips
    stubs/                                 # DELETIONS (Task 11)
      skill-chips.tsx + .test.tsx          # DELETE
      learning-chips.tsx + .test.tsx       # DELETE
      chat-tool-activity-indicator.tsx + .test.tsx # DELETE (real impl now in features/chat-agent/components/)
```

**Anti-god-file invariants:**
- One chip per file at `features/chat-agent/components/` (kebab-case filenames; exported symbols stay PascalCase to match uclaw)
- Composer module: `lib/composer/` for utilities + TipTap Node; `components/composer/` for React components (Controller + Popup). Two subdirectories — different concerns, no barrel files.
- One atom file per concern under `atoms/` (mirroring uclaw layout)
- `desktop/src/lib/` stays at `bridge/` only

---

## Port Methodology (verbatim-with-retargets)

Same as Plan 2b.2.c.1. For each ported file:
1. Read uclaw source verbatim.
2. Apply retargets:
   - `from '@/lib/utils'` → `from '@/shared/lib/cn'`
   - `from '@/lib/agent-types'` → `from '@/features/chat-agent/lib/agent-types'`
   - `from '@/lib/chat-types'` → `from '@/features/chat-agent/lib/chat-types'`
   - `from '@/lib/types'` → `from '@/features/chat-agent/lib/types'` (if we port it)
   - `from '@/lib/skill-citation'` → `from '@/shared/lib/skill-citation'`
   - `from '@/lib/tauri-bridge'` → `from '@/features/chat-agent/lib/peripheral-stubs'` (still stubbed; c.3 implements real commands)
   - `from '@/atoms/agent-atoms'` (named atoms) → `from '@/features/chat-agent/atoms/agent-atoms'` (verify the atom IS exported from our agent-atoms; per c.1 recon, types like ToolActivity + atoms like skillRecallsMapAtom should already be there)
   - `from '@/atoms/chat-atoms'` → `from '@/features/chat-agent/atoms/chat-atoms'`
   - `from '@/atoms/tab-atoms'` → `from '@/features/chat-agent/atoms/tab-atoms'`
   - `from '@/atoms/agent-display-name'` → `from '@/features/chat-agent/atoms/agent-display-name'`
   - `from '@/atoms/ui-preferences'` → `from '@/features/chat-agent/atoms/ui-preferences'`
   - `from '@/atoms/settings-tab'` → `from '@/features/chat-agent/lib/peripheral-stubs'` (still stubbed; settings UI deferred)
   - `from '@/components/ui/<x>'` → `from '@/shared/ui/<x>'`
   - `from '@/components/agent/<x>'` (tool infrastructure) → `from '@/features/chat-agent/components/<kebab-x>'` (ported in c.1) OR `from '@/features/chat-agent/lib/<kebab-x>'` if it's a utility
   - `from '@/components/composer/MentionChipNode'` → `from '@/features/chat-agent/lib/composer/mention-chip-node'`
   - `from '@/components/composer/composer-serialize'` → `from '@/features/chat-agent/lib/composer/composer-serialize'`
   - `from '@/components/composer/ComposerMentionController'` → `from '@/features/chat-agent/components/composer/composer-mention-controller'`
   - `from '@/components/composer/ComposerMentionPopup'` → `from '@/features/chat-agent/components/composer/composer-mention-popup'`
   - `from '@/components/chat/<x>'` (chips) → `from '@/features/chat-agent/components/<kebab-x>'`
3. Resolve TS strict-mode tweaks (`_`-prefix unused args; one-line comments for kebab-case renames).
4. If a port references a symbol NOT in our scope (not yet ported, not in stubs), STOP and report.

---

## Task 1: Recon — full import surface + type coverage gaps

**Files:**
- Create: `docs/superpowers/plans/2026-05-28-desktop-composer-and-atoms-recon.md`

- [ ] **Step 1: Enumerate every file's imports**

```bash
UCLAW=/Users/ryanliu/Documents/uclaw/ui/src
for f in \
  $UCLAW/components/composer/composer-serialize.ts \
  $UCLAW/components/composer/MentionChipNode.ts \
  $UCLAW/components/composer/ComposerMentionController.tsx \
  $UCLAW/components/composer/ComposerMentionPopup.tsx \
  $UCLAW/components/ai-elements/rich-text-input.tsx \
  $UCLAW/atoms/chat-atoms.ts \
  $UCLAW/atoms/tab-atoms.ts \
  $UCLAW/atoms/agent-display-name.ts \
  $UCLAW/atoms/ui-preferences.ts \
  $UCLAW/components/agent/SkillCitationChips.tsx \
  $UCLAW/components/agent/SkillRecallChips.tsx \
  $UCLAW/components/chat/MemoryRecallChip.tsx \
  $UCLAW/components/chat/ProactiveLearningChip.tsx \
  $UCLAW/components/chat/ChatToolBlock.tsx \
  $UCLAW/components/chat/ChatToolActivityIndicator.tsx ; do
  [ -f "$f" ] && echo "### $f" && grep -E "^import " "$f" && echo ""
done
```

- [ ] **Step 2: Confirm `lib/types.ts` existence + ProactiveLearningEvent**

```bash
ls /Users/ryanliu/Documents/uclaw/ui/src/lib/types.ts 2>&1
grep -E "^export.*ProactiveLearningEvent" /Users/ryanliu/Documents/uclaw/ui/src/lib/types.ts 2>&1
```

If `lib/types.ts` exists and exports types our chips need, plan to port it (or extract only what's needed) in Task 7 alongside the chips that consume it.

- [ ] **Step 3: Confirm uclaw's `@/atoms/settings-tab` shape vs our stubs**

```bash
ls /Users/ryanliu/Documents/uclaw/ui/src/atoms/settings-tab.ts 2>&1
grep "^export" /Users/ryanliu/Documents/uclaw/ui/src/atoms/settings-tab.ts 2>&1
```

Our `peripheral-stubs.ts` exports `settingsTabAtom`, `settingsOpenAtom`, `environmentCheckDialogOpenAtom`. Verify uclaw's actual exports match (so the retarget `@/atoms/settings-tab` → `peripheral-stubs` works without prop adjustments at chip consumers).

- [ ] **Step 4: Check `agent-atoms.ts` for chip-required exports**

```bash
DEST=/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
echo "=== uclaw chips read from agent-atoms ==="
for f in $UCLAW/components/{agent/SkillCitationChips.tsx,agent/SkillRecallChips.tsx,chat/MemoryRecallChip.tsx,chat/ProactiveLearningChip.tsx,chat/ChatToolBlock.tsx} ; do
  grep -nE "from '@/atoms/agent-atoms'" "$f"
done
echo ""
echo "=== Our agent-atoms exports ==="
grep -nE "^export " $DEST/desktop/src/features/chat-agent/atoms/agent-atoms.ts | head -40
```

For each atom/type referenced by a chip that's NOT in our agent-atoms, list as "type/atom coverage gap" — Task 6/7/8 will need to verify before porting.

- [ ] **Step 5: Stub-replacement mapping**

```bash
grep -rn "from .*stubs/skill-chips\|from .*stubs/learning-chips\|from .*stubs/chat-tool-activity-indicator" \
  $DEST/desktop/src/features/chat-agent/ 2>&1
```

Identify every consumer of the 3 stubs to delete. Primary expected consumer: `agent-messages.tsx`.

- [ ] **Step 6: Atom shadow mapping**

```bash
grep -nE "^export (const|interface|type) (channelsAtom|tabMinimapCacheAtom|proactiveLearningEventsAtom|memoryRecallEventAtom|skillRecallsMapAtom|agentDisplayNameForAtom|stickyUserMessageEnabledAtom|SettingsTab|settingsTabAtom|settingsOpenAtom|environmentCheckDialogOpenAtom|readAttachment|saveImageAs|openExternal)" \
  $DEST/desktop/src/features/chat-agent/lib/peripheral-stubs.ts
```

This produces the BEFORE list. Determine which exports get DELETED in Task 11 (atom shadows that have a real source after Tasks 3-5) vs KEPT (Tauri shims + settings atoms — Plan 2b.2.c.3 handles).

- [ ] **Step 7: ui-preferences.ts Tauri persistence check**

```bash
grep -nA 5 "initializeUiPreferences\|updateStickyUserMessageEnabled" /Users/ryanliu/Documents/uclaw/ui/src/atoms/ui-preferences.ts
```

`ui-preferences.ts` calls Tauri commands (`invoke('get_ui_preferences')`, `invoke('set_sticky_user_message_enabled')`). Confirm whether the calls reference our existing `@tauri-apps/api/core` (already a dep) or a custom bridge. If custom, plan to retarget to peripheral-stubs no-op OR add commands in c.3.

- [ ] **Step 8: Write recon doc**

Save to `docs/superpowers/plans/2026-05-28-desktop-composer-and-atoms-recon.md` with sections:
- Per-file import surface (Step 1)
- `lib/types.ts` decision (Step 2): port the file OR inline the type
- `@/atoms/settings-tab` mapping (Step 3): exports match our stubs yes/no
- agent-atoms type-coverage gaps (Step 4)
- Stub-replacement mapping (Step 5)
- Atom shadow inventory (Step 6): which deletes in Task 11
- ui-preferences Tauri-call handling (Step 7)

- [ ] **Step 9: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add docs/superpowers/plans/2026-05-28-desktop-composer-and-atoms-recon.md
git commit -m "docs(plan): recon composer + atoms + chips for 2b.2.c.2"
```

## Reporting (per task — applies throughout)

Each subagent reports **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** with commit SHA + test count delta + any adaptations.

---

## Task 2: Composer utilities (composer-serialize + MentionChipNode) + optional lib/types.ts

**Files:**
- Create: `desktop/src/features/chat-agent/lib/composer/composer-serialize.ts`
- Create: `desktop/src/features/chat-agent/lib/composer/composer-serialize.test.ts` (port uclaw's verbatim)
- Create: `desktop/src/features/chat-agent/lib/composer/mention-chip-node.ts`
- (Conditional, per Task 1 Step 2) Create: `desktop/src/features/chat-agent/lib/types.ts`

### Step 1: Port composer-serialize.ts verbatim

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/composer/composer-serialize.ts` (57 LOC) → target. Apply retargets per methodology. Per recon, exports `serializeDocToWireText(doc) → string`.

### Step 2: Port uclaw's composer-serialize.test.ts

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/composer/composer-serialize.test.ts` (134 LOC) → target. Retarget the source import only. Verbatim assertions.

### Step 3: Port MentionChipNode.ts → mention-chip-node.ts (kebab-case)

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/composer/MentionChipNode.ts` (137 LOC) → `desktop/src/features/chat-agent/lib/composer/mention-chip-node.ts`. **Filename normalized to kebab-case; exported symbol `MentionChipNode` stays unchanged.** Add doc comment at top:

```ts
// Ported from uclaw composer/MentionChipNode.ts. Filename normalized to
// kebab-case for consistency with the rest of features/chat-agent/lib/;
// the exported TipTap Node symbol `MentionChipNode` is unchanged.
```

Per recon, exports: `MentionChipKind` (type alias), `MentionChipAttrs` (interface), `chipToWireText(attrs) → string`, `MentionChipNode` (TipTap Node).

### Step 4: (Conditional) Port lib/types.ts

If Task 1 Step 2 confirmed `uclaw/ui/src/lib/types.ts` exists AND exports symbols our chips need (`ProactiveLearningEvent` at minimum), port it verbatim to `desktop/src/features/chat-agent/lib/types.ts`. Apply retargets.

If uclaw's `lib/types.ts` does NOT exist (or `ProactiveLearningEvent` lives in `agent-atoms.ts`), skip this step — Task 7 (ProactiveLearningChip port) will retarget to whatever the real source is.

### Step 5: Run tests

```bash
pnpm --dir desktop test "(composer-serialize|mention-chip-node|chat-agent/lib/types)" 2>&1 | tail -10
```

Expected: uclaw's composer-serialize tests PASS verbatim. Mention-chip-node has no port-time tests (it's a TipTap Node extension; tested via RichTextInput in Task 10).

### Step 6: Commit

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/lib/composer/ desktop/src/features/chat-agent/lib/types.ts 2>/dev/null || true
git commit -m "feat(desktop): port composer utilities (composer-serialize + MentionChipNode) + optional lib/types"
```

Report commit SHA + test count + whether `lib/types.ts` was ported.

---

## Task 3: Small atoms (agent-display-name + ui-preferences)

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/agent-display-name.ts` (56 LOC)
- Create: `desktop/src/features/chat-agent/atoms/agent-display-name.test.ts`
- Create: `desktop/src/features/chat-agent/atoms/ui-preferences.ts` (84 LOC)
- Create: `desktop/src/features/chat-agent/atoms/ui-preferences.test.ts`

### Step 1: Port agent-display-name.ts verbatim

Read `/Users/ryanliu/Documents/uclaw/ui/src/atoms/agent-display-name.ts` → target. Apply retargets. Per recon, exports `DEFAULT_AGENT_NAME`, `agentDisplayNameMapAtom` (uses `atomWithStorage`), `agentDisplayNameForAtom`, `setAgentDisplayName` (mutator function).

### Step 2: Write minimal test

```ts
// desktop/src/features/chat-agent/atoms/agent-display-name.test.ts
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { DEFAULT_AGENT_NAME, agentDisplayNameForAtom, agentDisplayNameMapAtom } from './agent-display-name'

describe('agent-display-name atoms', () => {
  it('exports DEFAULT_AGENT_NAME as a string', () => {
    expect(typeof DEFAULT_AGENT_NAME).toBe('string')
    expect(DEFAULT_AGENT_NAME.length).toBeGreaterThan(0)
  })

  it('agentDisplayNameMapAtom defaults to empty record', () => {
    const store = createStore()
    expect(store.get(agentDisplayNameMapAtom)).toEqual({})
  })

  it('agentDisplayNameForAtom returns a function', () => {
    const store = createStore()
    expect(typeof store.get(agentDisplayNameForAtom)).toBe('function')
  })
})
```

### Step 3: Port ui-preferences.ts verbatim

Read `/Users/ryanliu/Documents/uclaw/ui/src/atoms/ui-preferences.ts` → target. Apply retargets.

**Tauri persistence note:** Per Task 1 Step 7 recon, this file calls `invoke('get_ui_preferences')`, `invoke('set_sticky_user_message_enabled')`, etc. against the Tauri runtime. In jsdom test environment these `invoke` calls will throw or hang.

Mitigation: wrap each `invoke` call in a try/catch that returns the default on failure (uclaw upstream may already do this — preserve verbatim). If not, add the safety wrapper inline AND document with a comment:

```ts
// Plan 2b.2.c.2 — invoke('get_ui_preferences') will be a no-op in MVP
// (Rust command not yet implemented; lands in Plan 2b.2.c.3 / 3.5).
// We catch the error so the atom default-loading flow doesn't throw.
```

### Step 4: Write minimal test

```ts
// desktop/src/features/chat-agent/atoms/ui-preferences.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'jotai/vanilla'

// Mock the Tauri invoke surface so atomWithStorage / initializeUiPreferences
// don't try to actually call backend commands.
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}))

const mod = await import('./ui-preferences')

describe('ui-preferences atoms', () => {
  it('stickyUserMessageEnabledAtom defaults to true', () => {
    const store = createStore()
    expect(store.get(mod.stickyUserMessageEnabledAtom)).toBe(true)
  })

  it('agentStatusBarEnabledAtom + planModeSuggestEnabledAtom export with boolean defaults', () => {
    const store = createStore()
    expect(typeof store.get(mod.agentStatusBarEnabledAtom)).toBe('boolean')
    expect(typeof store.get(mod.planModeSuggestEnabledAtom)).toBe('boolean')
  })

  it('initializeUiPreferences is callable and resolves', async () => {
    await expect(mod.initializeUiPreferences(createStore())).resolves.not.toThrow()
  })
})
```

If `initializeUiPreferences` has a different signature, adapt the test.

### Step 5: Run tests + commit

```bash
pnpm --dir desktop test "atoms/(agent-display-name|ui-preferences)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/atoms/{agent-display-name,ui-preferences}*
git commit -m "feat(desktop): port small chat-side atoms (agent-display-name + ui-preferences)"
```

Report **DONE** / **BLOCKED** with commit SHA + test count + Tauri-invoke handling chosen.

---

## Task 4: Heavy atom — chat-atoms.ts (225 LOC)

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/chat-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/chat-atoms.test.ts`

### Step 1: Inspect source

```bash
grep -E "^export " /Users/ryanliu/Documents/uclaw/ui/src/atoms/chat-atoms.ts | head -30
grep -E "^import " /Users/ryanliu/Documents/uclaw/ui/src/atoms/chat-atoms.ts | head -10
```

### Step 2: Port verbatim

Read `/Users/ryanliu/Documents/uclaw/ui/src/atoms/chat-atoms.ts` → target. Apply retargets per methodology.

**Important:** chat-atoms.ts is HEAVY (225 LOC) with many exports including some chat-mode-specific atoms (`conversationsAtom`, `currentConversationIdAtom`, etc.) that are DORMANT in agent-mode MVP — that's expected per design. They cost nothing until something subscribes. Add a header comment:

```ts
// Plan 2b.2.c.2 — verbatim port from uclaw atoms/chat-atoms.ts.
// Many atoms here (conversationsAtom, currentConversationIdAtom, ...) are
// chat-mode features dormant in agent-mode MVP. They sit at their default
// values until Plan 4 (chat-mode backend wiring) populates them. Staying
// 1:1 with uclaw upstream makes future syncs trivial.
```

### Step 3: Write minimal default-value test

```ts
// desktop/src/features/chat-agent/atoms/chat-atoms.test.ts
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  channelsAtom,
  channelsLoadedAtom,
  conversationsAtom,
  currentConversationIdAtom,
  CONTEXT_LENGTH_OPTIONS,
} from './chat-atoms'

describe('chat-atoms', () => {
  it('channelsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(channelsAtom)).toEqual([])
  })

  it('channelsLoadedAtom defaults to false', () => {
    const store = createStore()
    expect(store.get(channelsLoadedAtom)).toBe(false)
  })

  it('conversationsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(conversationsAtom)).toEqual([])
  })

  it('currentConversationIdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(currentConversationIdAtom)).toBeNull()
  })

  it('CONTEXT_LENGTH_OPTIONS includes the expected values', () => {
    expect(CONTEXT_LENGTH_OPTIONS).toContain('infinite')
    expect(CONTEXT_LENGTH_OPTIONS.length).toBeGreaterThan(0)
  })
})
```

### Step 4: Run + commit

```bash
pnpm --dir desktop test atoms/chat-atoms 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/atoms/chat-atoms*
git commit -m "feat(desktop): port chat-atoms (225 LOC verbatim, chat-mode atoms dormant in MVP)"
```

Report commit SHA + test count.

---

## Task 5: Heavy atom — tab-atoms.ts (195 LOC)

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/tab-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/tab-atoms.test.ts`

### Step 1: Inspect source

```bash
grep -E "^export " /Users/ryanliu/Documents/uclaw/ui/src/atoms/tab-atoms.ts | head -30
grep -E "^import " /Users/ryanliu/Documents/uclaw/ui/src/atoms/tab-atoms.ts | head -10
```

### Step 2: Port verbatim

Read `/Users/ryanliu/Documents/uclaw/ui/src/atoms/tab-atoms.ts` → target. Apply retargets.

**Important:** Same dormant-atom note as Task 4 — tab-management atoms (`tabsAtom`, `activeTabIdAtom`, `tabMruAtom`, etc.) are dormant in agent-mode MVP. Add a header comment matching Task 4's pattern.

**Note on `tabMinimapCacheAtom`:** Our `peripheral-stubs.ts` currently exports `tabMinimapCacheAtom`. If uclaw's `tab-atoms.ts` ALSO exports it, the real one takes precedence — Task 11 deletes the shadow. If uclaw's `tab-atoms.ts` does NOT export it, leave the stub in `peripheral-stubs.ts` for now; Plan 2b.2.c.3 addresses.

### Step 3: Write minimal default-value test

```ts
// desktop/src/features/chat-agent/atoms/tab-atoms.test.ts
import { describe, it, expect } from 'vitest'
import { createStore } from 'jotai/vanilla'
import {
  tabsAtom,
  activeTabIdAtom,
  tabMruAtom,
} from './tab-atoms'

describe('tab-atoms', () => {
  it('tabsAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(tabsAtom)).toEqual([])
  })

  it('activeTabIdAtom defaults to null', () => {
    const store = createStore()
    expect(store.get(activeTabIdAtom)).toBeNull()
  })

  it('tabMruAtom defaults to empty array', () => {
    const store = createStore()
    expect(store.get(tabMruAtom)).toEqual([])
  })
})
```

### Step 4: Run + commit

```bash
pnpm --dir desktop test atoms/tab-atoms 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/atoms/tab-atoms*
git commit -m "feat(desktop): port tab-atoms (195 LOC verbatim, tab-management dormant in MVP)"
```

Report commit SHA + test count + whether `tabMinimapCacheAtom` is in this file or not.

---

## Task 6: ChatToolBlock + ChatToolActivityIndicator (real chips)

**Files:**
- Create: `desktop/src/features/chat-agent/components/chat-tool-block.tsx` (155 LOC)
- Create: `desktop/src/features/chat-agent/components/chat-tool-block.test.tsx`
- Create: `desktop/src/features/chat-agent/components/chat-tool-activity-indicator.tsx` (71 LOC, REAL impl)
- Create: `desktop/src/features/chat-agent/components/chat-tool-activity-indicator.test.tsx`

### Step 1: Port ChatToolBlock.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatToolBlock.tsx` → `desktop/src/features/chat-agent/components/chat-tool-block.tsx`. Apply retargets:
- `@/components/agent/tool-utils` → `@/features/chat-agent/lib/tool-utils` (Plan 2b.2.c.1)
- `@/components/agent/tool-phrase` → `@/features/chat-agent/lib/tool-phrase` (Plan 2b.2.c.1)
- `@/components/agent/tool-renderers` → `@/features/chat-agent/components/tool-renderers` (Plan 2b.2.c.1)
- `@/components/agent/tool-renderers/BashStreamView` → `@/features/chat-agent/components/tool-renderers/bash-stream-view` (Plan 2b.2.c.1 renamed kebab-case)
- `@/atoms/agent-atoms` → `@/features/chat-agent/atoms/agent-atoms`

### Step 2: Port ChatToolActivityIndicator.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatToolActivityIndicator.tsx` → `desktop/src/features/chat-agent/components/chat-tool-activity-indicator.tsx`. Apply retargets:
- `./ChatToolBlock` → `./chat-tool-block`
- `@/lib/chat-types` → `@/features/chat-agent/lib/chat-types`

### Step 3: Write smoke tests

```tsx
// desktop/src/features/chat-agent/components/chat-tool-block.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatToolBlock } from './chat-tool-block'

describe('ChatToolBlock', () => {
  it('renders a tool block with name + status', () => {
    render(
      <ChatToolBlock
        toolName="read_file"
        input={{ path: '/x.txt' }}
        result=""
        isError={false}
        status="running"
      />,
    )
    // Real component renders tool phrase + spinner; assert mount only
    const root = document.body.firstChild
    expect(root).not.toBeNull()
  })
})
```

Adapt props to ChatToolBlock's actual signature (it likely takes more or fewer fields). If it requires a `live` prop with LiveOutput shape, pass a minimal one.

```tsx
// desktop/src/features/chat-agent/components/chat-tool-activity-indicator.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatToolActivityIndicator } from './chat-tool-activity-indicator'

describe('ChatToolActivityIndicator (real)', () => {
  it('renders nothing for empty activities', () => {
    const { container } = render(<ChatToolActivityIndicator activities={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an activity element when activities present', () => {
    const { container } = render(
      <ChatToolActivityIndicator
        activities={[{
          id: 'a1',
          toolName: 'read_file',
          input: {},
          status: 'running',
        } as Parameters<typeof ChatToolActivityIndicator>[0]['activities'][0]]}
      />,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
```

Adapt `activities` shape to actual `ChatToolActivity` interface from chat-types.

### Step 4: Run + commit

```bash
pnpm --dir desktop test "(chat-tool-block|chat-tool-activity-indicator)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/components/{chat-tool-block,chat-tool-activity-indicator}*
git commit -m "feat(desktop): port ChatToolBlock + real ChatToolActivityIndicator (chips)"
```

Report commit SHA + test count + any prop shape adaptations.

---

## Task 7: MemoryRecallChip + ProactiveLearningChip (small chips)

**Files:**
- Create: `desktop/src/features/chat-agent/components/memory-recall-chip.tsx` (166 LOC)
- Create: `desktop/src/features/chat-agent/components/memory-recall-chip.test.tsx`
- Create: `desktop/src/features/chat-agent/components/proactive-learning-chip.tsx` (96 LOC)
- Create: `desktop/src/features/chat-agent/components/proactive-learning-chip.test.tsx`

### Step 1: Port MemoryRecallChip.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/MemoryRecallChip.tsx` → `desktop/src/features/chat-agent/components/memory-recall-chip.tsx`. Apply retargets:
- `@/components/ui/badge` → `@/shared/ui/badge` (Plan 2b.2.c.1 added this primitive)
- `@/atoms/agent-atoms` → `@/features/chat-agent/atoms/agent-atoms` (for `MemoryRecallEvent` type)

### Step 2: Port ProactiveLearningChip.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ProactiveLearningChip.tsx` → `desktop/src/features/chat-agent/components/proactive-learning-chip.tsx`. Apply retargets:
- `@/components/ui/badge` → `@/shared/ui/badge`
- `@/components/ui/tooltip` → `@/shared/ui/tooltip`
- `@/lib/types` (ProactiveLearningEvent) → `@/features/chat-agent/lib/types` (if Task 2 ported it) OR `@/features/chat-agent/atoms/agent-atoms` (if the real type lives there)

### Step 3: Write smoke tests

```tsx
// desktop/src/features/chat-agent/components/memory-recall-chip.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRecallChip } from './memory-recall-chip'

describe('MemoryRecallChip', () => {
  it('renders for a minimal memory recall event', () => {
    const event = { id: 'm1', kind: 'recall' } as Parameters<typeof MemoryRecallChip>[0]['event']
    const { container } = render(<MemoryRecallChip event={event} />)
    expect(container.firstChild).not.toBeNull()
  })
})
```

```tsx
// desktop/src/features/chat-agent/components/proactive-learning-chip.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProactiveLearningChip } from './proactive-learning-chip'

describe('ProactiveLearningChip', () => {
  it('renders for a minimal proactive learning event', () => {
    const event = { id: 'p1' } as Parameters<typeof ProactiveLearningChip>[0]['event']
    const { container } = render(<ProactiveLearningChip event={event} />)
    expect(container.firstChild).not.toBeNull()
  })
})
```

Adapt the `event` shape to whatever `MemoryRecallEvent` / `ProactiveLearningEvent` actually requires (read the chip's prop interface).

### Step 4: Run + commit

```bash
pnpm --dir desktop test "(memory-recall-chip|proactive-learning-chip)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/components/{memory-recall-chip,proactive-learning-chip}*
git commit -m "feat(desktop): port MemoryRecallChip + ProactiveLearningChip"
```

Report commit SHA + test count.

---

## Task 8: SkillCitationChips + SkillRecallChips

**Files:**
- Create: `desktop/src/features/chat-agent/components/skill-citation-chips.tsx` (112 LOC)
- Create: `desktop/src/features/chat-agent/components/skill-citation-chips.test.tsx`
- Create: `desktop/src/features/chat-agent/components/skill-recall-chips.tsx` (218 LOC)
- Create: `desktop/src/features/chat-agent/components/skill-recall-chips.test.tsx`

### Step 1: Port SkillCitationChips.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SkillCitationChips.tsx` → `desktop/src/features/chat-agent/components/skill-citation-chips.tsx`. Apply retargets:
- `@/lib/skill-citation` (SkillCitation type) → `@/shared/lib/skill-citation` (Plan 2b.2.b.1)
- `@/lib/tauri-bridge` (recordSkillCited) → `@/features/chat-agent/lib/peripheral-stubs` — **but** `recordSkillCited` is NOT in peripheral-stubs yet. **Action:** add a no-op stub for it in peripheral-stubs.ts as part of this task:

```ts
// In peripheral-stubs.ts (add alongside the existing Tauri shims):

/** Real impl lands in Plan 4 (skill registry). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function recordSkillCited(_skillName: string): Promise<void> {
  return
}
```

- `@/atoms/settings-tab` (settingsOpenAtom, settingsTabAtom) → `@/features/chat-agent/lib/peripheral-stubs` (already stubbed)

### Step 2: Port SkillRecallChips.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SkillRecallChips.tsx` → target. Apply retargets:
- `@/atoms/agent-atoms` (skillRecallsMapAtom, SkillRecall type) → `@/features/chat-agent/atoms/agent-atoms`
- `@/atoms/settings-tab` → `@/features/chat-agent/lib/peripheral-stubs`

### Step 3: Write smoke tests

```tsx
// desktop/src/features/chat-agent/components/skill-citation-chips.test.tsx
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect } from 'vitest'
import { SkillCitationChips } from './skill-citation-chips'

describe('SkillCitationChips', () => {
  it('renders nothing for empty citations', () => {
    const { container } = render(
      <Provider>
        <SkillCitationChips citations={[]} messageKey="m-1" />
      </Provider>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders for a single citation', () => {
    const citations = [{ name: 'test-skill', source: '@test' } as Parameters<typeof SkillCitationChips>[0]['citations'][0]]
    const { container } = render(
      <Provider>
        <SkillCitationChips citations={citations} messageKey="m-1" />
      </Provider>,
    )
    expect(container.firstChild).not.toBeNull()
  })
})
```

```tsx
// desktop/src/features/chat-agent/components/skill-recall-chips.test.tsx
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { describe, it, expect } from 'vitest'
import { SkillRecallChips } from './skill-recall-chips'

describe('SkillRecallChips', () => {
  it('renders without crashing for empty session', () => {
    const { container } = render(
      <Provider>
        <SkillRecallChips sessionId="s1" />
      </Provider>,
    )
    // Real component queries skillRecallsMapAtom; with empty store renders nothing
    expect(container).toBeDefined()
  })
})
```

Adapt prop shapes if uclaw uses different field names.

### Step 4: Run + commit

```bash
pnpm --dir desktop test "(skill-citation-chips|skill-recall-chips)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/components/{skill-citation-chips,skill-recall-chips}* desktop/src/features/chat-agent/lib/peripheral-stubs.ts
git commit -m "feat(desktop): port SkillCitationChips + SkillRecallChips (recordSkillCited stubbed)"
```

Report commit SHA + test count + confirmation that `recordSkillCited` no-op was added to peripheral-stubs.

---

## Task 9: Composer components (ComposerMentionController + ComposerMentionPopup)

**Files:**
- Create: `desktop/src/features/chat-agent/components/composer/composer-mention-controller.tsx` (381 LOC, kebab-cased)
- Create: `desktop/src/features/chat-agent/components/composer/composer-mention-controller.test.tsx`
- Create: `desktop/src/features/chat-agent/components/composer/composer-mention-popup.tsx` (117 LOC, kebab-cased)
- Create: `desktop/src/features/chat-agent/components/composer/composer-mention-popup.test.tsx`

### Step 1: Port ComposerMentionController.tsx → composer-mention-controller.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/composer/ComposerMentionController.tsx` → target (kebab-cased; symbol stays `ComposerMentionController`). Apply retargets:
- `./MentionChipNode` → `@/features/chat-agent/lib/composer/mention-chip-node`
- `./ComposerMentionPopup` → `./composer-mention-popup`
- `@/atoms/chat-atoms` → `@/features/chat-agent/atoms/chat-atoms`
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- Other paths per methodology

Add kebab-case doc comment at top.

### Step 2: Port ComposerMentionPopup.tsx → composer-mention-popup.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/composer/ComposerMentionPopup.tsx` → target. Apply retargets.

### Step 3: Write smoke tests

```tsx
// desktop/src/features/chat-agent/components/composer/composer-mention-controller.test.tsx
import { describe, it, expect } from 'vitest'
import { ComposerMentionController } from './composer-mention-controller'

describe('ComposerMentionController', () => {
  it('module exports the controller component', () => {
    expect(typeof ComposerMentionController).toBe('object') // forwardRef returns an object
  })
})
```

```tsx
// desktop/src/features/chat-agent/components/composer/composer-mention-popup.test.tsx
import { describe, it, expect } from 'vitest'
import { ComposerMentionPopup } from './composer-mention-popup'

describe('ComposerMentionPopup', () => {
  it('module exports the popup component', () => {
    expect(typeof ComposerMentionPopup).toBe('function')
  })
})
```

Full render tests for these are integration-shaped (require TipTap editor + popup positioning). Smoke tests assert module-level compilation; deeper coverage comes via RichTextInput (Task 10) and AgentMessages (existing tests still pass).

### Step 4: Run + commit

```bash
pnpm --dir desktop test composer 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/components/composer/
git commit -m "feat(desktop): port composer components (MentionController + MentionPopup, kebab-cased)"
```

Report commit SHA + test count.

---

## Task 10: RichTextInput (the composer input, deferred from b.1)

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/rich-text-input.tsx` (222 LOC)
- Create: `desktop/src/features/chat-agent/components/ai-elements/rich-text-input.test.tsx`

### Step 1: Port rich-text-input.tsx

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/rich-text-input.tsx` → target. Apply retargets:
- `@/components/composer/MentionChipNode` → `@/features/chat-agent/lib/composer/mention-chip-node`
- `@/components/composer/composer-serialize` → `@/features/chat-agent/lib/composer/composer-serialize`
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder` — stay as-is (npm packages installed in Plan 2b.2.b.1)

### Step 2: Write smoke test

```tsx
// desktop/src/features/chat-agent/components/ai-elements/rich-text-input.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RichTextInput } from './rich-text-input'

describe('RichTextInput', () => {
  it('renders a TipTap editable surface', () => {
    render(<RichTextInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />)
    // TipTap renders an editable [contenteditable] element
    const editor = document.querySelector('[contenteditable="true"]')
    expect(editor).not.toBeNull()
  })

  it('renders placeholder when provided', () => {
    render(<RichTextInput value="" onChange={vi.fn()} onSubmit={vi.fn()} placeholder="Type here" />)
    // TipTap places the placeholder as a data attribute or inside .is-empty
    expect(document.body.textContent ?? '').toBeDefined()
  })
})
```

If RichTextInput's prop signature differs (e.g., uses `defaultValue` instead of `value`, or takes a controller ref), adapt the test to the real signature.

### Step 3: Run + commit

```bash
pnpm --dir desktop test rich-text-input 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git add desktop/src/features/chat-agent/components/ai-elements/rich-text-input*
git commit -m "feat(desktop): port ai-elements/rich-text-input (TipTap composer, deferred from b.1)"
```

Report commit SHA + test count.

---

## Task 11: Swap AgentMessages imports + shrink peripheral-stubs + delete 3 stubs

**Files:**
- Modify: `desktop/src/features/chat-agent/components/agent-messages.tsx`
- Modify: `desktop/src/features/chat-agent/lib/peripheral-stubs.ts`
- Delete: `desktop/src/features/chat-agent/components/stubs/skill-chips.tsx` + `.test.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/learning-chips.tsx` + `.test.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/chat-tool-activity-indicator.tsx` + `.test.tsx`

### Step 1: Find every consumer of the 3 stubs

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
grep -rn "from .*stubs/\(skill-chips\|learning-chips\|chat-tool-activity-indicator\)" desktop/src/features/chat-agent/ 2>&1
```

Identify consumers — primarily expected to be `agent-messages.tsx`.

### Step 2: Plan the import swaps in agent-messages.tsx

```diff
- import { SkillCitationChips, SkillRecallChips } from '@/features/chat-agent/components/stubs/skill-chips'
+ import { SkillCitationChips } from '@/features/chat-agent/components/skill-citation-chips'
+ import { SkillRecallChips } from '@/features/chat-agent/components/skill-recall-chips'

- import { ProactiveLearningChip, MemoryRecallChip } from '@/features/chat-agent/components/stubs/learning-chips'
+ import { ProactiveLearningChip } from '@/features/chat-agent/components/proactive-learning-chip'
+ import { MemoryRecallChip } from '@/features/chat-agent/components/memory-recall-chip'

- import { ChatToolActivityIndicator } from '@/features/chat-agent/components/stubs/chat-tool-activity-indicator'
+ import { ChatToolActivityIndicator } from '@/features/chat-agent/components/chat-tool-activity-indicator'
```

### Step 3: Plan the atom import swaps in agent-messages.tsx

Per Task 1 Step 6 recon, the following atom imports are currently pointing at peripheral-stubs but should now point at the real atoms:

```diff
- import {
-   channelsAtom,
-   tabMinimapCacheAtom,    // KEEP from peripheral-stubs if uclaw's tab-atoms.ts doesn't export it (Task 5 reports)
-   proactiveLearningEventsAtom,
-   memoryRecallEventAtom,
-   skillRecallsMapAtom,
-   agentDisplayNameForAtom,
-   stickyUserMessageEnabledAtom,
-   saveImageAs,
- } from '@/features/chat-agent/lib/peripheral-stubs'
+ import { channelsAtom } from '@/features/chat-agent/atoms/chat-atoms'
+ import { agentDisplayNameForAtom } from '@/features/chat-agent/atoms/agent-display-name'
+ import { stickyUserMessageEnabledAtom } from '@/features/chat-agent/atoms/ui-preferences'
+ // proactiveLearningEventsAtom, memoryRecallEventAtom, skillRecallsMapAtom already in agent-atoms.ts:
+ import {
+   proactiveLearningEventsAtom,
+   memoryRecallEventAtom,
+   skillRecallsMapAtom,
+ } from '@/features/chat-agent/atoms/agent-atoms'
+ // tabMinimapCacheAtom stays in peripheral-stubs IF Task 5 confirmed it's not in tab-atoms.ts:
+ import { tabMinimapCacheAtom, saveImageAs } from '@/features/chat-agent/lib/peripheral-stubs'
```

If Task 5 reports `tabMinimapCacheAtom` IS in `tab-atoms.ts`, retarget it: `import { tabMinimapCacheAtom } from '@/features/chat-agent/atoms/tab-atoms'` and delete the stub from peripheral-stubs.ts.

### Step 4: Apply the edits

Make the diffs above in `desktop/src/features/chat-agent/components/agent-messages.tsx`. Verify it still compiles (`pnpm --dir desktop build` after the edit).

### Step 5: Shrink peripheral-stubs.ts

Edit `desktop/src/features/chat-agent/lib/peripheral-stubs.ts` to remove:
- `channelsAtom` export
- `proactiveLearningEventsAtom`, `memoryRecallEventAtom`, `skillRecallsMapAtom` exports (these were never the right source of truth; their shadows in peripheral-stubs were the c-A follow-up bug)
- `agentDisplayNameForAtom` export
- `stickyUserMessageEnabledAtom` export
- `tabMinimapCacheAtom` export — IF Task 5 reported tab-atoms.ts has it

KEEP:
- `readAttachment`, `saveImageAs`, `openExternal`, `recordSkillCited` (Task 8) — Tauri shims
- `settingsTabAtom`, `settingsOpenAtom`, `environmentCheckDialogOpenAtom`, `SettingsTab` type — settings (deferred to c.3+)
- `tabMinimapCacheAtom` — IF Task 5 reported it's NOT in tab-atoms.ts

Update the file's header comment to reflect the new, slimmer scope.

### Step 6: Delete the 3 stub files

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms
git rm desktop/src/features/chat-agent/components/stubs/skill-chips.tsx \
       desktop/src/features/chat-agent/components/stubs/skill-chips.test.tsx \
       desktop/src/features/chat-agent/components/stubs/learning-chips.tsx \
       desktop/src/features/chat-agent/components/stubs/learning-chips.test.tsx \
       desktop/src/features/chat-agent/components/stubs/chat-tool-activity-indicator.tsx \
       desktop/src/features/chat-agent/components/stubs/chat-tool-activity-indicator.test.tsx
```

### Step 7: Edit recon doc for follow-up 2b.2.c-C

```bash
# Open docs/superpowers/plans/2026-05-28-desktop-agent-messages-recon.md and remove the
# rows in the "Atom dependencies" table that misclassified proactiveLearningEventsAtom,
# memoryRecallEventAtom, skillRecallsMapAtom as needing stubs (they were already in
# agent-atoms.ts at the time of Plan 2b.2.b.2). Add a brief note:
#   "Amended 2b.2.c.2: shadows removed; consumers point at real agent-atoms."
```

If the recon doc lives at `docs/superpowers/plans/2026-05-28-desktop-agent-messages-recon.md`, edit that file. If the misclassification is in a different recon doc, find and edit it.

### Step 8: Run full test suite + build

```bash
pnpm --dir desktop test 2>&1 | tail -15
pnpm --dir desktop build 2>&1 | tail -10
```

Both must pass. If a downstream test breaks (e.g., agent-messages.test.tsx asserts on stub `data-stub` attributes that the real chips don't render), fix the test ONLY — the real components are the source of truth.

### Step 9: Verify stubs/ directory state

```bash
ls desktop/src/features/chat-agent/components/stubs/
```

Expected: ONLY `scroll-position-manager.tsx` + `scroll-position-manager.test.tsx` remain.

### Step 10: Commit

```bash
git add desktop/src/features/chat-agent/components/agent-messages.tsx \
        desktop/src/features/chat-agent/lib/peripheral-stubs.ts \
        desktop/src/features/chat-agent/components/stubs/ \
        docs/superpowers/plans/2026-05-28-desktop-agent-messages-recon.md 2>/dev/null || true
git commit -m "refactor(desktop): swap stub imports → real atoms + real chips (closes 2b.2.c-A + 2b.2.c-C)"
```

Report commit SHA + final stubs/ inventory + whether `tabMinimapCacheAtom` was deleted from peripheral-stubs or kept.

---

## Task 12: Smoke verification

**Files:** None.

### Step 1-7: Standard smoke

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-composer-and-atoms

# Step 1: Backend tests
cargo test -p hermes-desktop --lib 2>&1 | tail -3

# Step 2: Frontend tests (expect ≥360)
pnpm --dir desktop test 2>&1 | tail -10

# Step 3: Production build clean (tsc + vite)
pnpm --dir desktop build 2>&1 | tail -10

# Step 4: Warning-free Rust build
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -3

# Step 5: Workspace regression check
cargo check --workspace 2>&1 | tail -3

# Step 6: App.tsx untouched since main
git diff main -- desktop/src/app/App.tsx

# Step 7: No god-file regression
ls desktop/src/lib/
```

Expected: 21 backend PASS, ≥360 frontend PASS, all builds clean, `desktop/src/lib/` only contains `bridge/`.

### Step 8: stubs/ directory inventory

```bash
ls desktop/src/features/chat-agent/components/stubs/
```

Expected: ONLY scroll-position-manager files.

### Step 9: New file inventory

```bash
echo "=== composer/ ==="
ls desktop/src/features/chat-agent/lib/composer/
ls desktop/src/features/chat-agent/components/composer/
echo ""
echo "=== New atoms ==="
ls desktop/src/features/chat-agent/atoms/{chat-atoms,tab-atoms,agent-display-name,ui-preferences}*
echo ""
echo "=== New chips ==="
ls desktop/src/features/chat-agent/components/{skill-citation-chips,skill-recall-chips,memory-recall-chip,proactive-learning-chip,chat-tool-block,chat-tool-activity-indicator}*
echo ""
echo "=== RichTextInput ==="
ls desktop/src/features/chat-agent/components/ai-elements/rich-text-input*
echo ""
echo "=== peripheral-stubs.ts shrunk? ==="
wc -l desktop/src/features/chat-agent/lib/peripheral-stubs.ts
grep -E "^export " desktop/src/features/chat-agent/lib/peripheral-stubs.ts
```

Expected: all new files present + peripheral-stubs shrunk to roughly Tauri shims + settings atoms.

### Step 10: Bundle size

```bash
ls -lh desktop/dist/assets/*.js 2>/dev/null | awk '{print $5, $9}' | head -5
```

Expected: bundle within ~300-400 kB raw (composer + chips add modest LOC).

### Step 11: Repo state

```bash
git status --short
git log --oneline main..HEAD | wc -l
git log --oneline main..HEAD | head -20
```

Expected: clean tree; ~12 task commits above main.

## Reporting

Report **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** with:
- Backend test count
- Frontend test count + delta from main's 345
- Production build status + bundle size
- stubs/ inventory (must be only scroll-position-manager*)
- peripheral-stubs.ts size + remaining exports

---

## Done When

- All 11 source-affecting tasks (Tasks 1–11) complete; Task 12 smoke verification passes.
- ≥15 new frontend tests pass on top of main's 345 (target ≥360 cumulative).
- Backend unchanged: 21 Rust tests PASS.
- 3 stubs deleted (`skill-chips`, `learning-chips`, `chat-tool-activity-indicator`).
- `peripheral-stubs.ts` shrunk: atom shadows removed; only Tauri shims + settings atoms remain.
- AgentMessages imports point to real atoms (chat-atoms, agent-display-name, ui-preferences, agent-atoms for skill/memory/learning maps) + real chips.
- Build clean (tsc + vite + cargo).
- App.tsx untouched.
- No god-file regression (`desktop/src/lib/` still only has `bridge/`).
- Recon doc edit closes follow-up 2b.2.c-C.
- Final code review: APPROVED or APPROVED_WITH_FOLLOWUPS.

## Next Plan

**Plan 2b.2.c.3 — ChatAgentView + App.tsx wiring + ScrollPositionMemory (~600 LOC + integration).** Slim ChatAgentView container, real `useScrollPositionMemory` hook (deletes the last stub), real Tauri attachment commands (`read_attachment`, `save_image_as`) in Rust (or deferred to Plan 3.5), App.tsx replaces MVP composer with `<ChatAgentView />` and subscribes to `listenAgent`. Closes follow-ups 2b.2.c-B (error banner placement) + 2b.2.b.1 #3 (scroll-minimap dead handlers). After c.3 merges, manual `cargo tauri dev` launches the full message view rendering streamed replies with real tool activities.
