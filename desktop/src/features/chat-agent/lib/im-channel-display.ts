/**
 * im-channel-display — visual mapping for IM-origin agent sessions.
 *
 * Plan 3.2 — ported from uclaw lib/im-channel-display.ts.
 * Channel logo assets (wechat, feishu) are not yet available in this
 * workspace; `logoSrc` is omitted until assets are added.  Components
 * fall back to `emoji` when `logoSrc` is undefined, so the UI remains
 * functional.
 *
 * When `imChannelType` is present on a session (sourced from the
 * `im_sessions` JOIN in list_agent_sessions), the sidebar item and tab
 * surface a channel-specific marker so users can tell at a glance which
 * sessions are bridged from external IM channels.
 *
 * Channel keys mirror `crate::channels::types::ImChannelType::as_str` on
 * the backend.
 */

export interface ImChannelDisplay {
  /** Imported logo URL when a real asset exists. Components prefer this
   *  over `emoji` whenever present. */
  logoSrc?: string
  /** Emoji fallback for channels without a logo. Always present. */
  emoji: string
  /** Short Chinese label for tooltips and accessibility text. */
  label: string
}

const CHANNEL_TABLE: Record<string, ImChannelDisplay> = {
  // WeChat personal (iLink)
  wechat_ilink: { emoji: '💬', label: '微信' },
  // Enterprise WeChat (WeCom)
  wecom_bot:    { emoji: '🏢', label: '企业微信' },
  feishu:       { emoji: '🪶', label: '飞书' },
  dingtalk:     { emoji: '🔔', label: '钉钉' },
  email:        { emoji: '✉️', label: '邮件' },
  webhook:      { emoji: '🪝', label: 'Webhook' },
}

const UNKNOWN_CHANNEL: ImChannelDisplay = { emoji: '📩', label: 'IM' }

export function imChannelDisplay(channelType: string | undefined | null): ImChannelDisplay | null {
  if (!channelType) return null
  return CHANNEL_TABLE[channelType] ?? UNKNOWN_CHANNEL
}
