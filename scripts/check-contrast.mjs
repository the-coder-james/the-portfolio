#!/usr/bin/env node
/**
 * Token contrast report for src/styles/global.css (QA ST-01 / ST-02).
 *
 *   node scripts/check-contrast.mjs [path/to/global.css]
 *
 * Prints every failing pairing and the closest margin per theme; exits 1 on any
 * failure. The same model runs as a test in tests/static/contrast.test.ts.
 */
import { readFile } from "node:fs/promises";
import { evaluate, parsePalette } from "./lib/contrast.mjs";

const file = process.argv[2] ?? new URL("../src/styles/global.css", import.meta.url);
const themes = parsePalette(await readFile(file, "utf8"));
let fails = 0;
for (const [name, t] of Object.entries(themes)) {
  const rows = evaluate(t);
  const bad = rows.filter((r) => !r.ok);
  fails += bad.length;
  const closest = [...rows].sort((a, b) => a.ratio - a.min - (b.ratio - b.min))[0];
  const textured = rows.filter((r) => r.label === "textured");
  console.log(
    `${name.padEnd(9)} ${rows.length} pairs (${textured.length} textured), ${bad.length} failing; ` +
      `closest: ${closest.fg} on ${closest.bg} ${closest.ratio.toFixed(2)}:1 (min ${closest.min})`,
  );
  for (const r of bad) console.log(`  FAIL ${r.label.padEnd(11)} ${r.fg} ${r.fgv ?? "?"} on ${r.bg} ${r.bgv ?? "?"}: ${Number.isNaN(r.ratio) ? "missing token" : r.ratio.toFixed(2)} (min ${r.min})`);
}
process.exitCode = fails ? 1 : 0;
