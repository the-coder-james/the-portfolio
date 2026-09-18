/**
 * Analytics consent.
 *
 * A module-level store read through useSyncExternalStore, for the same reason
 * ThemeProvider is one: every Astro island is its own React root, so a context
 * mounted in one island cannot reach a component in another.
 *
 * Nothing analytics-related loads until `grant()` is called. GTM is injected
 * from here rather than from a script tag in the head, which is what makes the
 * banner an actual gate instead of a notice shown after the fact -- the usual
 * mistake is to load GTM in <head> and then ask permission.
 */

import { useSyncExternalStore } from "react";

export type Consent = "granted" | "denied" | "unset";

const STORAGE_KEY = "analytics-consent";
const EVENT = "consentchange";

/** Read once at module scope: the ID is inlined at build time. */
const GTM_ID = import.meta.env.PUBLIC_GTM_ID as string | undefined;

let injected = false;

export function getConsent(): Consent {
  if (typeof localStorage === "undefined") return "unset";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : "unset";
  } catch {
    // Private mode or blocked storage. Treat as undecided: the banner shows
    // again next visit, which is the conservative direction to fail in.
    return "unset";
  }
}

/**
 * Inject the GTM loader. Idempotent, and a no-op without an ID so local dev and
 * any build that has not been given one stay clean.
 */
function injectGtm() {
  if (injected || !GTM_ID || typeof document === "undefined") return;
  if (document.getElementById("gtm-loader")) return;
  injected = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const s = document.createElement("script");
  s.id = "gtm-loader";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(s);
}

function write(value: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The choice still holds for this visit.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

export function grant() {
  write("granted");
  injectGtm();
}

export function deny() {
  write("denied");
  // Nothing to tear down: without a grant, GTM was never injected.
}

/**
 * Called once on load. Re-injects for a visitor who already consented, so the
 * choice persists across visits without asking again.
 */
export function initConsent() {
  if (getConsent() === "granted") injectGtm();
}

/** True when a tag manager is actually configured -- no ID, no banner. */
export const analyticsConfigured = Boolean(GTM_ID);

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, getConsent, () => "unset" as Consent);
}

/**
 * Push an event to the dataLayer, but only with consent -- queuing events for a
 * visitor who declined would leak them the moment anything later granted.
 */
export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (getConsent() !== "granted" || !GTM_ID) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
