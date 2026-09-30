#!/usr/bin/env node
/**
 * Renders the hero at 1200x630 and saves it as public/og-image.png -- the card
 * LinkedIn, Slack and X show when the portfolio link is shared.
 *
 * Shot from the real page rather than drawn separately, so the preview cannot
 * drift from the design. Dark theme: it reads better as a thumbnail against
 * the light chrome of most feeds.
 *
 * Usage: npm run preview, then `node scripts/make-og-image.mjs`.
 */
import { chromium } from "playwright";

const URL = "http://localhost:4321/the-portfolio/";
const OUT = "public/og-image.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

await page.evaluate(() => {
  document.documentElement.classList.add("dark");
  // Chrome that belongs to the site, not to a preview card.
  document.querySelector("nav")?.remove();
  document.querySelector("footer")?.remove();
  // Entrance animations leave elements mid-flight at screenshot time.
  document.querySelectorAll("[data-entering]").forEach((el) => el.removeAttribute("data-entering"));
  document.querySelectorAll("*").forEach((el) => {
    const s = el.style;
    if (s.opacity && s.opacity !== "1") s.opacity = "1";
    if (s.transform) s.transform = "none";
    if (s.filter) s.filter = "none";
  });
  const home = document.getElementById("home");
  if (home) {
    home.style.height = "630px";
    home.style.minHeight = "630px";
    home.style.paddingTop = "0";
    home.style.justifyContent = "center";
  }
});
await page.waitForTimeout(1200);

const raw = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

// deviceScaleFactor 2 renders crisp text but lands at ~840KB, which is heavy
// for a card several platforms fetch on every share. Down to exactly 1200x630
// and compressed: sharp ships with Astro, so no extra dependency.
const sharp = (await import("sharp")).default;
await sharp(raw)
  .resize(1200, 630)
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(OUT);

const { size } = await import("node:fs").then((fs) => fs.promises.stat(OUT));
console.log(`wrote ${OUT} (1200x630, ${Math.round(size / 1024)}KB)`);
