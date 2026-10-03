// E2E-22: semantics spot checks, one per UI-review finding (UI-03, A11Y-04,
// UI-05, UI-02), each fixed and now held here.
import { expect, test } from "./helpers/fixtures";
import { open } from "./helpers/page";

test.skip(({ isMobile }) => isMobile, "the floaters and the hover tooltips are desktop features");

test("UI-03: the hero's decorative code floaters are hidden from assistive tech", async ({ page }) => {
  await open(page);
  const tree = await page.locator("#home").ariaSnapshot();
  for (const text of ["const x = () => {}", "npm run dev", "<Component />"]) expect(tree).not.toContain(text);
});

test("A11Y-04: the logo button's accessible name contains its visible text", async ({ page }) => {
  await open(page);
  await expect(page.locator("nav button.logo-home")).toHaveAccessibleName(/james/i);
});

test("UI-05: the theme toggle's action is shown to keyboard users, not only in a title", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Blueprint mode" }).focus();
  await expect(page.getByRole("tooltip")).toContainText(/switch to/i, { timeout: 2000 });
});

test("UI-02: a keyboard user can read why a project has no live link", async ({ page }) => {
  await open(page, { tab: "projects" });
  const trigger = page.locator("#projects [data-slot='tooltip-trigger']").first();
  expect(await trigger.evaluate((el) => (el as HTMLElement).tabIndex)).toBeGreaterThanOrEqual(0);
  await page.keyboard.press("Tab");
  await trigger.focus();
  await expect(page.locator("[data-slot='tooltip-content']").first()).toBeVisible({ timeout: 2000 });
});
