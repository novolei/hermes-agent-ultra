import { invoke } from "@tauri-apps/api/core";

/** Normalizes Tauri invoke errors into Error objects with a domain-prefixed message. */
export async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (err) {
    const message = extractErrorMessage(err);
    throw new Error(`[bridge:${command}] ${message}`);
  }
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  // Fall back to JSON for fully-opaque payloads; never to "[object Object]".
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
