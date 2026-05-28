# Plan 3.1 Desktop Multi-Theme Recon

**Date:** 2026-05-28  
**Branch:** feat/desktop-multi-theme  
**Parent commit (main):** b886ec1

---

## Step 1: themeAtom Consumers

Located in `desktop/src/features/chat-agent/atoms/theme-atoms.ts` and consuming files:

1. **theme-atoms.test.ts** (unit tests)
   - Line 3: import `themeAtom`
   - Lines 12, 17, 18, 25, 27: store.get/set operations

2. **pierre-theme.ts** (Pierre code block renderer)
   - Line 2: import `themeAtom`
   - Line 13: `useAtomValue(themeAtom)` to read current theme

3. **write-result.test.tsx** (unit tests)
   - Line 5: import `themeAtom`
   - Line 19: store.set operations

4. **read-result.test.tsx** (unit tests)
   - Line 5: import `themeAtom`
   - Line 18: store.set operations

5. **edit-result.test.tsx** (unit tests)
   - Line 5: import `themeAtom`
   - Line 18: store.set operations

**Summary:** 5 files consume themeAtom. 1 production consumer (pierre-theme.ts), 4 test files.

---

## Step 2: Current theme-atoms.ts Full Content

**File:** `desktop/src/features/chat-agent/atoms/theme-atoms.ts`

```typescript
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

**Exports:**
- `ThemeName`: type union `'light' | 'dark'`
- `themeAtom`: Jotai atom with initial value `'light'`
- `applyThemeToDocumentEffect`: function returning unsubscribe closure

**Current behavior:**
- Atom has only 2 themes: light and dark
- Applies theme to `<html data-theme="light|dark">`
- No storage persistence or system-mode detection yet

---

## Step 3: uclaw atoms/theme.ts Full Content

**File:** `/Users/ryanliu/Documents/uclaw/ui/src/atoms/theme.ts`

```typescript
/**
 * 主题状态原子
 *
 * 管理应用主题模式（浅色/深色/跟随系统/特殊风格）和特殊风格。
 * 从 Proma 迁移，IPC 使用 tauri-bridge 适配层。
 */

import { atom } from 'jotai'
import type { ThemeMode, ThemeStyle } from '@/lib/chat-types'
import * as bridge from '@/lib/tauri-bridge'

/** localStorage 缓存键 */
const THEME_CACHE_KEY = 'uclaw-theme-mode'
const THEME_STYLE_CACHE_KEY = 'uclaw-theme-style'

function getCachedThemeMode(): ThemeMode {
  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY)
    if (cached === 'light' || cached === 'dark' || cached === 'system' || cached === 'special') {
      return cached
    }
  } catch {
    // localStorage 不可用时忽略
  }
  return 'dark'
}

const VALID_THEME_STYLES: ThemeStyle[] = [
  'default', 'ocean-light', 'ocean-dark', 'forest-light', 'forest-dark',
  'slate-light', 'slate-dark', 'warm-paper', 'qingye', 'black', 'the-finals',
]

function getCachedThemeStyle(): ThemeStyle {
  try {
    const cached = localStorage.getItem(THEME_STYLE_CACHE_KEY)
    if (cached && VALID_THEME_STYLES.includes(cached as ThemeStyle)) {
      return cached as ThemeStyle
    }
  } catch {
    // localStorage 不可用时忽略
  }
  return 'default'
}

function cacheThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_CACHE_KEY, mode)
  } catch {
    // localStorage 不可用时忽略
  }
}

function cacheThemeStyle(style: ThemeStyle): void {
  try {
    localStorage.setItem(THEME_STYLE_CACHE_KEY, style)
  } catch {
    // localStorage 不可用时忽略
  }
}

/** 用户选择的主题模式 */
export const themeModeAtom = atom<ThemeMode>(getCachedThemeMode())

/** 用户选择的特殊风格 */
export const themeStyleAtom = atom<ThemeStyle>(getCachedThemeStyle())

/** 系统当前是否为深色模式 */
export const systemIsDarkAtom = atom<boolean>(true)

/** 派生：最终解析的主题（light | dark） */
export const resolvedThemeAtom = atom<'light' | 'dark'>((get) => {
  const mode = get(themeModeAtom)
  if (mode === 'system') {
    return get(systemIsDarkAtom) ? 'dark' : 'light'
  }
  if (mode === 'special') {
    const style = get(themeStyleAtom)
    return DARK_THEME_STYLES.includes(style) ? 'dark' : 'light'
  }
  return mode
})

const ALL_THEME_STYLE_CLASSES = [
  'theme-ocean-light',
  'theme-ocean-dark',
  'theme-forest-light',
  'theme-forest-dark',
  'theme-slate-light',
  'theme-slate-dark',
  'theme-warm-paper',
  'theme-qingye',
  'theme-black',
  'theme-the-finals',
] as const

/** 这些特殊风格是深色主题 */
const DARK_THEME_STYLES: ThemeStyle[] = [
  'ocean-dark', 'forest-dark', 'slate-dark', 'qingye', 'black', 'the-finals',
]

/**
 * 应用主题到 DOM
 */
export function applyThemeToDOM(themeMode: ThemeMode, themeStyle: ThemeStyle = 'default', systemIsDark: boolean = true): void {
  const html = document.documentElement
  let targetStyleClass: string | null = null
  let targetIsDark: boolean

  if (themeMode === 'special' && themeStyle !== 'default') {
    targetStyleClass = `theme-${themeStyle}`
    targetIsDark = DARK_THEME_STYLES.includes(themeStyle)
  } else if (themeMode === 'system') {
    targetIsDark = systemIsDark
  } else {
    targetIsDark = themeMode === 'dark'
  }

  const currentIsDark = html.classList.contains('dark')
  const currentStyleClass = ALL_THEME_STYLE_CLASSES.find((c) => html.classList.contains(c)) ?? null

  if (currentIsDark === targetIsDark && currentStyleClass === targetStyleClass) {
    return
  }

  if (currentStyleClass !== targetStyleClass) {
    if (currentStyleClass) html.classList.remove(currentStyleClass)
    if (targetStyleClass) html.classList.add(targetStyleClass)
  }
  if (currentIsDark !== targetIsDark) {
    html.classList.toggle('dark', targetIsDark)
  }
}

/**
 * 初始化主题系统（使用 Tauri bridge）
 */
export async function initializeTheme(
  setThemeMode: (mode: ThemeMode) => void,
  setSystemIsDark: (isDark: boolean) => void,
  setThemeStyle?: (style: ThemeStyle) => void,
): Promise<() => void> {
  // 从 Tauri 后端加载设置
  try {
    const settings = await bridge.getSettings()
    const themeMode = (settings.theme === 'light' || settings.theme === 'dark' || settings.theme === 'system' || settings.theme === 'special')
      ? settings.theme as ThemeMode
      : 'dark'
    setThemeMode(themeMode)
    cacheThemeMode(themeMode)
  } catch {
    // Tauri API 不可用时使用缓存值
    console.warn('[Theme] 无法从后端加载主题设置，使用缓存值')
  }

  // 系统主题检测（Tauri 环境中通过 CSS media query 或后端获取）
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setSystemIsDark(isDark)

  // 监听系统主题变化（使用 Web API）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleChange = (e: MediaQueryListEvent): void => {
    setSystemIsDark(e.matches)
  }
  mediaQuery.addEventListener('change', handleChange)

  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

/**
 * 更新主题模式并持久化（使用 Tauri bridge）
 */
export async function updateThemeMode(mode: ThemeMode): Promise<void> {
  cacheThemeMode(mode)
  await bridge.patchSettings({ theme: mode })
}

/**
 * 更新特殊风格并持久化
 */
export async function updateThemeStyle(style: ThemeStyle): Promise<void> {
  cacheThemeStyle(style)
}

// Re-export types for convenience
export type { ThemeMode, ThemeStyle }
```

**Key exports:**
- `themeModeAtom`: stores `'light' | 'dark' | 'system' | 'special'` (init from localStorage cache key `uclaw-theme-mode`)
- `themeStyleAtom`: stores themed style name (10 options), init from `uclaw-theme-style`
- `systemIsDarkAtom`: reflects OS dark mode preference
- `resolvedThemeAtom`: derived atom computing final light/dark from mode + style
- `applyThemeToDOM()`: applies both `dark` class and `theme-*` class to `<html>`
- `initializeTheme()`: async init with Tauri bridge fallback
- `updateThemeMode()`, `updateThemeStyle()`: persist updates

---

## Step 4: Storage Keys (Rename Map)

**uclaw -> hermes-agent-ultra rebrand:**

| uclaw key | Expected hermes key |
|-----------|-------------------|
| `uclaw-theme-mode` | `hermes-theme-mode` |
| `uclaw-theme-style` | `hermes-theme-style` |

---

## Step 5: Named Theme CSS Block Line Ranges in uclaw globals.css

**File:** `/Users/ryanliu/Documents/uclaw/ui/src/styles/globals.css` (2587 lines total)

| Theme Name | Type | Line Range | CSS Variables |
|-----------|------|-----------|---|
| `.theme-warm-paper` | Single block | 1995–2005 | code-bg, code-fg, code-border, code-header-bg/fg/hover, code-scrollbar |
| `.theme-ocean-light` | Grouped | 2006–2018 | (shared with forest-light, slate-light) |
| `.theme-forest-light` | Grouped | 2006–2018 | (shared with ocean-light, slate-light) |
| `.theme-slate-light` | Grouped | 2006–2018 | (shared with ocean-light, forest-light) |
| `.theme-ocean-dark` | Grouped | 2019–2032 | (shared with forest-dark, slate-dark, qingye) |
| `.theme-forest-dark` | Grouped | 2019–2032 | (shared with ocean-dark, slate-dark, qingye) |
| `.theme-slate-dark` | Grouped | 2019–2032 | (shared with ocean-dark, forest-dark, qingye) |
| `.theme-qingye` | Grouped | 2019–2032 | (shared with ocean-dark, forest-dark, slate-dark) |
| `.theme-black` | Single block | 2033–2043 | code-bg, code-fg, code-border, code-header-bg/fg/hover, code-scrollbar |
| `.theme-the-finals` | Single block | 2044–2055 | code-bg, code-fg, code-border, code-header-bg/fg/hover, code-scrollbar |

**Total: 10 named theme blocks found** (5 single, 5 grouped).

---

## Step 6: Current styles/index.css

**File:** `desktop/src/styles/index.css`

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

**Current state:**
- Uses `[data-theme="dark"]` selector (matches Plan 2b.2.c)
- Defines `--code-bg` in `:root` only (missing in `[data-theme="dark"]`)
- No `.theme-*` class blocks yet—Plan 3.1 Task 2 will port all 10 from uclaw
- Tailwind will extend these CSS variables in theme config

---

## Step 7: Current tailwind.config.js darkMode Setting

**File:** `desktop/tailwind.config.js`

```javascript
darkMode: ["class", '[data-theme="dark"]'],
```

**Current state:**
- Hybrid mode: checks `class="dark"` on HTML **or** `[data-theme="dark"]` attribute
- Allows both Tailwind class-based and Plan 2b theme attribute approaches
- Plan 3.1 will keep this unchanged (no tailwind.config.js modification needed)

---

## Step 8: Entry Point + Provider Location

**main.tsx exists:** YES  
**Location:** `desktop/src/main.tsx`

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import "@/shared/i18n";
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**Provider location:** `desktop/src/app/App.tsx` (wraps root component)

```typescript
import { Provider } from 'jotai'
import { ChatAgentView } from '@/features/chat-agent/components/chat-agent-view'

export function App() {
  return (
    <Provider>
      <ChatAgentView sessionId={SESSION_ID} />
    </Provider>
  )
}
```

**State:** Provider already wraps App (Plan 2b.2.c.3). `applyThemeToDocumentEffect` NOT yet subscribed.

---

## Step 9: Out-of-Scope Imports Flagged

**applyThemeToDocumentEffect current usage:**
- Defined in theme-atoms.ts
- Only tested in theme-atoms.test.ts (not wired to startup)
- NOT imported in App.tsx or any production mount point yet

**Concern:** Plan 3.1 Task 6 (Bootstrap) must subscribe `applyThemeToDocumentEffect(store)` in App.tsx or a mounted effect; currently no hook invokes it.

---

## Commit

```bash
cd /Users/ryanliu/Documents/hermes-agent-ultra/.worktrees/desktop-multi-theme
git add docs/superpowers/plans/2026-05-28-desktop-multi-theme-recon.md
git commit -m "docs(plan): recon Plan 3.1 multi-theme consumer + CSS surface"
```
