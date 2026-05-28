// Thin re-export only. No logic here. One domain module per backend `commands/<domain>.rs`.
// `call` stays INTERNAL to lib/bridge/ — consumers use the per-domain bridges only.
export * as appBridge from "./app";
export type { AppInfo } from "./generated";
