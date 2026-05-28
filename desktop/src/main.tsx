import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "jotai";
import { createStore } from "jotai/vanilla";
import { App } from "@/app/App";
import "@/shared/i18n";
import "@/styles/index.css";
import {
  themeModeAtom,
  themeStyleAtom,
  systemIsDarkAtom,
  initializeTheme,
  applyThemeToDOM,
} from "@/features/chat-agent/atoms/theme";

// Plan 3.1 — bootstrap the theme system before React mounts so the first
// frame shows the user's preferred theme (no flash-of-unstyled-content).
const store = createStore();

void initializeTheme(
  (mode) => store.set(themeModeAtom, mode),
  (isDark) => store.set(systemIsDarkAtom, isDark),
  (style) => store.set(themeStyleAtom, style),
);

// Apply the current theme atoms to DOM immediately so the first render uses
// the right tokens. initializeTheme above may have rehydrated from localStorage.
applyThemeToDOM(
  store.get(themeModeAtom),
  store.get(themeStyleAtom),
  store.get(systemIsDarkAtom),
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
