// Navigation and settling. No fixed sleeps in specs: settle() waits for the
// loading screen, fonts, hydration, finite animations and a still scroll.
import type { Page } from "@playwright/test";

export type Tab = "home" | "about" | "projects" | "contact";
export type Sub = "profile" | "arsenal" | "journey";
export interface State {
  tab: Tab;
  sub?: Sub;
}

/** Every desktop view: four panels, About as three sub-tabs. */
export const STATES: State[] = [
  { tab: "home" },
  { tab: "about", sub: "profile" },
  { tab: "about", sub: "arsenal" },
  { tab: "about", sub: "journey" },
  { tab: "projects" },
  { tab: "contact" },
];

export const stateName = (s: State) => (s.sub ? `${s.tab}/${s.sub}` : s.tab);

const readiness = (page: Page) =>
  page.evaluate(() => ({
    veil: !!document.getElementById("preboot-veil"),
    loader: !!document.querySelector("[aria-label='Loading site']"),
    // client:idle islands wait for requestIdleCallback, which a loaded
    // machine can starve for several seconds.
    unhydrated: [...document.querySelectorAll("astro-island[ssr]")].map((i) => (i.getAttribute("component-url") ?? "").split("/").pop()),
  }));

/** Wait until the page is quiet: loader gone, hydrated, fonts in, motion done. */
export async function settle(page: Page, { timeout = 30_000 } = {}) {
  try {
    await page.waitForFunction(
      () =>
        !document.getElementById("preboot-veil") &&
        !document.querySelector("[aria-label='Loading site']") &&
        !document.querySelector("astro-island[ssr]"),
      null,
      { timeout },
    );
  } catch (e) {
    throw new Error(`page never became ready: ${JSON.stringify(await readiness(page))}`, { cause: e });
  }
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(
    () => {
      // Finite, time-based animations only: infinite decorative loops never
      // end, and scroll-driven ones (animation-timeline: view(), the phone
      // hero) are "running" for as long as the page exists.
      const running = document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === "running" &&
            a.timeline === document.timeline &&
            a.effect &&
            a.effect.getComputedTiming().endTime !== Infinity,
        ).length;
      const w = window as unknown as { __qaLastY?: number };
      const y = Math.round(window.scrollY);
      const still = w.__qaLastY === y;
      w.__qaLastY = y;
      return running === 0 && still;
    },
    null,
    { timeout, polling: 120 },
  );
}

/** Load the page on a state (desktop: tab + sub-tab; phone: the scroll document). */
export async function open(page: Page, state: State = { tab: "home" }) {
  await page.goto(`#${state.tab}`);
  await settle(page);
  if (state.sub && !(await isScrollMode(page))) {
    await page.click(`#subtab-${state.sub}`);
    await settle(page);
  }
}

/** Switch state on an already-loaded page, through the hash like a link would. */
export async function go(page: Page, state: State) {
  await page.evaluate((t) => {
    if (location.hash !== `#${t}`) location.hash = `#${t}`;
  }, state.tab);
  await settle(page);
  if (state.sub && !(await isScrollMode(page))) {
    await page.click(`#subtab-${state.sub}`);
    await settle(page);
  }
}

export const isScrollMode = (page: Page) => page.evaluate(() => document.documentElement.hasAttribute("data-scroll-mode"));

/** CSS selector for what is on screen: the visible panel, or all of <main> in scroll mode. */
export const SCOPE = "main > section:not([hidden])";
