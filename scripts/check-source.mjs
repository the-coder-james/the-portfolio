#!/usr/bin/env node
/**
 * Source invariants (QA ST-06) and, with --report-unused, the advisory
 * unused-code report (QA ST-07).
 *
 *   node scripts/check-source.mjs [--report-unused]
 *
 * Exits 1 when an invariant is violated. The report never fails the run.
 */
import { blurUses, invariants, loadSources, unusedReport } from "./lib/source.mjs";

const text = await loadSources();
const inv = invariants(text);
let fails = 0;
for (const [rule, found] of Object.entries(inv)) {
  fails += found.length;
  console.log(`${found.length ? "FAIL" : "ok  "} ${rule}${found.length ? ": " + found.join(", ") : ""}`);
}
const blur = blurUses(text);
console.log(`info blur() filters in live components (CR-26 / UI-07, advisory): ${blur.length ? blur.join(", ") : "none"}`);

if (process.argv.includes("--report-unused")) {
  const r = await unusedReport(text);
  console.log("\nUnused code (advisory, CR-07..CR-11):");
  for (const [k, v] of Object.entries(r)) console.log(`  ${k} (${v.length}): ${v.join(", ") || "none"}`);
}
process.exitCode = fails ? 1 : 0;
