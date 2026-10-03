// ST-01, ST-02, ST-03: the palette in src/styles/global.css, measured against
// every pairing the components actually use (scripts/lib/contrast.mjs).
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { GRAIN_PEAK, evaluate, mix, parsePalette, ratio, texturedPage } from "../../scripts/lib/contrast.mjs";

const css = readFileSync(new URL("../../src/styles/global.css", import.meta.url), "utf8");
const themes = parsePalette(css);
type Row = ReturnType<typeof evaluate>[number];
const describeRow = (r: Row) => `${r.label} ${r.fg} on ${r.bg}: ${Number.isNaN(r.ratio) ? "missing token" : r.ratio.toFixed(2)} (min ${r.min})`;

describe("ST-03 contrast maths", () => {
  it("matches the WCAG reference values", () => {
    expect(ratio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(ratio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(ratio("#777777", "#ffffff")).toBeCloseTo(4.478, 3);
    expect(ratio("#1d4fbf", "#1d4fbf")).toBe(1);
  });

  it("mixes like color-mix(in srgb)", () => {
    expect(mix("#1d4fbf", 100, "#ffffff")).toBe("#1d4fbf");
    expect(mix("#1d4fbf", 0, "#ffffff")).toBe("#ffffff");
    expect(mix("#000000", 50, "#ffffff")).toBe("#808080");
  });

  it("parses both palettes, and Blueprint inherits what it does not redeclare", () => {
    const t = parsePalette(":root {\n --t-ink: #111111;\n --t-only-light: #222222;\n}\n.dark {\n --t-ink: #eeeeee;\n}");
    expect(t.manual).toEqual({ ink: "#111111", "only-light": "#222222" });
    expect(t.blueprint).toEqual({ ink: "#eeeeee", "only-light": "#222222" });
  });

  it("models the worst textured pixel per paper", () => {
    const light = { "surface-base": "#f3f1ea", brand: "#1d4fbf" };
    const dark = { "surface-base": "#0f2b4c", brand: "#9ed2ff" };
    expect(texturedPage(light)).toBe(mix("#000000", GRAIN_PEAK, mix("#1d4fbf", 8.5, "#f3f1ea")));
    expect(texturedPage(dark)).toBe(mix("#ffffff", 9, "#0f2b4c"));
  });
});

for (const [name, t] of Object.entries(themes)) {
  const rows = evaluate(t);
  describe(`palette: ${name}`, () => {
    it("ST-01 every flat pairing meets its minimum (text 4.5:1, UI 3:1)", () => {
      const flat = rows.filter((r) => r.label !== "textured");
      expect(flat).toHaveLength(104);
      expect(flat.filter((r) => !r.ok).map(describeRow)).toEqual([]);
    });

    it("ST-02 page text holds 4.5:1 on the worst textured pixel (rule + peak grain)", () => {
      const textured = rows.filter((r) => r.label === "textured");
      expect(textured).toHaveLength(12);
      expect(textured.filter((r) => !r.ok).map(describeRow)).toEqual([]);
    });
  });
}

it("no retired Destiny / Wings-of-Light tokens or hardcoded white remain", () => {
  expect(css.match(/--t-wing-|--color-wing-|Wings of Light|#fff;/g) ?? []).toEqual([]);
});
