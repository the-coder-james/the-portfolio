// Read-only probes of a built site (dist/ or dist-e2e/) for the invariants in
// CLAUDE.md (QA ST-04 / ST-05). Shared by scripts/check-dist.mjs and
// tests/dist/dist.test.ts.
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const BASE = "/the-portfolio/";

export async function loadDist(dir) {
  const html = await readFile(path.join(dir, "index.html"), "utf8");
  const notFound = existsSync(path.join(dir, "404.html")) ? await readFile(path.join(dir, "404.html"), "utf8") : "";
  const astro = path.join(dir, "_astro");
  const names = await readdir(astro);
  const css = (await Promise.all(names.filter((n) => n.endsWith(".css")).map((n) => readFile(path.join(astro, n), "utf8")))).join("\n");
  return { dir, html, notFound, css, names };
}

/** Deepest <astro-island> nesting in the HTML. CLAUDE.md requires exactly 1. */
export function islandNesting(html) {
  let depth = 0, max = 0, count = 0;
  for (const m of html.matchAll(/<astro-island\b|<\/astro-island>/g)) {
    if (m[0] === "</astro-island>") depth--;
    else { depth++; count++; max = Math.max(max, depth); }
  }
  return { count, max };
}

export const head = (html) => html.split("</head>")[0];

/** Local URLs (src/href in HTML, url() in CSS) that escape the base path. */
export function offBaseUrls({ html, css }) {
  const htmlUrls = [...html.matchAll(/\s(?:src|href)="([^"#][^"]*)"/g)].map((m) => m[1]).filter((u) => u.startsWith("/"));
  const cssUrls = [...css.matchAll(/url\((?!["']?data:)["']?([^"')]+)["']?\)/g)].map((m) => m[1]).filter((u) => u.startsWith("/"));
  return {
    htmlCount: htmlUrls.length,
    cssCount: cssUrls.length,
    off: [...htmlUrls, ...cssUrls].filter((u) => !u.startsWith(BASE)),
  };
}

/** <link rel="preload"> targets that do not exist in the build. */
export function missingPreloads({ dir, html }) {
  const hrefs = [...html.matchAll(/<link[^>]+rel="preload"[^>]*>/g)].map((m) => m[0].match(/href="([^"]+)"/)?.[1]).filter(Boolean);
  return { hrefs, missing: hrefs.filter((h) => !existsSync(path.join(dir, h.replace(BASE, "")))) };
}

/** PNG width/height from the IHDR chunk. */
export async function pngSize(file) {
  const b = await readFile(file);
  if (b.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

export async function ogImage({ dir, html }) {
  const url = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  if (!url) return { url: null, size: null };
  const local = path.join(dir, new URL(url).pathname.replace(BASE, ""));
  return { url, size: existsSync(local) ? await pngSize(local) : null };
}

/** The pre-paint theme script must run before the first stylesheet loads. */
export function themeScriptFirst(html) {
  const h = head(html);
  const script = h.indexOf("localStorage.getItem('theme')");
  const sheet = h.indexOf('rel="stylesheet"');
  return script > -1 && (sheet === -1 || script < sheet);
}

export async function sitemapUrls(dir) {
  const files = (await readdir(dir)).filter((n) => /^sitemap-\d+\.xml$/.test(n));
  const xml = (await Promise.all(files.map((n) => readFile(path.join(dir, n), "utf8")))).join("");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/** "No glass, no glow" in the shipped stylesheet (CLAUDE.md). */
export function glassInCss(css) {
  return {
    backdropFilter: [...css.matchAll(/([^{}]+)\{[^{}]*backdrop-filter\s*:/g)].map((m) => m[1].trim().slice(-60)),
    gradientText: (css.match(/background-clip\s*:\s*text/g) || []).length,
    retiredSelectors: [...new Set(css.match(/\.(glass-[\w-]+|gradient-text|card-glow)\b/g) || [])],
  };
}
