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
