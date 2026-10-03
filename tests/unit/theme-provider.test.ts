// UT-07..UT-09: the theme store (src/components/common/tsx/ThemeProvider.tsx).
// The OS-following rule lives in the private subscribe(), so it is exercised
// through useTheme() in a real React root against a controllable matchMedia.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { getTheme, setTheme, toggleTheme, useTheme } from "@/components/common/tsx/ThemeProvider";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** A matchMedia whose (prefers-color-scheme: dark) result the test controls. */
function fakeColorScheme(dark: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches: dark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.add(l),
    removeEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.delete(l),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
  return {
    flip(next: boolean) {
      mql.matches = next;
      listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

const html = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  html.className = "";
  html.style.colorScheme = "";
});

describe("UT-07 setTheme / toggleTheme / getTheme", () => {
  it("applies, stores and announces the theme", () => {
    const seen: unknown[] = [];
    window.addEventListener("themechange", (e) => seen.push((e as CustomEvent).detail));
    setTheme("dark");
    expect(html.classList.contains("dark")).toBe(true);
    expect(html.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(getTheme()).toBe("dark");
    setTheme("light");
    expect(html.classList.contains("dark")).toBe(false);
    expect(html.style.colorScheme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(seen).toEqual(["dark", "light"]);
  });

  it("toggles between the two", () => {
    toggleTheme();
    expect(getTheme()).toBe("dark");
    toggleTheme();
    expect(getTheme()).toBe("light");
  });

  it("still applies the theme when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => setTheme("dark")).not.toThrow();
    expect(getTheme()).toBe("dark");
  });
});

describe("UT-08 useTheme follows the OS only without an explicit choice", () => {
  let root: Root;
  let host: HTMLElement;
  const rendered = () => host.textContent;
  const mount = () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    const Probe = () => createElement("span", null, useTheme());
    act(() => root.render(createElement(Probe)));
  };
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it("follows an OS change when nothing is stored", () => {
    const os = fakeColorScheme(false);
    mount();
    expect(rendered()).toBe("light");
    act(() => os.flip(true));
    expect(html.classList.contains("dark")).toBe(true);
    expect(html.style.colorScheme).toBe("dark");
    expect(rendered()).toBe("dark");
  });

  it("ignores the OS once the visitor has chosen", () => {
    const os = fakeColorScheme(false);
    mount();
    act(() => setTheme("light"));
    act(() => os.flip(true));
    expect(html.classList.contains("dark")).toBe(false);
    expect(rendered()).toBe("light");
  });

  it("re-renders on an explicit change", () => {
    fakeColorScheme(false);
    mount();
    act(() => setTheme("dark"));
    expect(rendered()).toBe("dark");
  });

  it("removes its listeners on unmount", () => {
    const os = fakeColorScheme(false);
    mount();
    expect(os.listenerCount()).toBe(1);
    act(() => root.unmount());
    expect(os.listenerCount()).toBe(0);
    // Re-create so afterEach can unmount cleanly.
    root = createRoot(host);
  });
});

describe("UT-09 hydration-safe default", () => {
  it("renders light on the server even when the page is dark", () => {
    html.classList.add("dark");
    const Probe = () => createElement("span", null, useTheme());
    expect(renderToString(createElement(Probe))).toContain("light");
  });
});
