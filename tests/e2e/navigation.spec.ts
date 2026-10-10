// E2E-13 (one scrolling page, every width), E2E-14 (landing on a hash and the
// nav's scroll-spy), E2E-15 (About sub-tabs, at every width).
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { currentSection, sectionTop, settle } from "./helpers/page";

const SECTIONS = ["home", "about", "projects", "contact"] as const;

const navLink = (page: Page, name: string) =>
  page.locator("nav[aria-label='Primary']").getByRole("link", { name, exact: true });

test.describe("E2E-13 one scrolling page", () => {
  test("every section is in the document and at least one screen tall; nothing clips its content", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    const r = await page.evaluate((ids) => {
      const footer = document.querySelector("body > footer")!.getBoundingClientRect().height;
      return {
        sections: ids.map((id) => {
          const el = document.getElementById(id)!;
          const cs = getComputedStyle(el);
          return { id, hidden: el.hidden, height: Math.round(el.getBoundingClientRect().height), overflowY: cs.overflowY };
        }),
        screen: window.innerHeight,
        footer: Math.round(footer),
      };
    }, [...SECTIONS]);
    expect(r.sections.map((s) => s.hidden)).toEqual([false, false, false, false]);
    for (const s of r.sections) {
      // Contact gives the footer its share, so the last screen is Contact + footer.
      const min = s.id === "contact" ? r.screen - r.footer : r.screen;
      expect(s.height, `#${s.id} height`).toBeGreaterThanOrEqual(min - 1);
      // Sections grow with their content; none cuts it off or scrolls it.
      expect(s.overflowY, `#${s.id} overflow-y`).toBe("visible");
    }
    // About holds the most and runs past a screen.
    expect(r.sections.find((s) => s.id === "about")!.height).toBeGreaterThan(r.screen);
  });

  test("the nav links scroll to their section and the nav follows the reader", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    expect(await currentSection(page)).toBe("home");
    for (const [name, id] of [["Projects", "projects"], ["About", "about"], ["Contact", "contact"]] as const) {
      await navLink(page, name).click();
      await settle(page);
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      expect(Math.abs(await sectionTop(page, id)), `#${id} lands at the top`).toBeLessThanOrEqual(2);
      await expect.poll(() => currentSection(page)).toBe(id);
    }
    // Scrolling by hand moves the marker too; nothing writes to the hash.
    await page.evaluate(() => window.scrollTo({ top: document.getElementById("about")!.offsetTop, behavior: "instant" }));
    await expect.poll(() => currentSection(page)).toBe("about");
    await expect(page).toHaveURL(/#contact$/);
    await page.locator("nav a.logo-home").click();
    await settle(page);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
    await expect.poll(() => currentSection(page)).toBe("home");
  });

  test("after following a nav link, the next Tab lands inside that section", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    await navLink(page, "Projects").click();
    await settle(page);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("#projects"))).toBe(true);
  });

  test("back and forward return to the sections the links went to", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    await navLink(page, "Projects").click();
    await settle(page);
    await navLink(page, "Contact").click();
    await settle(page);
    await page.goBack();
    await settle(page);
    expect(Math.abs(await sectionTop(page, "projects"))).toBeLessThanOrEqual(2);
    await page.goForward();
    await settle(page);
    expect(Math.abs(await sectionTop(page, "contact"))).toBeLessThanOrEqual(2);
  });

  test("the flow links walk home -> about -> projects -> contact", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    for (const [from, next] of [["home", "about"], ["about", "projects"], ["projects", "contact"]] as const) {
      await page.locator(`#${from} a[href="#${next}"]`).last().click();
      await settle(page);
      expect(Math.abs(await sectionTop(page, next)), `#${next}`).toBeLessThanOrEqual(2);
    }
  });

  test("the skip link goes to the content without moving the reader off the top", async ({ page }) => {
    await page.goto("#home");
    await settle(page);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  });
});

test.describe("E2E-14 landing on a hash", () => {
  for (const id of SECTIONS) {
    test(`/#${id} lands with the section at the top and holds there`, async ({ page }) => {
      await page.goto(`#${id}`);
      await settle(page);
      const first = await sectionTop(page, id);
      // The old phone scroll mode drifted ~1200px over ~900ms after landing.
      await page.waitForTimeout(1500);
      expect(await sectionTop(page, id), "the landing position holds").toBe(first);
      expect(Math.abs(first)).toBeLessThanOrEqual(1);
      await expect.poll(() => currentSection(page)).toBe(id);
      // The section pads itself clear of the floating nav: its first line of
      // content is never behind the pill.
      const gap = await page.evaluate((i) => {
        const nav = document.querySelector("nav[aria-label='Primary']")!.getBoundingClientRect().bottom;
        const first = [...document.getElementById(i)!.querySelectorAll("h1, h2, p")]
          .find((n) => !n.closest("[aria-hidden='true'], [hidden]") && n.getBoundingClientRect().height)!;
        return first.getBoundingClientRect().top - nav;
      }, id);
      expect(gap, "first content clears the nav").toBeGreaterThanOrEqual(0);
    });
  }

  for (const [legacy, id] of [["#skills", "about"], ["#experience", "about"]] as const) {
    test(`${legacy} resolves to #${id} without adding a history entry`, async ({ page }) => {
      // History length as the page first sees it (Playwright's about:blank
      // counts as an entry), before the hash is canonicalised.
      await page.addInitScript(() => {
        (window as unknown as { __qaHistory: number }).__qaHistory = history.length;
      });
      await page.goto(legacy);
      await settle(page);
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      expect(Math.abs(await sectionTop(page, id))).toBeLessThanOrEqual(1);
      // replaceState, not pushState: canonicalising adds no entry.
      expect(await page.evaluate(() => history.length)).toBe(
        await page.evaluate(() => (window as unknown as { __qaHistory: number }).__qaHistory),
      );
    });
  }

  test("an unknown hash is left alone at the top of the page", async ({ page }) => {
    await page.goto("#bogus");
    await settle(page);
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(0);
    expect(await currentSection(page)).toBe("home");
  });

  test("landing on a hash leaves the first Tab at the top of the document (WCAG 2.4.3)", async ({ page }) => {
    await page.goto("#contact");
    await settle(page);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
  });
});

test.describe("E2E-15 About is three sub-sections, all on the page", () => {
  test("Profile, Arsenal and Journey each show, in order, under their own heading", async ({ page }) => {
    await page.goto("#about");
    await settle(page);
    const r = await page.evaluate(() =>
      ["profile", "arsenal", "journey"].map((s) => {
        const el = document.getElementById(`about-${s}`)!;
        const h = el.querySelector("h3")!;
        return {
          shown: !el.hidden && el.getBoundingClientRect().height > 0,
          heading: h.textContent!.trim(),
          labelled: el.getAttribute("aria-labelledby") === h.id,
          top: el.getBoundingClientRect().top,
        };
      }),
    );
    expect(r.map((x) => x.shown)).toEqual([true, true, true]);
    expect(r.map((x) => x.heading)).toEqual([expect.stringMatching(/Profile/), expect.stringMatching(/Arsenal/), expect.stringMatching(/Journey/)]);
    expect(r.every((x) => x.labelled)).toBe(true);
    expect(r[0].top).toBeLessThan(r[1].top);
    expect(r[1].top).toBeLessThan(r[2].top);
    // No tabs anywhere in About any more: every skill and every stage is printed.
    expect(await page.locator("#about [role='tab'], #about [role='tablist']").count()).toBe(0);
  });

  test("every skill category and every Journey stage is shown at once", async ({ page }) => {
    await page.goto("#about");
    await settle(page);
    await expect(page.locator("#about-arsenal .skills-category")).toHaveCount(3);
    const stages = page.locator("#about-journey .journey-stage");
    await expect(stages).toHaveCount(6);
    // The last stage is the running one.
    await expect(stages.last()).toHaveAttribute("data-state", "running");
  });
});
