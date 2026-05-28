import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Stub out Tauri plugins that are not available in the test (jsdom) environment.
      // These modules are only resolvable inside a real Tauri runtime; tests that
      // exercise code importing them use vi.mock() at the test level, but Vite's
      // import-analysis pass runs before hoisting and will fail to resolve them
      // unless we provide a fallback alias here.
      "@tauri-apps/plugin-updater": path.resolve(import.meta.dirname, "./src/__mocks__/tauri-plugin-updater.ts"),
      "@tauri-apps/plugin-process": path.resolve(import.meta.dirname, "./src/__mocks__/tauri-plugin-process.ts"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
