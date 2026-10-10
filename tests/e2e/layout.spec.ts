// E2E-10: every state is responsive at every common size -- nothing pans
// sideways, no section clips or scrolls its own content (the page is the only
// vertical scroller), and on PC every card of the current Projects slide fits
// inside the stuck frame. Runs without mobile emulation: Chrome's mobile layout
// viewport grows to fit overflowing content, which would hide the overflow
// measured.
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { STATES, go, open, stateName, targetOf, type State } from "./helpers/page";

test.skip(({ isMobile }) => isMobile, "sizes are set explicitly in this spec");

const overflowX = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/**
 * Boxes in a state's target that cut off or scroll their own content
 * vertically. Excluded: the phone's swipe rail (a horizontal carousel), and
 * the cards' own clamped previews, which carry the full text elsewhere.
 */
const hiddenOverflow = (page: Page, s: State) =>
  page.evaluate((id) => {
    const out: string[] = [];
    for (const el of document.getElementById(id)!.querySelectorAll<HTMLElement>("*")) {
      if (el.closest(".projects-rail, .project-card")) continue;
      // Visually-hidden text for assistive tech is a 1px box by design.
      if (el.clientWidth <= 1 && el.clientHeight <= 1) continue;
      const oy = getComputedStyle(el).overflowY;
      if (oy === "visible" || oy === "clip" && el.matches(".page-section")) continue;
      if (el.scrollHeight > el.clientHeight + 1) out.push(`${window.__qa.describe(el)} ${oy} +${el.scrollHeight - el.clientHeight}px`);
    }
    return out;
  }, targetOf(s));

/** Cards of the current deck slide that run past the stage they sit in. */
const deckSpill = (page: Page) =>
  page.evaluate(() => {
    const stage = document.querySelector(".projects-stage");
    if (!stage) return [];
    const sr = stage.getBoundingClientRect();
    return [...document.querySelectorAll(".projects-slide:not([data-leaving]) .project-card")]
      .filter((c) => {
        const r = c.getBoundingClientRect();
        return r.bottom > sr.bottom + 1 || r.top < sr.top - 1;
      })
      .map((c) => window.__qa.describe(c));
  });

const SIZES = [
  [1440, 900], [1366, 768], [1280, 720], [1024, 768], [1024, 600], [768, 1024],
  // SP: 767px and below.
  [767, 1024], [414, 896], [390, 844], [375, 667], [360, 640],
  // A phone on its side is PC-wide and very short.
  [844, 390],
] as const;

for (const theme of ["light", "dark"] as const) {
  test.describe(`E2E-10 ${theme === "light" ? "Manual" : "Blueprint"}`, () => {
    test.use({ seed: { theme, consent: "denied" }, contextOptions: { reducedMotion: "reduce" } });

    for (const [width, height] of SIZES) {
      test(`${width}x${height}: every state fits the width and shows all of itself`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await open(page, { section: "home" });
        for (const state of STATES) {
          await go(page, state);
          expect(await overflowX(page), `${stateName(state)} overflow`).toBeLessThanOrEqual(0);
          expect(await hiddenOverflow(page, state), `${stateName(state)} hides content`).toEqual([]);
          if (state.section === "projects") expect(await deckSpill(page), "deck cards spill").toEqual([]);
        }
      });
    }
  });
}
