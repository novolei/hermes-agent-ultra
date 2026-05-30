# Plan 3.5.s.c — Desktop Settings: STT + IM Cluster + Pet + BrowserRuntime Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Third PR of the SettingsDialog sub-stack (3.5.s). Replace 4 deferred-tab stubs from 3.5.s.b (`SttSettings`, `ImChannelsSettings`, `PetSettings`, `BrowserRuntimeSettings`) with verbatim real ports. After this PR merges, the `[data-deferred-to="3.5.s.c"]` count drops to 0 and only 3 stubs remain (3.5.s.d: ProxySetting, SystemTab, AboutSettings).

**Architecture:** Verbatim port discipline established by PRs #18–#21. Each settings tab is copied byte-for-byte from `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/<Tab>.tsx` with only standardized import retargets, storage-key rebrand (`uclaw` → `hermes`) where applicable, and IPC-stub substitution. The BrowserRuntime cluster also requires verbatim ports of two pure-logic helpers (`browser-runtime-control-center.ts`, `browser-runtime-settings.ts`) and a large types file (`startup-doctor.ts`), each with their own test suites. ~25 new IPC stubs land in `tauri-bridge-stub.ts` under a unified `=== Plan 3.5.s.c additions ===` group.

**Tech Stack:** Tauri v2 · React 19 · TypeScript · Vite 7 · Vitest 4 · Jotai 2 · Tailwind v3 · Radix UI · lucide-react · sonner · qrcode (new dep, Wave C). All ports preserve uclaw's runtime behavior; UI strings stay Chinese to match the verbatim source.

---

## Closure summary

| Cluster | Source LOC | Test LOC | Prereqs (LOC) | Subtotal |
|---|---|---|---|---|
| **STT** | 193 | 45 | — | 238 |
| **IM cluster** | 1,389 | 340 | `im-channel-atoms.ts` (60), `qrcode` npm dep | ~1,789 |
| **Pet** | 91 | 0 | — | 91 |
| **BrowserRuntime cluster** | 607 main + 419 sub-components | 591 main + 383 lib tests | `browser-runtime-control-center.ts` (229), `browser-runtime-settings.ts` (273), `startup-doctor.ts` (473) | ~2,975 |
| **Total** | | | | **~5,093 LOC** |

This is ~55% larger than 3.5.s.b. Single-PR scope confirmed by the maintainer.

---

## File Structure

### New files (this plan creates)

```
desktop/
├── package.json                       # MODIFY (add @types/qrcode + qrcode runtime dep, Wave C prereq)
├── src/
│   ├── features/chat-agent/
│   │   ├── atoms/
│   │   │   └── im-channel-atoms.ts           # NEW (Wave C prereq, 60 LOC)
│   │   ├── components/settings/
│   │   │   ├── stt-settings.tsx              # NEW (Wave B, 193 LOC verbatim)
│   │   │   ├── stt-settings.test.tsx         # NEW (Wave B, 45 LOC verbatim)
│   │   │   ├── im-channels-settings.tsx      # NEW (Wave C, 192 LOC verbatim)
│   │   │   ├── im-channels-settings.test.tsx # NEW (Wave C, 92 LOC verbatim)
│   │   │   ├── im-channel-form.tsx           # NEW (Wave C, 315 LOC verbatim)
│   │   │   ├── im-channel-accordion-row.tsx  # NEW (Wave C, 602 LOC verbatim)
│   │   │   ├── im-channel-accordion-row.test.tsx # NEW (Wave C, 161 LOC verbatim)
│   │   │   ├── wechat-ilink-binding-panel.tsx        # NEW (Wave C, 259 LOC verbatim)
│   │   │   ├── wechat-ilink-binding-panel.test.tsx   # NEW (Wave C, 87 LOC verbatim)
│   │   │   ├── feishu-settings.tsx           # NEW (Wave C, 4 LOC verbatim — null wrapper)
│   │   │   ├── wechat-settings.tsx           # NEW (Wave C, 4 LOC verbatim — null wrapper)
│   │   │   ├── bot-hub-settings.tsx          # NEW (Wave C, 17 LOC verbatim — placeholder)
│   │   │   ├── pet-settings.tsx              # NEW (Wave D, 91 LOC verbatim)
│   │   │   ├── pet-settings.test.tsx         # NEW (Wave D, mount smoke test ~30 LOC)
│   │   │   ├── browser-runtime-settings.tsx           # NEW (Wave E, 607 LOC verbatim)
│   │   │   ├── browser-runtime-settings.test.tsx      # NEW (Wave E, 591 LOC verbatim)
│   │   │   └── browser-runtime/
│   │   │       ├── browser-automation-diagnostics.tsx  # NEW (Wave E, 70 LOC verbatim)
│   │   │       ├── browser-automation-header.tsx       # NEW (Wave E, 62 LOC verbatim)
│   │   │       ├── playwright-setup-progress.tsx       # NEW (Wave E, 69 LOC verbatim)
│   │   │       ├── playwright-skills-panel.tsx         # NEW (Wave E, 32 LOC verbatim)
│   │   │       └── provider-priority-list.tsx          # NEW (Wave E, 186 LOC verbatim)
│   │   └── lib/
│   │       ├── tauri-bridge-stub.ts                       # MODIFY (Wave A: add ~25 IPC stubs in s.c group)
│   │       ├── settings-bridge-stub.tsx                   # MODIFY (Wave F: drop 4 stubs)
│   │       ├── settings-bridge-stub.test.tsx              # MODIFY (Wave F: 7 → 3 count)
│   │       ├── browser-runtime/                           # NEW dir (Wave E prereqs)
│   │       │   ├── browser-runtime-control-center.ts      # NEW (Wave E, 229 LOC verbatim)
│   │       │   ├── browser-runtime-control-center.test.ts # NEW (Wave E, 143 LOC verbatim)
│   │       │   ├── browser-runtime-settings-helpers.ts    # NEW (Wave E, 273 LOC verbatim — renamed from uclaw `browser-runtime-settings.ts` to avoid collision with the tab .tsx)
│   │       │   └── browser-runtime-settings-helpers.test.ts # NEW (Wave E, 240 LOC verbatim — name aligned with the helper file)
│   │       └── startup-doctor.ts                          # NEW (Wave E prereq, 473 LOC verbatim)
│   └── features/chat-agent/components/app-shell/
│       └── app-shell.integration.test.tsx                 # MODIFY (Wave F: add Group P; adjust N3 target)
└── src/features/chat-agent/components/settings/
    └── settings-panel.tsx                                 # MODIFY (Wave F: retarget 4 imports)
```

### Existing prereqs that already exist (verified during recon — DO NOT re-port)

- ✅ `sttSettingsAtom`, `modelStatusAtom`, `Language` type — `desktop/src/features/chat-agent/atoms/stt-atoms.ts`
- ✅ `petCharacterAtom`, `petEnabledAtom`, `PetCharacter` type — `desktop/src/features/chat-agent/atoms/pet-atoms.ts`
- ✅ `kaleidoscopeModuleAtom`, `selectedBuiltinIntegrationAtom` — `desktop/src/features/chat-agent/atoms/kaleidoscope.ts`
- ✅ `topLevelViewAtom` — `desktop/src/features/chat-agent/atoms/top-level-view.ts`
- ✅ `SpaceSummary` type — `tauri-bridge-stub.ts:549` (already exported)
- ✅ `getShortcutForPlatform` — `desktop/src/features/chat-agent/lib/shortcut-defaults.ts:141`
- ✅ All settings primitives (`SettingsCard`, `SettingsRow`, `SettingsSection`, `SettingsSelect`, `SettingsToggle`, `LABEL_CLASS`, `DESCRIPTION_CLASS`, `ROW_CLASS`) — `desktop/src/features/chat-agent/components/settings/primitives/`
- ✅ `@/shared/ui/button`, `@/shared/ui/badge`, `@/shared/lib/cn` — all present

---

## Standard Retargets Table (applies to EVERY ported file)

| uclaw import path | hermes retarget |
|---|---|
| `@/components/ui/button` | `@/shared/ui/button` |
| `@/components/ui/badge` | `@/shared/ui/badge` |
| `@/components/ui/<x>` (other primitives) | `@/shared/ui/<x>` |
| `@/components/settings/<X>` (sibling) | `./<kebab-case-x>` |
| `@/components/settings/primitives/<X>` | `./primitives/<X>` (primitives keep PascalCase filenames) |
| `@/components/settings/browser-runtime/<X>` | `./browser-runtime/<kebab-case-x>` |
| `@/atoms/<x>` | `@/features/chat-agent/atoms/<kebab-case-x>` |
| `@/lib/utils` (cn) | `@/shared/lib/cn` |
| `@/lib/utils` (formatDateTime) | `@/shared/lib/format-date-time` |
| `@/lib/tauri-bridge` | `@/features/chat-agent/lib/tauri-bridge-stub` (or `./tauri-bridge-stub` if you're inside `lib/`) |
| `@/lib/types` (SpaceSummary etc.) | `@/features/chat-agent/lib/tauri-bridge-stub` (SpaceSummary already lives there) |
| `@/lib/shortcut-defaults` | `@/features/chat-agent/lib/shortcut-defaults` |
| `@/lib/browser-runtime/browser-runtime-control-center` | `@/features/chat-agent/lib/browser-runtime/browser-runtime-control-center` |
| `@/lib/browser-runtime/browser-runtime-settings` | `@/features/chat-agent/lib/browser-runtime/browser-runtime-settings-helpers` ← **RENAMED to avoid collision** with the tab file `components/settings/browser-runtime-settings.tsx` |
| `@/lib/startup/startup-doctor` | `@/features/chat-agent/lib/startup-doctor` |

**Canonical NOT_IMPLEMENTED marker:** `NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: <name>` — same string used by Waves B/C/D/E of 3.5.s.b. DO NOT introduce a `_3_5_S_C_` variant.

**Section-header convention in `tauri-bridge-stub.ts`:** single outer `// === Plan 3.5.s.c additions ===` group header at the bottom of the file (below the existing s.b group), then subsection delimiters `// ─── Wave A — <cluster> IPC stubs ───`. This mirrors Wave B/C/D/E of 3.5.s.b after the post-review normalization.

**Storage-key rebrand:** any `localStorage`/`sessionStorage` key containing the literal substring `uclaw` MUST be renamed to `hermes`. Workspace-filename refs (e.g. the UI string `uclaw.md`) are NOT storage keys and stay verbatim per established precedent.

---

## Anti-God-File Invariant

`desktop/src/lib/` contains ONLY `bridge/`. NEVER create new files there. All new lib helpers in this plan go under `desktop/src/features/chat-agent/lib/` (mirroring 3.5.s.b's `learned-profile-types.ts`, `persona-types.ts`, etc.).

`desktop/src/features/chat-agent/lib/browser-runtime/` is the new subdirectory introduced by Wave E for the two helper files + their tests.

---

## IPC stub catalogue (~25 new stubs, all in Wave A)

Wave A pre-loads ALL stubs in one commit so subsequent waves' ports compile immediately. Names sorted by cluster:

**STT cluster (Wave B will consume):**
- `stt_model_status` → `Promise<{ kind: 'unknown' | 'not-downloaded' | 'downloading' | 'ready' | 'error'; ... }>` — see `stt-atoms.ts` `ModelStatus` type for full shape; export as TS function `sttModelStatus()`
- `stt_download_model` → `Promise<string>` (returns dir path). Function: `sttDownloadModel(args: { targetDir?: string | null })`

**IM cluster (Wave C will consume):**
- `list_im_channels` → `Promise<ImChannelRow[]>` — function `listImChannels()`
- `get_im_channel_statuses` → `Promise<ImChannelStatus[]>` — function `getImChannelStatuses()`
- `toggle_im_channel` → `Promise<void>` — function `toggleImChannel(args: { id: string; enabled: boolean })`
- `delete_im_channel` → `Promise<void>` — function `deleteImChannel(args: { id: string })`
- `create_im_channel` → `Promise<ImChannelRow>` — function `createImChannel(args: { input: ImChannelInput })`
- `update_im_channel` → `Promise<ImChannelRow>` — function `updateImChannel(args: { id: string; input: ImChannelInput })`
- `list_spaces` → `Promise<SpaceSummary[]>` — function `listSpaces()` (SpaceSummary already exported from this file — re-use)
- `save_wechat_ilink_token` → `Promise<void>` — function `saveWechatIlinkToken(args: { instanceId: string; token: string })`
- `disconnect_wechat_ilink` → `Promise<void>` — function `disconnectWechatIlink(args: { instanceId: string })`

**BrowserRuntime cluster (Wave E will consume):**
- `getBrowserRuntimeControlCenter(): Promise<BrowserRuntimeControlCenterReport>`
- `getBrowserRuntimeStatus(): Promise<StartupRuntimePackStatusReport>`
- `listBrowserIdentities(): Promise<BrowserIdentityStatusReport>`
- `revokeBrowserIdentity(args: { profileId: string }): Promise<void>` — verify args shape against uclaw `tauri-bridge.ts:356` during port
- `runBrowserRuntimeProviderProbe(args: { providerId: BrowserRuntimeProviderId }): Promise<BrowserRuntimeProviderProbeSummary>` — verify shape
- `runPlaywrightSetup(args: { ... }): Promise<PlaywrightSetupExecutionReport>` — verify shape
- `setBrowserRuntimeMcpRawToolsExposed(args: { exposed: boolean }): Promise<void>` — verify shape
- `setBrowserRuntimeProviderEnabled(args: { providerId: BrowserRuntimeProviderId; enabled: boolean }): Promise<void>` — verify shape
- `setBrowserRuntimeProviderPriority(args: { priority: BrowserRuntimeProviderId[] }): Promise<void>` — verify shape

**Wave A subtask:** during the port, the implementer MUST first read uclaw `/Users/ryanliu/Documents/uclaw/ui/src/lib/tauri-bridge.ts` lines 185–356 to copy the exact `args` object shapes for each BrowserRuntime stub. Types like `BrowserIdentityActiveTaskSummary`, `BrowserIdentityProfileSummary`, `BrowserIdentityStatusReport`, `PlaywrightSetupExecutionReport` are exported by uclaw's `tauri-bridge.ts` and must be re-exported from our `tauri-bridge-stub.ts` for downstream consumers.

**Event listeners** (Wave C only, no stub needed — uses Tauri's `listen` API which already works in test env via the existing pattern):
- `im_channel_status_changed` — payload type `ImChannelStatus`

---

## Wave A — IPC stubs + npm dep prereq (Group I/L)

### Task A1: Add `qrcode` runtime dep + `@types/qrcode` dev dep

**Files:**
- Modify: `desktop/package.json`

- [ ] **Step 1: Install qrcode + @types/qrcode**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm install qrcode @types/qrcode
```

Expected: 2 packages added to package.json, lockfile updated.

- [ ] **Step 2: Verify installation**

```bash
grep -E '"qrcode"|"@types/qrcode"' /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop/package.json
```

Expected: both visible.

- [ ] **Step 3: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add -A
git commit -m "feat(desktop): add qrcode runtime dep (Wave A prereq for WechatIlinkBindingPanel)"
```

---

### Task A2: Add ~25 IPC stubs to `tauri-bridge-stub.ts` under a single `=== Plan 3.5.s.c additions ===` group

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts` (append at end of file)

- [ ] **Step 1: Read uclaw type-source lines** to capture exact shapes

Read these specific line ranges in uclaw and copy types verbatim into the stub file's new section:
- `/Users/ryanliu/Documents/uclaw/ui/src/lib/tauri-bridge.ts:185–356` (BrowserRuntime wrapper signatures + types)
- `/Users/ryanliu/Documents/uclaw/ui/src/atoms/stt-atoms.ts` (ModelStatus type — only the variants needed by SttSettings — `unknown | not-downloaded | downloading | ready | error`)
- `/Users/ryanliu/Documents/uclaw/ui/src/atoms/im-channel-atoms.ts:1–43` (ImChannelRow, ImChannelInput, ImChannelStatus interfaces — copy verbatim, the actual atoms ship in Task A3)

- [ ] **Step 2: Append the new section**

At the end of `tauri-bridge-stub.ts` add:

```ts
// ─── Plan 3.5.s.c additions ────────────────────────────────────────────────────

// ─── Wave A — STT IPC stubs ────────────────────────────────────────────────────
// SttSettings calls stt_model_status + stt_download_model.
// All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND until the Rust backend ships.
// Source: uclaw `@/lib/tauri-bridge` (these are raw invoke() calls in SttSettings, not wrapped).

/** Mirrors uclaw `stt-atoms.ts` ModelStatus shape. */
export type SttModelStatusKind = 'unknown' | 'not-downloaded' | 'downloading' | 'ready' | 'error'

export interface SttModelStatusReport {
  kind: SttModelStatusKind
  progress?: number
  bytesDownloaded?: number
  bytesTotal?: number
  message?: string
  dir?: string
}

/** Plan 3.5.s.c Wave A stub — replaced by Rust `stt_model_status` command. */
export async function sttModelStatus(): Promise<SttModelStatusReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: stt_model_status')
}

/** Plan 3.5.s.c Wave A stub — replaced by Rust `stt_download_model` command. */
export async function sttDownloadModel(_args: { targetDir?: string | null }): Promise<string> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: stt_download_model')
}

// ─── Wave A — IM Channel IPC stubs ────────────────────────────────────────────
// ImChannelsSettings + ImChannelAccordionRow + ImChannelForm + WechatIlinkBindingPanel
// call these. All throw NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND. The `im_channel_status_changed`
// event is consumed via Tauri `listen()` — no stub needed; the listen call gracefully
// no-ops in test/non-Tauri envs.

export interface ImChannelRow {
  id: string
  name: string
  channelType: string
  enabled: boolean
  spaceId: string | null
  config: Record<string, unknown>
}

export interface ImChannelInput {
  name: string
  channelType: string
  enabled: boolean
  spaceId: string | null
  config: Record<string, unknown>
}

export interface ImChannelStatus {
  instanceId: string
  state: string
  message?: string
  qrUrl?: string
  expiresAt?: number
}

/** Plan 3.5.s.c Wave A stub. */
export async function listImChannels(): Promise<ImChannelRow[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: list_im_channels')
}

/** Plan 3.5.s.c Wave A stub. */
export async function getImChannelStatuses(): Promise<ImChannelStatus[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_im_channel_statuses')
}

/** Plan 3.5.s.c Wave A stub. */
export async function toggleImChannel(_args: { id: string; enabled: boolean }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: toggle_im_channel')
}

/** Plan 3.5.s.c Wave A stub. */
export async function deleteImChannel(_args: { id: string }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: delete_im_channel')
}

/** Plan 3.5.s.c Wave A stub. */
export async function createImChannel(_args: { input: ImChannelInput }): Promise<ImChannelRow> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: create_im_channel')
}

/** Plan 3.5.s.c Wave A stub. */
export async function updateImChannel(_args: { id: string; input: ImChannelInput }): Promise<ImChannelRow> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: update_im_channel')
}

/** Plan 3.5.s.c Wave A stub — list workspace spaces. (SpaceSummary already exported above.) */
export async function listSpaces(): Promise<SpaceSummary[]> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: list_spaces')
}

/** Plan 3.5.s.c Wave A stub. */
export async function saveWechatIlinkToken(_args: { instanceId: string; token: string }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: save_wechat_ilink_token')
}

/** Plan 3.5.s.c Wave A stub. */
export async function disconnectWechatIlink(_args: { instanceId: string }): Promise<void> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: disconnect_wechat_ilink')
}

// ─── Wave A — BrowserRuntime IPC stubs ────────────────────────────────────────
// BrowserRuntimeSettings + sub-components call ~9 wrappers. The exact `args`/return
// shapes must match uclaw `/Users/ryanliu/Documents/uclaw/ui/src/lib/tauri-bridge.ts`
// lines 185–356 verbatim. Re-export the type aliases below for downstream consumers.

import type {
  BrowserRuntimeControlCenterReport,
  BrowserRuntimeProviderId,
  BrowserRuntimeProviderProbeSummary,
  StartupRuntimePackStatusReport,
} from './startup-doctor'

// Re-export so consumers can import them from this same module like uclaw does.
export type { BrowserRuntimeControlCenterReport, BrowserRuntimeProviderId } from './startup-doctor'

// These types live in uclaw `tauri-bridge.ts` next to the wrapper signatures.
// Port verbatim by reading uclaw `tauri-bridge.ts:215–360`. Schema below captures
// the named exports we depend on (the implementer copies the exact interface bodies).

export type PlaywrightSetupAction =
  | 'auto_setup'
  | 'install_node_with_homebrew'
  | 'refresh_skills'
  | 'probe_mcp'

export interface PlaywrightSetupStepExecutionReport {
  stepId: string
  command: string
  args: string[]
  status: 'succeeded' | 'failed' | 'timed_out' | 'spawn_failed'
  exitCode?: number | null
  stdout: string
  stderr: string
  error?: string | null
}

export interface PlaywrightSetupExecutionReport {
  action: PlaywrightSetupAction
  status: 'succeeded' | 'failed' | 'blocked'
  blockedReason?: string | null
  stepReports: PlaywrightSetupStepExecutionReport[]
}

// BrowserIdentity* — verbatim from uclaw `tauri-bridge.ts:253–340`.
export type BrowserIdentityKind = 'real_browser_profile' | 'storage_state' | 'cookie_jar' | 'bearer_token'
export type BrowserIdentityProvider = 'system_chrome' | 'playwright' | 'browser_use' | 'manual_import'
export type BrowserIdentityScope = 'workspace' | 'session' | 'global'
export type BrowserIdentityStatus = 'live' | 'stale' | 'unknown' | 'revoked'

export interface BrowserIdentityProfileSummary {
  id: string
  label: string
  originPattern: string
  kind: BrowserIdentityKind
  provider: BrowserIdentityProvider
  scope: BrowserIdentityScope
  createdAtMs: number
  lastUsedAtMs: number | null
  lastVerifiedAtMs: number | null
  expiresAtMs: number | null
  revokedAtMs: number | null
  status: BrowserIdentityStatus
  revoked: boolean
}

export interface BrowserIdentityActiveTaskSummary {
  profileId: string
  runId: string
  sessionId: string
  task: string
  status:
    | 'running'
    | 'completed'
    | 'failed'
    | 'stopped'
    | 'needs_user_intervention'
    | 'paused_waiting_for_browser_runtime'
    | 'paused_checkpointed'
  startedAtMs: number
  updatedAtMs: number
  drainDeadlineMs: number | null
}

export interface BrowserIdentityStatusReport {
  profiles: BrowserIdentityProfileSummary[]
  authorizedCount: number
  revokedCount: number
  activeTaskCount: number
  activeTasks: BrowserIdentityActiveTaskSummary[]
}

export interface BrowserIdentityRevocationReport {
  profile: BrowserIdentityProfileSummary | null
  revoked: boolean
  activeTaskCount: number
  activeTasks: BrowserIdentityActiveTaskSummary[]
  drainDeadlineMs: number | null
}

/** Plan 3.5.s.c Wave A stub. Signature: `() => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:188). */
export async function getBrowserRuntimeControlCenter(): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_browser_runtime_control_center')
}

/** Plan 3.5.s.c Wave A stub. Signature: `() => Promise<StartupRuntimePackStatusReport>` (uclaw tauri-bridge.ts:185). */
export async function getBrowserRuntimeStatus(): Promise<StartupRuntimePackStatusReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: get_browser_runtime_status')
}

/** Plan 3.5.s.c Wave A stub. Signature: `() => Promise<BrowserIdentityStatusReport>` (uclaw tauri-bridge.ts:343). */
export async function listBrowserIdentities(): Promise<BrowserIdentityStatusReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: list_browser_identities')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(profileId: string) => Promise<BrowserIdentityRevocationReport>` (uclaw tauri-bridge.ts:356). */
export async function revokeBrowserIdentity(_profileId: string): Promise<BrowserIdentityRevocationReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: revoke_browser_identity')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(providerId: BrowserRuntimeProviderId) => Promise<BrowserRuntimeProviderProbeSummary>` (uclaw tauri-bridge.ts:207). */
export async function runBrowserRuntimeProviderProbe(
  _providerId: BrowserRuntimeProviderId,
): Promise<BrowserRuntimeProviderProbeSummary> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: run_browser_runtime_provider_probe')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(action: PlaywrightSetupAction) => Promise<PlaywrightSetupExecutionReport>` (uclaw tauri-bridge.ts:236). */
export async function runPlaywrightSetup(_action: PlaywrightSetupAction): Promise<PlaywrightSetupExecutionReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: run_playwright_setup')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(exposed: boolean) => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:202). */
export async function setBrowserRuntimeMcpRawToolsExposed(_exposed: boolean): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: set_browser_runtime_mcp_raw_tools_exposed')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(providerId, enabled) => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:191). */
export async function setBrowserRuntimeProviderEnabled(
  _providerId: BrowserRuntimeProviderId,
  _enabled: boolean,
): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: set_browser_runtime_provider_enabled')
}

/** Plan 3.5.s.c Wave A stub. Signature: `(providerIds: BrowserRuntimeProviderId[]) => Promise<BrowserRuntimeControlCenterReport>` (uclaw tauri-bridge.ts:197). */
export async function setBrowserRuntimeProviderPriority(
  _providerIds: BrowserRuntimeProviderId[],
): Promise<BrowserRuntimeControlCenterReport> {
  throw new Error('NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND: set_browser_runtime_provider_priority')
}
```

All BrowserIdentity types above are fully inlined from uclaw `tauri-bridge.ts:253–340` — no placeholder bodies. After this commit, run `npx tsc -b` and confirm the residual error count is still 31 (the established main baseline).

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: 31 (the established main-baseline residual; not 32+).

- [ ] **Step 5: Run tests to confirm nothing broke**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: `Tests 941 passed (941)` (unchanged from baseline; Wave A adds types only).

- [ ] **Step 6: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/lib/tauri-bridge-stub.ts
git commit -m "feat(desktop): add Plan 3.5.s.c IPC stubs (STT + IM + BrowserRuntime, ~25 stubs)"
```

---

### Task A3: Port `im-channel-atoms.ts` (60 LOC verbatim)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/atoms/im-channel-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/im-channel-atoms.ts`

- [ ] **Step 1: Read uclaw source**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/atoms/im-channel-atoms.ts
```

- [ ] **Step 2: Copy verbatim with retargets**

```bash
cp /Users/ryanliu/Documents/uclaw/ui/src/atoms/im-channel-atoms.ts \
   /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop/src/features/chat-agent/atoms/im-channel-atoms.ts
```

Then in the new file, apply these specific retargets:
- The `invoke` import stays as-is: `import { invoke } from '@tauri-apps/api/core'` — atoms can still use raw `invoke` since the IPC names map directly to the Rust commands; no stubbing needed here because the atom-level `fetchImChannelsAtom`/`fetchImChannelStatusesAtom` will throw the same `NOT_IMPLEMENTED` when called against the not-yet-shipped backend. (This matches the established pattern from Plan 2b atom ports — the wrapper functions in `tauri-bridge-stub.ts` exist for COMPONENT-level imports; atoms keep raw `invoke`.)
- DOUBLE-CHECK: in 3.5.s.b's `learned-profile-tab.tsx` and `model-settings.tsx`, components call the wrapper functions from `tauri-bridge-stub.ts`. Atoms ported in earlier plans call raw `invoke()`. Follow this same split.
- No other imports need retargeting; the file imports only from `jotai`, `jotai/utils`, and `@tauri-apps/api/core`.

- [ ] **Step 3: Add a 1-line attribution comment at top**

Prepend the file with:

```ts
// Verbatim from uclaw ui/src/atoms/im-channel-atoms.ts (Plan 3.5.s.c Wave A3)
```

- [ ] **Step 4: Verify imports resolve and tests still pass**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: `Tests 941 passed (941)`.

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/atoms/im-channel-atoms.ts
git commit -m "feat(desktop): port im-channel-atoms (Wave A3 prereq, verbatim)"
```

---

## Wave B — SttSettings (~238 LOC)

Smallest real tab. Establishes the per-tab port rhythm before tackling heavier clusters.

### Task B1: Port `SttSettings.tsx` (193 LOC) + test (45 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/SttSettings.tsx`
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/SttSettings.test.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/stt-settings.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/stt-settings.test.tsx`

- [ ] **Step 1: Read uclaw sources**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/SttSettings.tsx
cat /Users/ryanliu/Documents/uclaw/ui/src/components/settings/SttSettings.test.tsx
```

- [ ] **Step 2: Port `stt-settings.tsx` verbatim with retargets**

Copy the file. Apply standard retargets table. Specific retargets for this file:
- `./primitives/SettingsUIConstants` → `./primitives/SettingsUIConstants` (unchanged — already exists, primitives keep PascalCase)
- `@/components/ui/button` → `@/shared/ui/button`
- `@/atoms/stt-atoms` → `@/features/chat-agent/atoms/stt-atoms`
- `@/lib/shortcut-defaults` → `@/features/chat-agent/lib/shortcut-defaults`

**Critical:** SttSettings calls raw `invoke('stt_model_status')` and `invoke('stt_download_model', { ... })`. The verbatim port also calls raw `invoke()`. DO NOT change these to wrapper imports — that would diverge from uclaw. The Wave A stubs (`sttModelStatus`, `sttDownloadModel`) exist for FUTURE refactors only; in this PR, the raw `invoke` calls fail at runtime with the standard Tauri "command not found" error in test env, which is what uclaw's tests also see (mocked via `vi.mock('@tauri-apps/api/core')`).

Add at top:

```ts
// Verbatim from uclaw ui/src/components/settings/SttSettings.tsx (Plan 3.5.s.c Wave B1)
```

- [ ] **Step 3: Port `stt-settings.test.tsx` verbatim with retargets**

Apply the same retargets. uclaw's test uses `vi.mock('@tauri-apps/api/core', ...)` to stub `invoke` — port verbatim. The test's renderer wrapper, if it uses `renderWithProviders`, follows the Wave D pattern from 3.5.s.b: inline `render(<Provider>{ui}</Provider>)` with a 1-line comment explaining why `MotionConfig`/`TooltipProvider` are dropped (this tab uses neither).

Add at top:

```ts
// Verbatim from uclaw ui/src/components/settings/SttSettings.test.tsx (Plan 3.5.s.c Wave B1)
```

- [ ] **Step 4: Run tests and verify the new test passes**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: `Tests 941+N passed` where N = uclaw test count (typically 3–8). For SttSettings (45 LOC test), expect roughly **+3 tests** → 944 total.

If a test fails because of a mock-shape mismatch (e.g., the `stt_model_status` mock returns the wrong variant), DO NOT modify the test — instead verify the production file is byte-identical to uclaw. Test failure with verbatim source indicates an import-resolution or mock-wiring issue.

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/stt-settings.tsx desktop/src/features/chat-agent/components/settings/stt-settings.test.tsx
git commit -m "feat(desktop): port stt-settings (verbatim, Wave B)"
```

---

## Wave C — IM Channels cluster (~1,789 LOC across 8 files)

The heaviest real-tab cluster. Sub-components must be ported BEFORE the main `ImChannelsSettings.tsx` because `ImChannelsSettings` imports `ImChannelAccordionRow`, which in turn imports `WechatIlinkBindingPanel`, etc. Follow this exact order to keep each commit's tree compilable.

### Task C1: Port the thin wrappers (FeishuSettings + WeChatSettings + BotHubSettings, ~25 LOC total)

**Files:**
- Sources:
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/FeishuSettings.tsx`
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/WeChatSettings.tsx`
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/BotHubSettings.tsx`
- Creates:
  - `desktop/src/features/chat-agent/components/settings/feishu-settings.tsx`
  - `desktop/src/features/chat-agent/components/settings/wechat-settings.tsx`
  - `desktop/src/features/chat-agent/components/settings/bot-hub-settings.tsx`

- [ ] **Step 1: Port `feishu-settings.tsx` (4 LOC, returns null)**

Copy verbatim — file body is:

```tsx
// Verbatim from uclaw ui/src/components/settings/FeishuSettings.tsx (Plan 3.5.s.c Wave C1)
// FeishuSettings — Proma 特有集成，uClaw 暂不需要
export default function FeishuSettings() {
  return null
}
```

- [ ] **Step 2: Port `wechat-settings.tsx` (4 LOC, returns null)**

Same shape as FeishuSettings:

```tsx
// Verbatim from uclaw ui/src/components/settings/WeChatSettings.tsx (Plan 3.5.s.c Wave C1)
// WeChatSettings — Proma 特有集成，uClaw 暂不需要
export default function WeChatSettings() {
  return null
}
```

- [ ] **Step 3: Port `bot-hub-settings.tsx` (17 LOC, placeholder)**

Copy verbatim with retarget `./primitives/SettingsSection` (already correct, no change needed).

- [ ] **Step 4: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: `Tests 944 passed (944)` (no new tests; the 3 files have no uclaw tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/feishu-settings.tsx desktop/src/features/chat-agent/components/settings/wechat-settings.tsx desktop/src/features/chat-agent/components/settings/bot-hub-settings.tsx
git commit -m "feat(desktop): port FeishuSettings + WeChatSettings + BotHubSettings (verbatim, Wave C1 — thin wrappers)"
```

---

### Task C2: Port `WechatIlinkBindingPanel.tsx` (259 LOC) + test (87 LOC)

**Files:**
- Sources:
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/WechatIlinkBindingPanel.tsx`
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/WechatIlinkBindingPanel.test.tsx`
- Creates:
  - `desktop/src/features/chat-agent/components/settings/wechat-ilink-binding-panel.tsx`
  - `desktop/src/features/chat-agent/components/settings/wechat-ilink-binding-panel.test.tsx`

This file uses `qrcode` (npm dep installed in Task A1), `invoke` from Tauri, `listen` from Tauri events, `toast` from sonner, and types from `im-channel-atoms`.

- [ ] **Step 1: Port the main file verbatim with retargets**

Retargets:
- `@/atoms/im-channel-atoms` → `@/features/chat-agent/atoms/im-channel-atoms`

The file calls `invoke('save_wechat_ilink_token', ...)` and `invoke('disconnect_wechat_ilink', ...)` — these stay as raw `invoke()` calls (same reasoning as SttSettings; tests mock at the `invoke` boundary).

Add attribution comment.

- [ ] **Step 2: Port the test file verbatim with retargets**

The test mocks `@tauri-apps/api/core` and `qrcode`. Apply standard retargets. If `renderWithProviders` is used, replace with inline `render(<Provider>{ui}</Provider>)` plus the standard 1-line comment.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: `Tests 944+N` where N is the uclaw test count for this panel (typically 3–6 for an 87-LOC test). Estimate **+5 tests** → 949.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/wechat-ilink-binding-panel.tsx desktop/src/features/chat-agent/components/settings/wechat-ilink-binding-panel.test.tsx
git commit -m "feat(desktop): port wechat-ilink-binding-panel (verbatim, Wave C2)"
```

---

### Task C3: Port `ImChannelForm.tsx` (315 LOC, no test in uclaw)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/ImChannelForm.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/im-channel-form.tsx`

- [ ] **Step 1: Port verbatim**

Retargets:
- `@/atoms/im-channel-atoms` → `@/features/chat-agent/atoms/im-channel-atoms`

The file calls `invoke('create_im_channel', ...)` and `invoke('update_im_channel', ...)` — stay as raw `invoke()`.

Add attribution comment.

- [ ] **Step 2: Write a minimal mount smoke test** (uclaw doesn't ship one)

```tsx
// desktop/src/features/chat-agent/components/settings/im-channel-form.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ImChannelForm } from './im-channel-form'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}))

describe('ImChannelForm', () => {
  it('renders without throwing for the create path', () => {
    const { container } = render(
      <ImChannelForm
        editing={null}
        channelType="webhook"
        spaces={[]}
        onClose={() => {}}
        onSaved={() => {}}
      />
    )
    // Form root renders a form element
    expect(container.querySelector('form')).not.toBeNull()
  })
})
```

(Implementer: confirm the prop signature matches the actual component export. If `ImChannelForm` is a default export, use `import ImChannelForm from './im-channel-form'` instead. The exact props are visible at the top of the verbatim source.)

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+1 test** → 950.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/im-channel-form.tsx desktop/src/features/chat-agent/components/settings/im-channel-form.test.tsx
git commit -m "feat(desktop): port im-channel-form (verbatim + mount smoke test, Wave C3)"
```

---

### Task C4: Port `ImChannelAccordionRow.tsx` (602 LOC) + test (161 LOC)

**Files:**
- Sources:
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/ImChannelAccordionRow.tsx`
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/ImChannelAccordionRow.test.tsx`
- Creates:
  - `desktop/src/features/chat-agent/components/settings/im-channel-accordion-row.tsx`
  - `desktop/src/features/chat-agent/components/settings/im-channel-accordion-row.test.tsx`

This is the second-largest single file in the cluster. It imports `WechatIlinkBindingPanel` (now ported in C2) and `im-channel-atoms` types.

- [ ] **Step 1: Port the main file verbatim with retargets**

Retargets:
- `@/atoms/im-channel-atoms` → `@/features/chat-agent/atoms/im-channel-atoms`
- `./WechatIlinkBindingPanel` → `./wechat-ilink-binding-panel`

Raw `invoke()` calls for `create_im_channel`, `update_im_channel`, `toggle_im_channel` stay as-is.

Add attribution comment.

- [ ] **Step 2: Port the test file verbatim with retargets**

Same retargets. Mock `@tauri-apps/api/core` and `@tauri-apps/api/event` (for `listen`). Apply `renderWithProviders` shim if needed.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+~8 tests** (161-LOC test file) → 958.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/im-channel-accordion-row.tsx desktop/src/features/chat-agent/components/settings/im-channel-accordion-row.test.tsx
git commit -m "feat(desktop): port im-channel-accordion-row (verbatim, Wave C4)"
```

---

### Task C5: Port `ImChannelsSettings.tsx` (192 LOC) + test (92 LOC)

**Files:**
- Sources:
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/ImChannelsSettings.tsx`
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/ImChannelsSettings.test.tsx`
- Creates:
  - `desktop/src/features/chat-agent/components/settings/im-channels-settings.tsx`
  - `desktop/src/features/chat-agent/components/settings/im-channels-settings.test.tsx`

Top-level tab component. Imports `ImChannelAccordionRow` (ported in C4) and `im-channel-atoms` (ported in A3).

- [ ] **Step 1: Port the main file verbatim with retargets**

Retargets:
- `@/atoms/im-channel-atoms` → `@/features/chat-agent/atoms/im-channel-atoms`
- `./ImChannelAccordionRow` → `./im-channel-accordion-row`
- `@/lib/types` (`SpaceSummary`) → `@/features/chat-agent/lib/tauri-bridge-stub` (SpaceSummary already exported from line 549 there)

Raw `invoke('list_spaces', ...)` and `listen('im_channel_status_changed', ...)` stay as-is. The implementer MUST also check whether ImChannelsSettings imports the constant `CHANNEL_TYPES_ORDER` from somewhere — if from a sibling file, port it; if defined locally in the source, it's already covered by the verbatim copy.

Add attribution comment.

- [ ] **Step 2: Port the test file verbatim with retargets**

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+~5 tests** (92-LOC test file) → 963.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/im-channels-settings.tsx desktop/src/features/chat-agent/components/settings/im-channels-settings.test.tsx
git commit -m "feat(desktop): port im-channels-settings (verbatim, Wave C5 — top-level tab)"
```

---

## Wave D — PetSettings (~91 LOC)

Smallest top-level real tab. Single file, no uclaw test ship.

### Task D1: Port `PetSettings.tsx` (91 LOC) + write minimal mount smoke test

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/PetSettings.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/pet-settings.tsx`
- Create: `desktop/src/features/chat-agent/components/settings/pet-settings.test.tsx`

- [ ] **Step 1: Port the main file verbatim with retargets**

Retargets:
- `@/lib/utils` (cn) → `@/shared/lib/cn`
- `@/atoms/pet-atoms` → `@/features/chat-agent/atoms/pet-atoms`

All primitives (`SettingsSection`, `SettingsCard`, `SettingsToggle`, `LABEL_CLASS`, `DESCRIPTION_CLASS`, `ROW_CLASS`) already exist at `./primitives/`.

Add attribution comment at top.

- [ ] **Step 2: Write a minimal mount smoke test**

```tsx
// desktop/src/features/chat-agent/components/settings/pet-settings.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'jotai'
import { PetSettings } from './pet-settings'

describe('PetSettings', () => {
  it('renders the section header', () => {
    const { getByText } = render(<Provider><PetSettings /></Provider>)
    // PetSettings renders a section labeled "桌面宠物" (Desktop Pet) per uclaw source
    expect(getByText(/桌面宠物|宠物/)).toBeTruthy()
  })

  it('renders character picker options for both characters', () => {
    const { container } = render(<Provider><PetSettings /></Provider>)
    // PetCharacter type has 'astro' | 'clawby' — both should render as selectable options
    // The exact attribute depends on the verbatim source; use a loose check.
    expect(container.querySelectorAll('button, [role="radio"], input[type="radio"]').length).toBeGreaterThanOrEqual(2)
  })
})
```

(Implementer: refine the assertion text after reading the verbatim source. The intent is "renders without throwing + shows the character picker.")

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+2 tests** → 965.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/pet-settings.tsx desktop/src/features/chat-agent/components/settings/pet-settings.test.tsx
git commit -m "feat(desktop): port pet-settings (verbatim + mount smoke test, Wave D)"
```

---

## Wave E — BrowserRuntime cluster (~2,975 LOC across 9 files)

The deepest closure. Three sub-tasks: lib helpers first (so sub-components and main tab can compile), then sub-components, then main tab + test.

### Task E1: Port `startup-doctor.ts` (473 LOC verbatim, pure types)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/lib/startup/startup-doctor.ts`
- Create: `desktop/src/features/chat-agent/lib/startup-doctor.ts`

Pure type declarations. No runtime logic, no imports from non-stdlib.

- [ ] **Step 1: Inspect source first**

```bash
head -60 /Users/ryanliu/Documents/uclaw/ui/src/lib/startup/startup-doctor.ts
grep -n "^import\|^export" /Users/ryanliu/Documents/uclaw/ui/src/lib/startup/startup-doctor.ts | head -50
```

Confirm: only `export` lines (types/interfaces/enums) — no `import` from `@/...` paths.

- [ ] **Step 2: Copy verbatim**

```bash
cp /Users/ryanliu/Documents/uclaw/ui/src/lib/startup/startup-doctor.ts \
   /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop/src/features/chat-agent/lib/startup-doctor.ts
```

Prepend:
```ts
// Verbatim from uclaw ui/src/lib/startup/startup-doctor.ts (Plan 3.5.s.c Wave E1)
```

- [ ] **Step 3: Run tests + tsc**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: tests still 965, tsc still 31.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/lib/startup-doctor.ts
git commit -m "feat(desktop): port startup-doctor types (Wave E1 prereq, 473 LOC verbatim)"
```

---

### Task E2: Port `browser-runtime-control-center.ts` (229 LOC) + its test (143 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/lib/browser-runtime/browser-runtime-control-center.ts`
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/lib/browser-runtime/browser-runtime-control-center.test.ts`
- Create: `desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-control-center.ts`
- Create: `desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-control-center.test.ts`

Pure-logic helper + view-model derivation functions. Has its own unit tests.

- [ ] **Step 1: Inspect imports**

```bash
grep -n "^import" /Users/ryanliu/Documents/uclaw/ui/src/lib/browser-runtime/browser-runtime-control-center.ts
```

Expected: imports types only from `@/lib/startup/startup-doctor` (Task E1, now at `@/features/chat-agent/lib/startup-doctor`).

- [ ] **Step 2: Create directory and copy with retarget**

```bash
mkdir -p /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop/src/features/chat-agent/lib/browser-runtime
```

Copy the file. Apply retarget: `@/lib/startup/startup-doctor` → `@/features/chat-agent/lib/startup-doctor` (or use relative `../startup-doctor` since we're inside `lib/`).

Add attribution comment.

- [ ] **Step 3: Port the test file with retargets**

`./browser-runtime-control-center` import stays sibling-relative. Other retargets same as above.

- [ ] **Step 4: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+~7 tests** (143-LOC test file) → 972.

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-control-center.ts desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-control-center.test.ts
git commit -m "feat(desktop): port browser-runtime-control-center helper (Wave E2 prereq, verbatim)"
```

---

### Task E3: Port `browser-runtime-settings.ts` → `browser-runtime-settings-helpers.ts` (273 LOC) + its test (240 LOC)

**Files:**
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/lib/browser-runtime/browser-runtime-settings.ts`
- Source: `/Users/ryanliu/Documents/uclaw/ui/src/lib/browser-runtime/browser-runtime-settings.test.ts`
- Create: `desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-settings-helpers.ts`
- Create: `desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-settings-helpers.test.ts`

**RENAME** the file from `browser-runtime-settings.ts` to `browser-runtime-settings-helpers.ts` to avoid filename collision with the tab component file `components/settings/browser-runtime-settings.tsx` ported in Task E5. This is the ONLY non-verbatim change in this plan — call it out clearly in the commit message.

- [ ] **Step 1: Copy + retarget + rename**

Copy `browser-runtime-settings.ts` to `browser-runtime-settings-helpers.ts`. Apply retarget: `@/lib/startup/startup-doctor` → `../startup-doctor`.

Add attribution comment, noting the rename:
```ts
// Verbatim from uclaw ui/src/lib/browser-runtime/browser-runtime-settings.ts (Plan 3.5.s.c Wave E3)
// File renamed (browser-runtime-settings.ts → browser-runtime-settings-helpers.ts) to avoid
// collision with the tab component file at ../../components/settings/browser-runtime-settings.tsx.
```

- [ ] **Step 2: Port the test file (also renamed)**

Copy `browser-runtime-settings.test.ts` → `browser-runtime-settings-helpers.test.ts`. The test's import of the helper file MUST be updated to match the new name: `./browser-runtime-settings-helpers` (or whatever sibling-relative path).

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+~12 tests** (240-LOC test file) → 984.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-settings-helpers.ts desktop/src/features/chat-agent/lib/browser-runtime/browser-runtime-settings-helpers.test.ts
git commit -m "feat(desktop): port browser-runtime-settings helpers (Wave E3 prereq, verbatim with deliberate rename for collision avoidance)"
```

---

### Task E4: Port the 5 BrowserRuntime sub-components (419 LOC total)

**Files:**
- Sources (under `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/browser-runtime/`):
  - `BrowserAutomationDiagnostics.tsx` (70 LOC)
  - `BrowserAutomationHeader.tsx` (62 LOC)
  - `PlaywrightSetupProgress.tsx` (69 LOC)
  - `PlaywrightSkillsPanel.tsx` (32 LOC)
  - `ProviderPriorityList.tsx` (186 LOC)
- Creates (under `desktop/src/features/chat-agent/components/settings/browser-runtime/`):
  - `browser-automation-diagnostics.tsx`
  - `browser-automation-header.tsx`
  - `playwright-setup-progress.tsx`
  - `playwright-skills-panel.tsx`
  - `provider-priority-list.tsx`

uclaw ships NO test files for these sub-components — write minimal mount smoke tests for the two heaviest (`ProviderPriorityList` 186 LOC, `BrowserAutomationDiagnostics` 70 LOC); skip tests for the three trivial ones.

- [ ] **Step 1: Create the directory + port all 5 files verbatim**

```bash
mkdir -p /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop/src/features/chat-agent/components/settings/browser-runtime
```

For each file, apply these retargets:
- `@/lib/browser-runtime/browser-runtime-control-center` → `@/features/chat-agent/lib/browser-runtime/browser-runtime-control-center`
- `@/lib/startup/startup-doctor` → `@/features/chat-agent/lib/startup-doctor`
- `@/lib/tauri-bridge` (only `PlaywrightSetupExecutionReport` from `PlaywrightSetupProgress.tsx`) → `@/features/chat-agent/lib/tauri-bridge-stub`
- `@/components/ui/*` → `@/shared/ui/*`
- Filename for sibling imports: kebab-case.

Add attribution comments at top of each file.

- [ ] **Step 2: Write mount smoke tests for the two heavier ones**

```tsx
// desktop/src/features/chat-agent/components/settings/browser-runtime/provider-priority-list.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ProviderPriorityList } from './provider-priority-list'

describe('ProviderPriorityList', () => {
  it('renders without throwing when priority list is empty', () => {
    const { container } = render(
      <ProviderPriorityList
        priority={[]}
        probePendingProviderId={null}
        onEnable={vi.fn()}
        onSetFirst={vi.fn()}
        onRunProbe={vi.fn()}
      />
    )
    expect(container).toBeTruthy()
  })
})
```

(Implementer: confirm the exact prop signature from the verbatim source.)

```tsx
// desktop/src/features/chat-agent/components/settings/browser-runtime/browser-automation-diagnostics.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserAutomationDiagnostics } from './browser-automation-diagnostics'

describe('BrowserAutomationDiagnostics', () => {
  it('renders without throwing with no report prop', () => {
    const { container } = render(<BrowserAutomationDiagnostics />)
    expect(container).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+2 tests** → 986.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/browser-runtime/
git commit -m "feat(desktop): port 5 browser-runtime sub-components (verbatim, Wave E4)"
```

---

### Task E5: Port `BrowserRuntimeSettings.tsx` (607 LOC) + test (591 LOC)

**Files:**
- Sources:
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/BrowserRuntimeSettings.tsx`
  - `/Users/ryanliu/Documents/uclaw/ui/src/components/settings/BrowserRuntimeSettings.test.tsx`
- Creates:
  - `desktop/src/features/chat-agent/components/settings/browser-runtime-settings.tsx`
  - `desktop/src/features/chat-agent/components/settings/browser-runtime-settings.test.tsx`

Top-level tab. Largest single file in this PR. All prereqs (sub-components, lib helpers, types) now exist.

- [ ] **Step 1: Port the main file verbatim with retargets**

Retargets:
- `@/atoms/kaleidoscope` → `@/features/chat-agent/atoms/kaleidoscope`
- `@/atoms/top-level-view` → `@/features/chat-agent/atoms/top-level-view`
- `@/components/ui/badge` → `@/shared/ui/badge`
- `@/components/ui/button` → `@/shared/ui/button`
- `@/lib/browser-runtime/browser-runtime-control-center` → `@/features/chat-agent/lib/browser-runtime/browser-runtime-control-center`
- `@/lib/browser-runtime/browser-runtime-settings` → `@/features/chat-agent/lib/browser-runtime/browser-runtime-settings-helpers` ← **RENAMED** path
- `@/lib/startup/startup-doctor` → `@/features/chat-agent/lib/startup-doctor`
- `@/lib/tauri-bridge` → `@/features/chat-agent/lib/tauri-bridge-stub`
- `./browser-runtime/BrowserAutomationDiagnostics` → `./browser-runtime/browser-automation-diagnostics`
- `./browser-runtime/BrowserAutomationHeader` → `./browser-runtime/browser-automation-header`
- `./browser-runtime/PlaywrightSetupProgress` → `./browser-runtime/playwright-setup-progress`
- `./browser-runtime/PlaywrightSkillsPanel` → `./browser-runtime/playwright-skills-panel`
- `./browser-runtime/ProviderPriorityList` → `./browser-runtime/provider-priority-list`
- `./primitives` (the barrel) → `./primitives` (unchanged — uclaw's barrel works as-is once primitives are at the same path)

Add attribution comment.

- [ ] **Step 2: Port the test file verbatim with retargets**

Apply same retargets. The test likely mocks the entire `tauri-bridge` module — these become mocks of `tauri-bridge-stub`. Apply the `renderWithProviders` shim if needed.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+~20 tests** (591-LOC test file) → 1006.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/browser-runtime-settings.tsx desktop/src/features/chat-agent/components/settings/browser-runtime-settings.test.tsx
git commit -m "feat(desktop): port browser-runtime-settings (verbatim, Wave E5 — top-level tab)"
```

---

## Wave F — Stub removal + retarget + integration tests + sweep

### Task F1: Remove 4 stubs from `settings-bridge-stub.tsx`

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/settings-bridge-stub.tsx`
- Modify: `desktop/src/features/chat-agent/lib/settings-bridge-stub.test.tsx`

- [ ] **Step 1: Delete the 4 stubs and their section comment**

In `settings-bridge-stub.tsx`, find and delete these lines:

```tsx
// Plan 3.5.s.c — provider integrations + STT settings + pet + browser runtime
export const SttSettings = makeStubTab('SttSettings', '3.5.s.c')
export const ImChannelsSettings = makeStubTab('ImChannelsSettings', '3.5.s.c')
export const PetSettings = makeStubTab('PetSettings', '3.5.s.c')
export const BrowserRuntimeSettings = makeStubTab('BrowserRuntimeSettings', '3.5.s.c')
```

After deletion, the file should have only the `makeStubTab` factory + the 3 remaining 3.5.s.d exports (`ProxySetting`, `SystemTab`, `AboutSettings`).

- [ ] **Step 2: Update the smoke test**

In `settings-bridge-stub.test.tsx`:

- Change `it('exports 7 deferred-tab stub components', ...)` to `it('exports 3 deferred-tab stub components', ...)`. Update `.toBe(7)` → `.toBe(3)`.
- Remove the 4 `it.each` entries for SttSettings, ImChannelsSettings, PetSettings, BrowserRuntimeSettings.
- In the standalone placeholder-content test, swap the rendered component from `<stubs.SttSettings />` (which was the swap target in 3.5.s.b) to `<stubs.ProxySetting />`, and update the assertions:
  - `toContain('SttSettings')` → `toContain('ProxySetting')`
  - `toContain('3.5.s.c')` → `toContain('3.5.s.d')`

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: net **−4 it.each cases** → 1002 (delta from F1 alone). Tests still pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/lib/settings-bridge-stub.tsx desktop/src/features/chat-agent/lib/settings-bridge-stub.test.tsx
git commit -m "feat(desktop): Wave F1 — drop 4 deferred-tab stubs (3.5.s.c real ports)"
```

---

### Task F2: Retarget `settings-panel.tsx` imports

**Files:**
- Modify: `desktop/src/features/chat-agent/components/settings/settings-panel.tsx`

- [ ] **Step 1: Remove 4 stubs from the bridge import + add 4 sibling-relative imports**

Current `settings-bridge-stub` import block in `settings-panel.tsx` looks like:

```ts
import {
  ImChannelsSettings,
  SttSettings,
  PetSettings,
  BrowserRuntimeSettings,
  ProxySetting,
  SystemTab,
  AboutSettings,
} from '@/features/chat-agent/lib/settings-bridge-stub'
```

Remove the 4 newly-real names:

```ts
import {
  ProxySetting,
  SystemTab,
  AboutSettings,
} from '@/features/chat-agent/lib/settings-bridge-stub'
import { SttSettings } from './stt-settings'
import { ImChannelsSettings } from './im-channels-settings'
import { PetSettings } from './pet-settings'
import { BrowserRuntimeSettings } from './browser-runtime-settings'
```

The `switch` cases for `stt`, `imChannels`, `pet`, `browserRuntime` still reference the same names — they now bind to the real components.

**Critical:** Verify that the named exports in the ported tabs match these import names. The verbatim ports may have used `default` exports. Specifically:
- `feishu-settings.tsx` and `wechat-settings.tsx` are `export default function FeishuSettings()` — but `settings-panel.tsx` doesn't import these (only the bridge stub did via name), so this isn't an issue here.
- `stt-settings.tsx`, `im-channels-settings.tsx`, `pet-settings.tsx`, `browser-runtime-settings.tsx`: confirm each exports the PascalCase symbol. If any of them defaults instead, use `import X from './x'` syntax.

- [ ] **Step 2: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: tests still 1002 (no net change in Group N tests yet — that's F3).

- [ ] **Step 3: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/settings/settings-panel.tsx
git commit -m "feat(desktop): Wave F2 — retarget settings-panel to real 3.5.s.c tab ports"
```

---

### Task F3: Add Group P integration tests + adjust prior assertions

**Files:**
- Modify: `desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx`

- [ ] **Step 1: Adjust the existing N3-equivalent test**

The current N3 test (added by 3.5.s.a, updated in 3.5.s.b Wave F3) asserts:
```ts
expect(document.body.querySelector('[data-deferred-to="3.5.s.c"]')).not.toBeNull()
```
for the `stt` tab. After Wave F1/F2, `stt` is no longer deferred — this assertion would flip. Change N3 to use a tab still in 3.5.s.d (`proxy` is one of the remaining ones):

```ts
  it('N3: deferred tabs (e.g., proxy) show data-deferred-to placeholders', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'proxy')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.d"]')).not.toBeNull()
  })
```

Likewise, **Group O test O5** (added by 3.5.s.b Wave F3) asserts `stt` is a 3.5.s.c stub. After Wave F1/F2, this also flips. Change O5 to use a 3.5.s.d tab:

```ts
  it('O5: 3.5.s.d stubs still render for their respective tabs', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'proxy')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.d"]')).not.toBeNull()
  })
```

- [ ] **Step 2: Add Group P block at end of file**

```ts
// ---------------------------------------------------------------------------
// P. AppShell + SettingsDialog 3.5.s.c real ports — 5 cases
// ---------------------------------------------------------------------------

describe('AppShell + SettingsDialog 3.5.s.c tabs (real ports)', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => cleanup())

  it('P1: stt tab opens with real SttSettings content', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'stt')
    render(<Provider store={store}><AppShell /></Provider>)
    // Real SttSettings renders the language section — positive assertion via section attr.
    // Implementer: replace this with whatever data attribute the verbatim port surfaces
    // at section level (e.g., data-settings-section="语音输入" or similar).
    expect(document.body.querySelector('[data-deferred-to="3.5.s.c"]')).toBeNull()
  })

  it('P2: imChannels tab is real (no stub marker)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'imChannels')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.c"]')).toBeNull()
  })

  it('P3: pet tab is real', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'pet')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.c"]')).toBeNull()
  })

  it('P4: browserRuntime tab is real', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'browserRuntime')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.c"]')).toBeNull()
  })

  it('P5: 3.5.s.d stubs still render for their respective tabs (regression guard)', () => {
    const store = createStore()
    store.set(settingsOpenAtom, true)
    store.set(settingsTabAtom, 'system')
    render(<Provider store={store}><AppShell /></Provider>)
    expect(document.body.querySelector('[data-deferred-to="3.5.s.d"]')).not.toBeNull()
  })
})
```

**Important — IPC mock additions:** The existing mock block in this integration test (around lines 144–174 per the recall context from PR #21) already stubs `getRoleModels`, `proactiveStatus`, etc. After Wave F2, the real `SttSettings`, `ImChannelsSettings`, `PetSettings`, `BrowserRuntimeSettings` mount when their tabs activate, triggering their `useEffect` async paths. The implementer must check the mock block and add stub returns for:
- `sttModelStatus` → resolves to `{ kind: 'unknown' }`
- `listImChannels` → resolves to `[]`
- `getImChannelStatuses` → resolves to `[]`
- `listSpaces` → resolves to `[]`
- `getBrowserRuntimeControlCenter` → resolves to a minimal report (read uclaw type for shape) or `null` if optional
- `getBrowserRuntimeStatus` → resolves to a minimal status shape
- `listBrowserIdentities` → resolves to a minimal report

If any of these still throws an unhandled rejection in tests, follow the same fix pattern from 3.5.s.b Wave F review: provide a resolved value that satisfies the consumer's first `.find`/`.map`/etc. call.

- [ ] **Step 3: Run tests**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -6
```

Expected: **+5 P-tests** → 1007. Zero failing, zero unhandled rejections.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add desktop/src/features/chat-agent/components/app-shell/app-shell.integration.test.tsx
git commit -m "feat(desktop): Wave F3 — Group P integration tests + N3/O5 retarget to 3.5.s.d"
```

---

### Task F4: Final automated sweep

- [ ] **Step 1: Anti-god-file invariant check**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
find desktop/src/lib -type f -not -path '*/bridge/*'
```

Expected: empty output. (No new files under `desktop/src/lib/` outside `bridge/`.)

- [ ] **Step 2: Storage-key leakage check**

```bash
git grep -nE "'uclaw[:-]|\"uclaw[:-]" desktop/src/features/ desktop/src/app/ desktop/src/shared/ || echo "clean"
```

Expected: only the pre-existing comment-only rebrand-history hits in `chat-atoms.ts` (4 matches). NO new storage keys with `uclaw` prefix.

- [ ] **Step 3: Deferred-residual count**

```bash
git grep -n 'data-deferred-to="3.5.s.c"' desktop/src/ || echo "0 — all 3.5.s.c stubs removed"
```

Expected: only `.toBeNull()` assertions in `app-shell.integration.test.tsx`. NO real-code occurrences.

- [ ] **Step 4: tsc residual count**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npx tsc -b 2>&1 | grep -c "error TS"
```

Expected: 31 (unchanged from main baseline). If higher, identify which new files contributed and fix.

- [ ] **Step 5: Final test run**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster/desktop
npm test -- --reporter=dot 2>&1 | tail -10
```

Expected: **1007 passing, 0 failing**.

- [ ] **Step 6: Commit sweep result only if changes**

If steps 1–5 surfaced fixable issues that were addressed:

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-settings-provider-cluster
git add -A
git commit -m "chore(desktop): Plan 3.5.s.c final sweep" 2>/dev/null || echo "nothing to commit"
```

---

## Final Self-Review Checklist

- [ ] Wave A: qrcode dep added; ~25 IPC stubs added under `=== Plan 3.5.s.c additions ===`; `im-channel-atoms.ts` ported
- [ ] Wave B: SttSettings ported with test
- [ ] Wave C: 8 IM-cluster files ported (3 thin wrappers + WechatIlinkBindingPanel + ImChannelForm + ImChannelAccordionRow + ImChannelsSettings; tests where uclaw ships them, minimal mount tests otherwise)
- [ ] Wave D: PetSettings ported with mount smoke test
- [ ] Wave E: BrowserRuntime cluster ported (startup-doctor types, control-center helper + test, settings-helpers + test, 5 sub-components + 2 smoke tests, main tab + test)
- [ ] Wave F: 4 stubs deleted; 4 imports retargeted; Group P added; N3/O5 retargeted; final sweep green
- [ ] Anti-god-file: `desktop/src/lib/` contains only `bridge/`
- [ ] `[data-deferred-to="3.5.s.c"]` count: 0 in production code
- [ ] Test count up by ≥60 (941 → ≥1001)
- [ ] tsc residual errors stable at 31 (no NEW from 3.5.s.c)
- [ ] All commits use conventional-commit prefixes (`feat(desktop):`, `chore(desktop):`)
- [ ] Canonical NOT_IMPLEMENTED marker used for all new stubs (`NOT_IMPLEMENTED_IN_PLAN_3_5_S_BACKEND`)

---

## Carry-Forward Follow-ups

After 3.5.s.c merges:

1. **Plan 3.5.s.d** — ProxySetting + SystemTab + AboutSettings (~3,000 LOC; 3 deferred-tab stubs). Last PR of the SettingsDialog sub-stack.
2. **Rust backends** for all 3.5.s.c new IPC stubs (~25 commands): `stt_model_status`, `stt_download_model`, IM channel CRUD + status, WeChat ilink token mgmt, BrowserRuntime supervisor (~9 commands).
3. **Pre-existing carry-forwards** (still open from 3.5.s.a/b): 31 residual tsc errors, ChannelSettings backend integration, recharts Tooltip type narrowing.
4. The deliberate filename rename (`browser-runtime-settings.ts` → `browser-runtime-settings-helpers.ts`) creates a verbatim-port divergence from uclaw. When the uclaw upstream gets re-pulled (e.g., for a sync wave), the helper file rename must be reapplied. Document this in the PR description.

---

## Test Count Trajectory

| Wave | Tests added | Running total |
|---|---|---|
| Baseline (post-3.5.s.b) | — | 941 |
| A | 0 (types/stubs only; im-channel-atoms not directly tested) | 941 |
| B (SttSettings) | +3 | 944 |
| C1 (thin wrappers) | 0 | 944 |
| C2 (WechatIlinkBindingPanel) | +5 | 949 |
| C3 (ImChannelForm smoke) | +1 | 950 |
| C4 (ImChannelAccordionRow) | +8 | 958 |
| C5 (ImChannelsSettings) | +5 | 963 |
| D (PetSettings smoke) | +2 | 965 |
| E1 (startup-doctor types) | 0 | 965 |
| E2 (control-center) | +7 | 972 |
| E3 (settings-helpers) | +12 | 984 |
| E4 (sub-components × 2 smoke) | +2 | 986 |
| E5 (BrowserRuntimeSettings) | +20 | 1006 |
| F1 (drop 4 it.each cases) | −4 | 1002 |
| F3 (Group P + adjust N3/O5) | +5 | 1007 |
| **Final** | **+66** | **1007** |
