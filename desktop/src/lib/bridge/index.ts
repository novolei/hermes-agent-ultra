// Thin re-export only. No logic here. One domain module per backend `commands/<domain>.rs`.
export * as appBridge from "./app";
export { call } from "./client";
