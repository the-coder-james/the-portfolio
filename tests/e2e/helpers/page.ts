// Navigation and settling. No fixed sleeps in specs: settle() waits for the
// loading screen, fonts, hydration, finite animations and a still scroll.
import type { Page } from "@playwright/test";

export type Section = "home" | "about" | "projects" | "contact";
export type Sub = "profile" | "arsenal" | "journey";
export interface State {
  section: Section;
  sub?: Sub;
}

/** Every view: four sections, About read as its three sub-sections. */
export const STATES: State[] = [
  { section: "home" },
  { section: "about", sub: "profile" },
  { section: "about", sub: "arsenal" },
  { section: "about", sub: "journey" },
  { section: "projects" },
  { section: "contact" },
];

export const stateName = (s: State) => (s.sub ? `${s.section}/${s.sub}` : s.section);

/** The element a state is about: an About sub-section, or a section. */
export const targetOf = (s: State) => (s.sub ? `about-${s.sub}` : s.section);

/** CSS selector for what is on screen in a state. */
export const scopeOf = (s: State) => `#${targetOf(s)}`;

/** One entry per section, for walks that cover a whole section at once. */
export const SECTION_STATES: State[] = STATES.filter((s, i, all) => all.findIndex((t) => t.section === s.section) === i)
  .map((s) => ({ section: s.section }));

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
  // A still scroll means two polls in a row at the same position. The last
  // position is kept on window between polls, so forget the previous call's:
  // straight after goBack() the first poll would otherwise match where the
  // last settle() left off and pass before the scroll had even started.
  await page.evaluate(() => {
    delete (window as unknown as { __qaLastY?: number }).__qaLastY;
  });
  await page.waitForFunction(
    () => {
      // Finite, time-based animations only: infinite decorative loops never
      // end, and scroll-driven ones (the section choreography, view() and
      // scroll() timelines) are "running" for as long as the page exists.
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

/**
 * Scroll a state's whole target through the screen and back, the way a
 * reader would, so every reveal in it has fired: content below the fold waits,
 * unrevealed, until it is scrolled to.
 */
export async function revealAll(page: Page, state: State) {
  await page.evaluate(async (id) => {
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(undefined)));
    const el = document.getElementById(id)!;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const bottom = top + el.offsetHeight;
    for (let y = top; y < bottom; y += window.innerHeight / 2) {
      window.scrollTo({ top: y, behavior: "instant" });
      await frame();
      await frame();
    }
  }, targetOf(state));
  await go(page, state);
}

/** Land on a state on an already-loaded page, without a settle. */
async function place(page: Page, state: State) {
  await page.evaluate((id) => {
    const el = document.getElementById(id)!;
    // scroll-margin-top keeps an About sub-section clear of the nav.
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - margin, behavior: "instant" });
  }, targetOf(state));
}

/** Load the page on a state: land on its section's hash, then its sub-section. */
export async function open(page: Page, state: State = { section: "home" }) {
  await page.goto(`#${state.section}`);
  await settle(page);
  if (state.sub) {
    await place(page, state);
    await settle(page);
  }
}

/**
 * Bring a state to rest at the top of the screen on an already-loaded page --
 * where a nav link would leave it -- so its scroll choreography has finished
 * before anything is measured.
 */
export async function go(page: Page, state: State) {
  await place(page, state);
  await settle(page);
}

/** Top of a section relative to the viewport, rounded. */
export const sectionTop = (page: Page, id: string) =>
  page.evaluate((i) => Math.round(document.getElementById(i)!.getBoundingClientRect().top), id);

/** The section the nav marks as current (the logo stands for Home). */
export const currentSection = (page: Page) =>
  page.evaluate(() => {
    const nav = document.querySelector("nav[aria-label='Primary']")!;
    const cur = nav.querySelector("[aria-current='true']");
    return cur?.getAttribute("href")?.replace(/^#/, "") ?? null;
  });
