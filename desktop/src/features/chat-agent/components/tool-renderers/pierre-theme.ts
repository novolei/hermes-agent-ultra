import { useAtomValue } from 'jotai'
import { resolvedThemeAtom } from '@/features/chat-agent/atoms/theme'

/**
 * Ported from uclaw's tool-renderers/pierre-theme.ts.
 *
 * Plan 3.1 — retargeted from the simple themeAtom (Plan 2b.2.b.1) to the
 * resolvedThemeAtom derived atom from the multi-theme port. The `'light' | 'dark'`
 * union is preserved; switching to a named theme (e.g., ocean-dark) properly
 * resolves to 'dark' for syntax highlighting.
 */
export function usePierreTheme(): 'one-light' | 'one-dark-pro' {
  const theme = useAtomValue(resolvedThemeAtom)
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
