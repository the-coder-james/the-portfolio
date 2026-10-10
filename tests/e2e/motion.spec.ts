// E2E-01, E2E-02: content never depends on a reveal running (RM-01 / CR-04).
// E2E-28: the stat counter shows only its own digits.
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { STATES, open, scopeOf, settle, stateName, type State } from "./helpers/page";

/** Visible, non-decorative text in a state's section that is not fully opaque. */
const dimText = (page: Page, state: State) =>
  page.evaluate((scope) => {
    const qa = window.__qa;
    const out: string[] = [];
    let checked = 0;
    for (const root of document.querySelectorAll(scope))
      for (const el of qa.textHolders(root)) {
        checked++;
        const o = qa.opacity(el);
        if (o < 0.99) out.push(`${qa.describe(el)} opacity=${o.toFixed(2)}`);
      }
    return { checked, dim: out };
  }, scopeOf(state));

/** Reveal nodes on screen that are not at their end state. */
const unsettledReveals = (page: Page, state: State) =>
  page.evaluate((scope) =>
    [...document.querySelectorAll(`${scope} [data-reveal]`)]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => ({ el: window.__qa.describe(el), opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))
      .filter((r) => r.opacity !== "1" || r.transform !== "none"),
  scopeOf(state));

const portraitOpacity = (page: Page) =>
  page.evaluate(() => {
    const img = document.querySelector<HTMLImageElement>("#about-profile img[alt$='photo']");
    return img ? window.__qa.opacity(img) : -1;
  });

test.describe("E2E-01 reduced motion: nothing is left invisible", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  for (const theme of ["light", "dark"] as const) {
    test.describe(theme === "light" ? "Manual" : "Blueprint", () => {
      test.use({ seed: { theme, consent: "denied" } });

      for (const state of STATES) {
        test(`${stateName(state)}: all text visible, every reveal at its end state`, async ({ page }) => {
          await open(page, state);
          const { checked, dim } = await dimText(page, state);
          expect(checked, "text nodes measured").toBeGreaterThan(5);
          expect(dim).toEqual([]);
          expect(await unsettledReveals(page, state)).toEqual([]);
          if (state.sub === "profile") expect(await portraitOpacity(page)).toBeGreaterThanOrEqual(0.99);
        });
      }

      test("every project card on screen is fully visible", async ({ page, isMobile }) => {
        await open(page, { section: "projects" });
        const cards = await page.evaluate(() =>
          [...document.querySelectorAll("#projects .project-card")].map((c) => window.__qa.opacity(c)),
        );
        // The phone's rail renders all forty; the PC deck one slide of them.
        if (isMobile) expect(cards).toHaveLength(40);
        else expect(cards.length).toBeGreaterThan(1);
        expect(cards.filter((o) => o < 0.99)).toEqual([]);
      });
    });
  }
});

test.describe("E2E-02 changing the motion preference mid-visit", () => {
  test.skip(({ isMobile }) => isMobile, "desktop is enough: the mechanism is the same");

  /** The current deck slide's cards: dimmed, or still moving. */
  const cardsVisibleAndStill = (page: Page) =>
    page.evaluate(() => {
      const items = [...document.querySelectorAll(".projects-slide:not([data-leaving]) .projects-slide-item")];
      return {
        onScreen: items.length > 0,
        dim: items.filter((c) => window.__qa.opacity(c.querySelector(".project-card")!) < 0.99).length,
        animating: items.filter((c) => c.getAnimations({ subtree: true }).length > 0).length,
      };
    });

  test("turning reduced motion on after the reveal keeps content visible", async ({ page }) => {
    await open(page, { section: "projects" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await settle(page);
    expect(await cardsVisibleAndStill(page)).toEqual({ onScreen: true, dim: 0, animating: 0 });
  });

  test("turning reduced motion off does not replay or hide anything", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, { section: "projects" });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await settle(page);
    expect(await cardsVisibleAndStill(page)).toEqual({ onScreen: true, dim: 0, animating: 0 });
    // The next slide plays the deck's change, and ends up just as visible.
    await page.evaluate(() => window.scrollBy({ top: window.innerHeight, behavior: "instant" }));
    await settle(page);
    expect(await cardsVisibleAndStill(page)).toEqual({ onScreen: true, dim: 0, animating: 0 });
  });
});

test.describe("E2E-28 the stat counter", () => {
  test.skip(({ isMobile }) => isMobile, "desktop is enough: the mechanism is the same");

  // The rolling strip used to place its digits by a pixel height measured
  // while the stat card was still scaling in, so the neighbours of the digit
  // on show sat less than one window away and their edges showed.
  test("each digit window shows exactly one digit", async ({ page }) => {
    await open(page, { section: "about", sub: "profile" });
    const windows = await page.evaluate(() =>
      [...document.querySelectorAll(".stat-value .relative.inline-block")].map((box) => {
        const b = box.getBoundingClientRect();
        return [...box.querySelectorAll(":scope > span.absolute")].filter((d) => {
          const r = d.getBoundingClientRect();
          return Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top) > 0.5;
        }).length;
      }),
    );
    expect(windows.length, "the counter rendered").toBeGreaterThan(0);
    expect(windows.every((n) => n === 1)).toBe(true);
  });
});
