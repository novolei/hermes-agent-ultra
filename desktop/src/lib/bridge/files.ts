/**
 * Plan 2b.2.c.3 — frontend wrappers for the Rust Tauri commands defined in
 * desktop/src-tauri/src/commands/files.rs. Replaces the no-op stubs in
 * peripheral-stubs.ts; consumers (InlineImage in AgentMessages, sdk-message-renderer,
 * tool-activity-item) retarget to import from here.
 */
import { commands } from './generated'

/**
 * Read a file from disk and return its base64-encoded bytes.
 * Returns null if the file is missing or unreadable.
 */
export async function readAttachment(localPath: string): Promise<string | null> {
  try {
    const result = await commands.readAttachment(localPath)
    return result.status === 'ok' ? result.data : null
  } catch {
    return null
  }
}

export interface SaveImageArgs {
  localPath: string
  filename: string
  mediaType: string
}

/**
 * Open the native save-as dialog and copy `localPath` to the chosen target.
 * Returns true on success, false on user cancel or copy failure.
 */
export async function saveImageAs(args: SaveImageArgs): Promise<boolean> {
  try {
    const result = await commands.saveImageAs({
      local_path: args.localPath,
      filename: args.filename,
      media_type: args.mediaType,
    })
    return result.status === 'ok' ? result.data : false
  } catch {
    return false
  }
}
