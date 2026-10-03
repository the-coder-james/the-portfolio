// E2E-10: no horizontal overflow and nothing clipped below its panel, across
// widths, themes and every state. Port of the scratchpad shots.mjs measure().
// Runs without mobile emulation: Chrome's mobile layout viewport grows to fit
// overflowing content, which would hide the overflow being measured.
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { STATES, go, open, stateName } from "./helpers/page";

test.skip(({ isMobile }) => isMobile, "widths are set explicitly in this spec");

const overflowX = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

/** Text/controls that the visible panel clips at its bottom edge outside the intended scroll regions. */
const clipped = (page: Page) =>
  page.evaluate(() => {
    const out: string[] = [];
    const scrollers = ".panel-scroll, .about-pane, .timeline-detail-card, .projects-rail, .pipeline";
    for (const panel of document.querySelectorAll("main > section:not([hidden])")) {
      const pr = panel.getBoundingClientRect();
      panel.querySelectorAll("h1, h2, h3, p, a, button, input, textarea, li").forEach((n) => {
        if (n.closest(scrollers) || n.closest("[hidden]")) return;
        const r = n.getBoundingClientRect();
        if (r.height && r.bottom > pr.bottom + 1) out.push(window.__qa.describe(n));
      });
    }
    return out;
  });

/** Widths where LAYOUT-01 (a 2px sideways pan in scroll mode) is still open. */

for (const theme of ["light", "dark"] as const) {
  test.describe(`E2E-10 ${theme === "light" ? "Manual" : "Blueprint"}`, () => {
    test.use({ seed: { theme, consent: "denied" } });

    for (const width of [1440, 1366, 1280, 768, 641]) {
      test(`${width}px tabs: every state fits the width and its panel`, async ({ page }) => {
        await page.setViewportSize({ width, height: width >= 1280 ? 800 : 900 });
        await open(page, { tab: "home" });
        for (const state of STATES) {
          await go(page, state);
          expect(await overflowX(page), `${stateName(state)} overflow`).toBeLessThanOrEqual(0);
          expect(await clipped(page), `${stateName(state)} clipped`).toEqual([]);
        }
      });
    }

    for (const width of [640, 390, 360]) {
      test(`${width}px scroll mode: the document never pans sideways`, async ({ page }) => {
        // LAYOUT-01: the Projects scroll gutter used to push the full-bleed
        // rail 2px past the viewport here.
        await page.setViewportSize({ width, height: 844 });
        await open(page, { tab: "home" });
        expect(await page.evaluate(() => document.documentElement.hasAttribute("data-scroll-mode"))).toBe(true);
        expect(await overflowX(page)).toBeLessThanOrEqual(0);
      });
    }
  });
}
