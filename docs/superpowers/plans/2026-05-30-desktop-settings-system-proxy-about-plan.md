# Plan 3.5.s.d — Desktop Settings: Proxy + About + System Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fourth and FINAL PR of the SettingsDialog sub-stack (3.5.s). Replace the last 3 deferred-tab stubs from 3.5.s.c (`ProxySetting`, `SystemTab`, `AboutSettings`) with verbatim real ports. After this PR merges, the `[data-deferred-to=...]` count across ALL settings tabs drops to 0 — `settings-bridge-stub.tsx` becomes empty (factory + no exports) and the entire SettingsDialog is functionally ported.

**Architecture:** Verbatim port discipline established by PRs #18–#22. Each settings tab is copied byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/<Tab>.tsx` with only standardized import retargets, storage-key rebrand where applicable, and IPC-stub substitution. SystemTab is the heavy tab (821 LOC) with 4 sub-components + 3 pure-logic lib helpers (each with its own raw-`invoke()` wrappers, ported verbatim into `features/chat-agent/lib/`). Only 2 new named-wrapper IPC stubs land in `tauri-bridge-stub.ts` (`getVersion`, `getPlatform` for AboutSettings); all other IPCs stay as raw `invoke()` inside the verbatim-ported helper modules.

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 · Tailwind v3 · lucide-react. Package manager is **pnpm** (the desktop project uses `pnpm-lock.yaml`; use `pnpm add`, NOT `npm install`, if a dep is ever needed — none is needed in this plan). All ports preserve uclaw runtime behavior; UI strings stay Chinese to match the verbatim source.

---

## Closure summary

| Cluster | Source LOC | Test LOC | Prereqs (LOC) | Subtotal |
|---|---|---|---|---|
| **ProxySetting** | 87 | 0 | `SettingsInput` primitive (34) | ~121 |
| **AboutSettings** | 86 | 0 | `getVersion`/`getPlatform` stubs + `VersionInfo`/`PlatformInfo` types (~15) | ~101 |
| **SystemTab** | 821 | 136 | 4 sub-components (902) + 3 lib helpers (229) | ~2,088 |
| **Total** | | | | **~2,310 LOC** |

Smaller than 3.5.s.c (~5,100). Single-PR scope — this is the final sub-stack PR with only 3 stubs left.

---

## File Structure

### New files (this plan creates)

```
desktop/src/features/chat-agent/
├── components/settings/
│   ├── primitives/
│   │   └── SettingsInput.tsx                  # NEW (Wave A, 34 LOC verbatim — PascalCase, matches sibling primitives)
│   ├── proxy-setting.tsx                      # NEW (Wave B, 87 LOC verbatim)
│   ├── proxy-setting.test.tsx                 # NEW (Wave B, mount smoke test)
│   ├── about-settings.tsx                     # NEW (Wave C, 86 LOC verbatim)
│   ├── about-settings.test.tsx                # NEW (Wave C, mount smoke test)
│   ├── system-tab.tsx                         # NEW (Wave D, 821 LOC verbatim)
│   ├── system-tab.test.tsx                    # NEW (Wave D, 136 LOC verbatim)
│   ├── embedding-endpoint-section.tsx         # NEW (Wave D, 200 LOC verbatim)
│   ├── stream-skill-thresholds-section.tsx    # NEW (Wave D, 224 LOC verbatim)
│   ├── fold-delta-threshold-section.tsx       # NEW (Wave D, 182 LOC verbatim)
│   └── developer-options-section.tsx          # NEW (Wave D, 296 LOC verbatim)
└── lib/
    ├── tauri-bridge-stub.ts                   # MODIFY (Wave A: add getVersion + getPlatform stubs + VersionInfo/PlatformInfo types)
    ├── settings-bridge-stub.tsx               # MODIFY (Wave E: delete all 3 stubs → factory-only file)
    ├── settings-bridge-stub.test.tsx          # MODIFY (Wave E: 3 → 0 count)
    ├── embedding-endpoint.ts                  # NEW (Wave A prereq, 126 LOC verbatim)
    ├── stream-skill-thresholds.ts             # NEW (Wave A prereq, 73 LOC verbatim)
    └── fold-delta-threshold.ts                # NEW (Wave A prereq, 30 LOC verbatim)
```

### Modified files (Wave E)
- `desktop/src/features/chat-agent/components/settings/settings-panel.tsx` — retarget 3 imports
- `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx` — add Group Q, adjust N3/O5/P5 if they still reference a now-real tab

### Existing prereqs that already exist (verified during recon — DO NOT re-port)
- ✅ `SettingsSection`, `SettingsCard`, `SettingsToggle`, `SettingsSelect`, `SettingsUIConstants` primitives — `desktop/src/features/chat-agent/components/settings/primitives/`
- ✅ `@/shared/ui/input` (the `Input` primitive that `SettingsInput` wraps)
- ✅ `@/shared/ui/button`
- ✅ `cn` at `@/shared/lib/cn`
- ✅ `SystemDiagnosticsReport` type — defined LOCALLY in `SystemTab.tsx:66` (covered by the verbatim copy; do NOT extract)

---

## Standard Retargets Table (applies to EVERY ported file)

| uclaw import path | hermes retarget |
|---|---|
| `@/components/ui/button` | `@/shared/ui/button` |
| `@/components/ui/input` | `@/shared/ui/input` |
| `@/components/ui/<x>` (other primitives) | `@/shared/ui/<x>` |
| `@/components/settings/<X>` (sibling) | `./<kebab-case-x>` |
| `@/components/settings/primitives/<X>` | `./primitives/<X>` (primitives keep PascalCase filenames) |
| `@/lib/utils` (`cn`) | `@/shared/lib/cn` |
| `@/lib/tauri-bridge` (`getVersion`/`getPlatform`) | `@/features/chat-agent/lib/tauri-bridge-stub` |
| `@/lib/types` (`VersionInfo`/`PlatformInfo`) | `@/features/chat-agent/lib/tauri-bridge-stub` (these types are added there in Wave A) |
| `@/lib/embedding-endpoint` | `@/features/chat-agent/lib/embedding-endpoint` |
| `@/lib/stream-skill-thresholds` | `@/features/chat-agent/lib/stream-skill-thresholds` |
| `@/lib/fold-delta-threshold` | `@/features/chat-agent/lib/fold-delta-threshold` |

**Canonical NOT_IMPLEMENTED marker:** `NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: <snake_case_command>` — same string used by all of 3.5.s.a/b/c. DO NOT introduce a `_3_5_S_D_` variant.

**Raw `invoke()` discipline:** The 3 lib helper modules (`embedding-endpoint.ts`, `stream-skill-thresholds.ts`, `fold-delta-threshold.ts`) ARE the wrapper layer — they call raw `invoke('get_embedding_config')` etc. internally. Port them verbatim; the raw `invoke()` calls stay (they throw the standard Tauri "command not found" at runtime until the Rust backend ships, exactly like uclaw). Similarly, `SystemTab.tsx` calls raw `invoke('get_system_diagnostics')` + dynamic `invoke(command)` — these stay raw. Tests mock at the `@tauri-apps/api/core` boundary. The ONLY named-wrapper stubs added to `tauri-bridge-stub.ts` are `getVersion` + `getPlatform` (because AboutSettings imports them by name from `@/lib/tauri-bridge`, mirroring how `model-settings.tsx` imported `getRoleModels`).

**Storage-key rebrand:** any `localStorage`/`sessionStorage` key containing the literal substring `uclaw` → `hermes`. UI strings (workspace filenames) stay verbatim. Audit each file; most have no storage usage.

---

## Anti-God-File Invariant

`desktop/src/lib/` contains ONLY `bridge/`. NEVER create new files there. All new lib helpers in this plan go under `desktop/src/features/chat-agent/lib/` (mirroring 3.5.s.c's `lib/browser-runtime/`, `startup-doctor.ts`, etc.).

---

## Section-header convention in `tauri-bridge-stub.ts`

Append a new outer group header at the bottom of the file (below the existing `// === Plan 3.5.s.c additions ===` block):

```
// === Plan 3.5.s.d additions ===
// ─── Wave A — AboutSettings IPC stubs ───
```

Then the 2 stubs + 2 types. This mirrors the post-normalization 3.5.s.b/c convention (single `===` outer marker, `─── Wave X — ... ───` subsections).

---

## Wave A — Foundation: SettingsInput primitive + AboutSettings IPC stubs + 3 lib helpers

### Task A1: Port `SettingsInput.tsx` primitive (34 LOC verbatim)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/primitives/SettingsInput.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/primitives/SettingsInput.tsx`

- [ ] **Step 1: Read uclaw source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/primitives/SettingsInput.tsx
```

- [ ] **Step 2: Write the ported primitive**

Create `desktop/src/features/chat-agent/components/settings/primitives/SettingsInput.tsx` with the verbatim body, applying retargets `@/lib/utils` → `@/shared/lib/cn` and `@/components/ui/input` → `@/shared/ui/input`:

```tsx
import { cn } from '@/shared/lib/cn'
import { Input } from '@/shared/ui/input'
import { forwardRef } from 'react'

interface SettingsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const SettingsInput = forwardRef<HTMLInputElement, SettingsInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        <Input
          ref={ref}
          className={cn(
            'h-9 text-sm',
            error && 'border-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

SettingsInput.displayName = 'SettingsInput'
```

- [ ] **Step 3: Verify it compiles + tests still pass**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npx tsc -b 2>&1 | grep -c "error TS"
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: tsc 28 (unchanged), tests 994 (unchanged — primitive not yet consumed).

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/primitives/SettingsInput.tsx
git commit -m "feat(desktop): port SettingsInput primitive (Wave A1 prereq, verbatim)"
```

---

### Task A2: Add `getVersion`/`getPlatform` IPC stubs + `VersionInfo`/`PlatformInfo` types

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (append at end of file)

- [ ] **Step 1: Append the new section**

At the end of `tauri-bridge-stub.ts` add:

```ts
// === Plan 3.5.s.d additions ===
// ─── Wave A — AboutSettings IPC stubs ───
// AboutSettings calls getVersion + getPlatform (named wrappers, like model-settings
// imports getRoleModels). All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until the
// Rust backend ships. Source: uclaw `@/lib/tauri-bridge` lines 361–365, types from
// uclaw `@/lib/types` lines 1–11.

/** Mirrors uclaw lib/types.ts PlatformInfo. */
export interface PlatformInfo {
  os: string
  arch: string
  version: string
}

/** Mirrors uclaw lib/types.ts VersionInfo. */
export interface VersionInfo {
  appVersion: string
  tauriVersion: string
  rustVersion: string
}

/** Plan 3.5.s.d Wave A stub — replaced by Rust `get_platform` command. */
export async function getPlatform(): Promise<PlatformInfo> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_platform')
}

/** Plan 3.5.s.d Wave A stub — replaced by Rust `get_version` command. */
export async function getVersion(): Promise<VersionInfo> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_version')
}
```

**Important:** before adding, grep to confirm `getVersion`/`getPlatform`/`VersionInfo`/`PlatformInfo` are NOT already exported from this file (a prior plan may have added them):
```bash
grep -nE "getVersion|getPlatform|interface VersionInfo|interface PlatformInfo" desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
```
If any already exist, reuse them and skip the duplicate.

- [ ] **Step 2: Verify TypeScript + tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npx tsc -b 2>&1 | grep -c "error TS"
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: tsc 28, tests 994.

- [ ] **Step 3: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add getVersion + getPlatform IPC stubs (Wave A2, AboutSettings prereq)"
```

---

### Task A3: Port 3 SystemTab lib helpers verbatim

**Files:**
- Sources:
  - `/Users/ryanliu/Documents/uclaw/ui/src/lib/embedding-endpoint.ts` (126 LOC)
  - `/Users/ryanliu/Documents/uclaw/ui/src/lib/stream-skill-thresholds.ts` (73 LOC)
  - `/Users/ryanliu/Documents/uclaw/ui/src/lib/fold-delta-threshold.ts` (30 LOC)
- Creates:
  - `desktop/src/features/chat-agent/lib/embedding-endpoint.ts`
  - `desktop/src/features/chat-agent/lib/stream-skill-thresholds.ts`
  - `desktop/src/features/chat-agent/lib/fold-delta-threshold.ts`

These are pure-logic helper modules. Each imports only `invoke` from `@tauri-apps/api/core` plus possibly stdlib. They contain their own `invoke('...')` wrapper functions + exported constants/types (e.g. `SETUP_SCRIPTS`, `SETUP_SCRIPT_DESCRIPTORS`, `STREAM_SKILL_DEFAULTS`, `FOLD_DELTA_THRESHOLD_DEFAULT`).

- [ ] **Step 1: Inspect each source's imports**

```bash
grep -nE "^import" /Users/ryanliu/Documents/uclaw/ui/src/lib/embedding-endpoint.ts /Users/ryanliu/Documents/uclaw/ui/src/lib/stream-skill-thresholds.ts /Users/ryanliu/Documents/uclaw/ui/src/lib/fold-delta-threshold.ts
```
Confirm: only `@tauri-apps/api/core` imports (no `@/...` aliases). If any source imports from `@/...`, escalate.

- [ ] **Step 2: Copy each verbatim**

```bash
cp /Users/ryanliu/Documents/uclaw/ui/src/lib/embedding-endpoint.ts \
   /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop/src/features/chat-agent/lib/embedding-endpoint.ts
cp /Users/ryanliu/Documents/uclaw/ui/src/lib/stream-skill-thresholds.ts \
   /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop/src/features/chat-agent/lib/stream-skill-thresholds.ts
cp /Users/ryanliu/Documents/uclaw/ui/src/lib/fold-delta-threshold.ts \
   /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop/src/features/chat-agent/lib/fold-delta-threshold.ts
```

Prepend each with a 1-line attribution comment, e.g.:
```ts
// Verbatim from uclaw ui/src/lib/embedding-endpoint.ts (Plan 3.5.s.d Wave A3)
```

The raw `invoke('get_embedding_config')` / `invoke('get_stream_idle_timeout_secs')` / `invoke('get_fold_delta_threshold')` etc. calls stay as-is — these helper modules ARE the wrapper layer.

- [ ] **Step 3: Verify TypeScript + tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npx tsc -b 2>&1 | grep -c "error TS"
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: tsc 28, tests 994 (helpers not yet consumed until Wave D).

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/lib/embedding-endpoint.ts desktop/src/features/chat-agent/lib/stream-skill-thresholds.ts desktop/src/features/chat-agent/lib/fold-delta-threshold.ts
git commit -m "feat(desktop): port 3 SystemTab lib helpers (Wave A3 prereq, verbatim)"
```

---

## Wave B — ProxySetting (~121 LOC)

### Task B1: Port `ProxySetting.tsx` (87 LOC) + write minimal smoke test

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/ProxySetting.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/proxy-setting.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/proxy-setting.test.tsx` (NEW — uclaw doesn't ship one)

- [ ] **Step 1: Read uclaw source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/ProxySetting.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Retargets for this file:
- `./primitives/SettingsSection` → `./primitives/SettingsSection` (unchanged)
- `./primitives/SettingsInput` → `./primitives/SettingsInput` (unchanged — just ported in A1)
- `./primitives/SettingsToggle` → `./primitives/SettingsToggle` (unchanged)
- `./primitives/SettingsSelect` → `./primitives/SettingsSelect` (unchanged)
- `@/components/ui/button` → `@/shared/ui/button`

The component uses `useState` only and has a `console.log` placeholder in `handleSave` (verbatim — keep it; it mirrors uclaw's not-yet-wired save). No IPC, no atoms, no storage keys.

Add a 1-line attribution comment at top:
```tsx
// Verbatim from uclaw ui/src/components/settings/ProxySetting.tsx (Plan 3.5.s.d Wave B1)
```

- [ ] **Step 3: Write a minimal mount smoke test**

```tsx
// desktop/src/features/chat-agent/components/settings/proxy-setting.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProxySetting } from './proxy-setting'

describe('ProxySetting', () => {
  it('renders the proxy settings section header', () => {
    render(<ProxySetting />)
    // Verbatim source renders an <h2> '代理设置'.
    expect(screen.getByText('代理设置')).toBeTruthy()
  })

  it('renders the proxy-type select with all 4 options', () => {
    const { container } = render(<ProxySetting />)
    // PROXY_TYPE_OPTIONS has 4 entries (none/http/socks5/system).
    // SettingsSelect renders a native <select> or option list.
    expect(container.querySelectorAll('option, [role="option"]').length).toBeGreaterThanOrEqual(4)
  })
})
```

**Refine after reading the source**: if `SettingsSelect` renders something other than `<option>` elements (e.g. a Radix listbox that only mounts options on open), adjust the second assertion to target whatever stable element the select surfaces (e.g. the trigger button text, or the `PROXY_TYPE_OPTIONS[0]` label `无代理`). The intent is 2 non-tautological assertions: section header + the select is present.

- [ ] **Step 4: Run tests + tsc**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
npx tsc -b 2>&1 | grep -c "error TS"
```
Expected: 994 + 2 = 996 tests passing, tsc 28.

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/proxy-setting.tsx desktop/src/features/chat-agent/components/settings/proxy-setting.test.tsx
git commit -m "feat(desktop): port proxy-setting (verbatim + mount smoke test, Wave B)"
```

---

## Wave C — AboutSettings (~101 LOC)

### Task C1: Port `AboutSettings.tsx` (86 LOC) + write minimal smoke test

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/AboutSettings.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/about-settings.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/about-settings.test.tsx` (NEW)

- [ ] **Step 1: Read uclaw source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/AboutSettings.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Retargets:
- `./primitives/SettingsSection` → `./primitives/SettingsSection` (unchanged)
- `./primitives/SettingsCard` → `./primitives/SettingsCard` (unchanged)
- `@/lib/tauri-bridge` (`getVersion`, `getPlatform`) → `@/features/chat-agent/lib/tauri-bridge-stub`
- `@/lib/types` (`VersionInfo`, `PlatformInfo`) → `@/features/chat-agent/lib/tauri-bridge-stub` (types added there in A2)

The component uses `useState` + `useEffect` that calls `getVersion()` / `getPlatform()` on mount. Since both stubs throw `NOT_IMPLEMENTED`, the component's `useEffect` must already wrap these in try/catch (verbatim) — confirm the source handles the rejection gracefully; if it does, the component renders with empty/fallback version info. DO NOT add error handling the source doesn't have.

Add a 1-line attribution comment at top.

- [ ] **Step 3: Write a minimal mount smoke test**

```tsx
// desktop/src/features/chat-agent/components/settings/about-settings.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AboutSettings } from './about-settings'

// getVersion/getPlatform are named-wrapper stubs that throw NOT_IMPLEMENTED.
// Mock them so the mount effect resolves with sensible values.
vi.mock('@/features/chat-agent/lib/tauri-bridge-stub', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/chat-agent/lib/tauri-bridge-stub')>()
  return {
    ...actual,
    getVersion: vi.fn().mockResolvedValue({ appVersion: '0.14.2', tauriVersion: '2.0.0', rustVersion: '1.80.0' }),
    getPlatform: vi.fn().mockResolvedValue({ os: 'macos', arch: 'aarch64', version: '15.0' }),
  }
})

describe('AboutSettings', () => {
  it('renders without throwing and shows the section content', async () => {
    const { container } = render(<AboutSettings />)
    await waitFor(() => {
      // After the mount effect resolves, the version string appears somewhere.
      // Verbatim source renders a SettingsSection — confirm a data-settings-section
      // or the app version text is present. Adjust the matcher to the actual rendered text.
      expect(container.querySelector('[data-settings-section], h2, h3')).not.toBeNull()
    })
  })

  it('displays the resolved app version after the mount effect', async () => {
    render(<AboutSettings />)
    await waitFor(() => {
      expect(screen.getByText(/0\.14\.2/)).toBeTruthy()
    })
  })
})
```

**Refine after reading the source**: the exact rendered text depends on the verbatim component. If AboutSettings renders the version inside a labeled row (e.g. `应用版本: 0.14.2`), the `/0\.14\.2/` matcher works. If it renders version differently (or doesn't display `appVersion` directly), adjust to assert on whatever stable text the component surfaces (e.g. an app-name heading). Keep 2 meaningful assertions.

- [ ] **Step 4: Run tests + tsc**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
npx tsc -b 2>&1 | grep -c "error TS"
```
Expected: 996 + 2 = 998 tests passing, tsc 28.

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/about-settings.tsx desktop/src/features/chat-agent/components/settings/about-settings.test.tsx
git commit -m "feat(desktop): port about-settings (verbatim + mount smoke test, Wave C)"
```

---

## Wave D — SystemTab cluster (~2,088 LOC across 6 files)

Sub-components must be ported BEFORE `SystemTab.tsx` because SystemTab imports all 4. The 3 lib helpers (Wave A3) are already in place. Port order: 4 sub-components → SystemTab main + test.

### Task D1: Port `EmbeddingEndpointSection.tsx` (200 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/EmbeddingEndpointSection.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/embedding-endpoint-section.tsx`

- [ ] **Step 1: Read source + audit imports**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/EmbeddingEndpointSection.tsx
grep -nE "^import|from '@/|from '\./" /Users/ryanliu/Documents/uclaw/ui/src/components/settings/EmbeddingEndpointSection.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Retargets:
- `@/lib/embedding-endpoint` → `@/features/chat-agent/lib/embedding-endpoint`
- any `@/components/ui/<x>` → `@/shared/ui/<x>`
- any `./primitives/<X>` → `./primitives/<X>` (unchanged)
- any `@/lib/utils` (cn) → `@/shared/lib/cn`

Add attribution comment. Audit for any import not in the retarget table — if found, resolve it or escalate.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: 998 (no new tests; this sub-component has no uclaw test).

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/embedding-endpoint-section.tsx
git commit -m "feat(desktop): port embedding-endpoint-section (verbatim, Wave D1)"
```

---

### Task D2: Port `StreamSkillThresholdsSection.tsx` (224 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/StreamSkillThresholdsSection.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/stream-skill-thresholds-section.tsx`

- [ ] **Step 1: Read source + audit imports**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/StreamSkillThresholdsSection.tsx
grep -nE "^import|from '@/|from '\./" /Users/ryanliu/Documents/uclaw/ui/src/components/settings/StreamSkillThresholdsSection.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Retargets:
- `@/lib/stream-skill-thresholds` → `@/features/chat-agent/lib/stream-skill-thresholds`
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- `./primitives/<X>` → unchanged
- `@/lib/utils` (cn) → `@/shared/lib/cn`

Add attribution comment.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: 998.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/stream-skill-thresholds-section.tsx
git commit -m "feat(desktop): port stream-skill-thresholds-section (verbatim, Wave D2)"
```

---

### Task D3: Port `FoldDeltaThresholdSection.tsx` (182 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/FoldDeltaThresholdSection.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/fold-delta-threshold-section.tsx`

- [ ] **Step 1: Read source + audit imports**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/FoldDeltaThresholdSection.tsx
grep -nE "^import|from '@/|from '\./" /Users/ryanliu/Documents/uclaw/ui/src/components/settings/FoldDeltaThresholdSection.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Retargets:
- `@/lib/fold-delta-threshold` → `@/features/chat-agent/lib/fold-delta-threshold`
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- `./primitives/<X>` → unchanged
- `@/lib/utils` (cn) → `@/shared/lib/cn`

Add attribution comment.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: 998.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/fold-delta-threshold-section.tsx
git commit -m "feat(desktop): port fold-delta-threshold-section (verbatim, Wave D3)"
```

---

### Task D4: Port `DeveloperOptionsSection.tsx` (296 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/DeveloperOptionsSection.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/developer-options-section.tsx`

This file imports `SETUP_SCRIPTS`, `SETUP_SCRIPT_DESCRIPTORS`, `runSetupScript`, `SetupScriptName`, `SetupScriptOutputEvent`, `SetupScriptEndEvent` from `@/lib/embedding-endpoint` (all exported by the helper ported in A3), and `listen` from `@tauri-apps/api/event`.

- [ ] **Step 1: Read source + audit imports**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/DeveloperOptionsSection.tsx
grep -nE "^import|from '@/|from '\./" /Users/ryanliu/Documents/uclaw/ui/src/components/settings/DeveloperOptionsSection.tsx
```

- [ ] **Step 2: Port verbatim with retargets**

Retargets:
- `@/lib/embedding-endpoint` → `@/features/chat-agent/lib/embedding-endpoint`
- `@/components/ui/<x>` → `@/shared/ui/<x>`
- `./primitives/<X>` → unchanged
- `@/lib/utils` (cn) → `@/shared/lib/cn`
- `@tauri-apps/api/event` (`listen`) → unchanged (Tauri API; works in test env via existing patterns)

The component uses `listen('setup_script_output', ...)` / `listen('setup_script_end', ...)` events + `runSetupScript()` (the verbatim wrapper). These stay as-is. Add attribution comment.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: 998.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/developer-options-section.tsx
git commit -m "feat(desktop): port developer-options-section (verbatim, Wave D4)"
```

---

### Task D5: Port `SystemTab.tsx` (821 LOC) + test (136 LOC)

**Files:**
- Sources:
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/SystemTab.tsx`
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/SystemTab.test.tsx`
- Creates:
  - `desktop/src/features/chat-agent/components/settings/system-tab.tsx`
  - `desktop/src/features/chat-agent/components/settings/system-tab.test.tsx`

Top-level tab. All 4 sub-components (D1–D4) now exist.

- [ ] **Step 1: Read both sources**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/SystemTab.tsx
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/SystemTab.test.tsx
```

- [ ] **Step 2: Port the main file verbatim with retargets**

Retargets:
- `@/lib/utils` (cn) → `@/shared/lib/cn`
- `./EmbeddingEndpointSection` → `./embedding-endpoint-section`
- `./StreamSkillThresholdsSection` → `./stream-skill-thresholds-section`
- `./FoldDeltaThresholdSection` → `./fold-delta-threshold-section`
- `./DeveloperOptionsSection` → `./developer-options-section`
- any `@/components/ui/<x>` → `@/shared/ui/<x>`
- any `./primitives/<X>` → unchanged

`SystemDiagnosticsReport` is defined locally at line 66 (verbatim copy covers it). Raw `invoke('get_system_diagnostics')` + dynamic `invoke(command)` + `invoke<unknown>(evalCommands[kind])` all stay as-is. Add attribution comment.

- [ ] **Step 3: Port the test file verbatim with retargets**

Apply the same retargets. uclaw's test mocks `@tauri-apps/api/core` `invoke`. If it uses `renderWithProviders` from `@/test-utils/render`, replace with the established inline shim:
```tsx
import * as React from 'react'
import { createStore, Provider } from 'jotai'
import { render } from '@testing-library/react'

function renderWithProviders(
  ui: React.ReactElement,
  opts?: { store?: ReturnType<typeof createStore> },
) {
  return render(<Provider store={opts?.store}>{ui}</Provider>)
}
```
(Only add the shim if the original test uses `renderWithProviders`; if it uses bare `render`, no shim needed.)

Drop any unused imports if they cause tsc errors (established 3.5.s.b/c pattern; document in commit message if you do).

- [ ] **Step 4: Run tests + tsc**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -8
npx tsc -b 2>&1 | grep -c "error TS"
```
Expected: 998 + N (uclaw test count; 136-LOC test ≈ 6–10 cases) → ~1006. tsc 28.

If a test fails, verify the production file is byte-identical to uclaw (don't ad-hoc patch the test). A failure with truly verbatim source usually means a retarget/mock-wiring issue.

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/system-tab.tsx desktop/src/features/chat-agent/components/settings/system-tab.test.tsx
git commit -m "feat(desktop): port system-tab (verbatim, Wave D5 — top-level tab)"
```

---

## Wave E — Stub removal + retarget + integration tests + sweep

### Task E1: Remove all 3 stubs from `settings-bridge-stub.tsx`

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/settings-bridge-stub.tsx`
- Modify: `desktop/src/features/chat-agent/lib/settings-bridge-stub.test.tsx`

- [ ] **Step 1: Delete the 3 stubs + section comment**

In `settings-bridge-stub.tsx`, delete:
```tsx
// Plan 3.5.s.d — advanced + system
export const ProxySetting = makeStubTab('ProxySetting', '3.5.s.d')
export const SystemTab = makeStubTab('SystemTab', '3.5.s.d')
export const AboutSettings = makeStubTab('AboutSettings', '3.5.s.d')
```

After deletion, the file retains ONLY the `import * as React` line + the `makeStubTab` factory function with NO exported stubs. The factory stays (it's harmless dead code now, but deleting it would require also handling the file becoming export-less — keep the factory to avoid an "unused but exported nowhere" lint and to document the pattern). Add a 1-line comment above the factory:
```tsx
// All deferred-tab stubs have been replaced by real ports as of Plan 3.5.s.d.
// The factory is retained for reference / any future deferral.
```

- [ ] **Step 2: Update the smoke test**

In `settings-bridge-stub.test.tsx`:
- Change `it('exports 3 deferred-tab stub components', ...)` → `it('exports 0 deferred-tab stub components (all real as of 3.5.s.d)', ...)`. Update `.toBe(3)` → `.toBe(0)`.
- Remove ALL `it.each` entries (the table is now empty). Since `it.each([])` with an empty array throws "no test cases", DELETE the entire `it.each(...)` block.
- DELETE the standalone placeholder-content test (`it('placeholder content includes the symbol name and the plan reference', ...)`) — there's no stub left to render. 

The resulting test file should have just the one `it('exports 0 ...')` count assertion (and the `makeStubTab` factory is no longer exercised — that's fine).

Actually, to keep a meaningful test of the factory itself (so it isn't dead-untested), replace the deleted tests with one factory unit test:
```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import * as React from 'react'
import * as stubs from './settings-bridge-stub'

describe('settings-bridge-stub', () => {
  it('exports 0 deferred-tab stub components (all real as of 3.5.s.d)', () => {
    const exportedFunctions = Object.values(stubs).filter((v) => typeof v === 'function')
    // Only the makeStubTab factory may remain; assert no StubSettingsTab exports.
    // makeStubTab is a factory (returns a component), so filter it out by checking
    // it doesn't render a [data-stub] element when called with no args is not valid —
    // instead assert the count of exported *tab components* is 0.
    expect(exportedFunctions.length).toBe(0)
  })
})
```

**Important caveat:** if `makeStubTab` itself is exported (check the file — in the current version it is NOT exported, it's a module-private `function makeStubTab`), then `exportedFunctions.length` is 0 after removing the 3 stubs. Confirm `makeStubTab` is not exported; if it is, either un-export it (preferred — it has no external consumers) or adjust the assertion to `.toBe(1)` and document why. Verify with:
```bash
grep -n "export.*makeStubTab\|^function makeStubTab\|^const makeStubTab" desktop/src/features/chat-agent/lib/settings-bridge-stub.tsx
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```
Expected: the settings-bridge-stub test file drops from ~5 cases to 1 (net −4 from removed it.each + placeholder). Running total adjusts accordingly. All pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/lib/settings-bridge-stub.tsx desktop/src/features/chat-agent/lib/settings-bridge-stub.test.tsx
git commit -m "feat(desktop): Wave E1 — drop final 3 deferred-tab stubs (settings dialog fully ported)"
```

---

### Task E2: Retarget `settings-panel.tsx` imports

**Files:**
- Modify: `desktop/src/features/chat-agent/components/settings/settings-panel.tsx`

- [ ] **Step 1: Replace the bridge import + add 3 sibling imports**

Current line 14:
```ts
import { ProxySetting, SystemTab, AboutSettings } from '@/features/chat-agent/lib/settings-bridge-stub'
```

Replace with 3 sibling-relative imports:
```ts
import { ProxySetting } from './proxy-setting'
import { SystemTab } from './system-tab'
import { AboutSettings } from './about-settings'
```

The `switch` cases for `proxy`, `system`, `about` (lines ~44–51) still reference the same names — they now bind to the real components. Verify each ported file exports the named symbol:
```bash
grep -nE "export (function|const) (ProxySetting|SystemTab|AboutSettings)" desktop/src/features/chat-agent/components/settings/proxy-setting.tsx desktop/src/features/chat-agent/components/settings/system-tab.tsx desktop/src/features/chat-agent/components/settings/about-settings.tsx
```
If any uses `export default`, switch that import to `import X from './x'`.

After this change, `settings-panel.tsx` no longer imports from `settings-bridge-stub` at all. Confirm there are no other `settings-bridge-stub` imports anywhere:
```bash
grep -rn "settings-bridge-stub" desktop/src/ | grep -v "\.test\." | grep -v "settings-bridge-stub.tsx"
```
Expected: zero hits in production code (only the test file references it).

- [ ] **Step 2: Run tests + tsc**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -6
npx tsc -b 2>&1 | grep -c "error TS"
```
Expected: tests pass, tsc 28.

- [ ] **Step 3: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/settings/settings-panel.tsx
git commit -m "feat(desktop): Wave E2 — retarget settings-panel to real Proxy/System/About ports"
```

---

### Task E3: Add Group Q integration tests + adjust prior deferred-tab assertions

**Files:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

- [ ] **Step 1: Audit existing assertions that reference now-real tabs**

The prior PRs left integration tests that assert certain tabs are STILL stubs:
- N3 (3.5.s.a group): was retargeted in 3.5.s.c Wave F3 to test `proxy` → `3.5.s.d` stub.
- O5 (3.5.s.b group): was retargeted in 3.5.s.c Wave F3 to test `proxy` → `3.5.s.d`.
- P5 (3.5.s.c group): asserts `system` → `3.5.s.d` stub.

After THIS PR, `proxy`, `system`, AND `about` are all real. So N3, O5, and P5 will FLIP (their `.not.toBeNull()` on a `3.5.s.d` marker will fail). **There are no deferred tabs left** — so these "deferred tab still renders a stub" regression guards have nothing left to point at.

Resolution: convert N3, O5, P5 to assert the OPPOSITE — that the previously-deferred tab is now real (stub marker absent). Find each and change:

For N3 (around line 695):
```ts
  it('N3: previously-deferred tabs (e.g., proxy) are now real ports (no stub marker)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'proxy')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to]')).toBeNull()
  })
```

For O5 (around line 770, inside the 3.5.s.b describe):
```ts
  it('O5: proxy tab is now a real port (3.5.s.d shipped)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'proxy')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to]')).toBeNull()
  })
```

For P5 (end of the 3.5.s.c describe, around line 805):
```ts
  it('P5: system tab is now a real port (3.5.s.d shipped)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'system')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to]')).toBeNull()
  })
```

**Read the actual current text of N3/O5/P5 before editing** — line numbers drift. Grep for them:
```bash
grep -nE "N3:|O5:|P5:" desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
```

- [ ] **Step 2: Add Group Q block at end of file**

```ts
// ---------------------------------------------------------------------------
// Q. AppShell + SettingsDialog 3.5.s.d real ports — final 3 tabs + completeness
// ---------------------------------------------------------------------------

describe('AppShell + SettingsDialog 3.5.s.d tabs (real ports — sub-stack complete)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('Q1: proxy tab is real (no stub marker)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'proxy')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.d"]')).toBeNull()
  })

  it('Q2: system tab is real (no stub marker)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'system')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.d"]')).toBeNull()
  })

  it('Q3: about tab is real (no stub marker)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'about')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.d"]')).toBeNull()
  })

  it('Q4: NO settings tab renders any deferred-to stub marker (sub-stack fully ported)', () => {
    const tabs = [
      'connectivity', 'intelligence', 'tools', 'memoryRecall', 'learnedProfile',
      'imChannels', 'general', 'stt', 'shortcuts', 'pet', 'proxy',
      'browserRuntime', 'system', 'about',
    ] as const
    for (const tab of tabs) {
      const store = createStore()
      store.set(settingsOpenAtom, true)
      store.set(settingsTabAtom, tab)
      const { unmount } = render(<Provider store={store}><AppShell /></Provider>)
      expect(document.body.querySelector('[data-deferred-to]')).toBeNull()
      unmount()
    }
  })
})
```

**IPC mock additions:** the existing `vi.mock` blocks in this file already stub the s.a/b/c IPCs. After Wave E2, the real `ProxySetting`, `SystemTab`, `AboutSettings` mount when their tabs activate:
- `ProxySetting` — no IPC (useState only); no mock needed.
- `AboutSettings` — calls `getVersion()` / `getPlatform()` from `tauri-bridge-stub`. Add to the `tauri-bridge-stub` mock block:
  ```ts
  getVersion: vi.fn().mockResolvedValue({ appVersion: '0.14.2', tauriVersion: '2.0.0', rustVersion: '1.80.0' }),
  getPlatform: vi.fn().mockResolvedValue({ os: 'macos', arch: 'aarch64', version: '15.0' }),
  ```
- `SystemTab` — calls raw `invoke('get_system_diagnostics')` on mount. The existing `@tauri-apps/api/core` mock (a `mockImplementation((cmd) => ...)` switch added in 3.5.s.c Wave F3) must return a sensible value for `get_system_diagnostics`. Add a case returning a minimal `SystemDiagnosticsReport`-shaped object (or `null` if the component guards it). Read SystemTab's `runDiagnostics()` to see what shape it destructures, and return the minimum that avoids a throw. If SystemTab wraps the call in try/catch (it does — `setActionError(String(e))`), returning `null` or letting it reject is tolerable as long as no UNHANDLED rejection escapes; prefer returning a minimal valid object to keep the test output clean.

  Read the diagnostics consumer first:
  ```bash
  grep -nE "get_system_diagnostics|SystemDiagnosticsReport|\.\w+\b" /Users/ryanliu/Documents/uclaw/ui/src/components/settings/SystemTab.tsx | head -30
  ```
  Then mock `get_system_diagnostics` to return an object with whatever top-level fields SystemTab reads (at minimum the fields accessed without optional-chaining).

- [ ] **Step 3: Run tests + check for unhandled rejections**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -10
```
Expected: +4 Group Q tests; N3/O5/P5 still pass (now asserting real). Total ~1010. Zero NEW unhandled rejections (the 2 pre-existing im-channels ones may remain).

If a Q test triggers an unhandled rejection from SystemTab's diagnostics call, tighten the `get_system_diagnostics` mock return shape.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "feat(desktop): Wave E3 — Group Q integration tests + flip N3/O5/P5 to real-port assertions"
```

---

### Task E4: Final automated sweep

- [ ] **Step 1: Anti-god-file invariant check**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
find desktop/src/lib -type f -not -path '*/bridge/*'
```
Expected: empty.

- [ ] **Step 2: Storage-key leakage check**

```bash
git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/ || echo "clean"
```
Expected: only pre-existing comment-only hits in `chat-atoms.ts` (4 matches).

- [ ] **Step 3: Deferred-residual count (ALL plans)**

```bash
git grep -n 'data-deferred-to=' desktop/src/ | grep -v "\.test\." || echo "0 — all stubs removed from production code"
```
Expected: 0 production-code hits. Every `data-deferred-to` reference should now be `.toBeNull()` test assertions only.

- [ ] **Step 4: Confirm settings-bridge-stub is no longer imported by production code**

```bash
grep -rn "settings-bridge-stub" desktop/src/ | grep -v "\.test\." | grep -v "/settings-bridge-stub.tsx"
```
Expected: empty (only the test file + the stub file itself reference it).

- [ ] **Step 5: tsc residual count**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npx tsc -b 2>&1 | grep -c "error TS"
```
Expected: 28 (unchanged from baseline).

- [ ] **Step 6: Final test run**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about/desktop
npm test -- --reporter=dot 2>&1 | tail -10
```
Expected: ~1010 passing, 0 failing.

- [ ] **Step 7: Commit sweep result only if changes**

If steps 1–6 surfaced fixable issues that were addressed:
```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-system-proxy-about
git add -A
git commit -m "chore(desktop): Plan 3.5.s.d final sweep" 2>/dev/null || echo "nothing to commit"
```

---

## Final Self-Review Checklist

- [ ] Wave A: SettingsInput primitive + getVersion/getPlatform stubs + VersionInfo/PlatformInfo types + 3 lib helpers ported
- [ ] Wave B: ProxySetting ported with mount smoke test
- [ ] Wave C: AboutSettings ported with mount smoke test
- [ ] Wave D: SystemTab cluster (4 sub-components + main tab + test) ported
- [ ] Wave E: 3 stubs deleted; 3 imports retargeted; Group Q added; N3/O5/P5 flipped to real-port assertions; sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] `[data-deferred-to=...]` count: 0 in production code (entire SettingsDialog now real)
- [ ] `settings-bridge-stub.tsx` has 0 exported stubs (factory-only)
- [ ] `settings-panel.tsx` no longer imports from `settings-bridge-stub`
- [ ] Test count up by ≥10 net (994 → ≥1004; trajectory lands ~1006, ±4 on the SystemTab uclaw test case count)
- [ ] tsc residual errors stable at 28 (no NEW from 3.5.s.d)
- [ ] All commits use conventional-commit prefixes (`feat(desktop):`, `chore(desktop):`)
- [ ] Canonical NOT_IMPLEMENTED marker (`NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND`) used for the 2 new stubs

---

## Carry-Forward Follow-ups

After 3.5.s.d merges, the SettingsDialog sub-stack (3.5.s.a → 3.5.s.d) is COMPLETE — all 14 settings tabs are real verbatim ports. Remaining work:

1. **Rust backends** for ALL accumulated settings IPC stubs across 3.5.s.a–d:
   - 3.5.s.d additions: `get_version`, `get_platform`, `get_embedding_config`, `set_embedding_config`, `test_embedding_endpoint`, `run_setup_script`, `get_stream_idle_timeout_secs` + 5 sibling stream/skill threshold commands, `get_fold_delta_threshold` + `set_fold_delta_threshold`, `get_system_diagnostics`, plus SystemTab's dynamic action/eval commands.
   - Earlier carry-forwards: proactive/persona/memoryLearning/memoryRecall (3.5.s.b), STT/IM/BrowserRuntime (3.5.s.c), provider/cost/permission (3.5.s.a).
2. **ProxySetting save wiring**: the verbatim port has a `console.log` placeholder `handleSave`. A future plan should wire it to a real `set_proxy_config` Tauri command + persistence.
3. **Pre-existing carry-forwards** (still open from 3.5.s.a/b/c): 28 residual tsc errors, 2 pre-existing im-channels-settings.test.tsx async warnings.

---

## Test Count Trajectory

| Wave | Tests added | Running total |
|---|---|---|
| Baseline (post-3.5.s.c) | — | 994 |
| A1 (SettingsInput primitive) | 0 | 994 |
| A2 (IPC stubs) | 0 | 994 |
| A3 (3 lib helpers) | 0 | 994 |
| B (ProxySetting smoke) | +2 | 996 |
| C (AboutSettings smoke) | +2 | 998 |
| D1–D4 (4 sub-components, no tests) | 0 | 998 |
| D5 (SystemTab + test) | +8 | 1006 |
| E1 (drop stub tests: −4 it.each/placeholder, keep 1 count) | −4 | 1002 |
| E3 (Group Q +4; N3/O5/P5 flipped, no count change) | +4 | 1006 |
| **Final** | **+12** | **~1006** |

(The SystemTab uclaw test case count is an estimate; final total may land ±4 around 1006. The acceptance bar is ≥1004 OR a clearly-explained lower number if the SystemTab test ships fewer cases than estimated.)
