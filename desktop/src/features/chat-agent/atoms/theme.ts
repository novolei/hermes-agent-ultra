// Plan 3.1 — verbatim port from uclaw atoms/theme.ts. Replaces the simple
// themeAtom from Plan 2b.2.b.1 (deleted in Task 8 of this plan). Storage
// keys rebranded uclaw-* → hermes-* per Plan 2b.2.c.2 precedent.
//
// Tauri `invoke('get_theme_preferences')` etc. are not yet implemented —
// they fall back to localStorage (matches uclaw upstream behavior in
// environments without the backend).

/**
 * 主题状态原子
 *
 * 管理应用主题模式（浅色/深色/跟随系统/特殊风格）和特殊风格。
 * 从 uclaw 迁移，Tauri IPC 尚未实现，回退到 localStorage。
 */

import { atom } from 'jotai'
import type { ThemeMode, ThemeStyle } from '../lib/chat-types'

/** localStorage 缓存键 */
const THEME_CACHE_KEY = 'hermes-theme-mode'
const THEME_STYLE_CACHE_KEY = 'hermes-theme-style'

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
 * 初始化主题系统
 *
 * Tauri `invoke('get_settings')` 尚未实现 — 回退到 localStorage。
 * 当后端命令就绪后，此处替换为真实的 bridge.getSettings() 调用。
 */
export async function initializeTheme(
  setThemeMode: (mode: ThemeMode) => void,
  setSystemIsDark: (isDark: boolean) => void,
  setThemeStyle?: (style: ThemeStyle) => void,
): Promise<() => void> {
  // 从 Tauri 后端加载设置（尚未实现，回退到缓存值）
  try {
    // Plan 3.1: Tauri invoke('get_settings') not yet wired — use localStorage
    const themeMode = getCachedThemeMode()
    setThemeMode(themeMode)
    cacheThemeMode(themeMode)
    if (setThemeStyle) {
      const themeStyle = getCachedThemeStyle()
      setThemeStyle(themeStyle)
    }
  } catch {
    // 回退到缓存值
    console.warn('[Theme] 无法从后端加载主题设置，使用缓存值')
  }

  // 系统主题检测（Web API）
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setSystemIsDark(isDark)

  // 监听系统主题变化
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
 * 更新主题模式并持久化
 *
 * Plan 3.1: Tauri invoke('patch_settings') not yet wired — persists to
 * localStorage only (matches Plan 2b.2.c.2 ui-preferences.ts pattern).
 */
export async function updateThemeMode(mode: ThemeMode): Promise<void> {
  cacheThemeMode(mode)
}

/**
 * 更新特殊风格并持久化
 */
export async function updateThemeStyle(style: ThemeStyle): Promise<void> {
  cacheThemeStyle(style)
}

// Re-export types for convenience
export type { ThemeMode, ThemeStyle }
