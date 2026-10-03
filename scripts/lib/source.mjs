// Static analysis of src/ for the QA source invariants (ST-06) and the
// advisory unused-code report (ST-07). Shared by scripts/check-source.mjs and
// tests/static/source.test.ts. Read-only.
import { readFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EXT = [".ts", ".tsx", ".astro", ".mjs", ".js", ".json", ".css"];

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (EXT.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

/** Every source file under src/ with its text. */
export async function loadSources(root = ROOT) {
  const files = await walk(path.join(root, "src"));
  const text = new Map();
  await Promise.all(files.map(async (f) => text.set(f, await readFile(f, "utf8"))));
  return text;
}

const rel = (f, root = ROOT) => path.relative(root, f);

function resolveSpec(from, spec, root) {
  let base;
  if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null; // a package
  base = base.replace(/\?.*$/, "");
  const candidates = [base, ...EXT.map((e) => base + e), ...EXT.map((e) => path.join(base, "index" + e))];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

/**
 * Files reachable from the page entry points (src/pages/*) through static and
 * dynamic imports. Anything outside this set is never part of the build's
 * module graph -- although Tailwind still scans it for class names.
 */
export function reachable(text, root = ROOT) {
  const seen = new Set();
  const queue = [...text.keys()].filter((f) => f.startsWith(path.join(root, "src", "pages") + path.sep));
  const IMPORT = /(?:import|export)\s+(?:[^'"`;]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    const src = text.get(f) ?? "";
    for (const m of src.matchAll(IMPORT)) {
      const target = resolveSpec(f, m[1] ?? m[2], root);
      if (target && text.has(target) && !seen.has(target)) queue.push(target);
    }
  }
  return seen;
}

/**
 * Blank out comments (block, JSX, HTML and line) while keeping every newline,
 * so rules match code rather than prose and line numbers stay true. A `//`
 * only starts a comment at line start or after whitespace/punctuation, never
 * inside a URL such as https://.
 */
export function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(^|[\s;,{}])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)));
}

/** Line numbers (1-based) where `re` matches in `src`, comments excluded. */
function hits(src, re) {
  const out = [];
  stripComments(src).split("\n").forEach((line, i) => {
    if (re.test(line)) out.push(i + 1);
    re.lastIndex = 0;
  });
  return out;
}

/**
 * The CLAUDE.md / QA source invariants. Each returns a list of "file:line"
 * violations over the live (reachable) source.
 */
export function invariants(text, root = ROOT) {
  const live = reachable(text, root);
  const globalCss = path.join(root, "src", "styles", "global.css");
  const find = (re, filter = () => true) => {
    const out = [];
    for (const f of live) {
      if (!filter(f)) continue;
      for (const n of hits(text.get(f), re)) out.push(`${rel(f, root)}:${n}`);
    }
    return out.sort();
  };
  // Lines of global.css's @theme block (the only place a family name may live).
  const themeLines = new Set();
  {
    const lines = text.get(globalCss).split("\n");
    let inTheme = false;
    lines.forEach((l, i) => {
      if (/^@theme\s*\{/.test(l)) inTheme = true;
      if (inTheme) themeLines.add(i + 1);
      if (inTheme && /^\}/.test(l)) inTheme = false;
    });
  }
  return {
    // (a) a font family by name anywhere but the @theme font tokens
    fontFamilyLiterals: find(/Space[ _]Grotesk|JetBrains|IBM Plex|Barlow|Arial Narrow/).filter((h) => {
      const [f, n] = h.split(":");
      return !(path.join(root, f) === globalCss && themeLines.has(Number(n)));
    }),
    // (b) client:visible never hydrates inside a hidden panel
    clientVisible: find(/client:visible/, (f) => f.endsWith(".astro")),
    // (c) the RM-01 idiom: `initial` branching on reduced motion
    reducedMotionInitial: find(/initial\s*[:=]\s*\{?\s*reduced\s*\?\s*false/),
    // (d) fonts from Google's CDN leak the visitor's IP before consent
    fontCdn: find(/(https?:)?\/\/fonts\.(googleapis|gstatic)\.com/),
    // (e) no glass: backdrop-filter in live code
    backdropFilter: find(/backdrop-filter|backdropFilter|backdrop-blur/),
    // (f) white text hardcoded on a brand fill (1.6:1 on Blueprint)
    hardcodedWhite: find(/color:\s*["']?(#fff\b|#ffffff\b|white\b)|\btext-white\b/),
  };
}

/** Advisory: blur() filters in live components (CR-26, UI-07); not a rule. */
export function blurUses(text, root = ROOT) {
  const live = reachable(text, root);
  const out = [];
  for (const f of live) for (const n of hits(text.get(f), /blur\(\s*\d+(\.\d+)?px/)) out.push(`${rel(f, root)}:${n}`);
  return out.sort();
}

/** Advisory unused-code report (ST-07). */
export async function unusedReport(text, root = ROOT) {
  const live = reachable(text, root);
  const css = text.get(path.join(root, "src", "styles", "global.css"));
  const others = [...text.entries()].filter(([f]) => !f.endsWith("global.css"));
  const all = [...text.entries()];
  const modules = [...text.keys()]
    .filter((f) => /\.(tsx?|astro)$/.test(f) && !live.has(f) && !f.endsWith("env.d.ts"))
    .map((f) => rel(f, root))
    .sort();
  const TW = "(?:bg|text|border(?:-[trblxy])?|fill|stroke|ring|outline|placeholder|from|via|to|shadow|decoration|accent|caret|divide)";
  const tokens = [...new Set([...css.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]))]
    .filter((v) => !/^--(radius|breakpoint|font|t-)/.test(v))
    .filter((v) => {
      const re = new RegExp(`var\\(\\s*${v}[\\s,)]`);
      if (all.some(([, t]) => re.test(t))) return false;
      if (v.startsWith("--color-")) {
        const tw = new RegExp(`(?<![\\w-])${TW}-${v.slice(8)}(?![\\w-])`);
        if (all.some(([, t]) => tw.test(t))) return false;
      }
      return true;
    })
    .sort();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\([^)]*\)/g, "");
  const classes = new Set();
  for (const b of stripped.matchAll(/([^{}]+)\{/g)) {
    if (/^\s*@/.test(b[1])) continue;
    for (const m of b[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(m[1]);
  }
  const deadClasses = [...classes]
    .filter((c) => c !== "dark" && !others.some(([, t]) => new RegExp(`(?<![\\w-])${c.replace(/-/g, "\\-")}(?![\\w-])`).test(t)))
    .sort();
  const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)]
    .map((m) => m[1])
    .filter((k) => !all.some(([, t]) => new RegExp(`animation(?:-name)?\\s*:[^;]*\\b${k}\\b`).test(t)))
    .sort();
  const publicDir = path.join(root, "public");
  const publicFiles = (await readdir(publicDir, { withFileTypes: true }))
    .filter((e) => e.isFile() && !e.name.startsWith("."))
    .map((e) => e.name)
    .filter((n) => !all.some(([, t]) => t.includes(n)) && !["robots.txt", "favicon.svg", "og-image.png"].includes(n))
    .sort();
  return { modules, tokens, classes: deadClasses, keyframes, publicFiles };
}
