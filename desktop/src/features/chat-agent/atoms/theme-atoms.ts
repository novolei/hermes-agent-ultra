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
