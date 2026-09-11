/**
 * Theme state for the Destiny palette: light ("standby") by default, dark
 * ("combat mode") on request.
 *
 * This is a module-level store read through useSyncExternalStore rather than a
 * React context. Every Astro island is its own React root, so a provider
 * mounted in one island cannot reach a component in another -- a context here
 * would silently only work inside whichever island happened to wrap it. The
 * source of truth is therefore the DOM itself (`.dark` on <html>), which every
 * island and all of the CSS can already see.
 *
 * The class is set before first paint by the inline script in layout.astro;
 * this module only mutates and reports it afterwards.
 */

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const EVENT = "themechange";

/** Read the live theme off the document. */
export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  // Keeps form controls, scrollbars and the like in step with the palette.
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }));
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);

  // Follow the OS only while the visitor has not made an explicit choice --
  // once they have, that choice outlives any later OS change.
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = (e: MediaQueryListEvent) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (stored) return;
    document.documentElement.classList.toggle("dark", e.matches);
    document.documentElement.style.colorScheme = e.matches ? "dark" : "light";
    onChange();
  };
  mq.addEventListener("change", onSystemChange);

  return () => {
    window.removeEventListener(EVENT, onChange);
    mq.removeEventListener("change", onSystemChange);
  };
}

// The server always renders the light default, so the server snapshot must
// agree with it or React reports a hydration mismatch.
const getServerSnapshot = (): Theme => "light";

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, getServerSnapshot);
}
