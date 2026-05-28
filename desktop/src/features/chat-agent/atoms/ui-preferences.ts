/**
 * UI 偏好设置状态管理
 *
 * 管理用户界面相关的显示偏好。
 * 从 uClaw 迁移，IPC 使用 tauri-bridge 适配层。
 */

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// ===== localStorage 缓存键 =====

const STICKY_USER_MESSAGE_CACHE_KEY = 'hermes-sticky-user-message'

// ===== Jotai Atoms =====

/** 是否显示用户消息悬浮置顶条 */
export const stickyUserMessageEnabledAtom = atom<boolean>(true)

/**
 * 是否显示输入框上方的 Agent 状态条（AgentStatusBar）。
 * 默认关闭——流式气泡内已有 AgentRunningIndicator，状态条属可选的额外信息密度。
 * 用 atomWithStorage 自持久化，无需 initializeUiPreferences 接线。
 */
export const agentStatusBarEnabledAtom = atomWithStorage<boolean>(
  'hermes-agent-status-bar',
  false,
)

/**
 * 是否启用 Plan 模式自动建议横幅（PlanModeSuggestBanner）。
 * 用户点击"不再建议"后置为 false，持久化到 localStorage。
 */
export const planModeSuggestEnabledAtom = atomWithStorage<boolean>(
  'hermes-plan-mode-suggest-enabled',
  true,
)

// ===== 缓存读取 =====

function getCachedStickyUserMessage(): boolean {
  try {
    const cached = localStorage.getItem(STICKY_USER_MESSAGE_CACHE_KEY)
    if (cached === 'true' || cached === 'false') {
      return cached === 'true'
    }
  } catch {
    // localStorage 不可用时忽略
  }
  return true
}

// ===== 初始化 =====

/**
 * 从后端加载 UI 偏好设置
 *
 * Plan 2b.2.c.2 — Rust 命令 `get_ui_preferences` / `set_*` 尚未实现
 * (在 Plan 2b.2.c.3 / Plan 3.5 设置 UI 中落地)。
 * 使用缓存值保持原子在 MVP + 测试中可用。
 */
export async function initializeUiPreferences(
  setStickyUserMessageEnabled: (enabled: boolean) => void,
): Promise<void> {
  try {
    // 目前使用缓存值，直到后端命令就绪
    const cached = getCachedStickyUserMessage()
    setStickyUserMessageEnabled(cached)
  } catch (error) {
    console.error('[UI偏好] 初始化失败:', error)
  }
}

// ===== 持久化更新 =====

/**
 * Plan 2b.2.c.3 — the Rust `set_sticky_user_message_enabled` command has not
 * been implemented yet (settings UI lands in Plan 3.5). For MVP we persist to
 * localStorage directly so the atom is usable from the React side without
 * blocking on a backend that hasn't shipped. When the real Rust command lands,
 * this function becomes the thin Tauri-invoke wrapper it was in uclaw.
 */
export async function updateStickyUserMessageEnabled(enabled: boolean): Promise<void> {
  // 使用 localStorage 缓存用户偏好设置
  try {
    localStorage.setItem(STICKY_USER_MESSAGE_CACHE_KEY, String(enabled))
  } catch {
    // localStorage 不可用时忽略
  }
}
