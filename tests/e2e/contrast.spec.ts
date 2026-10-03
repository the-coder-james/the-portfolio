// E2E-05: every visible text node clears WCAG 1.4.3 against what it really
// sits on: its colour (with opacity) composited over the composited
// background chain, and -- for text straight on the drafting sheet -- the
// least-contrasting page pixel (major rule + peak grain, QA D7 / F83).
// E2E-06: placeholders, which 1.4.3 covers too.
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { SCOPE, STATES, open, stateName } from "./helpers/page";

/**
 * Excluded here, asserted elsewhere: the hero's decorative code floaters are
 * pure decoration (exempt from 1.4.3) but not yet aria-hidden -- UI-03,
 * semantics.spec.ts.
 */
const DECORATIVE = "#home .select-none.pointer-events-none";

const lowContrastText = (page: Page) =>
  page.evaluate(
    ({ scope, exclude }) => {
      const qa = window.__qa;
      const out: string[] = [];
      let checked = 0;
      for (const root of document.querySelectorAll(scope))
        for (const el of qa.textHolders(root)) {
          if (el.closest(exclude)) continue;
          checked++;
          const fg = qa.parse(getComputedStyle(el).color);
          fg[3] *= qa.opacity(el);
          const g = qa.ground(el);
          let r = qa.ratio(qa.over(fg, g.color), g.color);
          let where = "flat";
          if (g.onPage) {
            const t = qa.texturedPage();
            const rt = qa.ratio(qa.over(fg, t), t);
            if (rt < r) [r, where] = [rt, "on grid + grain"];
          }
          const min = qa.isLarge(el) ? 3 : 4.5;
          if (r < min) out.push(`${qa.describe(el)} ${r.toFixed(2)}:1 ${where} (min ${min})`);
        }
      return { checked, failures: out };
    },
    { scope: SCOPE, exclude: DECORATIVE },
  );

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme === "light" ? "Manual" : "Blueprint"}`, () => {
    test.use({ seed: { theme, consent: "denied" } });

    test.describe("E2E-05 rendered text contrast", () => {
      for (const state of STATES) {
        test(stateName(state), async ({ page, isMobile }) => {
          test.skip(isMobile && state.tab !== "home", "the phone runs one scroll document (the home case)");
          await open(page, state);
          const { checked, failures } = await lowContrastText(page);
          expect(checked, "text nodes measured").toBeGreaterThan(5);
          expect(failures).toEqual([]);
        });
      }

      test("Skills tabs: inactive labels >= 4.5:1, the selected tab distinct from its track (>= 3:1)", async ({ page }) => {
        await open(page, { tab: "about", sub: "arsenal" });
        const r = await page.evaluate(() => {
          const qa = window.__qa;
          const tabs = [...document.querySelectorAll("#about-arsenal [role='tab']")];
          const track = qa.ground(tabs[0].parentElement!).color;
          const inactive = tabs
            .filter((t) => t.getAttribute("data-state") === "inactive")
            .map((t) => qa.ratio(qa.over(qa.parse(getComputedStyle(t).color), track), track));
          const active = tabs.find((t) => t.getAttribute("data-state") === "active")!;
          const fill = qa.over(qa.parse(getComputedStyle(active).backgroundColor), track);
          return {
            inactiveMin: Math.min(...inactive),
            activeLabel: qa.ratio(qa.over(qa.parse(getComputedStyle(active).color), fill), fill),
            fillVsTrack: qa.ratio(fill, track),
          };
        });
        expect(r.inactiveMin).toBeGreaterThanOrEqual(4.5);
        expect(r.activeLabel).toBeGreaterThanOrEqual(4.5);
        expect(r.fillVsTrack).toBeGreaterThanOrEqual(3);
      });
    });

    test.describe("E2E-06 placeholder contrast", () => {
      for (const [tab, selector] of [["projects", ".projects-search"], ["contact", "#contact input, #contact textarea"]] as const) {
        test(`${tab}: placeholders >= 4.5:1`, async ({ page }) => {
          await open(page, { tab });
          const ratios = await page.locator(selector).evaluateAll((els) =>
            els.map((el) => {
              const qa = window.__qa;
              const g = qa.ground(el).color;
              return qa.ratio(qa.over(qa.parse(getComputedStyle(el, "::placeholder").color), g), g);
            }),
          );
          expect(ratios.length).toBeGreaterThan(0);
          for (const r of ratios) expect(r).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  });
}
