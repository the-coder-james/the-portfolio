// ST-04, ST-05: invariants of the built site, checked on both builds:
//   dist/      the production-equivalent build (no PUBLIC_GTM_ID);
//   dist-e2e/  the e2e build (PUBLIC_GTM_ID=GTM-QATEST0), which the browser
//              tests run against.
// Build first: `npm run build && npm run build:e2e` (npm run test:dist does both).
// QA_DIST="a,b" overrides the directories (used by the mutation checks).
import { beforeAll, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  glassInCss, islandNesting, loadDist, missingPreloads, offBaseUrls, ogImage, sitemapUrls, themeScriptFirst,
} from "../../scripts/lib/dist.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const dirs = (process.env.QA_DIST ?? "dist,dist-e2e").split(",").map((d) => path.resolve(ROOT, d.trim()));

for (const dir of dirs) {
  const name = path.basename(dir);
  // dist-e2e is the only build made with a GTM ID; its expectations differ.
  const gtmId = name === "dist-e2e" ? "GTM-QATEST0" : null;

  describe(`${name}/`, () => {
    let d: Awaited<ReturnType<typeof loadDist>>;
    beforeAll(async () => {
      if (!existsSync(path.join(dir, "index.html"))) throw new Error(`${dir} is not built: run npm run build && npm run build:e2e`);
      d = await loadDist(dir);
    });

    it("ST-04 islands are never nested (depth 1)", () => {
      const { count, max } = islandNesting(d.html);
      expect(count).toBeGreaterThan(0);
      expect(max).toBe(1);
    });

    it("ST-04 no font is loaded from Google's CDN", () => {
      expect((d.html + d.css).match(/fonts\.(googleapis|gstatic)\.com/g) ?? []).toEqual([]);
    });

    // GTM must never be referenced from the HTML, not even as a <noscript>
    // iframe: a visitor without script never sees the banner, so could never
    // consent to it. The only way in is ConsentStore's bundle, after grant().
    it(gtmId ? "ST-04 GTM ships only in the consent-gated bundle, never in the HTML" : "ST-04 no analytics at all without PUBLIC_GTM_ID", async () => {
      expect(d.html).not.toContain("googletagmanager");
      const bundles = await Promise.all(
        d.names.filter((n) => n.endsWith(".js")).map((n) => readFile(path.join(dir, "_astro", n), "utf8")),
      );
      const withId = bundles.filter((js) => js.includes("googletagmanager.com/gtm.js") && (!gtmId || js.includes(gtmId)));
      expect(withId).toHaveLength(gtmId ? 1 : 0);
    });

    it("ST-04 every local URL in the HTML and CSS stays under /the-portfolio/", () => {
      const r = offBaseUrls(d);
      expect(r.htmlCount).toBeGreaterThan(0);
      expect(r.cssCount).toBeGreaterThan(0);
      expect(r.off).toEqual([]);
    });

    it("ST-04 the font preloads point at files in the build", () => {
      const r = missingPreloads(d);
      expect(r.hrefs).toHaveLength(2);
      expect(r.missing).toEqual([]);
    });

    it("ST-04 og:image is a 1200x630 PNG in the build", async () => {
      const og = await ogImage(d);
      expect(og.url).toMatch(/\/the-portfolio\/og-image\.png$/);
      expect(og.size).toEqual({ width: 1200, height: 630 });
    });

    it("ST-04 the pre-paint theme script runs before the first stylesheet", () => {
      expect(themeScriptFirst(d.html)).toBe(true);
    });

    it("ST-04 the sitemap lists the page and never the 404; the 404 is noindex", async () => {
      const urls = await sitemapUrls(dir);
      expect(urls).toContain("https://the-coder-james.github.io/the-portfolio/");
      expect(urls.filter((u) => u.includes("404"))).toEqual([]);
      expect(d.notFound).toContain('<meta name="robots" content="noindex, follow">');
    });

    it("ST-05 no gradient text or retired glass/glow selectors ship", () => {
      const g = glassInCss(d.css);
      expect(g.gradientText).toBe(0);
      expect(g.retiredSelectors).toEqual([]);
    });

    // CR-09: Tailwind v4 scans every file, imported or not, so the unused
    // morphing-dialog used to put .backdrop-blur-xs into the shipped CSS. The
    // dead primitives are deleted; this keeps glass from coming back.
    it("ST-05 CR-09: no backdrop-filter ships in the CSS (no glass)", () => {
      expect(glassInCss(d.css).backdropFilter).toEqual([]);
    });
  });
}
