# Desktop Multi-Theme — Plan 3.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace our simple `themeAtom` (Plan 2b.2.b.1) with uclaw's full multi-theme system: 10 named themes (`ocean-light`, `ocean-dark`, `forest-light`, `forest-dark`, `slate-light`, `slate-dark`, `warm-paper`, `qingye`, `black`, `the-finals`) + light/dark/system mode + theme picker UI. After this PR, existing components automatically inherit theme switching via CSS variables; no component changes required outside `pierre-theme.ts`'s 1-line retarget.

**Architecture:** Bottom-up port. Theme CSS variables first (so the renderer can already display them). Then port uclaw's `atoms/theme.ts` verbatim (replaces our simpler `theme-atoms.ts`). Then update Tailwind config to cover the new `.theme-*` selectors. Then retarget `pierre-theme.ts` (1-line). Then build the ThemePicker component for Plan 3.3 to mount in the Dock. Verbatim port discipline: storage keys rebrand `uclaw-*` → `hermes-*` per Plan 2b.2.c.2 precedent.

**Tech Stack additions:** None. Multi-theme is pure CSS variables + Jotai atoms + localStorage persistence.

**Reference:** Spec — [docs/superpowers/specs/2026-05-28-desktop-navigation-spine-design.md](../specs/2026-05-28-desktop-navigation-spine-design.md) §3.1. Stacked on main at `b886ec1` (post-merge of Plan 2b.2.c.3).

---

## File Structure

```
desktop/src/
  styles/
    themes.css                              # NEW (Task 3): 10 named theme blocks (~1,500 LOC)
    index.css                               # MODIFY (Task 3): @import './themes.css'
  features/chat-agent/
    atoms/
      theme-atoms.ts                        # DELETE (Task 8): replaced by theme.ts
      theme-atoms.test.ts                   # DELETE (Task 8)
      theme.ts                              # NEW (Task 2): verbatim port of uclaw atoms/theme.ts
      theme.test.ts                         # NEW (Task 2)
    components/
      tool-renderers/
        pierre-theme.ts                     # MODIFY (Task 5): themeAtom → resolvedThemeAtom (1-line)
  shared/
    ui/
      theme-picker.tsx                      # NEW (Task 7): dropdown picker for the 10 themes
      theme-picker.test.tsx                 # NEW (Task 7)
  tailwind.config.js                        # MODIFY (Task 4): darkMode covers [class*="theme-"]-dark variants
```

**Anti-god-file invariants:**
- `themes.css` is a separate file, not appended to `index.css`. One file per concern.
- `theme.ts` lives under `features/chat-agent/atoms/` (matches uclaw's `@/atoms/theme` path — consumer imports stay short).
- `ThemePicker` is a `shared/ui/` primitive (reusable across Dock + Settings modal); not feature-scoped.

---

## Port Methodology

For ported files:
1. Read uclaw source verbatim.
2. Apply retargets:
   - `from '@/lib/utils'` → `from '@/shared/lib/cn'`
   - `from '@/atoms/theme'` (when other uclaw files import this) — we'll create at `@/features/chat-agent/atoms/theme`
   - localStorage keys: `uclaw-*` → `hermes-*` per Plan 2b.2.c.2 precedent
3. Resolve TS strict-mode tweaks (`_`-prefix unused args).

---

## Task 1: Recon — themeAtom consumer surface + uclaw theme.ts shape

**Files:** Create `docs/superpowers/plans/2026-05-28-desktop-multi-theme-recon.md`.

- [ ] **Step 1: Enumerate current themeAtom consumers**

```bash
DEST=/Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
echo "=== themeAtom imports in desktop/ ==="
grep -rn "from .*theme-atoms\|themeAtom" $DEST/desktop/src 2>&1 | head -20
echo ""
echo "=== Current theme-atoms.ts exports ==="
cat $DEST/desktop/src/features/chat-agent/atoms/theme-atoms.ts
```

Confirm: which files import `themeAtom` / `applyThemeToDocumentEffect`. Likely consumers:
- `pierre-theme.ts` (Plan 2b.2.c.1)
- Maybe `main.tsx` or `App.tsx`

- [ ] **Step 2: Read uclaw's atoms/theme.ts verbatim**

```bash
cat /Users/ryanliu/Documents/uclaw/ui/src/atoms/theme.ts
```

Record exports: `themeModeAtom`, `themeStyleAtom`, `systemIsDarkAtom`, `resolvedThemeAtom`, `applyThemeToDOM`, `initializeTheme`, `updateThemeMode`, `updateThemeStyle`, plus types `ThemeMode` and `ThemeStyle`.

Confirm storage keys (`THEME_CACHE_KEY`, `THEME_STYLE_CACHE_KEY`).

- [ ] **Step 3: Enumerate the named theme CSS blocks in uclaw globals.css**

```bash
UCLAW=/Users/ryanliu/Documents/uclaw/ui/src
grep -nE "^\.theme-[a-z-]+ \{|^\.theme-[a-z-]+, $" $UCLAW/styles/globals.css | head -30
```

Confirm: 10 themes listed in the spec (ocean-light, ocean-dark, forest-light, forest-dark, slate-light, slate-dark, warm-paper, qingye, black, the-finals) — note line ranges for each block.

- [ ] **Step 4: Confirm current `styles/index.css` content**

```bash
cat $DEST/desktop/src/styles/index.css
```

Record what's currently there so Task 3 knows where to add the `@import` line.

- [ ] **Step 5: Confirm current `tailwind.config.js` darkMode config**

```bash
grep -nA 2 "darkMode" $DEST/desktop/tailwind.config.js
```

Record the current value (probably `["class", '[data-theme="dark"]']`).

- [ ] **Step 6: Write recon doc**

Save to `docs/superpowers/plans/2026-05-28-desktop-multi-theme-recon.md` with sections:
- themeAtom consumers (per-line)
- uclaw atoms/theme.ts exports + storage keys
- Named theme CSS block line ranges in uclaw globals.css
- Current styles/index.css content
- Current tailwind.config.js darkMode setting

- [ ] **Step 7: Commit**

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
git add docs/superpowers/plans/2026-05-28-desktop-multi-theme-recon.md
git commit -m "docs(plan): recon Plan 3.1 multi-theme consumer + CSS surface"
```

## Reporting (per task)

Each subagent reports **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** with commit SHA + test count delta + any adaptations.

---

## Task 2: Port uclaw's `atoms/theme.ts`

**Files:**
- Create: `desktop/src/features/chat-agent/atoms/theme.ts` (187 LOC verbatim port)
- Create: `desktop/src/features/chat-agent/atoms/theme.test.ts`

### Step 1: Port the source

Read `/Users/ryanliu/Documents/uclaw/ui/src/atoms/theme.ts` (187 LOC). Save to `desktop/src/features/chat-agent/atoms/theme.ts`. Apply retargets:
- Storage key rebrand: `'uclaw-theme-mode'` → `'hermes-theme-mode'`, `'uclaw-theme-style'` → `'hermes-theme-style'`
- Any `@/lib/...` imports → standard retargets per methodology
- Tauri `invoke` calls — preserve verbatim; if `get_theme_preferences` / `set_theme_*` commands don't exist in Rust yet, wrap in try/catch returning the default (matches the Plan 2b.2.c.2 `ui-preferences.ts` pattern)

Add a header comment:

```ts
// Plan 3.1 — verbatim port from uclaw atoms/theme.ts. Replaces the simple
// themeAtom from Plan 2b.2.b.1 (deleted in Task 8 of this plan). Storage
// keys rebranded uclaw-* → hermes-* per Plan 2b.2.c.2 precedent.
//
// Tauri `invoke('get_theme_preferences')` etc. are not yet implemented —
// they fall back to localStorage (matches uclaw upstream behavior in
// environments without the backend).
```

### Step 2: Write tests

Create `desktop/src/features/chat-agent/atoms/theme.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from 'jotai/vanilla'

// Mock Tauri invoke so initializeTheme etc. don't try to call backend
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}))

const mod = await import('./theme')

describe('theme atoms', () => {
  beforeEach(() => {
    // Clean localStorage between tests
    try { localStorage.clear() } catch { /* jsdom */ }
  })

  it('themeModeAtom has a default value (light, dark, system, or special)', () => {
    const store = createStore()
    const value = store.get(mod.themeModeAtom)
    expect(['light', 'dark', 'system', 'special']).toContain(value)
  })

  it('themeStyleAtom has a default value', () => {
    const store = createStore()
    const value = store.get(mod.themeStyleAtom)
    expect(typeof value).toBe('string')
  })

  it('systemIsDarkAtom defaults to a boolean', () => {
    const store = createStore()
    expect(typeof store.get(mod.systemIsDarkAtom)).toBe('boolean')
  })

  it('resolvedThemeAtom resolves to light or dark', () => {
    const store = createStore()
    const resolved = store.get(mod.resolvedThemeAtom)
    expect(['light', 'dark']).toContain(resolved)
  })

  it('applyThemeToDOM sets data-theme attribute', () => {
    document.documentElement.removeAttribute('data-theme')
    mod.applyThemeToDOM('dark', 'default', true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('applyThemeToDOM with non-default style adds a theme-* class', () => {
    document.documentElement.className = ''
    mod.applyThemeToDOM('light', 'ocean-light', false)
    expect(document.documentElement.className).toContain('theme-')
  })

  it('initializeTheme is callable and resolves', async () => {
    const store = createStore()
    if (typeof mod.initializeTheme === 'function') {
      await expect(mod.initializeTheme(store)).resolves.not.toThrow()
    }
  })

  it('updateThemeMode persists to localStorage', async () => {
    await mod.updateThemeMode('dark')
    expect(localStorage.getItem('hermes-theme-mode')).toBe('dark')
  })

  it('updateThemeStyle persists to localStorage', async () => {
    await mod.updateThemeStyle('ocean-dark')
    expect(localStorage.getItem('hermes-theme-style')).toBe('ocean-dark')
  })
})
```

Adapt assertions if uclaw's actual API differs (e.g., `initializeTheme` may take different args).

### Step 3: Run + commit

```bash
pnpm --dir desktop test atoms/theme 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
git add desktop/src/features/chat-agent/atoms/theme*
git commit -m "feat(desktop): port uclaw atoms/theme.ts (multi-theme atoms)"
```

Report **DONE** / **BLOCKED** with commit SHA + test count + any Tauri/storage-key adaptations.

---

## Task 3: Port the 10 named theme CSS blocks to `styles/themes.css`

**Files:**
- Create: `desktop/src/styles/themes.css`
- Modify: `desktop/src/styles/index.css`

### Step 1: Extract uclaw's named theme blocks

Per Task 1 recon, uclaw's `globals.css` contains theme blocks like `.theme-ocean-light { ... }`, `.theme-ocean-dark { ... }`, etc. Copy each block VERBATIM into `desktop/src/styles/themes.css`. The 10 blocks to extract:

1. `.theme-ocean-light`
2. `.theme-ocean-dark`
3. `.theme-forest-light`
4. `.theme-forest-dark`
5. `.theme-slate-light`
6. `.theme-slate-dark`
7. `.theme-warm-paper`
8. `.theme-qingye`
9. `.theme-black`
10. `.theme-the-finals`

Also include any `:root` augmentations that uclaw makes for theme-specific code-bg / scrollbar / shell-bg colors.

The file should start with:

```css
/*
 * Plan 3.1 — multi-theme CSS variable blocks ported verbatim from
 * uclaw/ui/src/styles/globals.css. Each `.theme-*` selector layers HSL
 * variables onto the base shadcn token set; components consume via
 * Tailwind's `var(--<token>)` mapping.
 *
 * The applyThemeToDOM helper in atoms/theme.ts sets BOTH:
 *   - `<html data-theme="light|dark">` for the base mode
 *   - `<html class="theme-<style>">` for the named style
 *
 * So a user selecting "ocean-dark" gets:
 *   <html data-theme="dark" class="theme-ocean-dark">
 *
 * CSS specificity rules: the `.theme-*` class overrides `:root` defaults.
 */
```

### Step 2: Import from `styles/index.css`

Edit `desktop/src/styles/index.css`. Add `@import './themes.css';` at the top (after the `@tailwind` directives):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './themes.css';

/* ... existing :root + .dark blocks remain ... */
```

The `@import` must come after `@tailwind` directives but before existing `:root` blocks so the named themes have correct specificity (lower than `:root` defaults, higher than utilities — Tailwind layers handle this).

### Step 3: Run frontend tests + build

```bash
pnpm --dir desktop test 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: tests pass; build clean; bundle size +~1,500 lines of CSS (≈10-15 KB raw).

### Step 4: Commit

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
git add desktop/src/styles/{themes.css,index.css}
git commit -m "feat(desktop): port 10 named theme CSS blocks to styles/themes.css"
```

Report **DONE** / **BLOCKED** with commit SHA + CSS line count + bundle-size delta.

---

## Task 4: Update `tailwind.config.js` for named-theme dark mode

**Files:** Modify `desktop/tailwind.config.js`.

### Step 1: Inspect current darkMode setting

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
grep -nA 2 "darkMode" desktop/tailwind.config.js
```

Likely shows `darkMode: ["class", '[data-theme="dark"]']` (from Plan 2b.2.b.1).

### Step 2: Extend darkMode to cover named-theme dark variants

Edit `desktop/tailwind.config.js`. Replace the darkMode line with:

```js
darkMode: [
  'class',
  // Plan 2b.2.b.1 — base light/dark via data-theme attribute
  '[data-theme="dark"]',
  // Plan 3.1 — named theme dark variants also count as dark mode
  // so dark: Tailwind utilities respond to .theme-ocean-dark, .theme-forest-dark, etc.
  '[class*="theme-"][class*="-dark"]',
  '.theme-qingye',
  '.theme-black',
  '.theme-the-finals',
],
```

The selectors above match uclaw's globals.css `:not([class*="theme-"]):not(.dark)` patterns inverted: when ANY `theme-*-dark` class is present, OR specifically the always-dark named themes (qingye, black, the-finals), Tailwind's `dark:` modifier activates.

### Step 3: Verify build

```bash
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: clean. Tailwind's class detector should accept the multi-selector array.

### Step 4: Commit

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
git add desktop/tailwind.config.js
git commit -m "feat(desktop): extend tailwind darkMode to cover named-theme dark variants"
```

Report **DONE** / **BLOCKED** with commit SHA.

---

## Task 5: Retarget `pierre-theme.ts` consumer

**Files:** Modify `desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.ts`.

### Step 1: Inspect current import

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
grep -n "themeAtom" desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.ts
```

Currently imports `themeAtom` from `@/features/chat-agent/atoms/theme-atoms`.

### Step 2: Retarget to `resolvedThemeAtom`

Edit the import + usage:

```diff
- import { themeAtom } from '@/features/chat-agent/atoms/theme-atoms'
+ import { resolvedThemeAtom } from '@/features/chat-agent/atoms/theme'
```

```diff
 export function usePierreTheme(): 'one-light' | 'one-dark-pro' {
-  const theme = useAtomValue(themeAtom)
+  const theme = useAtomValue(resolvedThemeAtom)
   return theme === 'dark' ? 'one-dark-pro' : 'one-light'
 }
```

The signature contract (`'light' | 'dark'` union) is identical; this is a pure rename.

### Step 3: Run + commit

```bash
pnpm --dir desktop test pierre-theme 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -5

git add desktop/src/features/chat-agent/components/tool-renderers/pierre-theme.ts
git commit -m "refactor(desktop): pierre-theme consumes resolvedThemeAtom (Plan 3.1)"
```

Report **DONE** / **BLOCKED** with commit SHA.

---

## Task 6: Wire `applyThemeToDOM` into the app bootstrap

**Files:**
- Modify: `desktop/src/main.tsx` OR `desktop/src/app/App.tsx` (whichever has the initial mount)

### Step 1: Inspect the entry point

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
cat desktop/src/main.tsx 2>&1 || cat desktop/src/app/main.tsx 2>&1
echo "---"
cat desktop/src/app/App.tsx
```

### Step 2: Decide where the bootstrap lives

Best place: `main.tsx` (runs once before React mounts).

If `main.tsx` exists, add:

```ts
import { createStore } from 'jotai/vanilla'
import { initializeTheme } from '@/features/chat-agent/atoms/theme'

// Plan 3.1 — bootstrap the theme system before React mounts so the first
// frame already shows the user's preferred theme (no flash-of-unstyled).
const store = createStore()
void initializeTheme(store)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
```

If `<Provider>` was previously inside `App.tsx` (Plan 2b.2.c.3), move it up to `main.tsx` so the same store can be initialized AND passed to App. Update `App.tsx` to not wrap with its own Provider (delete the `<Provider>` wrapper from c.3, since main.tsx now provides it).

### Step 3: Run + commit

```bash
pnpm --dir desktop test 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -5

git add desktop/src/main.tsx desktop/src/app/App.tsx 2>/dev/null || true
git commit -m "feat(desktop): bootstrap initializeTheme in main.tsx (Plan 3.1)"
```

Report **DONE** / **BLOCKED** with commit SHA + which file owns Provider after this task.

---

## Task 7: Build the `ThemePicker` component

**Files:**
- Create: `desktop/src/shared/ui/theme-picker.tsx` (~150 LOC NEW)
- Create: `desktop/src/shared/ui/theme-picker.test.tsx`

### Step 1: Design the picker

The picker is a small dropdown (or modal trigger) exposing:
- Mode selector: light / dark / system / special
- Style selector (when mode is special, OR always): the 10 named themes
- Live preview: switching the mode/style applies immediately via `updateThemeMode` / `updateThemeStyle`

Use shadcn primitives we already have (Button, Popover, Tooltip).

### Step 2: Write the component

Create `desktop/src/shared/ui/theme-picker.tsx`:

```tsx
import * as React from 'react'
import { useAtomValue } from 'jotai'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'
import {
  themeModeAtom,
  themeStyleAtom,
  updateThemeMode,
  updateThemeStyle,
  type ThemeMode,
  type ThemeStyle,
} from '@/features/chat-agent/atoms/theme'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '../lib/cn'

// Plan 3.1 — multi-theme picker. Exposed for Plan 3.3 to mount in the Dock
// and Plan 3.5 to mount in the Settings modal. Lives in shared/ui because it's
// reusable across multiple consumer surfaces.

const NAMED_STYLES: Array<{ value: ThemeStyle; label: string }> = [
  { value: 'default', label: 'Default' },
  { value: 'ocean-light', label: 'Ocean Light' },
  { value: 'ocean-dark', label: 'Ocean Dark' },
  { value: 'forest-light', label: 'Forest Light' },
  { value: 'forest-dark', label: 'Forest Dark' },
  { value: 'slate-light', label: 'Slate Light' },
  { value: 'slate-dark', label: 'Slate Dark' },
  { value: 'warm-paper', label: 'Warm Paper' },
  { value: 'qingye', label: '青夜 (Qingye)' },
  { value: 'black', label: 'Black' },
  { value: 'the-finals', label: 'The Finals' },
]

const MODES: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: 'light', label: 'Light', icon: <Sun className="size-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="size-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="size-4" /> },
  { value: 'special', label: 'Themed', icon: <Palette className="size-4" /> },
]

interface ThemePickerProps {
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function ThemePicker({ align = 'end', side = 'top', className }: ThemePickerProps): React.ReactElement {
  const mode = useAtomValue(themeModeAtom)
  const style = useAtomValue(themeStyleAtom)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Theme picker" className={className}>
          <Palette className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-64 p-3">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1.5">Mode</div>
            <div className="grid grid-cols-4 gap-1">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { void updateThemeMode(m.value) }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md p-2 text-xs transition-colors',
                    mode === m.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                  )}
                  aria-pressed={mode === m.value}
                  aria-label={m.label}
                >
                  {m.icon}
                  <span className="leading-none">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {mode === 'special' && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Style</div>
              <div className="max-h-48 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-1">
                  {NAMED_STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { void updateThemeStyle(s.value) }}
                      className={cn(
                        'rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                        style === s.value ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                      )}
                      aria-pressed={style === s.value}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### Step 3: Write tests

Create `desktop/src/shared/ui/theme-picker.test.tsx`:

```tsx
import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import { describe, it, expect, vi } from 'vitest'
import { ThemePicker } from './theme-picker'

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}))

describe('ThemePicker', () => {
  it('mounts with a trigger button', () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    expect(screen.getByRole('button', { name: /theme picker/i })).toBeInTheDocument()
  })

  it('opens the popover on click', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    // Mode section heading should be visible
    expect(await screen.findByText(/Mode/i)).toBeInTheDocument()
  })

  it('renders all 4 mode buttons', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    expect(await screen.findByRole('button', { name: /Light/i, pressed: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dark/i, pressed: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /System/i, pressed: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Themed/i, pressed: false })).toBeInTheDocument()
  })

  it('does not render style picker until mode=special', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    // Style heading should not appear until "Themed" mode is selected
    expect(screen.queryByText(/^Style$/)).toBeNull()
  })

  it('shows named-style picker after selecting Themed mode', async () => {
    render(
      <Provider>
        <ThemePicker />
      </Provider>,
    )
    await userEvent.click(screen.getByRole('button', { name: /theme picker/i }))
    await userEvent.click(screen.getByRole('button', { name: /Themed/i }))
    expect(await screen.findByText(/Ocean Light|Forest Dark|青夜|The Finals/)).toBeInTheDocument()
  })
})
```

### Step 4: Run + commit

```bash
pnpm --dir desktop test theme-picker 2>&1 | tail -10

cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
git add desktop/src/shared/ui/theme-picker*
git commit -m "feat(desktop): ThemePicker dropdown (mode + 10 named styles)"
```

Report **DONE** / **BLOCKED** with commit SHA + test count.

---

## Task 8: Delete `theme-atoms.ts` + verify no orphan consumers

**Files:**
- Delete: `desktop/src/features/chat-agent/atoms/theme-atoms.ts`
- Delete: `desktop/src/features/chat-agent/atoms/theme-atoms.test.ts`

### Step 1: Find any remaining consumers

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
grep -rn "from .*theme-atoms\|themeAtom\b" desktop/src 2>&1 | grep -v ".test\." | grep -v "atoms/theme-atoms"
```

Expected: NONE. Tasks 5 + 6 should have caught all consumers. If any remain, retarget them to `atoms/theme.ts`.

### Step 2: Delete the old file + test

```bash
git rm desktop/src/features/chat-agent/atoms/theme-atoms.ts \
       desktop/src/features/chat-agent/atoms/theme-atoms.test.ts
```

### Step 3: Run tests + build

```bash
pnpm --dir desktop test 2>&1 | tail -5
pnpm --dir desktop build 2>&1 | tail -5
```

Expected: tests pass (without the deleted theme-atoms tests); build clean.

### Step 4: Commit

```bash
git add desktop/src/features/chat-agent/atoms/theme-atoms.ts desktop/src/features/chat-agent/atoms/theme-atoms.test.ts 2>/dev/null || true
git commit -m "refactor(desktop): delete theme-atoms.ts (replaced by atoms/theme.ts in Plan 3.1)"
```

Report **DONE** / **BLOCKED** with commit SHA + confirmation that no consumers remain.

---

## Task 9: Smoke verification

**Files:** None.

### Step 1-7: Standard smoke

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme

# Backend tests
cargo test -p hermes-desktop --lib 2>&1 | tail -3

# Frontend tests (expect ≥458)
pnpm --dir desktop test 2>&1 | tail -10

# Production build clean
pnpm --dir desktop build 2>&1 | tail -10

# Warning-free Rust build
RUSTFLAGS="-D warnings" cargo build -p hermes-desktop 2>&1 | tail -3

# Workspace check
cargo check --workspace 2>&1 | tail -3

# App.tsx unchanged vs main (or only minor Provider relocation from Task 6)
git diff b886ec1 -- desktop/src/app/App.tsx | head -10

# stubs/ + peripheral-stubs.ts still gone (Plan 2b.2.c.3 invariants preserved)
ls desktop/src/features/chat-agent/components/stubs/ 2>&1
ls desktop/src/features/chat-agent/lib/peripheral-stubs.ts 2>&1

# theme.ts present, theme-atoms.ts gone
ls desktop/src/features/chat-agent/atoms/theme* 2>&1

# themes.css present
ls desktop/src/styles/themes.css 2>&1
wc -l desktop/src/styles/themes.css

# ThemePicker present
ls desktop/src/shared/ui/theme-picker* 2>&1
```

Expected:
- Backend: 23 PASS unchanged
- Frontend: ≥458 PASS
- Builds: clean
- App.tsx: unchanged OR only the Provider relocation from Task 6
- stubs/ + peripheral-stubs.ts: still gone
- theme.ts + theme.test.ts present; theme-atoms.ts + theme-atoms.test.ts gone
- themes.css present (≥1,000 LOC)
- theme-picker.tsx + .test.tsx present

### Step 8: Bundle size

```bash
ls -lh desktop/dist/assets/*.{js,css} 2>/dev/null | awk '{print $5, $9}' | head -6
```

CSS bundle should grow ~10-15 KB (gzip ~2-3 KB) — the multi-theme tokens. JS bundle unchanged (no new JS imports beyond ThemePicker).

### Step 9: Repo state

```bash
git status --short
git log --oneline main..HEAD | wc -l
git log --oneline main..HEAD | head -15
```

Expected: clean; ~10 commits (9 task commits + 1 spec commit at branch base).

### Step 10: Manual smoke (optional but recommended)

```bash
pnpm --dir desktop tauri dev
```

Window opens; mount ThemePicker temporarily inside App.tsx if not already accessible (or trigger via dev-tools console: `localStorage.setItem('hermes-theme-style', 'ocean-dark'); location.reload();`). Visually verify:
- Default light/dark works
- Switching to `ocean-dark` changes background tint
- Switching to `warm-paper` changes background tint
- Selecting `system` follows OS preference

Kill `tauri dev` after verification: `pkill -f hermes-desktop`.

## Reporting

Report **DONE** / **DONE_WITH_CONCERNS** / **BLOCKED** with:
- Backend test count
- Frontend test count + delta from main's 448
- Build status + CSS bundle delta
- ThemePicker test count
- Whether manual smoke (optional) was performed + outcome

---

## Done When

- All 8 source-affecting tasks complete; Task 9 smoke passes.
- ≥10 new frontend tests pass (target ≥458 cumulative).
- Backend unchanged: 23 Rust tests PASS.
- `theme-atoms.ts` deleted; `atoms/theme.ts` is the single source of truth.
- `themes.css` present with 10 named theme blocks.
- ThemePicker component shippable for Plan 3.3 to mount in Dock.
- Build clean (tsc + vite + cargo).
- App.tsx unchanged (or only the minor Provider-relocation from Task 6).
- No god-file regression (`desktop/src/lib/` still only contains `bridge/`).
- Final code review: APPROVED or APPROVED_WITH_FOLLOWUPS.

## Next Plan

**Plan 3.2 — Workspace atoms + workspace components (~2,800 LOC).** Replace the c.3 dormant `atoms/workspace.ts` stub with the real implementation. Port `components/workspace/` (5 components + tests). Implement Tauri backend (workspaces SQLite table + 5 CRUD commands). Closes Plan 2b.2.c.2 follow-up #4 properly.
