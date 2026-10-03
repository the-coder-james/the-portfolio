// ST-06: the source invariants CLAUDE.md states, over the live module graph
// (files reachable from src/pages). Advisory reports (unused code, blur) live
// in `node scripts/check-source.mjs --report-unused`.
import { beforeAll, describe, expect, it } from "vitest";
import { invariants, loadSources, reachable } from "../../scripts/lib/source.mjs";

let inv: ReturnType<typeof invariants>;
let live: Set<string>;

beforeAll(async () => {
  const text = await loadSources();
  inv = invariants(text);
  live = reachable(text);
});

describe("ST-06 source invariants", () => {
  it("walks the module graph from the pages", () => {
    // Sanity: the graph must reach the islands, or every rule below is vacuous.
    expect([...live].some((f) => f.endsWith("HeaderComponent.tsx"))).toBe(true);
    expect([...live].some((f) => f.endsWith("ProjectCard.tsx"))).toBe(true);
  });

  it("(a) no font family is named outside the @theme font tokens", () => {
    expect(inv.fontFamilyLiterals).toEqual([]);
  });

  it("(b) no client:visible island (a hidden panel never intersects)", () => {
    expect(inv.clientVisible).toEqual([]);
  });

  it("(c) no reveal branches `initial` on reduced motion (RM-01 / CR-04)", () => {
    expect(inv.reducedMotionInitial).toEqual([]);
  });

  it("(d) no font is fetched from Google's CDN", () => {
    expect(inv.fontCdn).toEqual([]);
  });

  it("(e) no backdrop-filter in live code (no glass)", () => {
    expect(inv.backdropFilter).toEqual([]);
  });

  it("(f) no hardcoded white text (on-brand flips per theme)", () => {
    expect(inv.hardcodedWhite).toEqual([]);
  });
});
