#!/usr/bin/env node
/**
 * Drives a real browser against the built site and reports how the scroll
 * stack actually behaves.
 *
 * This exists because `npm run build` and `astro check` both pass happily on a
 * page that is visibly broken — two stacking rewrites shipped "clean" while
 * every section was rendering on top of the others. Layout has to be checked
 * against a real render.
 *
 * Usage:
 *   npm run inspect                 # report only
 *   npm run inspect -- --shots      # also write screenshots to .inspect/
 *   npm run inspect -- --reduced    # emulate prefers-reduced-motion
 *
 * Expects `npm run preview` to be serving on :4321.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = "http://localhost:4321/the-portfolio/";
const VIEWPORT = { width: 1440, height: 900 };
const SHOTS = process.argv.includes("--shots");
const REDUCED = process.argv.includes("--reduced");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: VIEWPORT,
  reducedMotion: REDUCED ? "reduce" : "no-preference",
});

const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
console.log(`document: ${docHeight}px   viewport: ${VIEWPORT.height}px${REDUCED ? "   [reduced motion]" : ""}`);

const sample = () =>
  page.evaluate(() => {
    const rows = [];
    document.querySelectorAll("section[id]").forEach((s) => {
      const r = s.getBoundingClientRect();
      const veil = s.querySelector(':scope > div[data-stack-veil]');
      const shown = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
      const m = getComputedStyle(s).transform;
      const scale = m === "none" ? 1 : Number(m.split("(")[1].split(",")[0]);
      rows.push({
        id: s.id,
        top: Math.round(r.top),
        shown: Math.round(shown),
        pinned: Math.abs(r.top) < 2,
        scale: Number(scale.toFixed(3)),
        veil: veil ? Number(getComputedStyle(veil).opacity) : 0,
      });
    });
    return { y: Math.round(scrollY), rows };
  });

// Walk the page and record, per section, the best visibility it ever reaches
// and whether it is ever left mid-transition when it should be settled.
const best = {};
const problems = [];
const step = 100;

for (let y = 0; y <= docHeight; y += step) {
  await page.evaluate((sy) => window.scrollTo(0, sy), y);
  await page.waitForTimeout(35);
  const { rows } = await sample();

  for (const r of rows) {
    const b = (best[r.id] ??= { shown: 0, scale: 0, veilAtFull: null });
    if (r.shown > b.shown) {
      b.shown = r.shown;
      b.scale = r.scale;
      b.veilAtFull = r.veil;
    }
    // A section pinned at the top should be fully readable: no veil, no scale.
    if (r.pinned && r.shown > VIEWPORT.height * 0.8) {
      if (r.veil > 0.02) problems.push(`${r.id} pinned at y=${y} but veil=${r.veil.toFixed(2)}`);
      if (r.scale < 0.995) problems.push(`${r.id} pinned at y=${y} but scale=${r.scale}`);
    }
  }
}

console.log("\nsection      max visible   scale@peak   veil@peak");
for (const [id, b] of Object.entries(best)) {
  const ok = b.shown >= VIEWPORT.height * 0.85;
  console.log(
    `  ${id.padEnd(11)} ${String(b.shown).padStart(4)}px      ${b.scale.toFixed(3)}        ${b.veilAtFull?.toFixed(2) ?? "—"}   ${ok ? "" : "<-- never fully shown"}`
  );
}

if (SHOTS) {
  await mkdir(".inspect", { recursive: true });
  const ids = Object.keys(best);
  for (const id of ids) {
    const y = await page.evaluate((sid) => {
      const s = document.getElementById(sid);
      const sp = s.parentElement.hasAttribute("data-stack-spacer") ? s.parentElement : s;
      return sp.getBoundingClientRect().top + scrollY;
    }, id);
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `.inspect/${id}.png` });
  }
  console.log(`\nscreenshots: .inspect/ (${ids.length})`);
}

console.log(`\nconsole errors: ${errors.length ? errors.slice(0, 5).join("\n  ") : "none"}`);
if (problems.length) {
  console.log(`\nissues (${problems.length}):`);
  [...new Set(problems)].slice(0, 12).forEach((p) => console.log(`  ${p}`));
} else {
  console.log("issues: none");
}

await browser.close();
