/**
 * shortcut-registry — keyboard accelerator lookup + display helpers
 *
 * Verbatim port of uclaw `@/lib/shortcut-registry`.
 * Placeholder only: both functions return empty/fallback strings until the
 * real shortcut system is wired up (Plan 4.x).
 */

/** 获取当前平台的快捷键 */
export function getActiveAccelerator(_shortcutId: string): string {
  return ''
}

/** 获取快捷键的显示文本 */
export function getAcceleratorDisplay(accelerator: string): string {
  return accelerator || 'Esc'
}
