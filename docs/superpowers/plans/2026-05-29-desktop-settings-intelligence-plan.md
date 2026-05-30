# Plan 3.5.s.b — Desktop SettingsDialog Intelligence + Memory + Profile + Shortcuts Tabs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Second PR of the SettingsDialog sub-stack (3.5.s). Replace 4 deferred-tab stubs from 3.5.s.a (`IntelligenceTab`, `MemoryRecallTab`, `LearnedProfileTab`, `ShortcutSettings`) with verbatim real ports. After this PR merges, those 4 tabs are functional (or as functional as Tauri stubs allow) and the `[data-deferred-to="3.5.s.b"]` count drops to 0.

**Architecture:** Same Hermes verbatim-port conventions. The settings sub-components consume the 7 settings primitives from 3.5.s.a (Section/Card/Row/Select/Toggle + index). The `useShortcutCapture` hook (deferred from shortcuts-cleanup PR) is also ported as a Wave A prereq — ShortcutSettings consumes it.

**Tech Stack:** React 19 + Jotai 2.17.1 + Vitest + jsdom. Existing shadcn primitives + recharts. No new npm deps anticipated.

**Scope baseline (committed in `main` at `42e73e5f1` after PR #20 merge):**
- All of Plan 3.5.s.a (SettingsDialog shell + 3 core tabs + 11 deferred-tab stubs)
- `useShortcut` from shortcuts-cleanup; `useShortcutCapture` was deferred — port now
- Existing settings primitives (SettingsSection/Card/Row/Select/Toggle/SecretInput) reused
- `settings-bridge-stub.tsx` currently has 11 stubs — 4 of those (3.5.s.b destination) become real
- 901/901 tests baseline

**3.5.s.b port targets:**

| Bucket | Items | LOC |
|---|---|---|
| Hook prereq | `use-shortcut-capture.ts` (deferred from shortcuts-cleanup) | 125 |
| New atom files (likely) | `proactive-atoms.ts`, `learned-profile-atoms.ts` — sized TBD per recon | ~150 |
| New IPC stubs | `proactiveStatus`, `proactiveStart`, `proactiveStop`, `updateGlobalShortcut`, `getLearnedFacets`, `getLearnedProfile`, etc. — surfaced during sub-component ports | ~200 |
| New types | `ShortcutOverrides`, `FacetDto`, etc. — port from uclaw `chat-types`/`types` | ~80 |
| IntelligenceTab + sub-components | IntelligenceTab (111) + ModelSettings (282) + AgentSettings (72) + PromptsSettings (196) | 661 |
| MemoryRecallTab + sub-component | MemoryRecallTab (17) + MemoryRecallSettings (474) | 491 |
| LearnedProfileTab | 537 LOC standalone | 537 |
| ShortcutSettings | 433 LOC | 433 |
| Stub removal + import retarget | Delete 4 stubs from `settings-bridge-stub.tsx`; retarget 4 imports in `settings-panel.tsx` | -20 |
| Integration tests | Group O assertions (4 tabs real, 7 stubs remaining) | ~100 |
| **Total** | | **~2,800 LOC** |

**Tests target:** 901 → ≥945 (+44 minimum).

**Manual launch gate:** `cd desktop && pnpm tauri dev` opens window where SettingsDialog's Intelligence / Memory Recall / Learned Profile / Shortcut tabs render real content (NOT_IMPLEMENTED placeholders gone). The 7 remaining deferred tabs (3.5.s.c: Stt/ImChannels/Pet/BrowserRuntime; 3.5.s.d: Proxy/System/About) still show `data-deferred-to` placeholders. DevTools: `document.querySelectorAll('[data-deferred-to="3.5.s.b"]').length === 0` when any 3.5.s.b tab is active.

---

## File Structure

```
desktop/src/features/chat-agent/
├── hooks/
│   ├── use-shortcut-capture.ts         # NEW (Wave A1, 125 LOC — deferred from shortcuts-cleanup)
│   └── use-shortcut-capture.test.ts    # NEW (port uclaw test)
├── atoms/
│   ├── proactive-atoms.ts              # NEW (Wave A2 — surfaced by IntelligenceTab)
│   ├── learned-profile-atoms.ts        # NEW (Wave A2 — surfaced by LearnedProfileTab)
│   └── *.test.ts
├── lib/
│   ├── tauri-bridge-stub.ts            # MODIFY (Wave A3 — add ~10 new IPC stubs)
│   ├── settings-bridge-stub.tsx        # MODIFY (Wave F1 — DELETE 4 stubs)
│   └── format-date-time.ts             # NEW if not in tree (Wave A — uclaw `lib/utils` `formatDateTime`)
└── components/settings/
    ├── intelligence-tab.tsx            # NEW (Wave B1, 111 LOC)
    ├── intelligence-tab.test.tsx
    ├── model-settings.tsx              # NEW (Wave B2, 282 LOC)
    ├── agent-settings.tsx              # NEW (Wave B3, 72 LOC)
    ├── prompts-settings.tsx            # NEW (Wave B4, 196 LOC — distinct from prompt-settings.tsx in 3.5.s.a)
    ├── prompts-settings.test.tsx
    ├── memory-recall-tab.tsx           # NEW (Wave C1, 17 LOC)
    ├── memory-recall-settings.tsx      # NEW (Wave C2, 474 LOC)
    ├── learned-profile-tab.tsx         # NEW (Wave D1, 537 LOC)
    ├── learned-profile-tab.test.tsx
    ├── shortcut-settings.tsx           # NEW (Wave E1, 433 LOC)
    ├── shortcut-settings.test.tsx
    └── settings-panel.tsx              # MODIFY (Wave F2 — retarget 4 imports from stub → real)

desktop/src/features/chat-agent/components/app-shell/
└── app-shell.integration.test.tsx      # MODIFY (Wave F3 — Group O assertions)
```

---

## Wave A — Hook + atom + type + IPC prereqs

### Task A1: Port `useShortcutCapture` hook

**Files:**
- Create: `desktop/src/features/chat-agent/hooks/use-shortcut-capture.ts` (~125 LOC)
- Create: `desktop/src/features/chat-agent/hooks/use-shortcut-capture.test.ts` (port from uclaw)

Verbatim port from `/Users/ryanliu/Documents/uclaw/ui/src/hooks/useShortcutCapture.ts` with standard retargets.

```bash
git add desktop/src/features/chat-agent/hooks/use-shortcut-capture.{ts,test.ts}
git commit -m "feat(desktop): port use-shortcut-capture hook (Wave A1, deferred from shortcuts-cleanup)"
```

### Task A2: Port missing atom files (iterative per sub-component during Waves B-E)

Likely candidates surfaced during sub-component ports:
- `proactive-atoms.ts` (for IntelligenceTab — `proactiveStatus` may have a corresponding atom)
- `learned-profile-atoms.ts` (for LearnedProfileTab)

Port verbatim per the standard recipe (storage-key rebrand, retargets, `jotai/vanilla` smoke test).

### Task A3: Add new IPC stubs (iterative per sub-component during Waves B-E)

Likely surfaced symbols:
- `proactiveStatus`, `proactiveStart`, `proactiveStop` (IntelligenceTab)
- `updateGlobalShortcut` (ShortcutSettings)
- `getLearnedFacets`, `getLearnedProfile`, learned-profile CRUD (LearnedProfileTab)
- Memory-recall-related IPCs (MemoryRecallSettings)

All NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND per established pattern.

### Task A4: Verify or port `formatDateTime` + `FacetDto`

```bash
grep -rn "formatDateTime\|FacetDto" desktop/src/features/chat-agent/lib/ desktop/src/shared/lib/ 2>/dev/null | head
```

If missing, port. `formatDateTime` likely small helper; `FacetDto` is a type.

---

## Wave B — IntelligenceTab cluster

### Task B1: Port `IntelligenceTab.tsx` (111 LOC)

Verbatim port. Retarget sub-component imports to forthcoming Wave B2/B3/B4 files. uclaw ships a test for this — port verbatim.

### Task B2: Port `ModelSettings.tsx` (282 LOC)

Verbatim port. Likely surfaces model-config bridge stubs (some may already exist from 3.5.s.a). Reuse `SettingsCard`, `SettingsRow`, `SettingsSelect` primitives.

### Task B3: Port `AgentSettings.tsx` (72 LOC)

Verbatim port. Small file; mount smoke test.

### Task B4: Port `PromptsSettings.tsx` (196 LOC)

Verbatim port. Note distinct from `prompt-settings.tsx` from 3.5.s.a — this is plural "PromptsSettings" for prompts tab. Uclaw ships a test — port verbatim.

---

## Wave C — MemoryRecallTab + MemoryRecallSettings

### Task C1: Port `MemoryRecallTab.tsx` (17 LOC)

Trivial wrapper. Verbatim + mount smoke test.

### Task C2: Port `MemoryRecallSettings.tsx` (474 LOC)

Larger sub-component. Likely surfaces memory-recall-related IPC stubs + types. Port verbatim with retargets.

---

## Wave D — LearnedProfileTab

### Task D1: Port `LearnedProfileTab.tsx` (537 LOC)

Standalone (no sub-components). Likely surfaces:
- Multiple learned-profile-related IPC stubs
- `FacetDto` type
- `learned-profile-atoms.ts` (port as A2 sub-task)
- `formatDateTime` helper (port as A4 if missing)

uclaw ships a test — port verbatim.

---

## Wave E — ShortcutSettings

### Task E1: Port `ShortcutSettings.tsx` (433 LOC)

Depends on `use-shortcut-capture` (Wave A1) + `shortcutOverridesAtom` (exists) + `updateGlobalShortcut` IPC stub. uclaw ships a test — port verbatim.

This is the LAST real port. After E1, all 4 tabs scheduled for 3.5.s.b are real.

---

## Wave F — Stub removal + retarget + integration tests + sweep

### Task F1: Remove 4 stubs from `settings-bridge-stub.tsx`

Delete the `IntelligenceTab`, `MemoryRecallTab`, `LearnedProfileTab`, `ShortcutSettings` exports from the 3.5.s.b section of `settings-bridge-stub.tsx`. Update the smoke test's count assertion from 11 → 7.

### Task F2: Retarget `settings-panel.tsx` imports

Change 4 imports from `@/features/chat-agent/lib/settings-bridge-stub` to the real paths:
- `IntelligenceTab` → `./intelligence-tab`
- `MemoryRecallTab` → `./memory-recall-tab`
- `LearnedProfileTab` → `./learned-profile-tab`
- `ShortcutSettings` → `./shortcut-settings`

### Task F3: Extend Group N (or add Group O) integration tests

Add to `app-shell.integration.test.tsx`:

```typescript
describe('AppShell + SettingsDialog 3.5.s.b tabs (real ports)', () => {
  it('O1: intelligence tab opens with real ModelSettings content', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'intelligence')
    render(<Provider store={store}><AppShell /></Provider>)
    // Real IntelligenceTab renders sub-component sections (data-settings-section)
    expect(document.body.querySelector('[data-settings-section]')).not.toBeNull()
    expect(document.body.querySelector('[data-deferred-to="3.5.s.b"]')).toBeNull()
  })

  it('O2: memoryRecall tab is real (no stub marker)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'memoryRecall')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.b"]')).toBeNull()
  })

  it('O3: learnedProfile tab is real', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'learnedProfile')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.b"]')).toBeNull()
  })

  it('O4: shortcuts tab is real', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'shortcuts')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.b"]')).toBeNull()
  })

  it('O5: 3.5.s.c and 3.5.s.d stubs still render for their respective tabs', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'stt')  // 3.5.s.c
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.c"]')).not.toBeNull()
  })
})
```

### Task F4: Final automated sweep

Same recipe as 3.5.s.a F3:

```bash
ls desktop/src/lib/
git grep -nE "'uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/
cd desktop && pnpm vitest run 2>&1 | tail -5
pnpm tsc -b 2>&1 | grep -c "error TS"
cd ..
cargo fmt --all --check
python3 scripts/generate-parity-matrix.py --local-ref HEAD 2>&1 | tail -3
python3 scripts/validate-intentional-divergence.py --check --allow-warnings 2>&1 | tail -3

git status
git add -A
git commit -m "chore(desktop): Plan 3.5.s.b final sweep" 2>/dev/null || true
```

---

## Final Self-Review Checklist

- [ ] Wave A: use-shortcut-capture + new atoms + IPC stubs + types ported
- [ ] Wave B: IntelligenceTab cluster (4 files) ported
- [ ] Wave C: MemoryRecallTab + MemoryRecallSettings ported
- [ ] Wave D: LearnedProfileTab ported
- [ ] Wave E: ShortcutSettings ported
- [ ] Wave F: 4 stubs deleted; 4 imports retargeted; Group O tests pass; final sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] `[data-deferred-to="3.5.s.b"]` count: 0
- [ ] Test count up by ≥44 (was 901 → ≥945)
- [ ] tsc residual errors stable (~31; no NEW from 3.5.s.b)
- [ ] All commits use conventional-commit prefixes

---

## Carry-Forward Follow-ups

After 3.5.s.b merges:

1. **Plan 3.5.s.c** — Provider tabs (ImChannels + Feishu + WeChat + BotHub + WechatIlinkBinding) + SttSettings + PetSettings + BrowserRuntimeSettings (~3,500 LOC; 4 deferred-tab stubs replaced)
2. **Plan 3.5.s.d** — ProxySetting + SystemTab + AboutSettings + Developer surfaces (~3,000 LOC; 3 deferred-tab stubs replaced)
3. **Rust backends** for all 3.5.s.b new IPC stubs (proactive, learned profile, global shortcut overrides, memory recall config)
4. **Pre-existing carry-forwards** (from 3.5.s.a + earlier): 31 residual tsc errors, ChannelSettings backend integration, recharts Tooltip type narrowing, shortcut-defaults verbatim bug
