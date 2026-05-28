import { call } from "./client";

/** Mirrors `services::app_service::AppInfo` (Rust). Generated via tauri-specta in Plan 2. */
export interface AppInfo {
  name: string;
  version: string;
  platform: string;
}

export function appInfo(): Promise<AppInfo> {
  return call<AppInfo>("app_info");
}
