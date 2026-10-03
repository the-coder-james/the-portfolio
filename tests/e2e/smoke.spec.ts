// E2E-17 typography, E2E-18 console errors, E2E-19 hydration, E2E-20 no-JS,
// E2E-23 the 404 page, E2E-26 contracts for fixes that have landed (SYS-01, UI-06).
import { expect, test } from "./helpers/fixtures";
import { STATES, go, open, settle } from "./helpers/page";

test.describe("E2E-17 self-hosted type", () => {
  test.skip(({ isMobile }) => isMobile, "type does not depend on the viewport");

  test("each role resolves to its face, and the faces load from the site", async ({ page }, testInfo) => {
    await open(page);
    const loaded = new Set<string>();
    for (const state of STATES) {
      await go(page, state);
      for (const f of await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`)))
        loaded.add(f);
    }
    const first = (sel: string) =>
      page.evaluate((s) => {
        const el = document.querySelector(s);
        return el ? { family: getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim(), transform: getComputedStyle(el).textTransform } : null;
      }, sel);
    await go(page, { tab: "home" });
    expect(await first("body")).toMatchObject({ family: "IBM Plex Sans Variable" });
    expect(await first("#home h1")).toEqual({ family: "Barlow Condensed", transform: "uppercase" });
    expect(await first(".font-mono")).toMatchObject({ family: "IBM Plex Mono" });
    await go(page, { tab: "about", sub: "profile" });
    expect(await first("#about h2")).toEqual({ family: "Barlow Condensed", transform: "uppercase" });
    expect(
      await page.evaluate(() => ['700 16px "Barlow Condensed"', '400 16px "IBM Plex Sans Variable"', '400 16px "IBM Plex Mono"'].map((f) => document.fonts.check(f))),
    ).toEqual([true, true, true]);
    // Advisory (CR-17): imported faces never rendered in any state.
    const imported = await page.evaluate(() => [...new Set([...document.fonts].map((f) => `${f.family.replace(/"/g, "")} ${f.weight}`))]);
    const unused = imported.filter((f) => !loaded.has(f));
    testInfo.annotations.push({ type: "CR-17 imported but never loaded", description: unused.join(", ") || "none" });
    // No CDN request: the network fixture fails the test on any external request.
  });
});

test.describe("E2E-18 no console errors in any state", () => {
  for (const theme of ["light", "dark"] as const) {
    test.describe(theme === "light" ? "Manual" : "Blueprint", () => {
      test.use({ seed: { theme, consent: "denied" } });
      test("full traversal", async ({ page, isMobile }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
        page.on("console", (m) => {
          if (m.type() === "error") errors.push(`console: ${m.text()}`);
        });
        await open(page);
        for (const state of isMobile ? [] : STATES) await go(page, state);
        if (isMobile) await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await settle(page);
        expect(errors).toEqual([]);
      });
    });
  }
});

test.describe("E2E-19 every island hydrates, hidden panels included", () => {
  test("no island is left server-rendered", async ({ page, isMobile }) => {
    await open(page);
    const r = await page.evaluate(() => ({
      islands: document.querySelectorAll("astro-island").length,
      pending: [...document.querySelectorAll("astro-island[ssr]")].map((i) => i.getAttribute("component-url")),
      inHiddenPanels: document.querySelectorAll("main > section[hidden] astro-island").length,
    }));
    expect(r.islands).toBeGreaterThan(10);
    expect(r.pending).toEqual([]);
    // On desktop three panels are hidden; their islands (client:idle, never
    // client:visible) must have hydrated anyway.
    if (!isMobile) expect(r.inHiddenPanels).toBeGreaterThan(0);
  });
});

test.describe("E2E-20 without JavaScript the page still reads", () => {
  test.use({ javaScriptEnabled: false });

  // CR-05: the veil and the server-rendered loader are layers only script
  // removes, and reveals ship at opacity 0; a <noscript> style in layout.astro
  // hides the layers and pins [data-reveal] visible.
  test("CR-05: no layer covers the page and all text is visible", async ({ page }) => {
    await page.goto("#home");
    const r = await page.evaluate(() => {
      const shown = (el: Element | null) => !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden";
      const eff = (n: Element | null) => {
        let o = 1;
        for (; n && n !== document.documentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      };
      let dim = 0;
      const w = document.createTreeWalker(document.querySelector("main")!, NodeFilter.SHOW_TEXT);
      for (let t = w.nextNode(); t; t = w.nextNode()) {
        const el = t.parentElement;
        if (!t.textContent?.trim() || !el || el.closest("[aria-hidden='true']")) continue;
        if (el.getBoundingClientRect().width && eff(el) < 0.99) dim++;
      }
      return { veil: shown(document.getElementById("preboot-veil")), loader: shown(document.querySelector("[aria-label='Loading site']")), dim };
    });
    expect(r).toEqual({ veil: false, loader: false, dim: 0 });
  });
});

test.describe("E2E-23 the 404 page", () => {
  test.skip(({ isMobile }) => isMobile, "desktop is enough");
  test("is a real 404, noindex, and leads back to the site", async ({ page }) => {
    const res = await page.goto("does-not-exist");
    expect(res?.status()).toBe(404);
    await settle(page);
    await expect(page.locator("h1")).toHaveText(/doesn.t exist/i);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator(".page-404 a.flow-link")).toHaveAttribute("href", "/the-portfolio/");
  });
});

test.describe("E2E-26 contracts for fixes that landed", () => {
  test.skip(({ isMobile }) => isMobile, "pointer states are desktop");
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("SYS-01: the button primitives share one radius and one lift; :active presses flat", async ({ page }) => {
    await open(page);
    const buttons = page.locator("#home .btn-ink, #home .btn-sheet, #home .btn-sheet-icon");
    expect(await buttons.count()).toBeGreaterThanOrEqual(4);
    const radii = await buttons.evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e).borderRadius))]);
    expect(radii).toEqual(["10px"]);
    // Two frames first: even a 0.01ms transition reports its start value in the same task.
    const motion = async (i: number) =>
      buttons.nth(i).evaluate(async (e) => {
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        return { transform: getComputedStyle(e).transform, shadow: getComputedStyle(e).boxShadow };
      });
    for (let i = 0; i < (await buttons.count()); i++) {
      const rest = await motion(i);
      await buttons.nth(i).hover();
      const hover = await motion(i);
      expect(hover.transform, `button ${i} hover lifts`).toBe("matrix(1, 0, 0, 1, -2, -2)");
      await page.mouse.down();
      expect((await motion(i)).transform, `button ${i} :active presses flat`).toBe("none");
      // Release off the button: no click, so the CTAs do not navigate away.
      await page.mouse.move(1, 1);
      await page.mouse.up();
      expect(await motion(i), `button ${i} back at rest`).toEqual(rest);
      await page.keyboard.press("Shift+Tab"); // keyboard modality for :focus-visible
      await buttons.nth(i).focus();
      expect(await motion(i), `button ${i} keyboard focus lifts like hover`).toEqual(hover);
      await buttons.nth(i).blur();
    }
  });

  test("UI-06: the pre-render veil and the loader print the page's own drafting sheet", async ({ page }) => {
    const html = await (await page.request.get("")).text();
    await open(page);
    const r = await page.evaluate((src) => {
      const doc = new DOMParser().parseFromString(src, "text/html");
      const probe = document.createElement("div");
      probe.className = "drafting-sheet";
      document.body.append(probe);
      const a = getComputedStyle(document.querySelector(".site-backdrop")!);
      const b = getComputedStyle(probe);
      const same = a.backgroundImage === b.backgroundImage && a.backgroundSize === b.backgroundSize && a.backgroundColor === b.backgroundColor;
      probe.remove();
      return {
        veil: doc.getElementById("preboot-veil")?.classList.contains("drafting-sheet"),
        loader: doc.querySelector("[aria-label='Loading site']")?.classList.contains("drafting-sheet"),
        same,
      };
    }, html);
    expect(r).toEqual({ veil: true, loader: true, same: true });
  });
});

