# Desktop Tool-Rendering Subsystem Port — Plan 2b.2.c.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3 tool-rendering stubs from Plan 2b.2.b.2 with real uclaw-fidelity ports (~3,400 LOC effective) — `tool-renderers/*`, `ToolActivityItem`, `tool-utils`, `tool-phrase`, `ContentBlock`, `NativeBlockRenderer`, `SDKMessageRenderer`. After this plan, `AgentMessages` renders real tool activities + Anthropic content blocks + compaction UI. App.tsx wiring still deferred to Plan 2b.2.c.3.

**Architecture:** Bottom-up port in dependency order: utilities (tool-utils, tool-phrase, pierre-theme) → tool result renderers (8 files) → dispatcher → ToolActivityItem → content-block + native-block-renderer → SDKMessageRenderer → swap AgentMessages imports + delete stubs. Each ported file is verbatim from uclaw with import retargets + TS strict-mode tweaks. Stub-deletion is the gate: after this plan, `stubs/tool-activity-list.tsx`, `stubs/content-block.tsx`, `stubs/sdk-message-renderer.tsx` no longer exist.

**Tech Stack additions:** None — all deps already installed in Plan 2b.2.b.1.

**Reference:** Spec — [docs/superpowers/specs/2026-05-28-desktop-message-view-completion-design.md](../specs/2026-05-28-desktop-message-view-completion-design.md) §3.1. Stacked on main at `1138fad` (post-merge of Plans 1-2b.2.b.2).

---

## Important recon finding (verified before plan write)

uclaw's `hooks/useSmoothStream.ts` is itself a `[PLACEHOLDER]` with `简化版 — 直接返回原始内容（无逐字动画）`. Our Plan 2b.2.b.1 port is already 1:1 with upstream. **Plan 2b.2.b.1 follow-up #1 is moot** — there is no real impl in uclaw to port. Skip it. This is a divergence-correction noted in the spec's §8 decision log.

---

## Stubs to delete (the gate criterion)

After this plan ships:
```bash
ls desktop/src/features/chat-agent/components/stubs/
# Expected: only scroll-position-manager.tsx, skill-chips.tsx, learning-chips.tsx remain
# (the other 3 deleted; rest get deleted in c.2 / c.3)
```

Stub files deleted in this plan:
- `desktop/src/features/chat-agent/components/stubs/tool-activity-list.tsx` + `.test.tsx`
- `desktop/src/features/chat-agent/components/stubs/content-block.tsx` + `.test.tsx`
- `desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.tsx` + `.test.tsx`

---

## File Structure

```
desktop/src/features/chat-agent/
  lib/
    tool-utils.ts                            # NEW (Task 2): 553 LOC port
    tool-utils.test.ts                       # NEW (Task 2)
    tool-phrase.ts                           # NEW (Task 2): 382 LOC port
    tool-phrase.test.ts                      # NEW (Task 2)
  components/
    tool-renderers/
      pierre-theme.ts                        # NEW (Task 2): adapted for our themeAtom
      pierre-theme.test.ts                   # NEW (Task 2)
      default-result.tsx                     # NEW (Task 3)
      default-result.test.tsx                # NEW (Task 3)
      collapsible-result.tsx                 # NEW (Task 3)
      collapsible-result.test.tsx            # NEW (Task 3, port uclaw's)
      bash-result.tsx                        # NEW (Task 4)
      bash-result.test.tsx                   # NEW (Task 4, port uclaw's)
      bash-stream-view.tsx                   # NEW (Task 4, renamed BashStreamView.tsx)
      bash-stream-view.test.tsx              # NEW (Task 4, port uclaw's)
      read-result.tsx                        # NEW (Task 5)
      read-result.test.tsx                   # NEW (Task 5, port uclaw's)
      write-result.tsx                       # NEW (Task 6)
      write-result.test.tsx                  # NEW (Task 6, port uclaw's)
      edit-result.tsx                        # NEW (Task 6)
      edit-result.test.tsx                   # NEW (Task 6, port uclaw's)
      screenshot-result.tsx                  # NEW (Task 7)
      screenshot-result.test.tsx             # NEW (Task 7)
      index.tsx                              # NEW (Task 8): dispatcher (skip gbrain branch)
      index.test.tsx                         # NEW (Task 8, port uclaw's with gbrain assertion removed)
    tool-activity-item.tsx                   # NEW (Task 9): 693 LOC port — exports ToolActivityItem + ToolActivityList
    tool-activity-item.test.tsx              # NEW (Task 9, port uclaw's)
    native-block-renderer.tsx                # NEW (Task 10): 97 LOC port
    native-block-renderer.test.tsx           # NEW (Task 10, port uclaw's)
    content-block.tsx                        # NEW (Task 11): 609 LOC port (ThinkingBlock + helpers)
    content-block.test.tsx                   # NEW (Task 11): smoke tests
    sdk-message-renderer.tsx                 # NEW (Task 12): 1,150 LOC port
    sdk-message-renderer.test.tsx            # NEW (Task 12, port uclaw's)
    agent-messages.tsx                       # MODIFY (Task 13): swap stub imports → real
    stubs/
      tool-activity-list.tsx                 # DELETE (Task 13)
      tool-activity-list.test.tsx            # DELETE (Task 13)
      content-block.tsx                      # DELETE (Task 13)
      content-block.test.tsx                 # DELETE (Task 13)
      sdk-message-renderer.tsx               # DELETE (Task 13)
      sdk-message-renderer.test.tsx          # DELETE (Task 13)
```

**Anti-god-file invariants:**
- One renderer per file under `tool-renderers/`. No barrel re-export beyond the dispatcher's named imports.
- `tool-utils` + `tool-phrase` live in `lib/` (pure utilities, no React).
- `pierre-theme` lives in `tool-renderers/` (co-located with consumers, theme constants specific to code highlighting).
- `tool-activity-item.tsx` exports BOTH `ToolActivityItem` AND `ToolActivityList` (matching uclaw's bundling) — verified by Task 1 recon.

---

## Port Methodology (verbatim-with-retargets)

For each ported file:
1. Read uclaw source verbatim.
2. Apply retargets:
   - `from '@/lib/utils'` → `from '@/shared/lib/cn'`
   - `from '@/lib/agent-types'` → `from '@/features/chat-agent/lib/agent-types'`
   - `from '@/lib/chat-types'` → `from '@/features/chat-agent/lib/chat-types'`
   - `from '@/lib/normalize-agent-markdown'` → `from '@/shared/lib/normalize-agent-markdown'`
   - `from '@/lib/skill-citation'` → `from '@/shared/lib/skill-citation'`
   - `from '@/lib/highlight'` → `from '@/shared/lib/highlight'`
   - `from '@/lib/model-logo'` → `from '@/features/chat-agent/lib/model-logo'`
   - `from '@/hooks/useSmoothStream'` → `from '@/shared/lib/use-smooth-stream'`
   - `from '@/atoms/theme'` (resolvedThemeAtom) → `from '@/features/chat-agent/atoms/theme-atoms'` (themeAtom). **Adaptation:** uclaw's `resolvedThemeAtom: 'light' | 'dark'` maps 1:1 to our `themeAtom`. Pierre-theme's `dark → 'one-dark-pro'` / `light → 'one-light'` mapping works identically.
   - `from '@/atoms/agent-atoms'` (named atoms) → `from '@/features/chat-agent/atoms/agent-atoms'`
   - `from '@/atoms/{tab-atoms,chat-atoms,agent-display-name,ui-preferences}'` → still STUB via `@/features/chat-agent/lib/peripheral-stubs` (these get unstubbed in Plan 2b.2.c.2)
   - `from '@/components/ai-elements/<x>'` → `from '@/features/chat-agent/components/ai-elements/<x>'`
   - `from '@/components/agent/tool-renderers/<x>'` → `from './<x>'` (sibling)
   - `from '@/components/agent/tool-utils'` → `from '@/features/chat-agent/lib/tool-utils'`
   - `from '@/components/agent/tool-phrase'` → `from '@/features/chat-agent/lib/tool-phrase'`
   - `from '@/components/agent/ToolActivityItem'` → `from '@/features/chat-agent/components/tool-activity-item'`
   - `from '@/components/agent/ContentBlock'` → `from '@/features/chat-agent/components/content-block'`
   - `from '@/components/agent/NativeBlockRenderer'` → `from '@/features/chat-agent/components/native-block-renderer'`
   - `from '@/components/agent/SDKMessageRenderer'` → `from '@/features/chat-agent/components/sdk-message-renderer'`
   - `from '@/components/ui/<x>'` → `from '@/shared/ui/<x>'`
   - `from '@/components/chat/<x>'` → still STUB via `peripheral-stubs` OR via `@/features/chat-agent/components/<kebab-x>` (Plan 2b.2.b.1/b.2 ports)
3. Resolve TS strict-mode tweaks (`_`-prefix on unused args; doc comments for renames).
4. If a port references a symbol NOT in our scope (not yet ported and not in stubs), STOP and report — do not silently inline.

---

## Task 1: Recon — full import surface

**Files:**
- Create: `docs/superpowers/plans/2026-05-28-desktop-tool-renderers-recon.md`

- [ ] **Step 1: Enumerate every file's imports**

```bash
UCLAW=/Users/ryanliu/Documents/uclaw/ui/src
for f in \
  $UCLAW/components/agent/tool-renderers/{bash-result,BashStreamView,read-result,write-result,edit-result,collapsible-result,default-result,screenshot-result,index,pierre-theme}.{ts,tsx} \
  $UCLAW/components/agent/{ToolActivityItem,tool-utils,tool-phrase,ContentBlock,NativeBlockRenderer,SDKMessageRenderer}.{ts,tsx} ; do
  [ -f "$f" ] && echo "### $f" && grep -E "^import " "$f"
done
```

- [ ] **Step 2: Catalog stub-replacement mapping**

For each of the 3 stubs to delete, find every file in `desktop/src/features/chat-agent/` that imports from them, so Task 13 knows the exact import-swap edits:

```bash
DEST=/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers/desktop/src/features/chat-agent
grep -rn "from .*stubs/tool-activity-list\|from .*stubs/content-block\|from .*stubs/sdk-message-renderer" $DEST 2>/dev/null
```

- [ ] **Step 3: Confirm ToolActivityItem's exports (verify it exports both ToolActivityItem + ToolActivityList)**

```bash
grep -E "^export " /Users/ryanliu/Documents/uclaw/ui/src/components/agent/ToolActivityItem.tsx | head -10
```

- [ ] **Step 4: Confirm ContentBlock's exports (it should export ThinkingBlock + other helpers used by AgentMessages and SDKMessageRenderer)**

```bash
grep -E "^export " /Users/ryanliu/Documents/uclaw/ui/src/components/agent/ContentBlock.tsx | head -10
```

- [ ] **Step 5: Verify our agent-types has all types the ports need**

```bash
DEST=/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
# Look up types used by ContentBlock, SDKMessageRenderer, ToolActivityItem
grep -E "from '@/lib/agent-types'" /Users/ryanliu/Documents/uclaw/ui/src/components/agent/{ContentBlock,SDKMessageRenderer,ToolActivityItem}.tsx 2>/dev/null | sort -u
# Then verify each type is exported from our agent-types
grep -nE "^export " $DEST/desktop/src/features/chat-agent/lib/agent-types.ts | head
```

- [ ] **Step 6: Write recon doc**

Save to `docs/superpowers/plans/2026-05-28-desktop-tool-renderers-recon.md` with sections:
- Per-file import surface (Step 1 output)
- Stub-replacement mapping (Step 2): each import line in AgentMessages that points at a stub
- ToolActivityItem + ContentBlock public surface (Steps 3-4)
- Type coverage gaps (Step 5): list any uclaw type referenced by a port that's NOT yet in our type files; each gap will be added as a one-line export to agent-types.ts during the relevant port task
- Out-of-scope imports flagged: anything outside what the spec listed (recon catches scope creep)

- [ ] **Step 7: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add docs/superpowers/plans/2026-05-28-desktop-tool-renderers-recon.md
git commit -m "docs(plan): recon tool-rendering import surface for 2b.2.c.1"
```

## Reporting (per task — applies to all tasks in this plan)

Each task subagent reports **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** with commit SHA + test count delta + any adaptations made (signature changes, missing imports added, etc.).

---

## Task 2: Port utilities — tool-utils + tool-phrase + pierre-theme

**Files:**
- Create: `desktop/src/features/chat-agent/lib/tool-utils.ts` (553 LOC)
- Create: `desktop/src/features/chat-agent/lib/tool-utils.test.ts`
- Create: `desktop/src/features/chat-agent/lib/tool-phrase.ts` (382 LOC)
- Create: `desktop/src/features/chat-agent/lib/tool-phrase.test.ts`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.ts` (small)
- Create: `desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.test.ts`

All three are pure-utility / hook ports. Bundle into one task since each is small and independent.

- [ ] **Step 1: Port tool-utils.ts verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-utils.ts` → `desktop/src/features/chat-agent/lib/tool-utils.ts`. Apply retargets per methodology. Per recon, exports include: `TOOL_ICONS`, `getToolIcon`, `getToolDisplayName`, `getInputSummary`, `extractFilePath`, `computeDiffStats`, `formatElapsed`, `inferLanguageFromPath`.

- [ ] **Step 2: Write tool-utils tests**

```ts
// desktop/src/features/chat-agent/lib/tool-utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  TOOL_ICONS,
  getToolIcon,
  getToolDisplayName,
  computeDiffStats,
  formatElapsed,
  inferLanguageFromPath,
} from './tool-utils'

describe('tool-utils', () => {
  it('TOOL_ICONS is a non-empty map', () => {
    expect(Object.keys(TOOL_ICONS).length).toBeGreaterThan(0)
  })

  it('getToolIcon returns a function for known + unknown tools', () => {
    expect(typeof getToolIcon('read_file')).toBe('object')   // lucide icons are objects/components
    expect(typeof getToolIcon('unknown_tool')).toBe('object')
  })

  it('getToolDisplayName returns a string', () => {
    expect(typeof getToolDisplayName('read_file')).toBe('string')
  })

  it('inferLanguageFromPath returns "text" for unknown extensions', () => {
    expect(inferLanguageFromPath('x.weirdext')).toBe('text')
  })

  it('computeDiffStats returns +/-/total triple', () => {
    const stats = computeDiffStats('@@ -1,3 +1,4 @@\n line\n+added\n-removed')
    expect(stats).toBeDefined()
  })

  it('formatElapsed returns a string', () => {
    expect(typeof formatElapsed(0)).toBe('string')
    expect(typeof formatElapsed(120)).toBe('string')
  })
})
```

Adapt assertions to actual return shapes if recon reveals divergence.

- [ ] **Step 3: Port tool-phrase.ts verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-phrase.ts` → `desktop/src/features/chat-agent/lib/tool-phrase.ts`. Apply retargets. Per recon, exports `ToolPhrase` interface + `getToolPhrase` function.

- [ ] **Step 4: Write tool-phrase tests**

```ts
// desktop/src/features/chat-agent/lib/tool-phrase.test.ts
import { describe, it, expect } from 'vitest'
import { getToolPhrase } from './tool-phrase'

describe('tool-phrase', () => {
  it('returns a ToolPhrase object for known tools', () => {
    const phrase = getToolPhrase('read_file', { path: '/x.txt' })
    expect(phrase).toBeDefined()
    expect(typeof phrase).toBe('object')
  })

  it('handles null input gracefully', () => {
    const phrase = getToolPhrase('read_file', null)
    expect(phrase).toBeDefined()
  })

  it('returns a ToolPhrase for unknown tools (fallback)', () => {
    const phrase = getToolPhrase('totally_unknown_tool', {})
    expect(phrase).toBeDefined()
  })
})
```

- [ ] **Step 5: Port pierre-theme.ts with the themeAtom adaptation**

Create `desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.ts`:

```ts
import { useAtomValue } from 'jotai'
import { themeAtom } from '@/features/chat-agent/atoms/theme-atoms'

/**
 * Ported from uclaw's tool-renderers/pierre-theme.ts.
 *
 * uclaw uses `resolvedThemeAtom` (from `@/atoms/theme`) which is a derived
 * `'light' | 'dark'` atom. Our `themeAtom` exposes the same string union
 * directly, so the adaptation is a 1:1 import retarget. Plan 3 (multi-theme)
 * may introduce a richer resolved-theme atom; this file remains compatible.
 */
export function usePierreTheme(): 'one-light' | 'one-dark-pro' {
  const theme = useAtomValue(themeAtom)
  return theme === 'dark' ? 'one-dark-pro' : 'one-light'
}

/**
 * Infer Shiki/Pierre language identifier from a file path's extension.
 * Falls back to 'text' for unknown / extensionless paths.
 *
 * Verbatim from uclaw upstream.
 */
export function detectLang(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx',
    js: 'javascript', jsx: 'jsx',
    json: 'json', md: 'markdown', mdx: 'markdown',
    py: 'python', rs: 'rust', go: 'go',
    java: 'java', kt: 'kotlin', swift: 'swift',
    rb: 'ruby', php: 'php', sh: 'shell', bash: 'shell',
    yaml: 'yaml', yml: 'yaml', toml: 'toml',
    html: 'html', css: 'css', scss: 'scss', sass: 'sass',
    sql: 'sql', xml: 'xml', svg: 'xml',
    dockerfile: 'docker', dockerignore: 'text',
    c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp',
    cs: 'csharp', vue: 'vue', svelte: 'svelte',
    lua: 'lua', r: 'r', dart: 'dart', zig: 'zig',
  }
  return map[ext] ?? 'text'
}
```

- [ ] **Step 6: Write pierre-theme tests**

```ts
// desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.test.ts
import { describe, it, expect } from 'vitest'
import { detectLang } from './pierre-theme'

describe('pierre-theme', () => {
  describe('detectLang', () => {
    it('returns typescript for .ts', () => {
      expect(detectLang('x.ts')).toBe('typescript')
    })
    it('returns text for unknown extension', () => {
      expect(detectLang('x.weirdext')).toBe('text')
    })
    it('returns text for extensionless path', () => {
      expect(detectLang('LICENSE')).toBe('text')
    })
    it('handles case-insensitive extensions', () => {
      expect(detectLang('x.TS')).toBe('typescript')
    })
  })
  // usePierreTheme requires React + Jotai render — covered by integration in Task 16
})
```

- [ ] **Step 7: Run tests + commit**

```bash
pnpm --dir desktop test "(tool-utils|tool-phrase|pierre-theme)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/lib/tool-utils.ts desktop/src/features/chat-agent/lib/tool-utils.test.ts
git add desktop/src/features/chat-agent/lib/tool-phrase.ts desktop/src/features/chat-agent/lib/tool-phrase.test.ts
git add desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.ts desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.test.ts
git commit -m "feat(desktop): port tool-utils + tool-phrase + pierre-theme (utilities for tool renderers)"
```

---

## Task 3: Port renderers — default-result + collapsible-result

**Files:**
- Create: `desktop/src/features/chat-agent/components/tool-renderers/default-result.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/default-result.test.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/collapsible-result.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/collapsible-result.test.tsx`

Both are small (66 + 62 LOC). `collapsible-result` is the wrapper used by other renderers; `default-result` is the dispatcher fallback.

- [ ] **Step 1: Port default-result.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/default-result.tsx` → target. Apply retargets.

- [ ] **Step 2: Port collapsible-result.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/collapsible-result.tsx` → target. Apply retargets.

- [ ] **Step 3: Port uclaw's collapsible-result test verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/collapsible-result.test.tsx` → target. Retarget only the source import.

- [ ] **Step 4: Write default-result smoke test**

```tsx
// desktop/src/features/chat-agent/components/tool-renderers/default-result.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DefaultResultRenderer } from './default-result'

describe('DefaultResultRenderer', () => {
  it('renders unknown tool result text', () => {
    render(
      <DefaultResultRenderer
        toolName="some_tool"
        input={{}}
        result="hello result"
        isError={false}
      />,
    )
    expect(screen.getByText(/hello result/)).toBeInTheDocument()
  })

  it('renders error variant', () => {
    render(
      <DefaultResultRenderer
        toolName="some_tool"
        input={{}}
        result="boom"
        isError={true}
      />,
    )
    expect(screen.getByText(/boom/)).toBeInTheDocument()
  })
})
```

Adapt to actual prop shape if uclaw differs.

- [ ] **Step 5: Run + commit**

```bash
pnpm --dir desktop test "(default-result|collapsible-result)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/tool-renderers/{default-result,collapsible-result}*
git commit -m "feat(desktop): port default-result + collapsible-result renderers"
```

---

## Task 4: Port renderers — bash-result + bash-stream-view

**Files:**
- Create: `desktop/src/features/chat-agent/components/tool-renderers/bash-result.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/bash-result.test.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/bash-stream-view.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/bash-stream-view.test.tsx`

- [ ] **Step 1: Port bash-result.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/bash-result.tsx` → target. Apply retargets.

- [ ] **Step 2: Port bash-stream-view.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/BashStreamView.tsx` → `desktop/src/features/chat-agent/components/tool-renderers/bash-stream-view.tsx` (kebab-cased filename; exported symbol stays `BashStreamView`). Add a doc comment at the top noting the rename.

- [ ] **Step 3: Port both test files**

Read uclaw's `bash-result.test.tsx` + `BashStreamView.test.tsx` → targets. Retarget imports. Verbatim assertions.

- [ ] **Step 4: Run + commit**

```bash
pnpm --dir desktop test "(bash-result|bash-stream-view)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/tool-renderers/{bash-result,bash-stream-view}*
git commit -m "feat(desktop): port bash-result + BashStreamView (renamed kebab-case)"
```

---

## Task 5: Port renderer — read-result

**Files:**
- Create: `desktop/src/features/chat-agent/components/tool-renderers/read-result.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/read-result.test.tsx`

- [ ] **Step 1: Port read-result.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/read-result.tsx` → target. Apply retargets.

- [ ] **Step 2: Port uclaw's test**

Read uclaw's `read-result.test.tsx` → target. Retarget imports.

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test read-result 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/tool-renderers/read-result*
git commit -m "feat(desktop): port read-result renderer"
```

---

## Task 6: Port renderers — write-result + edit-result

**Files:**
- Create: `desktop/src/features/chat-agent/components/tool-renderers/write-result.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/write-result.test.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/edit-result.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/edit-result.test.tsx`

- [ ] **Step 1: Port write-result.tsx + edit-result.tsx**

Read both uclaw source files → targets. Apply retargets per methodology.

- [ ] **Step 2: Port both uclaw test files**

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test "(write-result|edit-result)" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/tool-renderers/{write-result,edit-result}*
git commit -m "feat(desktop): port write-result + edit-result renderers"
```

---

## Task 7: Port renderer — screenshot-result

**Files:**
- Create: `desktop/src/features/chat-agent/components/tool-renderers/screenshot-result.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/screenshot-result.test.tsx`

- [ ] **Step 1: Port screenshot-result.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/screenshot-result.tsx` → target. Apply retargets. Note: screenshot-result likely uses `ImageLightbox` (already ported) and may reference the Tauri attachment bridge (currently stubbed in `peripheral-stubs.ts`). If it imports `saveImageAs`, retarget to the stub.

- [ ] **Step 2: Write smoke test**

```tsx
// desktop/src/features/chat-agent/components/tool-renderers/screenshot-result.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScreenshotResultRenderer } from './screenshot-result'

describe('ScreenshotResultRenderer', () => {
  it('renders for a valid result payload', () => {
    const result = JSON.stringify({ filename: 'screen.png', localPath: '/tmp/screen.png', mediaType: 'image/png' })
    const { container } = render(<ScreenshotResultRenderer result={result} isError={false} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('renders error state without crashing', () => {
    const { container } = render(<ScreenshotResultRenderer result="boom" isError={true} />)
    expect(container.firstChild).not.toBeNull()
  })
})
```

Adapt to actual prop shape if uclaw differs (could be a parsed object instead of JSON string).

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test screenshot-result 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/tool-renderers/screenshot-result*
git commit -m "feat(desktop): port screenshot-result renderer"
```

---

## Task 8: Port dispatcher — tool-renderers/index.tsx (skip gbrain)

**Files:**
- Create: `desktop/src/features/chat-agent/components/tool-renderers/index.tsx`
- Create: `desktop/src/features/chat-agent/components/tool-renderers/index.test.tsx`

- [ ] **Step 1: Port index.tsx with gbrain branch removed**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/tool-renderers/index.tsx` → target. The full file is 47 LOC. Apply retargets (all imports are sibling `./` paths — fine). **CHANGE:** Remove the `GbrainResultRenderer` import line AND the `if (toolName.startsWith('mcp__gbrain__')...)` branch entirely.

The ported file should look like:

```tsx
import * as React from 'react'
import { WriteResultRenderer } from './write-result'
import { EditResultRenderer } from './edit-result'
import { ReadResultRenderer } from './read-result'
import { BashResultRenderer } from './bash-result'
import { ScreenshotResultRenderer } from './screenshot-result'
import { DefaultResultRenderer } from './default-result'

// Plan 2b.2.c.1 — Gbrain branch + import removed (uclaw-specific tool; no
// gbrain in Hermes). If a future Hermes tool needs a custom renderer, add
// a new case here.

export interface ToolResultRendererProps {
  toolName: string
  input: Record<string, unknown>
  result: string
  isError: boolean
}

export function ToolResultRenderer({
  toolName,
  input,
  result,
  isError,
}: ToolResultRendererProps): React.ReactElement {
  const props = { input, result, isError }
  switch (toolName) {
    case 'write_file':
      return <WriteResultRenderer {...props} />
    case 'edit':
      return <EditResultRenderer {...props} />
    case 'read_file':
      return <ReadResultRenderer {...props} />
    case 'bash':
      return <BashResultRenderer {...props} />
    case 'browser_screenshot':
      return <ScreenshotResultRenderer result={result} isError={isError} />
    default:
      return <DefaultResultRenderer toolName={toolName} {...props} />
  }
}
```

- [ ] **Step 2: Port uclaw's index.test.tsx with gbrain assertion(s) removed**

Read uclaw's `index.test.tsx` → target. Retarget imports. **CHANGE:** Remove any `it(...)` block that asserts gbrain dispatch (the test will likely have a case for `mcp__gbrain__` routing). Document with a comment.

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test "tool-renderers/index" 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/tool-renderers/index*
git commit -m "feat(desktop): port tool-renderers dispatcher (gbrain branch removed)"
```

---

## Task 9: Port ToolActivityItem (the wrapper, exports both ToolActivityItem + ToolActivityList)

**Files:**
- Create: `desktop/src/features/chat-agent/components/tool-activity-item.tsx` (693 LOC)
- Create: `desktop/src/features/chat-agent/components/tool-activity-item.test.tsx`

This is one of the bigger files in the plan. Apply retargets carefully.

- [ ] **Step 1: Read the source and confirm exports**

```bash
grep -E "^export " /Users/ryanliu/Documents/uclaw/ui/src/components/agent/ToolActivityItem.tsx | head -10
```

Confirm both `ToolActivityItem` and `ToolActivityList` are exported (per recon expectations).

- [ ] **Step 2: Port the source verbatim with all retargets**

Apply the methodology's retargets. Key imports that will need retargeting:
- `./tool-renderers` → `./tool-renderers` (sibling — already correct)
- `./tool-renderers/{specific renderers}` if imported directly
- `./tool-utils` → `@/features/chat-agent/lib/tool-utils`
- `./tool-phrase` → `@/features/chat-agent/lib/tool-phrase`
- `@/atoms/agent-atoms` → `@/features/chat-agent/atoms/agent-atoms`

- [ ] **Step 3: Port uclaw's ToolActivityItem.test.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/ToolActivityItem.test.tsx` → `desktop/src/features/chat-agent/components/tool-activity-item.test.tsx`. Retarget imports. Verbatim assertions.

- [ ] **Step 4: Run + commit**

```bash
pnpm --dir desktop test tool-activity-item 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/tool-activity-item*
git commit -m "feat(desktop): port ToolActivityItem (693 LOC, exports ToolActivityList too)"
```

---

## Task 10: Port native-block-renderer (97 LOC)

**Files:**
- Create: `desktop/src/features/chat-agent/components/native-block-renderer.tsx`
- Create: `desktop/src/features/chat-agent/components/native-block-renderer.test.tsx`

- [ ] **Step 1: Port native-block-renderer.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/NativeBlockRenderer.tsx` → target (kebab-cased filename). Apply retargets.

- [ ] **Step 2: Port uclaw's NativeBlockRenderer.test.tsx**

Read uclaw's test → target. Retarget imports.

- [ ] **Step 3: Run + commit**

```bash
pnpm --dir desktop test native-block-renderer 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/native-block-renderer*
git commit -m "feat(desktop): port NativeBlockRenderer (Anthropic block dispatcher)"
```

---

## Task 11: Port content-block (609 LOC, exports ThinkingBlock + helpers)

**Files:**
- Create: `desktop/src/features/chat-agent/components/content-block.tsx`
- Create: `desktop/src/features/chat-agent/components/content-block.test.tsx`

- [ ] **Step 1: Read source + confirm exports**

```bash
grep -E "^export " /Users/ryanliu/Documents/uclaw/ui/src/components/agent/ContentBlock.tsx | head -10
```

Confirm `ThinkingBlock` is exported (Task 1 recon should have noted this). Other exports likely include helper components for various content block types.

- [ ] **Step 2: Port the source**

Read uclaw's `ContentBlock.tsx` → target (kebab-cased filename). Apply retargets.

- [ ] **Step 3: Write smoke test**

```tsx
// desktop/src/features/chat-agent/components/content-block.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ThinkingBlock } from './content-block'

describe('content-block', () => {
  it('ThinkingBlock renders thinking text from block', () => {
    const block = { type: 'thinking' as const, thinking: 'reasoning trace' }
    render(<ThinkingBlock block={block} />)
    expect(screen.getByText(/reasoning trace/)).toBeInTheDocument()
  })

  it('ThinkingBlock renders empty thinking gracefully', () => {
    const block = { type: 'thinking' as const, thinking: '' }
    const { container } = render(<ThinkingBlock block={block} />)
    expect(container.firstChild).not.toBeNull()
  })
})
```

Adapt the `block` shape to whatever `SDKThinkingBlock` actually is (per agent-types.ts).

- [ ] **Step 4: Run + commit**

```bash
pnpm --dir desktop test content-block 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/content-block*
git commit -m "feat(desktop): port ContentBlock (609 LOC, ThinkingBlock + content helpers)"
```

---

## Task 12: Port SDKMessageRenderer (1,150 LOC — biggest in this plan)

**Files:**
- Create: `desktop/src/features/chat-agent/components/sdk-message-renderer.tsx`
- Create: `desktop/src/features/chat-agent/components/sdk-message-renderer.test.tsx`

- [ ] **Step 1: Confirm exports**

```bash
grep -E "^export " /Users/ryanliu/Documents/uclaw/ui/src/components/agent/SDKMessageRenderer.tsx | head -10
```

Confirm `CompactingIndicator` + `CompactBoundaryDivider` are exported (those are the 2 we need to swap in for the stubs).

- [ ] **Step 2: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/agent/SDKMessageRenderer.tsx` → target. Apply retargets.

This is the LARGEST file in this plan (1,150 LOC). Pay extra attention to:
- Many imports — retarget each per methodology
- The `CompactingIndicator` and `CompactBoundaryDivider` exports must remain at the top level (so swap-in is import-name-compatible)
- May reference `useSmoothStream` — confirms our `@/shared/lib/use-smooth-stream` interface matches uclaw's

If a symbol is referenced that's not yet in our scope, STOP and report — don't silently inline.

- [ ] **Step 3: Port uclaw's SDKMessageRenderer.test.tsx**

Read uclaw's test → target. Retarget imports.

- [ ] **Step 4: Run + commit**

```bash
pnpm --dir desktop test sdk-message-renderer 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
git add desktop/src/features/chat-agent/components/sdk-message-renderer*
git commit -m "feat(desktop): port SDKMessageRenderer (1,150 LOC) — compaction UI + raw SDK rendering"
```

---

## Task 13: Swap AgentMessages imports + delete 3 stub files

**Files:**
- Modify: `desktop/src/features/chat-agent/components/agent-messages.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/tool-activity-list.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/tool-activity-list.test.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/content-block.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/content-block.test.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.tsx`
- Delete: `desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.test.tsx`

- [ ] **Step 1: Identify the exact lines in agent-messages.tsx to swap**

```bash
grep -n "from .*stubs/(tool-activity-list\|content-block\|sdk-message-renderer)" /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers/desktop/src/features/chat-agent/components/agent-messages.tsx
```

- [ ] **Step 2: Replace stub imports with real imports**

Edit `desktop/src/features/chat-agent/components/agent-messages.tsx`. Specifically:

```diff
- import { ToolActivityList, ChatToolActivityIndicator } from '@/features/chat-agent/components/stubs/tool-activity-list'
+ import { ToolActivityList } from '@/features/chat-agent/components/tool-activity-item'
+ // ChatToolActivityIndicator still stubbed (deleted in Plan 2b.2.c.2 when chat-side chips land)
+ import { ChatToolActivityIndicator } from '@/features/chat-agent/components/stubs/tool-activity-list'

- import { ThinkingBlock, NativeBlockRenderer } from '@/features/chat-agent/components/stubs/content-block'
+ import { ThinkingBlock } from '@/features/chat-agent/components/content-block'
+ import { NativeBlockRenderer } from '@/features/chat-agent/components/native-block-renderer'

- import { CompactingIndicator, CompactBoundaryDivider } from '@/features/chat-agent/components/stubs/sdk-message-renderer'
+ import { CompactingIndicator, CompactBoundaryDivider } from '@/features/chat-agent/components/sdk-message-renderer'
```

**Important:** `ChatToolActivityIndicator` is NOT replaced in this plan — Plan 2b.2.c.2 handles it (it's a chat-side chip, not a tool-rendering concern). The stub file for `tool-activity-list` is partially kept for that purpose. To handle this cleanly:

**Refinement:** Split the existing stub file into two:
- Keep `stubs/tool-activity-list.tsx` for `ChatToolActivityIndicator` ONLY (delete the `ToolActivityList` export from it; only `ChatToolActivityIndicator` remains)
- Delete `stubs/tool-activity-list.test.tsx` if all its tests reference the now-removed `ToolActivityList`; OR trim it down to just the `ChatToolActivityIndicator` tests

Or simpler: rename the stub file to `chat-tool-activity-indicator.tsx` to reflect its new sole responsibility:
- Move `ChatToolActivityIndicator` to `stubs/chat-tool-activity-indicator.tsx`
- Delete the old `stubs/tool-activity-list.tsx` entirely (since `ToolActivityList` now comes from the real file)
- Update import in agent-messages.tsx to point at the renamed stub

Pick whichever approach the implementer prefers; document the choice with a comment.

- [ ] **Step 3: Delete the stub files**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
# After refactoring per Step 2, delete the now-unused stub files:
git rm desktop/src/features/chat-agent/components/stubs/content-block.tsx desktop/src/features/chat-agent/components/stubs/content-block.test.tsx
git rm desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.tsx desktop/src/features/chat-agent/components/stubs/sdk-message-renderer.test.tsx
# Stubs/tool-activity-list.tsx — see Step 2 for refactoring (rename or trim)
```

- [ ] **Step 4: Run full test suite + build**

```bash
pnpm --dir desktop test 2>&1 | tail -10
pnpm --dir desktop build 2>&1 | tail -10
```

Expected: all tests pass; build clean. If a downstream component (e.g., agent-messages.test.tsx) breaks because of swapped prop signatures, fix the test ONLY — never modify the ported components.

- [ ] **Step 5: Verify stubs/ directory state**

```bash
ls desktop/src/features/chat-agent/components/stubs/
```

Expected: only `scroll-position-manager.tsx`, `skill-chips.tsx`, `learning-chips.tsx`, `sdk-message-renderer.tsx-removal-trace` (none) — and the renamed `chat-tool-activity-indicator.tsx` if Step 2's rename approach was chosen.

- [ ] **Step 6: Commit**

```bash
git add desktop/src/features/chat-agent/components/agent-messages.tsx desktop/src/features/chat-agent/components/stubs/
git commit -m "refactor(desktop): swap stub imports → real tool/content/SDK components (deletes 3 stubs)"
```

---

## Task 14: Smoke verification

**Files:** None (verification only).

- [ ] **Step 1: Backend tests still pass**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-tool-renderers
cargo test -p hermes-desktop --lib 2>&1 | tail -3
```

Expected: 21 PASS.

- [ ] **Step 2: Frontend tests all green**

```bash
pnpm --dir desktop test 2>&1 | tail -10
```

Expected: ≥322 PASS (282 carried + ≥40 new).

- [ ] **Step 3: Build clean**

```bash
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -10
```

Expected: both clean.

- [ ] **Step 4: Workspace check**

```bash
cargo check --workspace 2>&1 | tail -3
```

Expected: PASS.

- [ ] **Step 5: App.tsx untouched**

```bash
git diff main -- desktop/src/app/App.tsx
```

Expected: empty.

- [ ] **Step 6: stubs/ directory inventory**

```bash
ls desktop/src/features/chat-agent/components/stubs/
```

Expected: 3 stubs only (`scroll-position-manager.tsx`, `skill-chips.tsx`, `learning-chips.tsx`) + the chat-tool-activity-indicator artifact from Task 13's split. Plan 2b.2.c.2 + c.3 finish removing the rest.

- [ ] **Step 7: New file inventory**

```bash
echo "=== tool-renderers/ ==="
ls desktop/src/features/chat-agent/components/tool-renderers/
echo "=== top-level components added ==="
ls desktop/src/features/chat-agent/components/{tool-activity-item,native-block-renderer,content-block,sdk-message-renderer}* 2>&1
echo "=== lib/ utilities added ==="
ls desktop/src/features/chat-agent/lib/{tool-utils,tool-phrase}* 2>&1
```

Expected: all the files from the File Structure section present.

- [ ] **Step 8: Repo state**

```bash
git status --short
git log --oneline main..HEAD | wc -l
git log --oneline main..HEAD | head -20
```

Expected: clean; ~14 task commits above `1138fad` (main tip).

- [ ] **Step 9: No god-file regression**

```bash
ls desktop/src/lib/
```

Expected: only `bridge/`.

---

## Done When

- All 13 source-affecting tasks complete; Task 14 smoke verification passes.
- ≥40 new frontend tests pass on top of main's 282 → cumulative ≥322.
- Backend unchanged: 21 Rust tests PASS.
- 3 stubs deleted (`tool-activity-list.tsx`'s `ToolActivityList` export, `content-block.tsx`, `sdk-message-renderer.tsx`) + their test files.
- AgentMessages imports point to real components; `ChatToolActivityIndicator` still stubbed (handled in Plan 2b.2.c.2).
- Build clean (tsc + vite + cargo).
- App.tsx untouched.
- No god-file regression (`desktop/src/lib/` still only contains `bridge/`).
- Final code review: APPROVED or APPROVED_WITH_FOLLOWUPS.

## Next Plan

**Plan 2b.2.c.2 — Composer + chat-side atoms + real chips (~2,200 LOC).** Ports composer module (RichTextInput + MentionChipNode + composer-serialize + Mention controller/popup), real chat-side atoms (chat-atoms, tab-atoms, agent-display-name, ui-preferences), and real chips (SkillCitationChips, SkillRecallChips, MemoryRecallChip, ProactiveLearningChip, ChatToolBlock, ChatToolActivityIndicator). Deletes the remaining `skill-chips` + `learning-chips` stubs and the atom shadows in `peripheral-stubs.ts`. Closes follow-ups 2b.2.c-A + 2b.2.c-C.
