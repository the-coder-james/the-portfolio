// E2E-21: the Projects browser (ProjectsGrid.tsx): search, filters, empty
// state, view toggle, and phone paging. Expected counts come from the data.
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { expect, test } from "./helpers/fixtures";
import { open, settle } from "./helpers/page";

interface Project { title: string; description: string; tags: string[]; role: number; provider: number }
const projects: Project[] = JSON.parse(readFileSync(new URL("../../src/assets/projectlist.json", import.meta.url), "utf8"));
const TOTAL = projects.length;

const status = (page: Page) => page.locator("#projects [role=status]");
const cards = (page: Page) => page.locator("#projects [data-reveal][tabindex='0']");
const matching = (q: string) => projects.filter((p) => `${p.title}\n${p.description}`.toLowerCase().includes(q)).length;

test.describe("E2E-21 desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop grid");

  test("search matches titles and descriptions, and the status line counts the filtered set", async ({ page }) => {
    await open(page, { tab: "projects" });
    await expect(status(page)).toHaveText(`// showing ${TOTAL} of ${TOTAL}`);
    // A word that appears in descriptions, so title-only matching would undercount.
    const q = "corporate";
    const n = matching(q);
    expect(n).toBeGreaterThan(0);
    await page.fill(".projects-search", q);
    await expect(status(page)).toHaveText(`// showing ${n} of ${n} (filtered from ${TOTAL})`);
    await expect(cards(page)).toHaveCount(n);
    await page.getByRole("button", { name: "clear search" }).click();
    await expect(status(page)).toHaveText(`// showing ${TOTAL} of ${TOTAL}`);
  });

  test("filters combine, show as removable chips, and clear all resets them", async ({ page }) => {
    await open(page, { tab: "projects" });
    const tag = page.locator(".filter-select").nth(0);
    const role = page.locator(".filter-select").nth(1);
    const tagId = await tag.locator("option").nth(1).getAttribute("value");
    await tag.selectOption(tagId!);
    const byTag = projects.filter((p) => p.tags.includes(tagId!));
    await expect(cards(page)).toHaveCount(byTag.length);
    await expect(page.getByRole("button", { name: /remove filter/ })).toHaveCount(1);
    const roleId = await role.locator("option").nth(1).getAttribute("value");
    await role.selectOption(roleId!);
    const both = byTag.filter((p) => String(p.role) === roleId);
    // AND, not OR: the result never grows when a filter is added.
    expect(both.length).toBeLessThanOrEqual(byTag.length);
    await expect(cards(page)).toHaveCount(both.length);
    await page.getByRole("button", { name: "clear all" }).click();
    await expect(cards(page)).toHaveCount(TOTAL);
    await expect(page.getByRole("button", { name: /remove filter/ })).toHaveCount(0);
  });

  test("no match shows the empty state; the view toggle reports its state", async ({ page }) => {
    await open(page, { tab: "projects" });
    await page.fill(".projects-search", "zzzz-no-such-project");
    await expect(page.getByText("No projects match your filters.")).toBeVisible();
    await expect(status(page)).toHaveText(`// showing 0 of 0 (filtered from ${TOTAL})`);
    await page.fill(".projects-search", "");
    await page.getByRole("button", { name: "List view" }).click();
    await expect(page.getByRole("button", { name: "List view" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Grid view" })).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("E2E-21 phone", () => {
  test.skip(({ isMobile }) => !isMobile, "phone paging and rail");

  test("grid is a swipe rail; list view pages by 8 and resets when filtered", async ({ page }) => {
    await open(page, { tab: "projects" });
    await expect(page.locator(".projects-rail")).toBeVisible();
    await expect(page.locator(".projects-rail > *")).toHaveCount(TOTAL);
    await page.getByRole("button", { name: "List view" }).click();
    await settle(page);
    await expect(cards(page)).toHaveCount(8);
    await page.getByRole("button", { name: /Show more/ }).click();
    await expect(cards(page)).toHaveCount(16);
    await expect(status(page)).toHaveText(`// showing 16 of ${TOTAL}`);
    await page.fill(".projects-search", "corporate");
    const n = matching("corporate");
    await expect(cards(page)).toHaveCount(Math.min(8, n));
  });
});
