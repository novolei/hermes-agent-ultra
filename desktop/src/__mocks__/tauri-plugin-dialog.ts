/**
 * Stub for @tauri-apps/plugin-dialog — used in dev/test where the Tauri
 * dialog plugin is not installed. Provides the minimal `open` surface that
 * files-rail/workspace/WorkspacePanelFooter imports so Vite's import-analysis
 * resolves it. Returns null (user-cancelled) so the verbatim-ported component
 * gracefully no-ops until the Rust dialog plugin ships.
 */
export interface OpenDialogOptions {
  multiple?: boolean
  directory?: boolean
  title?: string
  filters?: Array<{ name: string; extensions: string[] }>
}

export async function open(
  _options?: OpenDialogOptions,
): Promise<string | string[] | null> {
  return null
}
