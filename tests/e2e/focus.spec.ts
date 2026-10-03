// E2E-03: every keyboard stop shows a visible indicator (SC 2.4.7 / 1.4.11).
// E2E-04: no focused control is ever entirely hidden by the fixed nav (SC 2.4.11).
//
// Focus is moved with real Tab presses, never .focus(): Radix roving
// tablists redirect programmatic focus, and only the keyboard sets the
// :focus-visible modality a user would see. Reduced motion makes the
// 0.2s transitions and smooth focus-scrolling instant, so styles can be read
// without sleeps.
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { STATES, open, stateName } from "./helpers/page";

test.use({ contextOptions: { reducedMotion: "reduce" } });

/**
 * Known open defect, kept out of the general audit and asserted on its own
 * below: CR-03, the Skills tab panel is a Tab stop with no indicator.
 */
const KNOWN = "#about-arsenal [role='tabpanel']";

interface Stop {
  name: string;
  focusVisible: boolean;
  indicator: string | null;
  known: boolean;
}

/**
 * Move the sequential-focus starting point back to the top of the document
 * (the same body focus/blur HeaderComponent uses), so the next Tab lands on
 * the first stop rather than after whatever was last clicked.
 */
export const resetFocusStart = (page: Page) =>
  page.evaluate(() => {
    const body = document.body;
    body.setAttribute("tabindex", "-1");
    body.focus({ preventScroll: true });
    body.blur();
    body.removeAttribute("tabindex");
  });

/** Wait two frames: transitions (even 0.01ms ones) start from the old value. */
const twoFrames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

/** Tab through the page and judge each stop's focus indicator. */
async function auditFocus(page: Page, maxStops = 120): Promise<Stop[]> {
  await page.mouse.move(1, 1);
  await page.evaluate(() => {
    (window as unknown as { __qaFocus: unknown[] }).__qaFocus = [];
  });
  await resetFocusStart(page);
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press("Tab");
    await page.evaluate(twoFrames);
    const done = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const store = (window as unknown as { __qaFocus: { el: Element; s: Record<string, string>; fv: boolean }[] }).__qaFocus;
      if (!el || el === document.body || store.some((r) => r.el === el)) return true;
      const s = getComputedStyle(el);
      store.push({
        el,
        fv: el.matches(":focus-visible"),
        s: { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, boxShadow: s.boxShadow, borderColor: s.borderTopColor, borderWidth: s.borderTopWidth },
      });
      return false;
    });
    if (done) break;
  }
  return page.evaluate(async (known) => {
    (document.activeElement as HTMLElement | null)?.blur();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const qa = window.__qa;
    const store = (window as unknown as { __qaFocus: { el: Element; s: Record<string, string>; fv: boolean }[] }).__qaFocus;
    const rings = (shadow: string) =>
      shadow === "none"
        ? []
        : shadow.split(/,(?![^()]*\))/).map((x) => x.trim()).filter((x) => /\s0px 0px 0px (\d+(\.\d+)?)px/.test(x) && parseFloat(x.match(/0px 0px 0px (\d+(?:\.\d+)?)px/)![1]) >= 2);
    return store.map(({ el, s: f, fv }) => {
      const rest = getComputedStyle(el);
      const ground = qa.ground(el.parentElement ?? document.body).color;
      const vs = (c: string) => qa.ratio(qa.over(qa.parse(c), ground), ground);
      let indicator: string | null = null;
      if (f.outlineStyle !== "none" && parseFloat(f.outlineWidth) >= 1) {
        if (f.outlineStyle === "auto") indicator = "UA focus ring";
        else if (vs(f.outlineColor) >= 3) indicator = `outline ${vs(f.outlineColor).toFixed(2)}:1`;
      }
      if (!indicator) {
        const restRings = new Set(rings(rest.boxShadow));
        // Chromium serialises the colour first: rgba(...), color(srgb ...), #hex or a keyword.
        const colourOf = (r: string) => r.match(/^(\w[\w-]*\([^)]*\)|#[0-9a-f]+|[a-z]+)/i)?.[1] ?? "transparent";
        const ring = rings(f.boxShadow).find((r) => !restRings.has(r) && vs(colourOf(r)) >= 3);
        if (ring) indicator = `ring ${ring}`;
      }
      if (!indicator && f.borderColor !== rest.borderTopColor && parseFloat(f.borderWidth) >= 1 && vs(f.borderColor) >= 3) {
        indicator = `border ${vs(f.borderColor).toFixed(2)}:1`;
      }
      return { name: qa.describe(el), focusVisible: fv, indicator, known: el.matches(known) };
    });
  }, KNOWN);
}

test.describe("E2E-03 every keyboard stop shows a focus indicator (>= 3:1)", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard focus audit runs on desktop");

  for (const theme of ["light", "dark"] as const) {
    test.describe(theme === "light" ? "Manual" : "Blueprint", () => {
      test.use({ seed: { theme, consent: "denied" } });

      for (const state of STATES) {
        test(stateName(state), async ({ page }) => {
          await open(page, state);
          const stops = (await auditFocus(page)).filter((s) => !s.known);
          expect(stops.length, "the walk reached the panel").toBeGreaterThan(5);
          expect(stops.filter((s) => !s.focusVisible || !s.indicator).map((s) => `${s.name} focus-visible=${s.focusVisible}`)).toEqual([]);
        });
      }

      // CR-03: shadcn's TabsContent is a Tab stop (Radix tabIndex 0) and its
      // `outline-none` removed every indicator; .skills-panel restores one.
      test("CR-03: the Skills tab panel shows a focus indicator", async ({ page }) => {
        await open(page, { tab: "about", sub: "arsenal" });
        const panel = (await auditFocus(page)).find((s) => s.known);
        expect(panel, "the Skills tab panel is a Tab stop").toBeTruthy();
        expect(panel!.indicator).not.toBeNull();
      });
    });
  }
});

test.describe("E2E-04 the fixed nav never hides the focused control", () => {
  test.skip(({ isMobile }) => !isMobile, "the nav overlays content only in phone scroll mode");

  /** After each key press: is the focused element entirely behind the nav? */
  async function walk(page: Page, key: "Tab" | "Shift+Tab", max = 160) {
    const hidden: string[] = [];
    let visited = 0;
    await page.evaluate(() => document.querySelectorAll("[data-qa-seen]").forEach((e) => e.removeAttribute("data-qa-seen")));
    for (let i = 0; i < max; i++) {
      await page.keyboard.press(key);
      const r = await page.evaluate(async () => {
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
        const el = document.activeElement as HTMLElement | null;
        const nav = document.querySelector("nav[aria-label='Primary']")!;
        if (!el || el === document.body || el.hasAttribute("data-qa-seen")) return null; // end, or wrapped round
        el.setAttribute("data-qa-seen", "");
        if (nav.contains(el) || el.classList.contains("skip-link")) return { inNav: true, hidden: false, name: "" };
        const b = el.getBoundingClientRect();
        const n = nav.getBoundingClientRect();
        const covered = b.bottom <= n.bottom && b.left >= n.left - 2 && b.right <= n.right + 2;
        return { inNav: false, hidden: covered, name: `${window.__qa.describe(el)} bottom=${Math.round(b.bottom)} nav=${Math.round(n.bottom)}` };
      });
      if (!r) break;
      if (!r.inNav) {
        visited++;
        if (r.hidden) hidden.push(r.name);
      }
    }
    return { hidden, visited };
  }

  test("tabbing forward and backward through the whole document", async ({ page }) => {
    await open(page, { tab: "home" });
    await resetFocusStart(page);
    const forward = await walk(page, "Tab");
    expect(forward.visited).toBeGreaterThan(40);
    expect(forward.hidden).toEqual([]);
    const backward = await walk(page, "Shift+Tab");
    expect(backward.visited).toBeGreaterThan(40);
    expect(backward.hidden).toEqual([]);
  });
});
