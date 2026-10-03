// E2E-11: the inline pre-paint theme script (src/layout/layout.astro).
// E2E-12: the Manual / Blueprint toggle (ThemeToggle + ThemeProvider).
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { open, settle } from "./helpers/page";

test.skip(({ isMobile }) => isMobile, "theme logic does not depend on the viewport");

/** Record the theme at the moment <body> is first parsed: before first paint. */
async function recordPrePaint(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __qaPrePaint?: { dark: boolean; scheme: string } };
    new MutationObserver((_, obs) => {
      if (!document.body) return;
      const html = document.documentElement;
      w.__qaPrePaint = { dark: html.classList.contains("dark"), scheme: html.style.colorScheme };
      obs.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
}
const prePaint = (page: Page) =>
  page.evaluate(() => (window as unknown as { __qaPrePaint: { dark: boolean; scheme: string } }).__qaPrePaint);
/** The settled theme: the class, and the colour scheme actually in effect. */
const current = (page: Page) =>
  page.evaluate(() => ({ dark: document.documentElement.classList.contains("dark"), scheme: getComputedStyle(document.documentElement).colorScheme }));

type Stored = "light" | "dark" | "none" | "garbage" | "blocked";
/** The documented rule: an explicit stored choice wins; otherwise follow the OS. */
const expected = (stored: Stored, os: "light" | "dark") => {
  if (stored === "light" || stored === "dark") return stored === "dark";
  if (stored === "garbage") return false; // a value that is not "dark" reads as Manual
  return os === "dark"; // nothing stored, or nothing readable
};

test.describe("E2E-11 the theme is set before first paint", () => {
  for (const stored of ["light", "dark", "none", "garbage", "blocked"] as const) {
    for (const os of ["light", "dark"] as const) {
      test.describe(`stored ${stored}, OS ${os}`, () => {
        test.use({ seed: { theme: null, consent: "denied" }, colorScheme: os });

        test("matches the rule at first paint and never flips after", async ({ page }) => {
          // CR-27: with storage blocked the script used to throw before it
          // read the OS preference, so an OS-dark visitor got Manual.
          await recordPrePaint(page);
          await page.addInitScript((s) => {
            if (s === "blocked") {
              Storage.prototype.getItem = () => { throw new Error("blocked"); };
              Storage.prototype.setItem = () => { throw new Error("blocked"); };
            } else if (s !== "none") localStorage.setItem("theme", s);
          }, stored);
          await page.goto("#home");
          const dark = expected(stored, os);
          const first = await prePaint(page);
          expect(first.dark, "theme class at first paint").toBe(dark);
          // The script also pins color-scheme inline, ahead of the stylesheet
          // (it cannot when storage throws -- see CR-27).
          if (stored !== "blocked") expect(first.scheme).toBe(dark ? "dark" : "light");
          await settle(page);
          expect(await current(page)).toEqual({ dark, scheme: dark ? "dark" : "light" });
        });
      });
    }
  }
});

test.describe("E2E-12 the theme toggle", () => {
  test.use({ seed: { theme: null, consent: "denied" }, colorScheme: "light" });

  const toggle = (page: Page) => page.getByRole("button", { name: "Blueprint mode" });

  test("keeps one name, reports state with aria-pressed, and stores the choice", async ({ page }) => {
    await open(page);
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    await expect(toggle(page)).toHaveAccessibleName("Blueprint mode");
    expect(await current(page)).toEqual({ dark: true, scheme: "dark" });
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
  });

  test("works from the keyboard with Space and Enter", async ({ page }) => {
    await open(page);
    await toggle(page).focus();
    await page.keyboard.press("Space");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  });

  test("follows the OS until the visitor chooses, then never again", async ({ page }) => {
    await open(page);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => current(page)).toEqual({ dark: true, scheme: "dark" });
    await toggle(page).click(); // explicit choice: Manual
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => current(page)).toEqual({ dark: false, scheme: "light" });
  });

  test("the choice survives a reload", async ({ page }) => {
    await open(page);
    await toggle(page).click();
    await page.reload();
    await settle(page);
    expect(await current(page)).toEqual({ dark: true, scheme: "dark" });
    await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  });
});
