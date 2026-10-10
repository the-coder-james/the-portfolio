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
import { SECTION_STATES, open, stateName } from "./helpers/page";

test.use({ contextOptions: { reducedMotion: "reduce" } });

interface Stop {
  name: string;
  focusVisible: boolean;
  indicator: string | null;
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

/**
 * Tab through one section and judge each stop's focus indicator. Home starts
 * at the top of the document, so the skip link and the nav are walked with it;
 * every other section starts at its own top. The walk ends where focus leaves
 * the section.
 */
async function auditFocus(page: Page, section: string, maxStops = 120): Promise<Stop[]> {
  await page.mouse.move(1, 1);
  await page.evaluate(() => {
    (window as unknown as { __qaFocus: unknown[] }).__qaFocus = [];
  });
  if (section === "home") await resetFocusStart(page);
  else await page.evaluate((id) => document.getElementById(id)!.focus({ preventScroll: true }), section);
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press("Tab");
    await page.evaluate(twoFrames);
    const done = await page.evaluate((id) => {
      const el = document.activeElement as HTMLElement | null;
      const store = (window as unknown as { __qaFocus: { el: Element; s: Record<string, string>; fv: boolean }[] }).__qaFocus;
      if (!el || el === document.body || store.some((r) => r.el === el)) return true;
      const owner = el.closest("main > section");
      if (id === "home" ? owner && owner.id !== "home" : owner?.id !== id) return true;
      const s = getComputedStyle(el);
      store.push({
        el,
        fv: el.matches(":focus-visible"),
        s: { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, boxShadow: s.boxShadow, borderColor: s.borderTopColor, borderWidth: s.borderTopWidth },
      });
      return false;
    }, section);
    if (done) break;
  }
  return page.evaluate(async () => {
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
      return { name: qa.describe(el), focusVisible: fv, indicator };
    });
  });
}

test.describe("E2E-03 every keyboard stop shows a focus indicator (>= 3:1)", () => {
  test.skip(({ isMobile }) => isMobile, "keyboard focus audit runs on desktop");

  for (const theme of ["light", "dark"] as const) {
    test.describe(theme === "light" ? "Manual" : "Blueprint", () => {
      test.use({ seed: { theme, consent: "denied" } });

      // One walk per section: About's three sub-sections are all on the page,
      // so its walk covers every one of them.
      for (const state of SECTION_STATES) {
        test(stateName(state), async ({ page }) => {
          await open(page, state);
          const stops = await auditFocus(page, state.section);
          expect(stops.length, "the walk reached the section").toBeGreaterThan(1);
          expect(stops.filter((s) => !s.focusVisible || !s.indicator).map((s) => `${s.name} focus-visible=${s.focusVisible}`)).toEqual([]);
        });
      }
    });
  }
});

test.describe("E2E-04 the fixed nav never hides the focused control", () => {
  // The nav floats over whichever section is under it, at every width.

  /** After each key press: is the focused element entirely behind the nav? */
  async function walk(page: Page, key: "Tab" | "Shift+Tab", max = 160) {
    const hidden: string[] = [];
    const sections = new Set<string>();
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
        const section = el.closest("main > section")?.id ?? "";
        return { inNav: false, hidden: covered, section, name: `${window.__qa.describe(el)} bottom=${Math.round(b.bottom)} nav=${Math.round(n.bottom)}` };
      });
      if (!r) break;
      if (!r.inNav) {
        visited++;
        if (r.section) sections.add(r.section);
        if (r.hidden) hidden.push(r.name);
      }
    }
    return { hidden, visited, sections: [...sections].sort() };
  }

  test("tabbing forward and backward through the whole document", async ({ page }) => {
    await open(page, { section: "home" });
    await resetFocusStart(page);
    // The walk must cross every section. A count of stops would not say so:
    // the PC deck keeps one slide of cards in the document at a time, the
    // phone's rail all forty.
    const all = ["about", "contact", "home", "projects"];
    const forward = await walk(page, "Tab");
    expect(forward.sections).toEqual(all);
    expect(forward.visited).toBeGreaterThan(20);
    expect(forward.hidden).toEqual([]);
    const backward = await walk(page, "Shift+Tab");
    expect(backward.sections).toEqual(all);
    expect(backward.visited).toBeGreaterThan(20);
    expect(backward.hidden).toEqual([]);
  });
});
