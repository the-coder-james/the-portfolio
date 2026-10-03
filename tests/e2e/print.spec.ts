// The print language (CLAUDE.md "No glass, no glow").
// E2E-07: no translucent film sits straight on the drafting grid (PRINT-01).
// E2E-08: the tooltip arrow prints in the tooltip's own colour (UI-01).
// E2E-09: a project card's edge strengthens on hover and focus (UI-04).
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { SCOPE, STATES, open, settle, stateName } from "./helpers/page";

/** Elements with a 0 < alpha < 1 fill and no opaque sheet anywhere beneath them. */
const filmsOnGrid = (page: Page) =>
  page.evaluate((scope) => {
    const qa = window.__qa;
    const out: string[] = [];
    for (const root of document.querySelectorAll(scope))
      for (const el of root.querySelectorAll("*")) {
        if (el.closest("[aria-hidden='true'], [hidden]")) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const a = qa.parse(getComputedStyle(el).backgroundColor)[3];
        if (a === 0 || a >= 1) continue;
        if (qa.ground(el.parentElement!).onPage) out.push(`${qa.describe(el)} alpha=${a.toFixed(3)}`);
      }
    return out;
  }, SCOPE);

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme === "light" ? "Manual" : "Blueprint"}`, () => {
    test.use({ seed: { theme, consent: "denied" } });

    test.describe("E2E-07 surfaces are opaque sheets", () => {
      for (const state of STATES) {
        test(stateName(state), async ({ page, isMobile }) => {
          test.skip(isMobile && state.tab !== "home", "the phone runs one scroll document (the home case)");
          await open(page, state);
          expect(await filmsOnGrid(page)).toEqual([]);
        });
      }

      test("contact success panel and its buttons", async ({ page, isMobile }) => {
        test.skip(isMobile, "desktop is enough for one more state");
        await open(page, { tab: "contact" });
        await page.fill("#contact-name", "Ada");
        await page.fill("#contact-email", "ada@example.com");
        await page.fill("#contact-message", "Hello");
        // The mailto: navigation is an external protocol and goes nowhere here;
        // the submit handler still swaps in the success panel.
        await page.click("#contact button[type=submit]");
        await expect(page.getByRole("status").filter({ hasText: "Your draft is ready" })).toBeVisible();
        await settle(page);
        expect(await filmsOnGrid(page)).toEqual([]);
      });
    });

    test.describe("project cards", () => {
      test.skip(({ isMobile }) => isMobile, "hover is a pointer affordance");

      test("E2E-08 the tooltip arrow matches the tooltip body", async ({ page }) => {
        await open(page, { tab: "projects" });
        await page.locator("#projects [data-slot='tooltip-trigger']").first().hover();
        const tooltip = page.locator("[data-slot='tooltip-content']").first();
        await expect(tooltip).toBeVisible();
        const c = await tooltip.evaluate((el) => ({
          body: window.__qa.parse(getComputedStyle(el).backgroundColor),
          arrow: window.__qa.parse(getComputedStyle(el.querySelector("svg")!).fill),
        }));
        for (const i of [0, 1, 2]) expect(Math.abs(c.body[i] - c.arrow[i]), `channel ${i}`).toBeLessThanOrEqual(2);
      });

      test("E2E-09 a card's edge strengthens on hover and keyboard focus, with an accent rule", async ({ page }) => {
        await open(page, { tab: "projects" });
        const edge = (i: number) =>
          page.locator("#projects [data-reveal][tabindex='0']").nth(i).evaluate((el) => {
            const qa = window.__qa;
            const p = qa.page();
            return qa.ratio(qa.over(qa.parse(getComputedStyle(el).borderTopColor), p), p);
          });
        const accentRule = (i: number) =>
          page.locator("#projects [data-reveal][tabindex='0']").nth(i).evaluate((el) => getComputedStyle(el.firstElementChild!).boxShadow);
        for (let i = 0; i < 6; i++) {
          const card = page.locator("#projects [data-reveal][tabindex='0']").nth(i);
          const rest = await edge(i);
          await card.hover();
          await expect.poll(() => edge(i)).toBeGreaterThan(rest);
          expect(await accentRule(i)).toMatch(/inset/);
          await page.mouse.move(1, 1);
          await expect.poll(() => edge(i)).toBeCloseTo(rest, 1);
          await card.focus();
          await expect.poll(() => edge(i)).toBeGreaterThan(rest);
          await card.blur();
        }
      });
    });
  });
}
