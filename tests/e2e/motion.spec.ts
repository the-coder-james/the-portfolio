// E2E-01, E2E-02: content never depends on a reveal running (RM-01 / CR-04).
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { SCOPE, STATES, open, settle, stateName } from "./helpers/page";

/** Visible, non-decorative text that is not fully opaque. */
const dimText = (page: Page) =>
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
  }, SCOPE);

/** Reveal nodes on screen that are not at their end state. */
const unsettledReveals = (page: Page) =>
  page.evaluate((scope) =>
    [...document.querySelectorAll(`${scope} [data-reveal]`)]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => ({ el: window.__qa.describe(el), opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))
      .filter((r) => r.opacity !== "1" || r.transform !== "none"),
  SCOPE);

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
        test(`${stateName(state)}: all text visible, every reveal at its end state`, async ({ page, isMobile }) => {
          test.skip(isMobile && state.tab !== "home", "the phone runs one scroll document (covered by the home case)");
          await open(page, state);
          const { checked, dim } = await dimText(page);
          expect(checked, "text nodes measured").toBeGreaterThan(5);
          expect(dim).toEqual([]);
          expect(await unsettledReveals(page)).toEqual([]);
          if (state.sub === "profile" || isMobile) expect(await portraitOpacity(page)).toBeGreaterThanOrEqual(0.99);
        });
      }

      test("all 40 project cards are fully visible", async ({ page }) => {
        await open(page, { tab: "projects" });
        const cards = await page.evaluate(() =>
          [...document.querySelectorAll("#projects [data-reveal][tabindex='0']")].map((c) => window.__qa.opacity(c)),
        );
        // The phone lays the grid out as a rail; every card is still rendered.
        expect(cards).toHaveLength(40);
        expect(cards.filter((o) => o < 0.99)).toEqual([]);
      });
    });
  }
});

test.describe("E2E-02 changing the motion preference mid-visit", () => {
  test.skip(({ isMobile }) => isMobile, "desktop is enough: the mechanism is the same");

  const cardsVisibleAndStill = (page: Page) =>
    page.evaluate(() => {
      const cards = [...document.querySelectorAll("#projects [data-reveal][tabindex='0']")];
      return {
        dim: cards.filter((c) => window.__qa.opacity(c) < 0.99).length,
        animating: cards.filter((c) => c.getAnimations().length > 0).length,
      };
    });

  test("turning reduced motion on after the reveal keeps content visible", async ({ page }) => {
    await open(page, { tab: "projects" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await settle(page);
    expect(await cardsVisibleAndStill(page)).toEqual({ dim: 0, animating: 0 });
  });

  test("turning reduced motion off does not replay or hide anything", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, { tab: "projects" });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await settle(page);
    expect(await cardsVisibleAndStill(page)).toEqual({ dim: 0, animating: 0 });
  });
});
