// E2E-21: the Projects browser (ProjectsGrid.tsx, FilterSelect.tsx): search,
// the multi-select filter boxes, empty state, view toggle, the PC deck and the
// phone rail and list (E2E-21), and the PC deck (E2E-27). Expected counts
// come from the data.
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { expect, test } from "./helpers/fixtures";
import { open, settle } from "./helpers/page";

interface Project { title: string; description: string; tags: string[]; role: number; provider: number }
const projects: Project[] = JSON.parse(readFileSync(new URL("../../src/assets/projectlist.json", import.meta.url), "utf8"));
const taglist: Record<string, { name: string }> = JSON.parse(readFileSync(new URL("../../src/assets/taglist.json", import.meta.url), "utf8"));
const roles: Record<string, { name: string }> = JSON.parse(readFileSync(new URL("../../src/assets/roles.json", import.meta.url), "utf8"));
const TOTAL = projects.length;

const status = (page: Page) => page.locator("#projects [role=status]");
const cards = (page: Page) => page.locator("#projects .project-card");
const matching = (q: string) => projects.filter((p) => `${p.title}\n${p.description}`.toLowerCase().includes(q)).length;
const box = (page: Page, facet: "tag" | "role" | "via") =>
  page.locator("#projects .filter-select").filter({ hasText: `${facet}:` });
const listbox = (page: Page) => page.getByRole("listbox");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** An option by its name; its accessible name continues ", <n> projects". */
const option = (page: Page, name: string) => listbox(page).getByRole("option", { name: new RegExp(`^${esc(name)}\\s*,`) });

/**
 * The status line names how many projects match, whatever slice of them is on
 * screen: "// showing 1–8 of 31 (filtered from 40)".
 */
const expectMatched = (page: Page, n: number) =>
  expect(status(page)).toHaveText(new RegExp(`of ${n}${n === TOTAL ? "" : ` \\(filtered from ${TOTAL}\\)`}$`));

/**
 * Move the mouse onto an element the way a hand does, in a run of steps.
 * Radix keeps a hoverable tooltip open while the pointer may be travelling
 * toward it (WCAG 1.4.13) and decides that from the moves that follow; a
 * single-step jump (locator.hover()) leaves it waiting.
 */
const glide = async (page: Page, target: ReturnType<Page["locator"]>) => {
  const b = (await target.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
};

/** The two tags carried by the most projects, so a union is a real widening. */
const [tagA, tagB] = Object.keys(taglist)
  .map((id) => ({ id, n: projects.filter((p) => p.tags.includes(id)).length }))
  .sort((a, b) => b.n - a.n)
  .map((t) => t.id);

test.describe("E2E-21 desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop deck");

  test("search matches titles and descriptions, and the status line counts the filtered set", async ({ page }) => {
    await open(page, { section: "projects" });
    await expectMatched(page, TOTAL);
    // A word that appears in descriptions, so title-only matching would undercount.
    const q = "corporate";
    const n = matching(q);
    expect(n).toBeGreaterThan(0);
    await page.fill(".projects-search", q);
    await expectMatched(page, n);
    await page.getByRole("button", { name: "clear search" }).click();
    await expectMatched(page, TOTAL);
  });

  test("a box takes more than one value: OR within a box, AND across boxes", async ({ page }) => {
    await open(page, { section: "projects" });
    await box(page, "tag").click();
    await expect(listbox(page)).toBeVisible();
    await expect(listbox(page)).toHaveAttribute("aria-multiselectable", "true");

    await option(page, taglist[tagA].name).click();
    const byA = projects.filter((p) => p.tags.includes(tagA));
    await expectMatched(page, byA.length);
    // The list stays open, so a second value is one more click.
    await option(page, taglist[tagB].name).click();
    const byAorB = projects.filter((p) => p.tags.includes(tagA) || p.tags.includes(tagB));
    expect(byAorB.length, "the union widens the list").toBeGreaterThan(byA.length);
    await expectMatched(page, byAorB.length);
    await expect(option(page, taglist[tagA].name)).toHaveAttribute("aria-selected", "true");
    await expect(option(page, taglist[tagB].name)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(listbox(page)).toBeHidden();
    // The closed box shows the first value and how many more.
    await expect(box(page, "tag")).toContainText(taglist[tagA].name);
    await expect(box(page, "tag")).toContainText("+1");
    await expect(page.getByRole("button", { name: /remove filter/ })).toHaveCount(2);

    // A second box narrows what the first widened.
    const roleId = Object.keys(roles).find((r) => byAorB.some((p) => String(p.role) === r) && byAorB.some((p) => String(p.role) !== r))!;
    await box(page, "role").click();
    await option(page, roles[roleId].name).click();
    await page.keyboard.press("Escape");
    const both = byAorB.filter((p) => String(p.role) === roleId);
    expect(both.length).toBeLessThan(byAorB.length);
    await expectMatched(page, both.length);

    // One chip removes one value.
    await page.getByRole("button", { name: new RegExp(`${esc(taglist[tagB].name)}\\s+remove filter`) }).click();
    await expectMatched(page, projects.filter((p) => p.tags.includes(tagA) && String(p.role) === roleId).length);
    await page.getByRole("button", { name: "clear all" }).click();
    await expectMatched(page, TOTAL);
    await expect(page.getByRole("button", { name: /remove filter/ })).toHaveCount(0);
    await expect(box(page, "tag")).toContainText("all");
  });

  test("each option counts what choosing it would show", async ({ page }) => {
    await open(page, { section: "projects" });
    await box(page, "tag").click();
    for (const [id, t] of Object.entries(taglist)) {
      const n = projects.filter((p) => p.tags.includes(id)).length;
      await expect(option(page, t.name).locator(".filter-option-count")).toHaveText(String(n));
    }
  });

  test("the box works from the keyboard and hands focus back when it closes", async ({ page }) => {
    await open(page, { section: "projects" });
    await box(page, "tag").focus();
    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeFocused();
    const ids = Object.keys(taglist);
    // Arrow to the second option and choose it; Space chooses too.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(option(page, taglist[ids[1]].name)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await page.keyboard.press(" ");
    await expect(option(page, taglist[ids[0]].name)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press(" ");
    await expect(option(page, taglist[ids[0]].name)).toHaveAttribute("aria-selected", "false");
    await expectMatched(page, projects.filter((p) => p.tags.includes(ids[1])).length);
    // Escape closes and returns to the box; so does Tab, rather than leaving
    // focus stranded in the portal at the end of <body>.
    await page.keyboard.press("Escape");
    await expect(listbox(page)).toBeHidden();
    await expect(box(page, "tag")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(listbox(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(listbox(page)).toBeHidden();
    await expect(box(page, "tag")).toBeFocused();
  });

  test("no match shows the empty state; the view toggle reports its state", async ({ page }) => {
    await open(page, { section: "projects" });
    await page.fill(".projects-search", "zzzz-no-such-project");
    await expect(page.getByText("No projects match your filters.")).toBeVisible();
    await expect(status(page)).toHaveText(`// showing 0 of 0 (filtered from ${TOTAL})`);
    await page.fill(".projects-search", "");
    await page.getByRole("button", { name: "List view" }).click();
    await expect(page.getByRole("button", { name: "List view" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Grid view" })).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("E2E-27 the PC deck", () => {
  test.skip(({ isMobile }) => isMobile, "the deck is PC only");

  /** The slide range the status line names, e.g. [9, 16]. */
  const slideRange = (page: Page) =>
    status(page).evaluate((el) => {
      const m = el.textContent!.match(/showing (\d+)–(\d+)/);
      return m ? [Number(m[1]), Number(m[2])] : null;
    });

  test("the section is one screen of scroll per slide, and the frame stays on screen through it", async ({ page }) => {
    await open(page, { section: "projects" });
    const r = await page.evaluate(() => {
      const s = document.getElementById("projects")!;
      return {
        deck: s.hasAttribute("data-deck"),
        slides: Number(getComputedStyle(s).getPropertyValue("--slides")),
        height: s.offsetHeight,
        screen: window.innerHeight,
      };
    });
    expect(r.deck).toBe(true);
    expect(r.slides).toBeGreaterThan(1);
    expect(Math.abs(r.height - r.slides * r.screen)).toBeLessThanOrEqual(r.slides);
    // Half way down the deck the frame is still at the top of the screen.
    await page.evaluate(() => window.scrollBy({ top: Math.round(window.innerHeight * 1.5), behavior: "instant" }));
    await settle(page);
    const frameTop = await page.evaluate(() => Math.round(document.querySelector(".projects-frame")!.getBoundingClientRect().top));
    expect(frameTop).toBe(0);
  });

  test("a screen of scroll changes the slide: the old cards shrink away, inert, and each new one grows in after a random 0.5-1s", async ({ page }) => {
    await open(page, { section: "projects" });
    const first = await slideRange(page);
    // Six to a slide: three across, two down.
    expect(first).toEqual([1, 6]);
    expect(await page.locator(".projects-stage").evaluate((el) => [el.style.getPropertyValue("--cols"), el.style.getPropertyValue("--rows")])).toEqual(["3", "2"]);
    const perSlide = first![1];

    // Measured in the page, frame by frame, from the moment the scroll names
    // the next slide: when each arriving card first shows, and whether the
    // leaving slide was inert while it shrank.
    const r = await page.evaluate(async () => {
      const frame = () => new Promise<number>((res) => requestAnimationFrame(res));
      const statusEl = document.querySelector("#projects [role=status]")!;
      const before = statusEl.textContent;
      window.scrollBy({ top: window.innerHeight, behavior: "instant" });
      while (statusEl.textContent === before) await frame();
      const t0 = performance.now();
      const leaving = document.querySelector<HTMLElement>(".projects-slide[data-leaving]");
      const leavingInert = !!leaving && leaving.inert;
      const items = [...document.querySelectorAll<HTMLElement>(".projects-slide:not([data-leaving]) .projects-slide-item")];
      const startedAt: (number | null)[] = items.map(() => null);
      while (performance.now() - t0 < 4000 && startedAt.some((t) => t === null)) {
        const now = await frame();
        items.forEach((el, i) => {
          if (startedAt[i] === null && Number(getComputedStyle(el).opacity) > 0.02) startedAt[i] = (now - t0) / 1000;
        });
      }
      return { leavingInert, startedAt, status: statusEl.textContent };
    });

    expect(r.status).toContain(`showing ${perSlide + 1}–`);
    expect(r.leavingInert, "the leaving slide is inert").toBe(true);
    const starts = r.startedAt as number[];
    expect(starts.every((t) => t !== null), "every card arrived").toBe(true);
    // A frame or two of slack either side of the 0.50-1.00s window.
    for (const t of starts) {
      expect(t).toBeGreaterThanOrEqual(0.45);
      expect(t).toBeLessThanOrEqual(1.15);
    }
    // Random, not one shared delay.
    expect(Math.max(...starts) - Math.min(...starts)).toBeGreaterThan(0.05);

    await settle(page);
    await expect(page.locator(".projects-slide[data-leaving]")).toHaveCount(0);
  });

  test("one wheel gesture turns exactly one slide, and only once the slide has assembled", async ({ page }) => {
    await open(page, { section: "projects" });
    await expect(status(page)).toHaveText(/^\/\/ showing 1–6 of/);
    const box = (await page.locator(".projects-stage").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const top = () => page.evaluate(() => Math.round(document.getElementById("projects")!.getBoundingClientRect().top));
    const screen = await page.evaluate(() => window.innerHeight);

    // Real input: one wheel notch turns one slide -- a whole screen, with the
    // notch's own 100px of native scroll cancelled, not added on top.
    await page.mouse.wheel(0, 100);
    await expect(status(page)).toHaveText(/^\/\/ showing 7–12 of/);
    expect(await top()).toBe(-screen);
    await settle(page);

    // The gesture logic, timed in the page at a trackpad's own 16ms spacing
    // (a test's input arrives slower than that, and late enough under load to
    // read as separate gestures).
    const r = await page.evaluate(async () => {
      const statusEl = document.querySelector("#projects [role=status]")!;
      const wheel = (dy: number) => window.dispatchEvent(new WheelEvent("wheel", { deltaY: dy, cancelable: true, bubbles: true }));
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const range = () => statusEl.textContent!.match(/showing (\S+) of/)![1];

      await sleep(300); // the notch's gesture is over
      // A swipe and its long momentum tail: one gesture, so one slide.
      const beforeSwipe = range();
      for (const d of [3, 8, 18, 34, 52, 64, 70, 66]) { wheel(d); await sleep(16); }
      for (let i = 0; i < 70; i++) { wheel(Math.max(1, Math.round(60 * Math.exp(-i / 14)))); await sleep(16); }
      const afterSwipe = range();

      // Wait out the swipe's gesture and the slide's assembly, then step.
      await sleep(1600);
      wheel(100);
      await sleep(50);
      const afterStep = range();
      // A fresh gesture straight after, while that slide is still assembling.
      await sleep(260);
      wheel(100);
      await sleep(50);
      const whileAssembling = range();
      return { beforeSwipe, afterSwipe, afterStep, whileAssembling };
    });
    expect(r).toEqual({ beforeSwipe: "7–12", afterSwipe: "13–18", afterStep: "19–24", whileAssembling: "19–24" });
  });

  test("at the first slide a gesture up leaves the deck, and one in from above lands on it", async ({ page }) => {
    await open(page, { section: "projects" });
    const box = (await page.locator(".projects-stage").boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const top = () => page.evaluate(() => Math.round(document.getElementById("projects")!.getBoundingClientRect().top));
    await page.mouse.wheel(0, -120);
    await expect.poll(top).toBeGreaterThan(0);
    // From just above, a flick that would carry far into the deck stops on
    // its first slide instead.
    await page.evaluate(() => {
      const s = document.getElementById("projects")!;
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 200, behavior: "instant" });
    });
    await settle(page);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, 600);
    await expect.poll(top).toBe(0);
    await expect(status(page)).toHaveText(/^\/\/ showing 1–6 of/);
  });

  test("scrolling through several slides shows each one at once", async ({ page }) => {
    await open(page, { section: "projects" });
    // Two changes in quick succession: the second is the reader scrolling
    // through, so its cards must not wait out the 0.5-1s assembly.
    const r = await page.evaluate(async () => {
      const frame = () => new Promise<number>((res) => requestAnimationFrame(res));
      const statusEl = document.querySelector("#projects [role=status]")!;
      const changed = async (before: string | null) => {
        while (statusEl.textContent === before) await frame();
      };
      let before = statusEl.textContent;
      window.scrollBy({ top: window.innerHeight, behavior: "instant" });
      await changed(before);
      for (let k = 0; k < 6; k++) await frame();
      before = statusEl.textContent;
      window.scrollBy({ top: window.innerHeight, behavior: "instant" });
      await changed(before);
      const t0 = performance.now();
      const items = [...document.querySelectorAll<HTMLElement>(".projects-slide:not([data-leaving]) .projects-slide-item")];
      const startedAt: (number | null)[] = items.map(() => null);
      while (performance.now() - t0 < 3000 && startedAt.some((t) => t === null)) {
        const now = await frame();
        items.forEach((el, i) => {
          if (startedAt[i] === null && Number(getComputedStyle(el).opacity) > 0.02) startedAt[i] = (now - t0) / 1000;
        });
      }
      return startedAt;
    });
    expect(r.every((t) => t !== null)).toBe(true);
    // Before the earliest a stepped-onto slide may start (0.5s): proof the
    // cards skipped the assembly, with room for a loaded machine's frames.
    expect(Math.max(...(r as number[]))).toBeLessThan(0.5);
    await settle(page);
  });

  test("hovering a card opens its full description in a popup; its no-link button shows only the reason", async ({ page }) => {
    await open(page, { section: "projects" });
    const slideCards = page.locator(".projects-slide:not([data-leaving]) .project-card");
    const tips = page.locator("[data-slot='tooltip-content']:visible");
    // The popup's own paragraphs, not the visually-hidden copy Radix adds
    // inside it for screen readers.
    const desc = page.locator(".project-tip:visible");
    const descText = page.locator(".project-tip:visible > .project-tip-desc");
    const descMeta = page.locator(".project-tip:visible > .project-tip-meta");

    for (let i = 0; i < (await slideCards.count()); i++) {
      const card = slideCards.nth(i);
      const title = (await card.locator("h3").textContent())!.trim();
      const project = projects.find((p) => p.title === title)!;
      await glide(page, card.locator("h3"));
      await expect(desc).toHaveCount(1);
      // The whole description, never clamped, and the role and via line.
      await expect(descText).toHaveText(project.description.trim());
      expect(await descText.evaluate((p) => p.scrollHeight <= p.clientHeight + 1)).toBe(true);
      await expect(descMeta).toContainText(`role: ${roles[String(project.role)].name}`);
      await expect(descMeta).toContainText("via:");
    }

    // On a card's own "No public link" button, its reason is the one tooltip.
    const noLink = page.locator(".projects-slide:not([data-leaving]) button[data-slot='tooltip-trigger']").first();
    await glide(page, noLink);
    await expect(tips).toHaveCount(1);
    await expect(desc).toHaveCount(0);
  });

  test("the pager goes to a slide, and a new filter starts the deck again at its first", async ({ page }) => {
    await open(page, { section: "projects" });
    const dots = page.locator(".projects-pager-dot");
    expect(await dots.count()).toBeGreaterThan(2);
    await dots.nth(2).click();
    await settle(page);
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
    const range = await slideRange(page);
    expect(range![0]).toBeGreaterThan(1);
    // The frame is stuck to the screen; the filter jumps the page back to the
    // deck's start without moving it.
    await page.fill(".projects-search", "a");
    await settle(page);
    expect(await page.evaluate(() => Math.round(document.getElementById("projects")!.getBoundingClientRect().top))).toBe(0);
    await expect(status(page)).toHaveText(/showing 1(–\d+)? of/);
  });
});

test.describe("E2E-21 phone", () => {
  test.skip(({ isMobile }) => !isMobile, "the phone rail and list");

  test("grid is a swipe rail; list view grows the page a batch at a time", async ({ page }) => {
    await open(page, { section: "projects" });
    await expect(page.locator("#projects")).not.toHaveAttribute("data-deck", "");
    await expect(page.locator(".projects-rail")).toBeVisible();
    await expect(page.locator(".projects-rail > *")).toHaveCount(TOTAL);
    await page.getByRole("button", { name: "List view" }).click();
    await settle(page);
    await expect(cards(page)).toHaveCount(8);
    await page.getByRole("button", { name: /Show more/ }).click();
    await expect(cards(page)).toHaveCount(16);
    await expect(status(page)).toHaveText(`// showing 1–16 of ${TOTAL}`);
    await page.fill(".projects-search", "corporate");
    await expect(cards(page)).toHaveCount(Math.min(8, matching("corporate")));
  });

  test("tap and hold opens a card's description; the card says so; a tap elsewhere closes it", async ({ page, context }) => {
    await open(page, { section: "projects" });
    const card = page.locator(".projects-rail .project-card").first();
    await expect(card.locator(".project-hold-hint")).toBeVisible();
    await expect(card.locator(".project-hold-hint")).toHaveText(/tap and hold to see description/i);

    // Real touch input, through the DevTools protocol: Playwright's own
    // touchscreen only taps.
    const cdp = await context.newCDPSession(page);
    const touch = (type: "touchStart" | "touchEnd", points: { x: number; y: number }[]) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    const box = (await card.locator("h3").boundingBox())!;
    const at = { x: box.x + 20, y: box.y + box.height / 2 };
    const desc = page.locator(".project-tip:visible");

    // A tap is not a hold.
    await touch("touchStart", [at]);
    await touch("touchEnd", []);
    await page.waitForTimeout(700); // longer than the hold, so a tap that opened it would show
    await expect(desc).toHaveCount(0);

    // A hold opens it, and it stays open once the finger lifts.
    await touch("touchStart", [at]);
    await expect(desc).toHaveCount(1);
    await touch("touchEnd", []);
    await page.waitForTimeout(300);
    await expect(desc).toHaveCount(1);
    await expect(page.locator(".project-tip:visible > .project-tip-meta")).toContainText("role:");

    // The next tap anywhere outside it closes it.
    await touch("touchStart", [{ x: 200, y: 140 }]);
    await touch("touchEnd", []);
    await expect(desc).toHaveCount(0);
  });

  test("the three boxes share a row and still show their keys", async ({ page }) => {
    await open(page, { section: "projects" });
    const r = await page.locator("#projects .filter-select").evaluateAll((els) =>
      els.map((e) => {
        const b = e.getBoundingClientRect();
        const key = e.querySelector(".filter-select-key")!;
        return { top: Math.round(b.top), keyShown: key.getBoundingClientRect().right <= b.right };
      }),
    );
    expect(r).toHaveLength(3);
    expect(new Set(r.map((x) => x.top)).size, "one row").toBe(1);
    expect(r.every((x) => x.keyShown)).toBe(true);
  });
});
