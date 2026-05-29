/**
 * useShortcut — 快捷键绑定 Hook
 *
 * STUB: Minimal implementation for porting SpeechButton.
 * Full implementation with platform-aware keybinding, overrides, and modifier
 * matching is deferred to a later task.
 *
 * For now: disabled shortcut registration (preventDefault === false).
 * SpeechButton will render and respond to clicks; global keyboard shortcut
 * support is stubbed.
 */

import { useEffect, useRef } from 'react'

export interface UseShortcutOptions {
  /** 快捷键 ID（对应 shortcut-defaults 中的定义） */
  id: string
  /** 触发时的回调 */
  handler: (e: KeyboardEvent) => void
  /** 是否禁用（默认 false） */
  disabled?: boolean
  /** 是否阻止默认行为（默认 true） */
  preventDefault?: boolean
}

/**
 * Stub implementation: registers handler but does not actually attach to keydown.
 * Keybinding match logic deferred.
 */
export function useShortcut({
  id,
  handler,
  disabled = false,
  preventDefault = true,
}: UseShortcutOptions): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  // TODO: Implement full keydown listener with shortcut matching.
  // For now, shortcut is not active in the browser.
  useEffect(() => {
    if (disabled) return
    // Stub: no-op
  }, [id, disabled, preventDefault])
}

/**
 * Bind multiple shortcuts (stub).
 */
export function useShortcuts(
  shortcuts: Array<Omit<UseShortcutOptions, 'handler'> & { handler: (e: KeyboardEvent) => void }>,
): void {
  // Stub: no-op
}
