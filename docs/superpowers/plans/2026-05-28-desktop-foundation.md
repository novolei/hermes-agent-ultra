# Desktop Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up `desktop/` — a launchable Tauri v2 + React/TS desktop app wired into the existing Cargo workspace — with the anti-god-file module structure (backend `commands/`+`services/`, frontend `lib/bridge/`+`features/`), Tailwind+shadcn baseline, i18n scaffold, and one typed end-to-end `app_info` command proving in-process IPC and the testable trait-service layer.

**Architecture:** The desktop backend is a Rust Tauri crate (`hermes-desktop`) inside the same Cargo workspace as `hermes-core`/`hermes-agent` — this realizes the ADR's **embed-in-process** decision (no sidecar). Commands are thin (`commands/<domain>.rs`) and delegate to a trait-based service layer (`services/<domain>.rs`) that is unit-testable without Tauri. The frontend is feature-based (`src/features/<domain>/`), all IPC funnels through `src/lib/bridge/<domain>.ts`, and shared design-system primitives live in `src/shared/`.

**Tech Stack:** Tauri v2, Rust (edition 2021, rustc 1.95), React 18 + TypeScript + Vite, Tailwind CSS v3 + shadcn-style primitives, i18next, Jotai (added in Plan 3), vitest, cargo test.

> **Layout note:** This plan uses the standard Tauri v2 layout — frontend root at `desktop/` (React in `desktop/src/`) + `desktop/src-tauri/` (Rust). The ADR's `desktop/ui/...` paths map to `desktop/src/...`. Reference ADR: [docs/roadmaps/DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md](../../roadmaps/DESKTOP_APP_FRAMEWORK_ADR_2026-05-28.md).

---

## File Structure (created by this plan)

```
Cargo.toml                              # MODIFY: add "desktop/src-tauri" to workspace members
desktop/
  package.json                          # frontend deps + tauri scripts (pnpm)
  index.html  vite.config.ts  tsconfig*.json
  tailwind.config.js  postcss.config.js
  vitest.config.ts
  src/
    main.tsx                            # React entry
    app/
      App.tsx                           # minimal shell (consumes app_info + i18n)
    shared/
      lib/cn.ts                         # clsx + tailwind-merge helper
      ui/button.tsx                     # shadcn-style Button primitive
      i18n/index.ts                     # i18next init
      i18n/locales/en.json
      i18n/locales/zh.json
    lib/bridge/
      index.ts                          # thin re-export aggregator (no logic)
      client.ts                         # invoke/listen wrapper + error normalization
      app.ts                            # appInfo() typed bridge + AppInfo type
    features/                           # (empty .gitkeep; populated in Plans 2-6)
    styles/index.css                    # Tailwind + shadcn CSS variables
  src-tauri/
    Cargo.toml                          # MODIFY: name=hermes-desktop, workspace inheritance
    tauri.conf.json  build.rs  capabilities/  icons/   # from scaffold
    src/
      main.rs                           # calls hermes_desktop_lib::run()
      lib.rs                            # thin: builder + generate_handler! list
      state.rs                          # AppState (Arc handles; empty for now)
      commands/
        mod.rs                          # domain module declarations (aggregator)
        app.rs                          # #[tauri::command] app_info -> AppInfo
      services/
        mod.rs                          # service module declarations
        app_service.rs                  # AppService::info() + AppInfo + unit test
```

---

## Task 1: Scaffold the Tauri v2 React-TS app into `desktop/`

**Files:**
- Create: `desktop/**` (via official scaffolder)

- [ ] **Step 1: Run the official Tauri scaffolder (non-interactive)**

Run from the repo root (`/Users/ryanliu/Documents/hermes-agent-ultra`):

```bash
pnpm create tauri-app@latest desktop --template react-ts --manager pnpm -y
```

Expected: creates `desktop/` containing `package.json`, `index.html`, `vite.config.ts`, `src/` (React TS), and `src-tauri/` (Rust Tauri v2).

> If the CLI ignores flags and prompts interactively, answer: project name `desktop`, frontend `TypeScript / JavaScript`, package manager `pnpm`, UI template `React`, flavor `TypeScript`.

- [ ] **Step 2: Install frontend dependencies**

```bash
cd desktop && pnpm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 3: Verify the scaffold builds (Rust + frontend)**

```bash
pnpm --dir desktop build          # vite build of frontend -> desktop/dist
cargo build --manifest-path desktop/src-tauri/Cargo.toml
```

Expected: both succeed (Rust build will compile tauri + the scaffold app).

- [ ] **Step 4: Commit the scaffold**

```bash
git add desktop .gitignore
git commit -m "chore(desktop): scaffold Tauri v2 + React-TS app"
```

---

## Task 2: Wire `desktop/src-tauri` into the Cargo workspace as `hermes-desktop`

**Files:**
- Modify: `Cargo.toml` (root workspace members)
- Modify: `desktop/src-tauri/Cargo.toml`

- [ ] **Step 1: Add the desktop crate to the root workspace members**

In `Cargo.toml` (root), add the member to the `members` array (alphabetically after the crates list is fine). Change:

```toml
    "crates/hermes-telemetry",
    "crates/hermes-parity-tests",
]
```

to:

```toml
    "crates/hermes-telemetry",
    "crates/hermes-parity-tests",
    "desktop/src-tauri",
]
```

- [ ] **Step 2: Rename the desktop crate and inherit workspace metadata**

Edit the top of `desktop/src-tauri/Cargo.toml`. Replace the scaffold's `[package]` block so it reads:

```toml
[package]
name = "hermes-desktop"
version = { workspace = true }
edition = { workspace = true }
license = { workspace = true }
repository = { workspace = true }
description = "Hermes Agent Ultra cross-platform desktop app (Tauri v2)"

[lib]
name = "hermes_desktop_lib"
crate-type = ["lib", "cdylib", "staticlib"]
```

Leave the scaffold's `[build-dependencies]` (`tauri-build`) and `[dependencies]` (`tauri`, `serde`, `serde_json`, `tauri-plugin-*`) intact.

- [ ] **Step 3: Verify the workspace builds the desktop crate by package name**

Run from repo root:

```bash
cargo build -p hermes-desktop
```

Expected: PASS. (If it errors with "package not found", the member path in Step 1 is wrong.)

- [ ] **Step 4: Commit**

```bash
git add Cargo.toml Cargo.lock desktop/src-tauri/Cargo.toml
git commit -m "chore(desktop): join Cargo workspace as hermes-desktop crate"
```

---

## Task 3: Backend anti-god-file skeleton — `services/app_service.rs` (TDD) + `commands/app.rs` + thin `lib.rs`

**Files:**
- Create: `desktop/src-tauri/src/services/mod.rs`
- Create: `desktop/src-tauri/src/services/app_service.rs`
- Create: `desktop/src-tauri/src/commands/mod.rs`
- Create: `desktop/src-tauri/src/commands/app.rs`
- Create: `desktop/src-tauri/src/state.rs`
- Modify: `desktop/src-tauri/src/lib.rs`

- [ ] **Step 1: Write the failing service unit test**

Create `desktop/src-tauri/src/services/app_service.rs` with the type, service, and a test (implementation intentionally returns a wrong value first so the test fails):

```rust
//! App-level metadata service. Pure logic, unit-testable without Tauri.

use serde::Serialize;

/// Basic application metadata surfaced to the frontend.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
}

/// Stateless service exposing app metadata.
#[derive(Debug, Default, Clone)]
pub struct AppService;

impl AppService {
    pub fn new() -> Self {
        Self
    }

    pub fn info(&self) -> AppInfo {
        AppInfo {
            name: "WRONG".to_string(), // placeholder to make the test fail first
            version: env!("CARGO_PKG_VERSION").to_string(),
            platform: std::env::consts::OS.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn info_reports_name_version_and_platform() {
        let info = AppService::new().info();
        assert_eq!(info.name, "Hermes Agent Ultra");
        assert_eq!(info.version, env!("CARGO_PKG_VERSION"));
        assert_eq!(info.platform, std::env::consts::OS);
    }
}
```

- [ ] **Step 2: Declare the services module and run the test to verify it fails**

Create `desktop/src-tauri/src/services/mod.rs`:

```rust
pub mod app_service;
```

Add `mod services;` to `desktop/src-tauri/src/lib.rs` (near the top, after any existing `mod` lines). Then run:

```bash
cargo test -p hermes-desktop info_reports_name_version_and_platform
```

Expected: FAIL — `assertion failed: left: "WRONG", right: "Hermes Agent Ultra"`.

- [ ] **Step 3: Implement the minimal fix**

In `desktop/src-tauri/src/services/app_service.rs`, change the `name` line in `info()`:

```rust
            name: "Hermes Agent Ultra".to_string(),
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cargo test -p hermes-desktop info_reports_name_version_and_platform
```

Expected: PASS (1 passed).

- [ ] **Step 5: Add the thin command that delegates to the service**

Create `desktop/src-tauri/src/state.rs`:

```rust
//! Shared application state. Holds Arc handles to services.
//! (Hermes core services are added in Plan 2.)

use crate::services::app_service::AppService;

#[derive(Clone, Default)]
pub struct AppState {
    pub app: AppService,
}
```

Create `desktop/src-tauri/src/commands/app.rs` (thin: parse → call service → map result; no business logic):

```rust
//! `app` domain commands. Thin wrappers over `services::app_service`.

use crate::services::app_service::AppInfo;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn app_info(state: State<'_, AppState>) -> AppInfo {
    state.app.info()
}
```

Create `desktop/src-tauri/src/commands/mod.rs` (aggregator — declares domain modules; the `generate_handler!` list in `lib.rs` references `commands::<domain>::<fn>`):

```rust
//! Command modules, one file per domain. Keep commands thin; logic lives in `services`.
//! As domains grow, add `pub mod <domain>;` here and reference fns in `lib.rs`'s
//! `generate_handler!` list — never collapse them into one file.

pub mod app;
```

- [ ] **Step 6: Make `lib.rs` thin — register state + the command**

Replace the body of `desktop/src-tauri/src/lib.rs` with (keeping the scaffold's mobile entry attribute):

```rust
mod commands;
mod services;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![commands::app::app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

> Note: the scaffold registers `tauri_plugin_opener` and a default `greet` command. Remove the scaffold's `greet` function and its `src/main.rs` reference; if the scaffold did not include `tauri_plugin_opener`, delete that `.plugin(...)` line. Keep whatever plugins the scaffold actually added.

- [ ] **Step 7: Verify the crate builds and tests pass**

```bash
cargo build -p hermes-desktop
cargo test -p hermes-desktop
```

Expected: build PASS; tests PASS (1 passed).

- [ ] **Step 8: Commit**

```bash
git add desktop/src-tauri/src
git commit -m "feat(desktop): thin commands + trait-service skeleton (app_info)"
```

---

## Task 4: Frontend feature-based structure + Tailwind + shadcn baseline

**Files:**
- Create: `desktop/tailwind.config.js`, `desktop/postcss.config.js`
- Create: `desktop/src/styles/index.css`
- Create: `desktop/src/shared/lib/cn.ts`
- Create: `desktop/src/shared/ui/button.tsx`
- Create: `desktop/src/features/.gitkeep`
- Modify: `desktop/src/main.tsx`

- [ ] **Step 1: Install Tailwind v3 + shadcn utility deps**

```bash
cd desktop
pnpm add -D tailwindcss@3 postcss autoprefixer
pnpm add class-variance-authority clsx tailwind-merge
npx tailwindcss init -p
```

Expected: creates `tailwind.config.js` and `postcss.config.js`.

- [ ] **Step 2: Configure Tailwind content globs + base tokens**

Replace `desktop/tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Create the global stylesheet with shadcn CSS variables**

Create `desktop/src/styles/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --border: 240 3.7% 15.9%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Create the `cn` helper**

Create `desktop/src/shared/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Create the shadcn-style Button primitive**

Create `desktop/src/shared/ui/button.tsx`:

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        outline: "border border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";
```

- [ ] **Step 6: Import the global stylesheet and add the features placeholder**

In `desktop/src/main.tsx`, replace the scaffold's CSS import (e.g. `import "./App.css"` / `import "./index.css"`) with:

```tsx
import "./styles/index.css";
```

Create `desktop/src/features/.gitkeep` (empty file) so the feature dir is tracked.

- [ ] **Step 7: Verify the frontend builds**

```bash
pnpm --dir desktop build
```

Expected: PASS (Tailwind compiles, no type errors).

- [ ] **Step 8: Commit**

```bash
git add desktop/tailwind.config.js desktop/postcss.config.js desktop/src/styles desktop/src/shared desktop/src/features desktop/src/main.tsx desktop/package.json desktop/pnpm-lock.yaml
git commit -m "feat(desktop): Tailwind + shadcn baseline + feature-based skeleton"
```

---

## Task 5: Typed IPC bridge (`lib/bridge/`) + minimal shell consuming `app_info` + vitest (TDD)

**Files:**
- Create: `desktop/src/lib/bridge/client.ts`
- Create: `desktop/src/lib/bridge/app.ts`
- Create: `desktop/src/lib/bridge/index.ts`
- Create: `desktop/src/shared/lib/cn.test.ts`
- Create: `desktop/vitest.config.ts`
- Modify: `desktop/src/app/App.tsx` (create), `desktop/src/main.tsx`
- Modify: `desktop/package.json` (test script)

- [ ] **Step 1: Install vitest and add the test script**

```bash
cd desktop
pnpm add -D vitest
```

In `desktop/package.json`, add to `"scripts"`:

```json
    "test": "vitest run"
```

- [ ] **Step 2: Create the vitest config**

Create `desktop/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Write the failing util test**

Create `desktop/src/shared/lib/cn.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges class names and dedupes conflicting tailwind utilities", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-medium")).toBe("text-sm font-medium");
  });
});
```

- [ ] **Step 4: Run the test to verify it passes** (cn already exists from Task 4 — this guards it)

```bash
pnpm --dir desktop test
```

Expected: PASS (1 file, 1 test). If it fails, `tailwind-merge`/`clsx` are mis-imported in `cn.ts` — fix per Task 4 Step 4.

- [ ] **Step 5: Create the bridge client wrapper**

Create `desktop/src/lib/bridge/client.ts`:

```ts
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
```

- [ ] **Step 6: Create the `app` domain bridge (mirrors `commands/app.rs`)**

Create `desktop/src/lib/bridge/app.ts`:

```ts
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
```

- [ ] **Step 7: Create the thin bridge aggregator**

Create `desktop/src/lib/bridge/index.ts`:

```ts
// Thin re-export only. No logic here. One domain module per backend `commands/<domain>.rs`.
export * as appBridge from "./app";
export { call } from "./client";
```

- [ ] **Step 8: Create the minimal shell that consumes the bridge**

Create `desktop/src/app/App.tsx`. Note: `index.ts` re-exports the bridge as the `appBridge` namespace, so the `AppInfo` type is imported directly from `../lib/bridge/app`:

```tsx
import { useEffect, useState } from "react";
import { appBridge } from "../lib/bridge";
import type { AppInfo } from "../lib/bridge/app";
import { Button } from "../shared/ui/button";

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    appBridge.appInfo().then(setInfo).catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">
        {info ? `${info.name} v${info.version}` : "Loading…"}
      </h1>
      {info && <p className="text-muted-foreground">platform: {info.platform}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={() => appBridge.appInfo().then(setInfo)}>Refresh</Button>
    </main>
  );
}
```

- [ ] **Step 9: Mount the shell**

Replace the render body of `desktop/src/main.tsx` so it renders `<App />` from `./app/App` instead of the scaffold's default `App`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Delete the scaffold's old `desktop/src/App.tsx` and `desktop/src/App.css` if present.

- [ ] **Step 10: Verify build + tests**

```bash
pnpm --dir desktop build
pnpm --dir desktop test
```

Expected: build PASS, tests PASS.

- [ ] **Step 11: Commit**

```bash
git add desktop/src desktop/vitest.config.ts desktop/package.json desktop/pnpm-lock.yaml
git commit -m "feat(desktop): per-domain IPC bridge + app_info vertical slice + vitest"
```

---

## Task 6: i18n scaffold (en + zh) wired into the shell

**Files:**
- Create: `desktop/src/shared/i18n/index.ts`
- Create: `desktop/src/shared/i18n/locales/en.json`
- Create: `desktop/src/shared/i18n/locales/zh.json`
- Modify: `desktop/src/main.tsx`, `desktop/src/app/App.tsx`

- [ ] **Step 1: Install i18next**

```bash
pnpm --dir desktop add i18next react-i18next
```

- [ ] **Step 2: Create locale files**

Create `desktop/src/shared/i18n/locales/en.json`:

```json
{
  "app": {
    "loading": "Loading…",
    "refresh": "Refresh",
    "platform": "platform: {{platform}}"
  }
}
```

Create `desktop/src/shared/i18n/locales/zh.json`:

```json
{
  "app": {
    "loading": "加载中…",
    "refresh": "刷新",
    "platform": "平台：{{platform}}"
  }
}
```

- [ ] **Step 3: Create the i18n init module**

Create `desktop/src/shared/i18n/index.ts`:

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, zh: { translation: zh } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 4: Initialize i18n at startup**

In `desktop/src/main.tsx`, add the import (side-effect init) before rendering:

```tsx
import "./shared/i18n";
```

- [ ] **Step 5: Use a translation key in the shell**

In `desktop/src/app/App.tsx`, replace hardcoded strings with `useTranslation`:

```tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { appBridge } from "../lib/bridge";
import type { AppInfo } from "../lib/bridge/app";
import { Button } from "../shared/ui/button";

export function App() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    appBridge.appInfo().then(setInfo).catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">
        {info ? `${info.name} v${info.version}` : t("app.loading")}
      </h1>
      {info && <p className="text-muted-foreground">{t("app.platform", { platform: info.platform })}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={() => appBridge.appInfo().then(setInfo)}>{t("app.refresh")}</Button>
    </main>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
pnpm --dir desktop build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add desktop/src
git commit -m "feat(desktop): i18next scaffold (en + zh) wired into shell"
```

---

## Task 7: End-to-end smoke verification + final commit

**Files:**
- None (verification only)

- [ ] **Step 1: Run the full backend test suite for the desktop crate**

```bash
cargo test -p hermes-desktop
```

Expected: PASS.

- [ ] **Step 2: Run the frontend tests**

```bash
pnpm --dir desktop test
```

Expected: PASS.

- [ ] **Step 3: Launch the app and confirm the vertical slice works**

```bash
pnpm --dir desktop tauri dev
```

Expected: a native window opens showing `Hermes Agent Ultra v0.14.2` and `platform: macos` (or `windows`). Clicking **Refresh** re-fetches via the `app_info` IPC command. Close the window to end.

> This confirms: in-process embed (no sidecar/port), thin-command → trait-service path, per-domain bridge, Tailwind/shadcn rendering, and i18n — all working end-to-end.

- [ ] **Step 4: Confirm the full workspace still builds (no regressions)**

```bash
cargo build
```

Expected: PASS (the new `hermes-desktop` member compiles alongside existing crates).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore(desktop): foundation slice verified (embed IPC + structure)"
```

---

## Done When

- `pnpm --dir desktop tauri dev` opens a window rendering `app_info` fetched over in-process IPC.
- `cargo test -p hermes-desktop` and `pnpm --dir desktop test` both pass.
- `cargo build` (whole workspace) passes with `desktop/src-tauri` as a member.
- Structure locked in: backend `commands/<domain>.rs` (thin) + `services/<domain>.rs` (logic, tested); frontend `src/features/`, `src/shared/`, `src/lib/bridge/<domain>.ts` (single IPC entry). No god files on either side.

## Next Plan

Plan 2 — **Anti-corruption layer + chat/agent message view (1:1)**: add `hermes-agent`/`hermes-core` deps to `hermes-desktop`, implement `services/agent_service.rs` driving `AgentLoop`, emit `agent:*` events, wire `tauri-specta` type generation into `lib/bridge/`, and port uclaw's `ai-elements/`+`agent/`+`chat/` message stack into `features/chat-agent/`. (Requires inspecting the real `hermes-agent` public API first.)
