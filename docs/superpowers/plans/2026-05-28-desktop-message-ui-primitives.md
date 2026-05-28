# Desktop Message-View UI Primitives Port — Plan 2b.2.b.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port uclaw's message-view UI **foundation layer** into the Hermes desktop app — theme tokens, shadcn primitives, utilities, supporting helpers, and `ai-elements/*` components (minus `speech-button`) — so that Plan 2b.2.b.2 can drop `AgentMessages.tsx` on top with zero new infrastructure.

**Architecture:** Bottom-up port in dependency order: testing infrastructure → npm deps → theme tokens → shadcn primitives → shared utilities → CodeBlock → feature helpers → fixtures → `ai-elements/*`. Each ported file is a verbatim copy from `uclaw/ui/src/...` with import paths retargeted per Section 9 of the spec. Each port commit lands with at least one Vitest + RTL test that mounts the component against a fixture from `features/chat-agent/__fixtures__/`.

**Tech Stack additions:** `react-markdown@10.1.0`, `remark-gfm@4.0.0`, `shiki@3.22.0`, `lowlight@3.3.0`, `dompurify@3.4.1`, `@tiptap/react@3.23.2` + extensions, `motion@12.38.0`, `lucide-react@0.460.0`, `@radix-ui/react-tooltip`, `@radix-ui/react-scroll-area`, `@radix-ui/react-dialog`, `@radix-ui/react-slot` (versions pinned in Task 1). Dev: `jsdom`, `@testing-library/{react,jest-dom,user-event}`.

**Reference:** Spec — [docs/superpowers/specs/2026-05-28-desktop-message-rendering-ui-design.md](../specs/2026-05-28-desktop-message-rendering-ui-design.md). Stacked on Plan 2b.2.a (PR #4 — `feat/desktop-message-state`).

---

## Amendments (Post-Task-1 Recon, commit 5a5101c)

The recon (Task 1) surfaced seven dependencies the original task list assumed away. Adaptations:

| Original | Action | Why |
|---|---|---|
| **Task 11 (model-logo)** | Move target: `shared/lib/` → `features/chat-agent/lib/` | model-logo imports `Channel` type from feature-scoped `chat-types`; placing it under `shared/` would invert layer dependency. |
| **Task 15 (CodeBlock)** | Also port `uclaw/ui/src/lib/highlight.ts` (167 LOC Shiki wrapper) → `shared/lib/highlight.ts` as part of the same task | CodeBlock imports `highlightCode`/`escapeHtml` from this file. Self-contained Shiki wrapper. |
| **Task 17 (CopyButton)** | **REPURPOSE: extract `MessageAction` standalone** to `features/chat-agent/components/ai-elements/message-action.tsx` (21 LOC). CopyButton port deferred to a NEW Task 27b after Message. | CopyButton depends on `MessageAction` (exported from uclaw's message.tsx), Message depends on CopyButton → circular. Breaking MessageAction into its own file removes the cycle. |
| **Task 18 (ChatToolActivityIndicator)** | **DROPPED** — deferred to Plan 2b.2.c | Transitively pulls in 5 un-ported tool-rendering modules (`tool-utils`, `tool-phrase`, `tool-renderers/*`, `BashStreamView`). That entire subsystem belongs to 2b.2.c per spec §2. |
| **Task 19 (WelcomeEmptyState)** | Also port `lib/tips.ts` (71 LOC self-contained) → `features/chat-agent/lib/tips.ts` AND `atoms/user-profile.ts` (16 LOC) → `features/chat-agent/atoms/user-profile.ts` as part of the same task | Both small, self-contained, feature-scoped. Cheaper to port than stub. |
| **Task 25 (RichTextInput)** | **DROPPED** — deferred to Plan 2b.2.c | Pulls in `@/components/composer/MentionChipNode` + `composer-serialize`. RichTextInput is the user composer, not a message-view component — its rightful home is the App.tsx wiring plan. |
| **Task 27 (Message)** | Inline-stub `@/components/preview/chips/*` imports with no-op equivalents (markdown-only render; file paths render as plain text). Inline comment marks them as Plan 3.5 follow-up. Import `MessageAction` from the standalone file (Task 17). | Preview-chip rendering is a Plan 3.5 (App Shell + file preview) feature. Stubbing preserves message-view rendering for everything except file-path chips. |
| **NEW Task 27b "Port CopyButton"** | New task slotted after Task 27. Test asserts `content` prop (not `value`). | Now resolvable: depends on MessageAction (Task 17). |
| **Task 30 smoke** | Updated test-count floor from ≥31 to ≥27 (dropped 2 components × ~2 tests + adjustments). | Reflects the 2 dropped components. |

**Net effect:** 28 source-affecting tasks (was 29). Tasks 18 and 25 are SKIPPED markers; Task 27b is a new insertion. Smoke verification stays at Task 30.

**Plan 2b.2.c gets:** ChatToolActivityIndicator, ChatToolBlock + 5 tool-rendering modules, RichTextInput + composer module. Spec §14 already lists "tool-renderers/*" and "App.tsx integration" for 2b.2.c, so this slots in cleanly.

---

## File Structure

```
desktop/
  package.json                                # MODIFY (Task 2 + 3): dev deps + runtime deps
  vitest.config.ts                            # MODIFY (Task 2): environment "jsdom", include .tsx, setup file
  vitest.setup.ts                             # NEW (Task 2): jest-dom matchers
  tailwind.config.js                          # MODIFY (Task 4): full color token map
  src/
    styles/
      index.css                               # MODIFY (Task 4): expanded :root + [data-theme="dark"] blocks
    features/
      chat-agent/
        atoms/
          theme-atoms.ts                      # NEW (Task 4): themeAtom + html-attribute side effect
          theme-atoms.test.ts                 # NEW (Task 4)
        __fixtures__/
          message-fixtures.ts                 # NEW (Task 20)
          streaming-fixture.ts                # NEW (Task 20)
          tool-activity-fixture.ts            # NEW (Task 20)
        components/
          ai-elements/
            provider-avatar.tsx               # NEW (Task 21)
            provider-avatar.test.tsx          # NEW (Task 21)
            context-divider.tsx               # NEW (Task 22)
            context-divider.test.tsx          # NEW (Task 22)
            sticky-user-message.tsx           # NEW (Task 23)
            sticky-user-message.test.tsx      # NEW (Task 23)
            scroll-minimap.tsx                # NEW (Task 24)
            scroll-minimap.test.tsx           # NEW (Task 24)
            rich-text-input.tsx               # NEW (Task 25)
            rich-text-input.test.tsx          # NEW (Task 25)
            reasoning.tsx                     # NEW (Task 26)
            reasoning.test.tsx                # NEW (Task 26)
            message.tsx                       # NEW (Task 27)
            message.test.tsx                  # NEW (Task 27 — port uclaw test)
            message.fixtures.test.tsx         # NEW (Task 27 — port uclaw test)
            conversation.tsx                  # NEW (Task 28)
            conversation.test.tsx             # NEW (Task 28)
          user-avatar.tsx                     # NEW (Task 16)
          user-avatar.test.tsx                # NEW (Task 16)
          copy-button.tsx                     # NEW (Task 17)
          copy-button.test.tsx                # NEW (Task 17)
          chat-tool-activity-indicator.tsx    # NEW (Task 18)
          chat-tool-activity-indicator.test.tsx # NEW (Task 18)
          welcome-empty-state.tsx             # NEW (Task 19)
          welcome-empty-state.test.tsx        # NEW (Task 19)
    shared/
      ui/
        button.tsx                            # MODIFY (Task 5): port uclaw signature (variants + asChild)
        button.test.tsx                       # NEW (Task 5)
        input.tsx                             # NEW (Task 6)
        input.test.tsx                        # NEW (Task 6)
        tooltip.tsx                           # NEW (Task 7)
        tooltip.test.tsx                      # NEW (Task 7)
        spinner.tsx                           # NEW (Task 8)
        spinner.test.tsx                      # NEW (Task 8)
        image-lightbox.tsx                    # NEW (Task 9)
        image-lightbox.test.tsx               # NEW (Task 9)
        scroll-area.tsx                       # NEW (Task 10)
        scroll-area.test.tsx                  # NEW (Task 10)
      lib/
        model-logo.ts                         # NEW (Task 11)
        model-logo.test.ts                    # NEW (Task 11)
        skill-citation.ts                     # NEW (Task 12 — port + test)
        skill-citation.test.ts                # NEW (Task 12)
        normalize-agent-markdown.ts           # NEW (Task 13 — port + test)
        normalize-agent-markdown.test.ts      # NEW (Task 13)
        use-smooth-stream.ts                  # NEW (Task 14)
        use-smooth-stream.test.tsx            # NEW (Task 14)
      components/
        code-block.tsx                        # NEW (Task 15)
        code-block.test.tsx                   # NEW (Task 15)
```

**Anti-god-file invariants:**
- One primitive per file under `shared/ui/`. No barrel exports.
- Feature components stay under `features/chat-agent/components/`. Only `code-block.tsx` lives in `shared/components/` because future plans (plan preview, file preview) reuse it.
- Fixtures live in `features/chat-agent/__fixtures__/`.

---

## Port Methodology (applies to every port task)

1. Read uclaw source file verbatim.
2. Apply these import retargets (in order):
   - `from '@/components/ui/<x>'` → `from '@/shared/ui/<x>'`
   - `from '@/lib/utils'` → `from '@/shared/lib/cn'`
   - `from '@/lib/agent-types'` → `from '@/features/chat-agent/lib/agent-types'`
   - `from '@/lib/chat-types'` → `from '@/features/chat-agent/lib/chat-types'`
   - `from '@/lib/model-logo'` → `from '@/shared/lib/model-logo'`
   - `from '@/lib/normalize-agent-markdown'` → `from '@/shared/lib/normalize-agent-markdown'`
   - `from '@/lib/skill-citation'` → `from '@/shared/lib/skill-citation'`
   - `from '@/hooks/useSmoothStream'` → `from '@/shared/lib/use-smooth-stream'`
   - `from '@/components/shared/code-block/CodeBlock'` → `from '@/shared/components/code-block'`
   - `from '@/components/chat/<x>'` → `from '@/features/chat-agent/components/<kebab-x>'` (note: rename PascalCase to kebab-case)
   - `from '@/components/welcome/<x>'` → `from '@/features/chat-agent/components/<kebab-x>'`
   - `from '@/components/ai-elements/<x>'` → `from '@/features/chat-agent/components/ai-elements/<x>'`
3. Fix any `noUnusedParameters: true` violations by prefixing unused args with `_`. Add a one-line comment explaining the rename if uclaw doesn't have it.
4. If the file uses a uclaw type/helper not yet ported, the task lists it as a dependency that must be completed first.

---

## Task 1: Recon — lock dep versions + confirm import surface

**Files:**
- Create: `docs/superpowers/plans/2026-05-28-desktop-message-ui-primitives-recon.md`

**Inputs:** `uclaw/ui/pnpm-lock.yaml`, `uclaw/ui/package.json`, every file we plan to port.

- [ ] **Step 1: Read uclaw's resolved Radix versions from lockfile**

```bash
grep -E "@radix-ui/react-(tooltip|scroll-area|dialog|slot)" /Users/ryanliu/Documents/uclaw/ui/pnpm-lock.yaml | grep "resolution" -A 1 | head -40
# Or simpler:
grep -E "'@radix-ui/react-(tooltip|scroll-area|dialog|slot)'" /Users/ryanliu/Documents/uclaw/ui/package.json
```

Expected: prints version strings like `"^1.1.4"`. Record them.

- [ ] **Step 2: Confirm exact uclaw imports for each file we port**

```bash
UCLAW=/Users/ryanliu/Documents/uclaw/ui/src
for f in \
  $UCLAW/components/ai-elements/provider-avatar.tsx \
  $UCLAW/components/ai-elements/context-divider.tsx \
  $UCLAW/components/ai-elements/sticky-user-message.tsx \
  $UCLAW/components/ai-elements/scroll-minimap.tsx \
  $UCLAW/components/ai-elements/rich-text-input.tsx \
  $UCLAW/components/ai-elements/reasoning.tsx \
  $UCLAW/components/ai-elements/message.tsx \
  $UCLAW/components/ai-elements/conversation.tsx \
  $UCLAW/components/chat/UserAvatar.tsx \
  $UCLAW/components/chat/CopyButton.tsx \
  $UCLAW/components/chat/ChatToolActivityIndicator.tsx \
  $UCLAW/components/welcome/WelcomeEmptyState.tsx \
  $UCLAW/components/shared/code-block/CodeBlock.tsx \
  $UCLAW/hooks/useSmoothStream.ts \
  $UCLAW/lib/model-logo.ts \
  $UCLAW/lib/skill-citation.ts \
  $UCLAW/lib/normalize-agent-markdown.ts ; do
  echo "### $f"
  grep -E "^import " "$f"
done
```

Save the output. Anything matching `@/components/ui/<primitive>` is a primitive we MUST port in Tasks 5–10. Anything else is documented as a follow-up — DO NOT silently include extra primitives outside the spec.

- [ ] **Step 3: Audit existing `desktop/src/shared/ui/button.tsx` against uclaw's button.tsx**

```bash
diff /Users/ryanliu/Documents/uclaw/ui/src/components/ui/button.tsx \
     /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-message-ui-primitives/desktop/src/shared/ui/button.tsx
```

Expected differences: uclaw has `destructive`/`secondary`/`link` variants, `lg`/`icon-sm` sizes, `asChild` prop via `@radix-ui/react-slot`. Task 5 brings ours to parity.

- [ ] **Step 4: Write recon doc**

Create `docs/superpowers/plans/2026-05-28-desktop-message-ui-primitives-recon.md` with three sections:

```markdown
# Plan 2b.2.b.1 Recon

## Radix peer versions (from uclaw/ui/pnpm-lock.yaml)
- @radix-ui/react-tooltip: <version>
- @radix-ui/react-scroll-area: <version>
- @radix-ui/react-dialog: <version>
- @radix-ui/react-slot: <version>

## Per-file import surface

### components/ai-elements/provider-avatar.tsx
<full import list>

### components/ai-elements/context-divider.tsx
<full import list>

... (one section per file from Step 2)

## Button audit
- Existing desktop button.tsx variants: default, outline, ghost
- Existing sizes: default, sm, icon
- Uclaw adds: destructive, secondary, link / lg, icon-sm / asChild prop
- Plan: Task 5 replaces with uclaw signature verbatim.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-message-ui-primitives
git add docs/superpowers/plans/2026-05-28-desktop-message-ui-primitives-recon.md
git commit -m "docs(plan): recon dep versions + import surface for 2b.2.b.1"
```

---

## Task 2: Vitest + RTL + jsdom infrastructure

**Files:**
- Modify: `desktop/package.json` (devDeps)
- Modify: `desktop/vitest.config.ts`
- Create: `desktop/vitest.setup.ts`
- Create: `desktop/src/shared/lib/__tests__/smoke.test.tsx`

- [ ] **Step 1: Install test dev deps**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-message-ui-primitives/desktop
pnpm add -D jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```

Expected: package.json updated; pnpm-lock.yaml updated.

- [ ] **Step 2: Write vitest.setup.ts**

```ts
// desktop/vitest.setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 3: Update vitest.config.ts**

Replace the whole file with:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 4: Write the smoke test**

```tsx
// desktop/src/shared/lib/__tests__/smoke.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('vitest + RTL + jsdom', () => {
  it('renders a DOM element and asserts via jest-dom matchers', () => {
    render(<div role="status">ready</div>)
    expect(screen.getByRole('status')).toHaveTextContent('ready')
  })
})
```

- [ ] **Step 5: Run tests**

```bash
pnpm --dir desktop test 2>&1 | tail -10
```

Expected: 18 tests pass (existing 17 + 1 new smoke).

- [ ] **Step 6: Commit**

```bash
git add desktop/package.json desktop/pnpm-lock.yaml desktop/vitest.config.ts desktop/vitest.setup.ts desktop/src/shared/lib/__tests__/smoke.test.tsx
git commit -m "test(desktop): install RTL + jsdom + jest-dom; switch vitest env to jsdom"
```

---

## Task 3: Install runtime npm deps

**Files:**
- Modify: `desktop/package.json`

- [ ] **Step 1: Install runtime deps (versions per Task 1 recon for Radix; rest fixed)**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-message-ui-primitives/desktop
pnpm add \
  react-markdown@10.1.0 \
  remark-gfm@4.0.0 \
  shiki@3.22.0 \
  lowlight@3.3.0 \
  dompurify@3.4.1 \
  @tiptap/react@3.23.2 \
  @tiptap/starter-kit@3.23.2 \
  @tiptap/extension-placeholder@3.23.2 \
  motion@12.38.0 \
  lucide-react@0.460.0
# Radix peers — paste exact versions from the recon doc (Step 1 of Task 1):
pnpm add \
  @radix-ui/react-tooltip@<from recon> \
  @radix-ui/react-scroll-area@<from recon> \
  @radix-ui/react-dialog@<from recon> \
  @radix-ui/react-slot@<from recon>
# DOMPurify types
pnpm add -D @types/dompurify
```

Expected: all installs succeed.

- [ ] **Step 2: Verify build still passes**

```bash
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: clean (no warnings, no errors).

- [ ] **Step 3: Verify tests still pass**

```bash
pnpm --dir desktop test 2>&1 | tail -5
```

Expected: 18 tests pass.

- [ ] **Step 4: Commit**

```bash
git add desktop/package.json desktop/pnpm-lock.yaml
git commit -m "feat(desktop): install message-view runtime deps (markdown, shiki, tiptap, radix, lucide, motion)"
```

---

## Task 4: Theme tokens + Tailwind config + themeAtom

**Files:**
- Modify: `desktop/src/styles/index.css`
- Modify: `desktop/tailwind.config.js`
- Create: `desktop/src/features/chat-agent/atoms/theme-atoms.ts`
- Create: `desktop/src/features/chat-agent/atoms/theme-atoms.test.ts`

- [ ] **Step 1: Write the failing themeAtom test**

```ts
// desktop/src/features/chat-agent/atoms/theme-atoms.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'
import { themeAtom, applyThemeToDocumentEffect } from './theme-atoms'

describe('themeAtom', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to light', () => {
    const store = createStore()
    expect(store.get(themeAtom)).toBe('light')
  })

  it('updates and exposes the new value', () => {
    const store = createStore()
    store.set(themeAtom, 'dark')
    expect(store.get(themeAtom)).toBe('dark')
  })

  it('applyThemeToDocumentEffect mirrors the atom to <html data-theme>', () => {
    const store = createStore()
    const unsubscribe = applyThemeToDocumentEffect(store)
    try {
      store.set(themeAtom, 'dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
      store.set(themeAtom, 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    } finally {
      unsubscribe()
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --dir desktop test theme-atoms 2>&1 | tail -10
```

Expected: FAIL with "Cannot find module './theme-atoms'".

- [ ] **Step 3: Write theme-atoms.ts**

```ts
// desktop/src/features/chat-agent/atoms/theme-atoms.ts
import { atom } from 'jotai'
import type { createStore } from 'jotai/vanilla'

export type ThemeName = 'light' | 'dark'

export const themeAtom = atom<ThemeName>('light')

/**
 * Side-effect: mirror themeAtom changes onto <html data-theme="...">.
 * Returns an unsubscribe function. The Plan-3 theme switcher subscribes
 * once at app startup; this plan only ships the wiring.
 */
export function applyThemeToDocumentEffect(
  store: ReturnType<typeof createStore>,
): () => void {
  const apply = (value: ThemeName) => {
    document.documentElement.setAttribute('data-theme', value)
  }
  apply(store.get(themeAtom))
  return store.sub(themeAtom, () => {
    apply(store.get(themeAtom))
  })
}
```

- [ ] **Step 4: Replace `desktop/src/styles/index.css`** with the ported uclaw tokens:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --radius: 0.5rem;
    --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
    --font-mono: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --tooltip: 0 0% 15%;
    --tooltip-foreground: 0 0% 98%;
    --tooltip-muted: 0 0% 75%;
    --code-bg: 210 13% 12%;
    --success: 142 65% 35%;
    --success-bg: 142 70% 94%;
    --warning: 35 85% 38%;
    --warning-bg: 40 95% 92%;
    --danger: 0 70% 45%;
    --danger-bg: 0 80% 96%;
  }

  [data-theme="dark"] {
    --background: 0 0% 7%;
    --foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --accent: 0 0% 40%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 98%;
    --tooltip: 0 0% 90%;
    --tooltip-foreground: 0 0% 9%;
    --tooltip-muted: 0 0% 40%;
    --success: 142 70% 50%;
    --success-bg: 142 60% 15%;
    --warning: 35 90% 60%;
    --warning-bg: 40 60% 15%;
    --danger: 0 75% 60%;
    --danger-bg: 0 60% 15%;
  }

  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Replace `desktop/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        tooltip: {
          DEFAULT: 'hsl(var(--tooltip) / <alpha-value>)',
          foreground: 'hsl(var(--tooltip-foreground) / <alpha-value>)',
          muted: 'hsl(var(--tooltip-muted) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          bg: 'hsl(var(--success-bg))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          bg: 'hsl(var(--warning-bg))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          bg: 'hsl(var(--danger-bg))',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
pnpm --dir desktop test theme-atoms 2>&1 | tail -10
```

Expected: 3 PASS.

- [ ] **Step 7: Verify production build still works**

```bash
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add desktop/src/styles/index.css desktop/tailwind.config.js desktop/src/features/chat-agent/atoms/theme-atoms.ts desktop/src/features/chat-agent/atoms/theme-atoms.test.ts
git commit -m "feat(desktop): port uclaw theme tokens + tailwind color map + themeAtom (light/dark)"
```

---

## Task 5: Port shadcn primitive — Button (upgrade existing)

**Dependencies:** Task 2 (RTL), Task 3 (`@radix-ui/react-slot` installed), Task 4 (Tailwind colors for `destructive`/`secondary`).

**Files:**
- Modify: `desktop/src/shared/ui/button.tsx` (replace)
- Create: `desktop/src/shared/ui/button.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/shared/ui/button.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders a button element by default', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument()
  })

  it('supports asChild to render a Slot', () => {
    render(<Button asChild><a href="/x">Link</a></Button>)
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link).toHaveAttribute('href', '/x')
  })

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm --dir desktop test src/shared/ui/button.test 2>&1 | tail -10
```

Expected: FAIL — current button lacks `asChild` and `destructive`.

- [ ] **Step 3: Replace `desktop/src/shared/ui/button.tsx`**

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test src/shared/ui/button.test 2>&1 | tail -10
```

Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/ui/button.tsx desktop/src/shared/ui/button.test.tsx
git commit -m "feat(desktop): upgrade Button primitive to uclaw signature (destructive/secondary/link + asChild)"
```

---

## Task 6: Port shadcn primitive — Input

**Files:**
- Create: `desktop/src/shared/ui/input.tsx`
- Create: `desktop/src/shared/ui/input.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/shared/ui/input.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from './input'

describe('Input', () => {
  it('renders an input element with placeholder', () => {
    render(<Input placeholder="type here" />)
    expect(screen.getByPlaceholderText('type here')).toBeInTheDocument()
  })

  it('forwards refs', () => {
    const ref = { current: null as HTMLInputElement | null }
    render(<Input ref={(el) => { ref.current = el }} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test src/shared/ui/input.test 2>&1 | tail -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Port uclaw's input.tsx verbatim with import retarget**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ui/input.tsx` and copy to `desktop/src/shared/ui/input.tsx`, applying only the cn import retarget:

- `from '@/lib/utils'` → `from '../lib/cn'`

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test src/shared/ui/input.test 2>&1 | tail -5
```

Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/ui/input.tsx desktop/src/shared/ui/input.test.tsx
git commit -m "feat(desktop): port shadcn Input primitive"
```

---

## Task 7: Port shadcn primitive — Tooltip

**Files:**
- Create: `desktop/src/shared/ui/tooltip.tsx`
- Create: `desktop/src/shared/ui/tooltip.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/shared/ui/tooltip.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip'

describe('Tooltip', () => {
  it('renders trigger and shows content on focus', async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>hover me</TooltipTrigger>
          <TooltipContent>tip content</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )
    expect(screen.getByText('hover me')).toBeInTheDocument()
    fireEvent.focus(screen.getByText('hover me'))
    // Tooltip portals into body; await its tooltip role appearance
    expect(await screen.findByRole('tooltip')).toHaveTextContent('tip content')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test src/shared/ui/tooltip.test 2>&1 | tail -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Port uclaw's tooltip.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ui/tooltip.tsx` verbatim → `desktop/src/shared/ui/tooltip.tsx`. Retarget `from '@/lib/utils'` → `from '../lib/cn'`.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test src/shared/ui/tooltip.test 2>&1 | tail -5
```

Expected: 1 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/ui/tooltip.tsx desktop/src/shared/ui/tooltip.test.tsx
git commit -m "feat(desktop): port shadcn Tooltip primitive"
```

---

## Task 8: Port shadcn primitive — Spinner

**Files:**
- Create: `desktop/src/shared/ui/spinner.tsx`
- Create: `desktop/src/shared/ui/spinner.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/shared/ui/spinner.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spinner } from './spinner'

describe('Spinner', () => {
  it('renders with an accessible label', () => {
    render(<Spinner aria-label="loading" />)
    expect(screen.getByLabelText('loading')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test src/shared/ui/spinner.test 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port uclaw's spinner.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ui/spinner.tsx` verbatim → `desktop/src/shared/ui/spinner.tsx`. Retarget cn import.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test src/shared/ui/spinner.test 2>&1 | tail -5
```

Expected: 1 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/ui/spinner.tsx desktop/src/shared/ui/spinner.test.tsx
git commit -m "feat(desktop): port shadcn Spinner primitive"
```

---

## Task 9: Port shadcn primitive — ImageLightbox

**Files:**
- Create: `desktop/src/shared/ui/image-lightbox.tsx`
- Create: `desktop/src/shared/ui/image-lightbox.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/shared/ui/image-lightbox.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ImageLightbox } from './image-lightbox'

describe('ImageLightbox', () => {
  it('renders the thumbnail img element', () => {
    render(<ImageLightbox src="/x.png" alt="example" />)
    expect(screen.getByAltText('example')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test src/shared/ui/image-lightbox.test 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port uclaw's image-lightbox.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ui/image-lightbox.tsx` verbatim → `desktop/src/shared/ui/image-lightbox.tsx`. Retarget cn import. If it imports other shadcn primitives from `@/components/ui/*`, retarget those to `@/shared/ui/*`.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test src/shared/ui/image-lightbox.test 2>&1 | tail -5
```

Expected: 1 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/ui/image-lightbox.tsx desktop/src/shared/ui/image-lightbox.test.tsx
git commit -m "feat(desktop): port shadcn ImageLightbox primitive"
```

---

## Task 10: Port shadcn primitive — ScrollArea

**Files:**
- Create: `desktop/src/shared/ui/scroll-area.tsx`
- Create: `desktop/src/shared/ui/scroll-area.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/shared/ui/scroll-area.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScrollArea } from './scroll-area'

describe('ScrollArea', () => {
  it('renders children inside the viewport', () => {
    render(
      <ScrollArea>
        <div data-testid="child">contents</div>
      </ScrollArea>,
    )
    expect(screen.getByTestId('child')).toHaveTextContent('contents')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test src/shared/ui/scroll-area.test 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port uclaw's scroll-area.tsx**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ui/scroll-area.tsx` verbatim → `desktop/src/shared/ui/scroll-area.tsx`. Retarget cn import.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test src/shared/ui/scroll-area.test 2>&1 | tail -5
```

Expected: 1 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/ui/scroll-area.tsx desktop/src/shared/ui/scroll-area.test.tsx
git commit -m "feat(desktop): port shadcn ScrollArea primitive"
```

---

## Task 11: Port utility — model-logo

**Files:**
- Create: `desktop/src/shared/lib/model-logo.ts`
- Create: `desktop/src/shared/lib/model-logo.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// desktop/src/shared/lib/model-logo.test.ts
import { describe, it, expect } from 'vitest'
import { providerForModelId, logoForProvider } from './model-logo'

describe('model-logo', () => {
  it('extracts known providers from model ids', () => {
    expect(providerForModelId('claude-sonnet-4-6')).toBe('anthropic')
    expect(providerForModelId('gpt-4o')).toBe('openai')
  })

  it('returns a logo descriptor for the provider', () => {
    expect(logoForProvider('anthropic')).toBeDefined()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test src/shared/lib/model-logo 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port `lib/model-logo.ts` verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/lib/model-logo.ts` → `desktop/src/shared/lib/model-logo.ts`. No relative-path retargets needed (file is self-contained). Confirm by running:

```bash
grep "^import " /Users/ryanliu/Documents/uclaw/ui/src/lib/model-logo.ts
```

If imports exist beyond `lucide-react`, add the corresponding retargets.

- [ ] **Step 4: Check the test passes**

```bash
pnpm --dir desktop test src/shared/lib/model-logo 2>&1 | tail -5
```

If the test fails because the function names differ (e.g., uclaw exports `getProviderFromModel` not `providerForModelId`), update the test to use the actual exported names — DO NOT rename uclaw's exports. Re-run.

Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/lib/model-logo.ts desktop/src/shared/lib/model-logo.test.ts
git commit -m "feat(desktop): port model-logo provider/logo lookup"
```

---

## Task 12: Port utility — skill-citation (with uclaw's tests)

**Files:**
- Create: `desktop/src/shared/lib/skill-citation.ts`
- Create: `desktop/src/shared/lib/skill-citation.test.ts`

- [ ] **Step 1: Port `lib/skill-citation.ts` verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/lib/skill-citation.ts` → `desktop/src/shared/lib/skill-citation.ts`. Retarget any `@/lib/...` imports per the methodology.

- [ ] **Step 2: Port `lib/skill-citation.test.ts` verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/lib/skill-citation.test.ts` → `desktop/src/shared/lib/skill-citation.test.ts`. Retarget the import of the source file to `./skill-citation`.

- [ ] **Step 3: Run the tests**

```bash
pnpm --dir desktop test src/shared/lib/skill-citation 2>&1 | tail -10
```

Expected: all uclaw tests PASS.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/shared/lib/skill-citation.ts desktop/src/shared/lib/skill-citation.test.ts
git commit -m "feat(desktop): port skill-citation parser (+ uclaw tests)"
```

---

## Task 13: Port utility — normalize-agent-markdown (with uclaw's tests)

**Files:**
- Create: `desktop/src/shared/lib/normalize-agent-markdown.ts`
- Create: `desktop/src/shared/lib/normalize-agent-markdown.test.ts`

- [ ] **Step 1: Port the source verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/lib/normalize-agent-markdown.ts` → `desktop/src/shared/lib/normalize-agent-markdown.ts`. Retargets as above (DOMPurify, lowlight imports stay as-is — both are npm packages).

- [ ] **Step 2: Port uclaw's existing test file**

Read `/Users/ryanliu/Documents/uclaw/ui/src/lib/normalize-agent-markdown.test.ts` → `desktop/src/shared/lib/normalize-agent-markdown.test.ts`. Retarget the import.

- [ ] **Step 3: Run the tests**

```bash
pnpm --dir desktop test src/shared/lib/normalize-agent-markdown 2>&1 | tail -10
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add desktop/src/shared/lib/normalize-agent-markdown.ts desktop/src/shared/lib/normalize-agent-markdown.test.ts
git commit -m "feat(desktop): port normalize-agent-markdown sanitizer (+ uclaw tests)"
```

---

## Task 14: Port hook — useSmoothStream

**Files:**
- Create: `desktop/src/shared/lib/use-smooth-stream.ts`
- Create: `desktop/src/shared/lib/use-smooth-stream.test.tsx`

- [ ] **Step 1: Write the failing test (RTL + fake timers)**

```tsx
// desktop/src/shared/lib/use-smooth-stream.test.tsx
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSmoothStream } from './use-smooth-stream'

function Harness({ value }: { value: string }) {
  const display = useSmoothStream(value)
  return <div data-testid="out">{display}</div>
}

describe('useSmoothStream', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('eventually displays the full incoming string', () => {
    const { rerender } = render(<Harness value="hello" />)
    act(() => { vi.runAllTimers() })
    expect(screen.getByTestId('out')).toHaveTextContent('hello')

    rerender(<Harness value="hello world" />)
    act(() => { vi.runAllTimers() })
    expect(screen.getByTestId('out')).toHaveTextContent('hello world')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test use-smooth-stream 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the hook verbatim**

Read `/Users/ryanliu/Documents/uclaw/ui/src/hooks/useSmoothStream.ts` → `desktop/src/shared/lib/use-smooth-stream.ts`. NOTE: the uclaw filename is camelCase; we rename to kebab-case but keep the exported symbol identical (`useSmoothStream`). Add a doc-comment at the top noting the rename.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test use-smooth-stream 2>&1 | tail -5
```

Expected: PASS. If the hook's internals depend on timer cadence beyond simple `setTimeout`/`requestAnimationFrame`, update the test to drive the right timer (e.g., switch to `vi.advanceTimersByTime` with the actual cadence) rather than changing the hook.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/lib/use-smooth-stream.ts desktop/src/shared/lib/use-smooth-stream.test.tsx
git commit -m "feat(desktop): port useSmoothStream hook (filename normalized to kebab-case)"
```

---

## Task 15: Port shared/components — CodeBlock

**Dependencies:** Tasks 5–10 (primitives), 11–14 (utilities).

**Files:**
- Create: `desktop/src/shared/components/code-block.tsx`
- Create: `desktop/src/shared/components/code-block.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/shared/components/code-block.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CodeBlock } from './code-block'

describe('CodeBlock', () => {
  it('renders the source text in a code element', () => {
    render(<CodeBlock language="typescript">{`const x = 1`}</CodeBlock>)
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument()
  })

  it('exposes a copy affordance', () => {
    render(<CodeBlock language="ts">{`hello`}</CodeBlock>)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test code-block 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port `components/shared/code-block/CodeBlock.tsx`**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/shared/code-block/CodeBlock.tsx` → `desktop/src/shared/components/code-block.tsx`. Apply retargets per methodology. If the file imports a sibling helper (e.g., a tokenizer cache), inline it or create an adjacent file — DO NOT pull in `components/shared/code-block/` as a whole directory unless multiple files are genuinely required (verify via `ls /Users/ryanliu/Documents/uclaw/ui/src/components/shared/code-block/`). If multiple, place them in `desktop/src/shared/components/code-block/` with `index.ts` re-exporting only what callers import (no god-barrel).

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test code-block 2>&1 | tail -10
```

Expected: 2 PASS. If a Shiki async-init race causes the first assertion to fail, await the highlighter via the test (e.g., `await screen.findByText(/const x = 1/)`).

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/components/code-block.tsx desktop/src/shared/components/code-block.test.tsx
git commit -m "feat(desktop): port shared CodeBlock with Shiki highlighting"
```

---

## Task 16: Port feature helper — UserAvatar

**Files:**
- Create: `desktop/src/features/chat-agent/components/user-avatar.tsx`
- Create: `desktop/src/features/chat-agent/components/user-avatar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/user-avatar.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UserAvatar } from './user-avatar'

describe('UserAvatar', () => {
  it('renders a label-bearing element for "User"', () => {
    render(<UserAvatar />)
    expect(screen.getByLabelText(/user/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test user-avatar 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port `components/chat/UserAvatar.tsx`**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/UserAvatar.tsx` → `desktop/src/features/chat-agent/components/user-avatar.tsx`. Apply retargets.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test user-avatar 2>&1 | tail -5
```

Expected: PASS. Adapt the assertion if uclaw uses a different aria-label (e.g., `Avatar` instead of `User`) — use the actual label.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/user-avatar.tsx desktop/src/features/chat-agent/components/user-avatar.test.tsx
git commit -m "feat(desktop): port UserAvatar helper"
```

---

## Task 17: Port feature helper — CopyButton

**Files:**
- Create: `desktop/src/features/chat-agent/components/copy-button.tsx`
- Create: `desktop/src/features/chat-agent/components/copy-button.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/copy-button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CopyButton } from './copy-button'

describe('CopyButton', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('writes the value to clipboard when clicked', async () => {
    render(<CopyButton value="hello" />)
    await userEvent.click(screen.getByRole('button'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello')
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test copy-button 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port `components/chat/CopyButton.tsx`**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/CopyButton.tsx` → `desktop/src/features/chat-agent/components/copy-button.tsx`. Apply retargets (Button → `@/shared/ui/button`; Tooltip if used → `@/shared/ui/tooltip`).

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test copy-button 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/copy-button.tsx desktop/src/features/chat-agent/components/copy-button.test.tsx
git commit -m "feat(desktop): port CopyButton helper"
```

---

## Task 18: Port feature helper — ChatToolActivityIndicator

**Files:**
- Create: `desktop/src/features/chat-agent/components/chat-tool-activity-indicator.tsx`
- Create: `desktop/src/features/chat-agent/components/chat-tool-activity-indicator.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/chat-tool-activity-indicator.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChatToolActivityIndicator } from './chat-tool-activity-indicator'
import type { ToolActivity } from '../lib/agent-types'

const running: ToolActivity = {
  toolUseId: 'tu-1',
  toolName: 'web_search',
  input: { query: 'test' },
  done: false,
}

describe('ChatToolActivityIndicator', () => {
  it('renders the active tool name', () => {
    render(<ChatToolActivityIndicator activity={running} />)
    expect(screen.getByText(/web_search/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test chat-tool-activity-indicator 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port `components/chat/ChatToolActivityIndicator.tsx`**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/chat/ChatToolActivityIndicator.tsx` → `desktop/src/features/chat-agent/components/chat-tool-activity-indicator.tsx`. Apply retargets (Spinner, agent-types).

If the props shape differs from the test (e.g., uclaw expects `activities[]` not `activity`), update the test to match the actual prop shape. The truth is the ported component.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test chat-tool-activity-indicator 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/chat-tool-activity-indicator.tsx desktop/src/features/chat-agent/components/chat-tool-activity-indicator.test.tsx
git commit -m "feat(desktop): port ChatToolActivityIndicator helper"
```

---

## Task 19: Port feature helper — WelcomeEmptyState

**Files:**
- Create: `desktop/src/features/chat-agent/components/welcome-empty-state.tsx`
- Create: `desktop/src/features/chat-agent/components/welcome-empty-state.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/welcome-empty-state.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WelcomeEmptyState } from './welcome-empty-state'

describe('WelcomeEmptyState', () => {
  it('renders a welcome heading', () => {
    render(<WelcomeEmptyState />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test welcome-empty-state 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port `components/welcome/WelcomeEmptyState.tsx`**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/welcome/WelcomeEmptyState.tsx` → `desktop/src/features/chat-agent/components/welcome-empty-state.tsx`. Apply retargets. If the file uses translations (`react-i18next`), and the desktop hasn't set up i18n: keep the `t()` calls, and add a setup-file stub in `vitest.setup.ts` (see Plan 2b.2.a precedent — i18n stub via `vi.mock('react-i18next', ...)`).

If i18n adaptation requires a code change, document it inline with a comment like the `thinking_delta` precedent.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test welcome-empty-state 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/welcome-empty-state.tsx desktop/src/features/chat-agent/components/welcome-empty-state.test.tsx desktop/vitest.setup.ts
git commit -m "feat(desktop): port WelcomeEmptyState helper"
```

---

## Task 20: Build __fixtures__/

**Files:**
- Create: `desktop/src/features/chat-agent/__fixtures__/message-fixtures.ts`
- Create: `desktop/src/features/chat-agent/__fixtures__/streaming-fixture.ts`
- Create: `desktop/src/features/chat-agent/__fixtures__/tool-activity-fixture.ts`

- [ ] **Step 1: Write `message-fixtures.ts`**

```ts
// desktop/src/features/chat-agent/__fixtures__/message-fixtures.ts
import type { ChatMessage } from '../lib/chat-types'

export const userTurn: ChatMessage = {
  id: 'u-1',
  role: 'user',
  content: 'Why is the sky blue?',
  timestamp: 1716800000000,
}

export const assistantTurn: ChatMessage = {
  id: 'a-1',
  role: 'assistant',
  content: 'Rayleigh scattering: shorter wavelengths scatter more.',
  timestamp: 1716800001000,
}

export const twoTurnConversation: ChatMessage[] = [userTurn, assistantTurn]
```

(If `ChatMessage`'s real field names differ from this shape, mirror the actual type — read `desktop/src/features/chat-agent/lib/chat-types.ts` to confirm. The point is: fixtures construct values via the exported type so drift is caught at compile time.)

- [ ] **Step 2: Write `streaming-fixture.ts`**

```ts
// desktop/src/features/chat-agent/__fixtures__/streaming-fixture.ts
import type { AgentStreamState } from '../atoms/agent-atoms'

export const emptyStreaming: AgentStreamState = {
  running: true,
  content: '',
  reasoning: '',
  toolActivities: [],
  teammates: [],
} as AgentStreamState

export const partialStreaming: AgentStreamState = {
  ...emptyStreaming,
  content: 'Here is the partial ans',
  reasoning: 'thinking about the question',
}

export const completedStreaming: AgentStreamState = {
  ...emptyStreaming,
  running: false,
  content: 'Here is the full answer.',
  reasoning: 'final reasoning.',
}
```

(Again, mirror the actual `AgentStreamState` shape from `atoms/agent-atoms.ts` — these are fixture seeds, not type sources.)

- [ ] **Step 3: Write `tool-activity-fixture.ts`**

```ts
// desktop/src/features/chat-agent/__fixtures__/tool-activity-fixture.ts
import type { ToolActivity } from '../lib/agent-types'

export const pendingToolUse: ToolActivity = {
  toolUseId: 'tu-1',
  toolName: 'web_search',
  input: { query: 'how does Rayleigh scattering work?' },
  done: false,
}

export const completedToolUse: ToolActivity = {
  toolUseId: 'tu-1',
  toolName: 'web_search',
  input: { query: 'how does Rayleigh scattering work?' },
  result: '...',
  done: true,
  isError: false,
}

export const erroredToolUse: ToolActivity = {
  ...completedToolUse,
  toolUseId: 'tu-err',
  result: 'rate limited',
  isError: true,
}
```

- [ ] **Step 4: Run all tests — fixtures must compile**

```bash
pnpm --dir desktop test 2>&1 | tail -10
```

Expected: existing tests still pass; fixtures import without TS errors.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/__fixtures__/
git commit -m "test(desktop): add message/streaming/tool-activity fixtures for ai-elements"
```

---

## Task 21: Port ai-elements/provider-avatar

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/provider-avatar.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/provider-avatar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/ai-elements/provider-avatar.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProviderAvatar } from './provider-avatar'

describe('ProviderAvatar', () => {
  it('renders for a known model id', () => {
    render(<ProviderAvatar modelId="claude-sonnet-4-6" />)
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test provider-avatar 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/provider-avatar.tsx` → `desktop/src/features/chat-agent/components/ai-elements/provider-avatar.tsx`. Apply retargets per methodology.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test provider-avatar 2>&1 | tail -5
```

Expected: PASS. Adapt the assertion if the component uses `<svg>` instead of `<img>`.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/provider-avatar.tsx desktop/src/features/chat-agent/components/ai-elements/provider-avatar.test.tsx
git commit -m "feat(desktop): port ai-elements/provider-avatar"
```

---

## Task 22: Port ai-elements/context-divider

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/context-divider.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/context-divider.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/ai-elements/context-divider.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ContextDivider } from './context-divider'

describe('ContextDivider', () => {
  it('renders a separator role element', () => {
    render(<ContextDivider />)
    expect(screen.getByRole('separator', { hidden: true })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test context-divider 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/context-divider.tsx` → `desktop/src/features/chat-agent/components/ai-elements/context-divider.tsx`.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test context-divider 2>&1 | tail -5
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/context-divider.tsx desktop/src/features/chat-agent/components/ai-elements/context-divider.test.tsx
git commit -m "feat(desktop): port ai-elements/context-divider"
```

---

## Task 23: Port ai-elements/sticky-user-message

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/sticky-user-message.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/sticky-user-message.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/ai-elements/sticky-user-message.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StickyUserMessage } from './sticky-user-message'
import { userTurn } from '../../__fixtures__/message-fixtures'

describe('StickyUserMessage', () => {
  it('displays the user message content', () => {
    render(<StickyUserMessage message={userTurn} />)
    expect(screen.getByText(/sky blue/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test sticky-user-message 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/sticky-user-message.tsx` → target path. Apply retargets.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test sticky-user-message 2>&1 | tail -5
```

Expected: PASS. Adapt the assertion / prop names if uclaw uses a different prop shape (e.g., `content` as a string rather than a `message` object).

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/sticky-user-message.tsx desktop/src/features/chat-agent/components/ai-elements/sticky-user-message.test.tsx
git commit -m "feat(desktop): port ai-elements/sticky-user-message"
```

---

## Task 24: Port ai-elements/scroll-minimap

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScrollMinimap } from './scroll-minimap'

describe('ScrollMinimap', () => {
  it('renders without crashing when empty', () => {
    render(<ScrollMinimap items={[]} />)
    expect(screen.queryByRole('navigation')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test scroll-minimap 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/scroll-minimap.tsx` → target. Apply retargets. This file is 508 LOC — read the whole thing. If it depends on a sibling helper not yet listed (e.g., `useStickyHeader`), STOP and dispatch back to controller for re-scoping.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test scroll-minimap 2>&1 | tail -5
```

Expected: PASS. Adapt props if uclaw doesn't take `items` directly. The criterion is: a single "renders empty without throwing" test asserts the smoke path.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.tsx desktop/src/features/chat-agent/components/ai-elements/scroll-minimap.test.tsx
git commit -m "feat(desktop): port ai-elements/scroll-minimap"
```

---

## Task 25: Port ai-elements/rich-text-input

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/rich-text-input.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/rich-text-input.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/ai-elements/rich-text-input.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RichTextInput } from './rich-text-input'

describe('RichTextInput', () => {
  it('renders an editable surface', () => {
    render(<RichTextInput value="" onChange={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test rich-text-input 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/rich-text-input.tsx` → target. Apply retargets. TipTap imports stay as `@tiptap/react` (npm package).

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test rich-text-input 2>&1 | tail -5
```

Expected: PASS. TipTap in jsdom can be finicky — if `getByRole('textbox')` doesn't find the editor, replace with a more permissive assertion (`screen.getByTestId('rich-text-editor')` after adding a `data-testid` in the port, OR `document.querySelector('.tiptap')`).

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/rich-text-input.tsx desktop/src/features/chat-agent/components/ai-elements/rich-text-input.test.tsx
git commit -m "feat(desktop): port ai-elements/rich-text-input (TipTap)"
```

---

## Task 26: Port ai-elements/reasoning

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/reasoning.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/reasoning.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// desktop/src/features/chat-agent/components/ai-elements/reasoning.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Reasoning } from './reasoning'

describe('Reasoning', () => {
  it('renders the reasoning text when expanded', () => {
    render(<Reasoning text="thinking about it" defaultOpen />)
    expect(screen.getByText(/thinking about it/i)).toBeInTheDocument()
  })

  it('hides the reasoning text when collapsed', () => {
    render(<Reasoning text="thinking about it" defaultOpen={false} />)
    expect(screen.queryByText(/thinking about it/i)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test reasoning 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/reasoning.tsx` → target. Apply retargets.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test reasoning 2>&1 | tail -5
```

Expected: PASS. Adapt prop names if uclaw uses `content` instead of `text`.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/reasoning.tsx desktop/src/features/chat-agent/components/ai-elements/reasoning.test.tsx
git commit -m "feat(desktop): port ai-elements/reasoning"
```

---

## Task 27: Port ai-elements/message + port uclaw's existing tests

**Dependencies:** Tasks 11–19 (utilities + CodeBlock + helpers).

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/message.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/message.test.tsx` (port uclaw's)
- Create: `desktop/src/features/chat-agent/components/ai-elements/message.fixtures.test.tsx` (port uclaw's)

- [ ] **Step 1: Port `message.tsx` first**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/message.tsx` (615 LOC) → target. Apply retargets per methodology — pay special attention to:
- `@/lib/normalize-agent-markdown` → `@/shared/lib/normalize-agent-markdown`
- `@/components/shared/code-block/CodeBlock` → `@/shared/components/code-block`
- `@/lib/model-logo` → `@/shared/lib/model-logo`
- `@/components/chat/CopyButton` → `@/features/chat-agent/components/copy-button`
- `@/components/chat/UserAvatar` → `@/features/chat-agent/components/user-avatar`
- `@/components/ai-elements/<x>` (e.g., provider-avatar) → `./` (sibling)

- [ ] **Step 2: Port uclaw's `message.test.tsx`**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/message.test.tsx` → target. Retarget the `./message` import only — keep all assertions identical to the upstream test.

- [ ] **Step 3: Port uclaw's `message.fixtures.test.tsx`**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/message.fixtures.test.tsx` → target. Retarget imports. If uclaw's test imports fixture files from `__fixtures__/`, copy those too (under `desktop/src/features/chat-agent/components/ai-elements/__fixtures__/`).

- [ ] **Step 4: Run the tests**

```bash
pnpm --dir desktop test message 2>&1 | tail -15
```

Expected: all ported uclaw tests PASS. If a test fails because of a missing port (e.g., uclaw test imports `Badge` from `@/components/ui/badge`), STOP and note the gap — DO NOT silently widen the scope by porting a new primitive. Surface to controller.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/message.tsx desktop/src/features/chat-agent/components/ai-elements/message.test.tsx desktop/src/features/chat-agent/components/ai-elements/message.fixtures.test.tsx desktop/src/features/chat-agent/components/ai-elements/__fixtures__/ 2>/dev/null || true
git commit -m "feat(desktop): port ai-elements/message + uclaw tests"
```

---

## Task 28: Port ai-elements/conversation

**Files:**
- Create: `desktop/src/features/chat-agent/components/ai-elements/conversation.tsx`
- Create: `desktop/src/features/chat-agent/components/ai-elements/conversation.test.tsx`

- [ ] **Step 1: Write the failing test (fixture-driven)**

```tsx
// desktop/src/features/chat-agent/components/ai-elements/conversation.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Conversation } from './conversation'
import { twoTurnConversation } from '../../__fixtures__/message-fixtures'

describe('Conversation', () => {
  it('renders all message turns in order', () => {
    render(<Conversation messages={twoTurnConversation} />)
    expect(screen.getByText(/sky blue/i)).toBeInTheDocument()
    expect(screen.getByText(/Rayleigh/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm --dir desktop test conversation 2>&1 | tail -5
```

Expected: FAIL.

- [ ] **Step 3: Port the source**

Read `/Users/ryanliu/Documents/uclaw/ui/src/components/ai-elements/conversation.tsx` → target. Apply retargets. Sibling imports (e.g., `./message`, `./scroll-minimap`) stay as-is.

- [ ] **Step 4: Run the test**

```bash
pnpm --dir desktop test conversation 2>&1 | tail -5
```

Expected: PASS. Adapt prop names if uclaw uses a different shape.

- [ ] **Step 5: Commit**

```bash
git add desktop/src/features/chat-agent/components/ai-elements/conversation.tsx desktop/src/features/chat-agent/components/ai-elements/conversation.test.tsx
git commit -m "feat(desktop): port ai-elements/conversation"
```

---

## Task 29: Carried-forward follow-ups from Plan 2b.2.a

These are the two non-blocking items the final reviewer of Plan 2b.2.a flagged for this plan (Spec §11). Doing them here unblocks Plan 2b.2.b.2 from having to remember them.

**Files:**
- Modify: `desktop/src/features/chat-agent/lib/agent-types.ts`
- Modify: `desktop/src/features/chat-agent/bridge-adapter.ts`
- Modify: `desktop/src/features/chat-agent/atoms/agent-atoms.ts`

- [ ] **Step 1: Extend `AgentEvent` with optional `reason` and `message` fields**

Open `desktop/src/features/chat-agent/lib/agent-types.ts` and find the `AgentEvent` interface (or discriminated-union type). Add the two optional fields. Example shape:

```ts
// Before
export interface AgentEvent {
  type: string
  // ... existing fields
}

// After — add only these two:
export interface AgentEvent {
  type: string
  // ... existing fields
  /** Stop reason — populated when type === 'complete'. */
  reason?: string
  /** Error message — populated when type === 'error' or some 'status' variants. */
  message?: string
}
```

If `AgentEvent` is a union of narrower variants (`TextDeltaEvent | CompleteEvent | ErrorEvent | ...`), add `reason?: string` to the `complete` variant and `message?: string` to the `error` variant only. Don't widen variants that don't carry them.

- [ ] **Step 2: Drop the `Record<string, unknown>` casts in `bridge-adapter.ts`**

Open `desktop/src/features/chat-agent/bridge-adapter.ts`. Find every occurrence of `...({ ... } as Record<string, unknown>) as AgentEvent` and replace with direct field assignment now that the type permits it. Example diff for the `complete` case:

```ts
// Before
case 'agent:done':
  return { type: 'complete', ...({ reason: event.reason } as Record<string, unknown>) } as AgentEvent

// After
case 'agent:done':
  return { type: 'complete', reason: event.reason }
```

Repeat for `error` and any `status`-shaped emit.

- [ ] **Step 3: Add a doc comment to the `backgroundTasksAtomFamily` `_sessionId` rename**

Open `desktop/src/features/chat-agent/atoms/agent-atoms.ts` and find the `backgroundTasksAtomFamily` definition (search for `_sessionId`). Add the explanatory comment matching the `thinking_delta` precedent:

```ts
// Before
export const backgroundTasksAtomFamily = atomFamily((_sessionId: string) =>
  atom<BackgroundTask[]>([]),
)

// After
// Desktop port adaptation: TS strict-mode (`noUnusedParameters: true`) requires
// renaming the unused arg to `_sessionId`. The atomFamily keys on the original
// session id; this only affects the closure-arg name, not behavior. Plan 2c+
// should upstream a comment to uclaw if their atomFamily ever shrinks the arg.
export const backgroundTasksAtomFamily = atomFamily((_sessionId: string) =>
  atom<BackgroundTask[]>([]),
)
```

- [ ] **Step 4: Run the existing bridge-adapter + integration tests**

```bash
pnpm --dir desktop test bridge-adapter agent-atoms 2>&1 | tail -10
```

Expected: all 16 previously-passing tests (9 adapter + 7 integration) still PASS — the type widening doesn't break any assertion.

- [ ] **Step 5: Run the full test suite + build**

```bash
pnpm --dir desktop test 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: all pass; build clean.

- [ ] **Step 6: Commit**

```bash
git add desktop/src/features/chat-agent/lib/agent-types.ts desktop/src/features/chat-agent/bridge-adapter.ts desktop/src/features/chat-agent/atoms/agent-atoms.ts
git commit -m "refactor(desktop): close Plan 2b.2.a follow-ups (AgentEvent reason/message + _sessionId doc)"
```

---

## Task 30: Smoke verification

**Files:** None (verification only).

- [ ] **Step 1: Backend tests still pass**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-message-ui-primitives
cargo test -p hermes-desktop --lib 2>&1 | tail -3
```

Expected: 21 PASS (unchanged from Plan 2b.2.a).

- [ ] **Step 2: Frontend tests all green**

```bash
pnpm --dir desktop test 2>&1 | tail -15
```

Expected: ≥48 PASS total (17 carried forward + 31 minimum new — 3 theme + 28 component/utility tests across Tasks 5–28).

- [ ] **Step 3: Warning-free build**

```bash
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -3
pnpm --dir desktop build 2>&1 | tail -10
```

Expected: both clean.

- [ ] **Step 4: Workspace regression check**

```bash
cargo check --workspace 2>&1 | tail -3
```

Expected: PASS (no Rust changes in this plan).

- [ ] **Step 5: App.tsx untouched**

```bash
git diff 08efcaf -- desktop/src/app/App.tsx
```

Expected: empty.

- [ ] **Step 6: Bundle-size sanity**

```bash
ls -lh desktop/dist/assets/*.js | awk '{print $5, $9}'
```

Expected: no single chunk > 4 MB raw. Record the largest 3 chunks in the smoke report.

- [ ] **Step 7: Feature directory shape**

```bash
ls -R desktop/src/features/chat-agent/components/ai-elements desktop/src/features/chat-agent/components desktop/src/features/chat-agent/__fixtures__ desktop/src/shared/ui desktop/src/shared/lib desktop/src/shared/components
```

Expected: matches the File Structure section above.

- [ ] **Step 8: Repo state**

```bash
git status --short
git log --oneline -32
```

Expected: tree clean; ~30 task commits visible above `874bd34` (the spec commit, which itself sits above `08efcaf` — the Plan 2b.2.a tip).

---

## Done When

- All 29 source-affecting tasks complete (Tasks 1–29); Task 30 smoke verification passes.
- ≥31 new frontend tests added on top of Plan 2b.2.a's 17 (total ≥48 passing).
- Backend untouched: 21 Rust tests unchanged; `cargo check --workspace` green; no Rust file modified in this plan's commits.
- `App.tsx` untouched.
- No barrel exports under `shared/ui/` or `shared/components/`.
- Production build clean; bundle size within budget (smoke Step 6).
- Final code review verdict: APPROVED or APPROVED_WITH_FOLLOWUPS.

## Next Plan

**Plan 2b.2.b.2 — AgentMessages integration:** port `components/agent/AgentMessages.tsx` (1,267 LOC, one file) + its tests; the only Tauri-event reducer left to integrate (atoms + adapter already from 2b.2.a; primitives + ai-elements from this plan). After 2b.2.b.2 lands, Plan 2b.2.c wires the bridge → atoms → React via a `ChatAgentView` container and replaces `App.tsx`'s MVP composer with the full uclaw message view.
