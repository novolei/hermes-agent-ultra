import { invoke } from "@tauri-apps/api/core";

/** Normalizes Tauri invoke errors into Error objects with a domain-prefixed message. */
export async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`[bridge:${command}] ${message}`);
  }
}
