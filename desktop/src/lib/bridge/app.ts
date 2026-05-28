import { call } from "./client";
import type { AppInfo } from "./generated";

export type { AppInfo };

export function appInfo(): Promise<AppInfo> {
  return call<AppInfo>("app_info");
}
