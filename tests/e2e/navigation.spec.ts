// E2E-13 (desktop tabs), E2E-14 (phone scroll mode), E2E-15 (About sub-tabs).
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { isScrollMode, settle } from "./helpers/page";

const PANELS = ["home", "about", "projects", "contact"] as const;

/** Which panels are shown, and whether hidden ones are also aria-hidden. */
const panelState = (page: Page) =>
  page.evaluate((ids) => ids.map((id) => {
    const el = document.getElementById(id)!;
    return { id, hidden: el.hidden, ariaHidden: el.getAttribute("aria-hidden") };
  }), [...PANELS]);

async function expectOnly(page: Page, id: (typeof PANELS)[number]) {
  await expect.poll(() => panelState(page)).toEqual(
    PANELS.map((p) => ({ id: p, hidden: p !== id, ariaHidden: String(p !== id) })),
  );
}

test.describe("E2E-13 desktop tabs are driven by the hash", () => {
  test.skip(({ isMobile }) => isMobile, "tab mode is desktop-only");

  for (const [landing, panel] of [["", "home"], ["#home", "home"], ["#about", "about"], ["#projects", "projects"], ["#contact", "contact"]] as const) {
    test(`landing on "${landing || "(no hash)"}" shows only #${panel}`, async ({ page }) => {
      await page.goto(landing);
      await settle(page);
      await expectOnly(page, panel);
      await expect(page).toHaveURL(new RegExp(`#${panel}$`));
    });
  }

  for (const [legacy, panel] of [["#skills", "about"], ["#experience", "about"], ["#bogus", "home"]] as const) {
    test(`${legacy} resolves to #${panel} without adding a history entry`, async ({ page }) => {
      // History length as the page first sees it (Playwright's about:blank
      // counts as an entry), before the hash is canonicalised.
      await page.addInitScript(() => {
        (window as unknown as { __qaHistory: number }).__qaHistory = history.length;
      });
      await page.goto(legacy);
      await settle(page);
      await expectOnly(page, panel);
      await expect(page).toHaveURL(new RegExp(`#${panel}$`));
      // replaceState, not pushState: canonicalising adds no entry.
      expect(await page.evaluate(() => history.length)).toBe(
        await page.evaluate(() => (window as unknown as { __qaHistory: number }).__qaHistory),
      );
    });
  }

  test("tab clicks, the logo, back and forward all switch panels", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    await page.getByRole("tab", { name: "Projects" }).click();
    await expectOnly(page, "projects");
    await expect(page).toHaveURL(/#projects$/);
    // Focus moves into the panel so keyboard users are not left in the header.
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("projects");
    await page.getByRole("tab", { name: "Contact" }).click();
    await expectOnly(page, "contact");
    await page.goBack();
    await expectOnly(page, "projects");
    await page.goForward();
    await expectOnly(page, "contact");
    await page.getByRole("button", { name: "Home" }).click();
    await expectOnly(page, "home");
  });

  test("the flow links walk home -> about -> projects -> contact", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    for (const next of ["about", "projects", "contact"] as const) {
      await page.locator(`main > section:not([hidden]) a[href="#${next}"]`).last().click();
      await expectOnly(page, next);
    }
  });

  test("the skip link's #main never resets the panel", async ({ page }) => {
    await page.goto("#about");
    await settle(page);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    await expectOnly(page, "about");
  });
});

test.describe("E2E-14 phone scroll mode", () => {
  test.skip(({ isMobile }) => !isMobile, "scroll mode is phone-only");

  const panelTop = (page: Page, id: string) =>
    page.evaluate((i) => Math.round(document.getElementById(i)!.getBoundingClientRect().top), id);
  const navBottom = (page: Page) =>
    page.evaluate(() => Math.round(document.querySelector("nav[aria-label='Primary']")!.getBoundingClientRect().bottom));
  /**
   * Where the browser itself puts the panel: scrollIntoView honours the one
   * scroll offset (scroll-padding-top). Measured rather than computed, because
   * mobile emulation offsets the visual viewport by a few pixels.
   */
  const scrollTarget = (page: Page, id: string) =>
    page.evaluate(async (i) => {
      const el = document.getElementById(i)!;
      el.scrollIntoView({ behavior: "instant", block: "start" });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return Math.round(el.getBoundingClientRect().top);
    }, id);

  test("every panel is in the document and none is hidden", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    expect(await isScrollMode(page)).toBe(true);
    expect((await panelState(page)).map((p) => p.hidden)).toEqual([false, false, false, false]);
  });

  test("landing on #home holds the top of the page", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    await page.waitForTimeout(1500); // the drift this guards against took ~900ms
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the browser's scroll target sits just below the nav (one offset, not two)", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    const nav = await navBottom(page);
    for (const id of ["about", "projects", "contact"]) {
      // scroll-padding-top = --nav-h + 0.5rem; a second offset (the old
      // scroll-margin-top) landed panels a whole nav-height lower.
      const gap = (await scrollTarget(page, id)) - nav;
      expect(gap, `#${id}`).toBeGreaterThanOrEqual(0);
      expect(gap, `#${id}`).toBeLessThanOrEqual(16);
    }
  });

  for (const id of ["about", "projects", "contact"]) {
    test(`landing on #${id} holds the panel clear of the nav`, async ({ page }) => {
      await page.goto(`#${id}`);
      await settle(page);
      const first = await panelTop(page, id);
      await page.waitForTimeout(1500); // the drift this guards against ran ~900ms
      expect(await panelTop(page, id), "the landing position holds").toBe(first);
      const nav = await navBottom(page);
      const target = await scrollTarget(page, id);
      const navHeight = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")));
      // CR-28: the landing used to settle 6-55px low, a different amount each
      // load, because scrollIntoView chased the visual viewport while the URL
      // bar animated away. It now lands exactly on the browser's own target.
      expect(first).toBeGreaterThanOrEqual(nav);
      expect(Math.abs(first - target), "lands on the scroll target").toBeLessThanOrEqual(1);
      expect(first).toBeLessThan(target + navHeight);
    });
  }

  test("a nav pill scrolls to its panel and the active pill follows the reader", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    await page.getByRole("tab", { name: "Projects" }).click();
    await settle(page);
    const landed = await panelTop(page, "projects");
    expect(Math.abs(landed - (await scrollTarget(page, "projects")))).toBeLessThanOrEqual(2);
    await page.evaluate(() => document.getElementById("contact")!.scrollIntoView({ block: "start" }));
    await expect(page.getByRole("tab", { name: "Contact" })).toHaveAttribute("data-state", "active");
  });

  test("resizing out of and back into scroll mode never strands a panel", async ({ page }) => {
    await page.goto("#projects");
    await settle(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect.poll(() => isScrollMode(page)).toBe(false);
    await expectOnly(page, "projects");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => isScrollMode(page)).toBe(true);
    await expect.poll(async () => (await panelState(page)).every((p) => !p.hidden)).toBe(true);
  });
});

test.describe("E2E-15 About sub-tabs", () => {
  const panes = (page: Page) =>
    page.evaluate(() => ["profile", "arsenal", "journey"].map((s) => !document.getElementById(`about-${s}`)!.hidden));

  test("desktop: one pane at a time, by click and by keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "the sub-tab bar is desktop-only");
    await page.goto("#about");
    await settle(page);
    expect(await panes(page)).toEqual([true, false, false]);
    await page.click("#subtab-journey");
    await expect.poll(() => panes(page)).toEqual([false, false, true]);
    // Manual activation: arrows move focus, Enter selects.
    await page.focus("#subtab-journey");
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#subtab-arsenal")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => panes(page)).toEqual([false, true, false]);
  });

  test("phone: every pane shows, each with its own label", async ({ page, isMobile }) => {
    test.skip(!isMobile, "scroll mode only");
    await page.goto("#about");
    await settle(page);
    expect(await panes(page)).toEqual([true, true, true]);
    await expect(page.locator(".about-pane-label:visible")).toHaveCount(3);
  });
});
