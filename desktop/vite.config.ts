import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Stub out Tauri plugins that are not yet wired on the Rust side.
      // The plugin npm packages are intentionally NOT installed (Plan 3.3 has
      // not shipped updater/process backends). Until they do, these aliases
      // route the JS imports to the same no-op mocks vitest uses, so the dev
      // server's import-analysis pass resolves cleanly and the verbatim-ported
      // updater.ts atom gracefully degrades at runtime.
      "@tauri-apps/plugin-updater": path.resolve(
        import.meta.dirname,
        "./src/__mocks__/tauri-plugin-updater.ts",
      ),
      "@tauri-apps/plugin-process": path.resolve(
        import.meta.dirname,
        "./src/__mocks__/tauri-plugin-process.ts",
      ),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
