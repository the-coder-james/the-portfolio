// WCAG contrast maths and the palette pairing model for src/styles/global.css.
//
// The palette lives in two blocks of --t-* declarations (`:root` for Manual,
// `.dark` for Blueprint). Every pairing below occurs in the components; the
// "textured" pairings also measure page text against the worst real pixel of
// the drafting sheet, because page copy does not sit on flat stock (QA D7,
// UI review VIS-01, WCAG failure F83: test at the least-contrasting area).
//
// Shared by scripts/check-contrast.mjs (CLI report) and tests/static/*.

/** "#abc" | "#aabbcc" -> [r, g, b] in 0..255 */
export const hex2rgb = (h) => {
  let s = h.replace("#", "");
  if (s.length === 3) s = [...s].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};

export const rgb2hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** `pct`% of `a` over (100 - pct)% of `b`, like color-mix(in srgb, a pct%, b). */
export const mix = (a, pct, b) => {
  const x = hex2rgb(a), y = hex2rgb(b);
  return rgb2hex(x.map((v, i) => (v * pct + y[i] * (100 - pct)) / 100));
};

/** Relative luminance (WCAG 2.x). */
export const luminance = (h) =>
  hex2rgb(h)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);

/** WCAG contrast ratio, 1..21. */
export const ratio = (a, b) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/**
 * Peak alpha of the paper grain, in percent. The grain SVG caps alpha at 0.07
 * (feColorMatrix in --paper-grain); rasterised, it peaks near 6.4%.
 */
export const GRAIN_PEAK = 6.4;

/**
 * The least-contrasting pixel of the page for this theme. Manual: a major rule
 * (brand at 8.5%) under peak black grain, which darkens the stock. Blueprint:
 * a white major rule (9%), which lightens the paper; its grain only darkens,
 * which helps light type, so it is not the worst case there.
 */
export const texturedPage = (t) =>
  luminance(t["surface-base"]) > 0.5
    ? mix("#000000", GRAIN_PEAK, mix(t.brand, 8.5, t["surface-base"]))
    : mix("#ffffff", 9, t["surface-base"]);

/**
 * Parse the two palettes out of global.css. `.dark` inherits every --t-* token
 * it does not redeclare, exactly as the cascade does.
 */
export function parsePalette(css) {
  const themes = { manual: {}, blueprint: {} };
  for (const m of css.matchAll(/(^|\n)\s*(:root|\.dark)\s*\{([^}]*)\}/g)) {
    const target = m[2] === ":root" ? themes.manual : themes.blueprint;
    for (const d of m[3].matchAll(/--t-([\w-]+):\s*(#[0-9a-fA-F]{3,8})\b/g)) target[d[1]] = d[2];
  }
  themes.blueprint = { ...themes.manual, ...themes.blueprint };
  return themes;
}

const isHex = (v) => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v);

/**
 * Every pairing that actually occurs in the components, by role. `fg` / `bg`
 * name a token or are literal colours (tints computed with mix()).
 */
export function pairs(t) {
  const P = [];
  const add = (label, fg, bg, min) =>
    P.push({ label, fg, bg, fgv: isHex(fg) ? fg : t[fg], bgv: isHex(bg) ? bg : t[bg], min });
  const PAGE = ["surface-base", "card-surface", "card-surface-raised"];
  const TEXT = ["ink", "ink-muted", "ink-dim", "ink-faint", "brand", "brand-text", "brand-400",
    "success", "success-strong", "crimson", "gold", "danger"];
  // Body text on the page and on sheets.
  for (const fg of [...TEXT, "foreground", "muted-foreground"]) for (const bg of PAGE) add("text", fg, bg, 4.5);
  // The same text against the worst textured pixel of the page.
  const worst = texturedPage(t);
  for (const fg of TEXT) add("textured", fg, worst, 4.5);
  // Titlebars (window cards) carry ink-dim mono labels.
  add("text", "ink-dim", "card-titlebar", 4.5);
  // Footer sits on surface-deep: faint copy, brand logo text.
  for (const fg of ["ink-faint", "ink-dim", "brand"]) add("text", fg, "surface-deep", 4.5);
  // Project accents print their tag text on a 14% tint of themselves over the sheet.
  for (const a of ["brand", "accent-2", "accent-3", "accent-4", "accent-5", "brand-400"]) {
    add("accent tag", a, mix(t[a], 14, t["card-surface"]), 4.5);
    add("accent text", a, "card-surface", 4.5);
  }
  // Role badge (brand-text on a 7% brand tint), via badge (violet on a 7% violet tint).
  add("badge", "brand-text", mix(t.brand, 7, t["card-surface"]), 4.5);
  add("badge", "syn-violet", mix(t["syn-violet"], 7, t["card-surface"]), 4.5);
  // Code surfaces.
  for (const fg of ["code-ink", "code-ink-dim", "code-ink-faint", "code-success", "success", "success-strong", "chrome-line",
    "syn-keyword", "syn-ident", "syn-fn", "syn-string", "syn-number", "syn-punct", "syn-plain", "syn-comment", "syn-attr", "syn-tag", "syn-violet"])
    add("code", fg, "surface-code", 4.5);
  for (const fg of ["code-ink-dim", "code-ink-faint"]) add("code head", fg, "surface-code-head", 4.5);
  // Labels on fills.
  add("on fill", "on-brand", "brand-700", 4.5);
  add("on fill", "on-brand", "brand-900", 4.5);
  add("on fill", "on-brand", "brand", 4.5);
  add("on fill", "primary-foreground", "primary", 4.5);
  add("on fill", "destructive-foreground", "destructive", 4.5);
  add("on fill", "surface-code", "success", 4.5);
  // UI boundaries (SC 1.4.11).
  for (const fg of ["card-border", "card-border-strong", "ring", "brand", "success-soft"])
    for (const bg of ["surface-base", "card-surface"]) add("UI 3:1", fg, bg, 3);
  add("UI 3:1", "brand", mix(t.brand, 14, t["card-surface"]), 3); // tab pill edge vs its own fill
  for (const icon of ["brand-400", "accent-2", "accent-3"]) add("icon 3:1", icon, "surface-base", 3);
  // Text on tinted chips: active tab label on the pill, filter chips and the
  // hero/portrait badges (brand-text or brand-400 on a 10-15% brand tint).
  add("on tint", "brand", mix(t.brand, 14, t["card-surface"]), 4.5);
  add("on tint", "brand-text", mix(t.brand, 15, t["surface-base"]), 4.5);
  add("on tint", "brand-text", mix(t.brand, 15, t["card-surface"]), 4.5);
  add("on tint", "brand-400", mix(t.brand, 10, t["surface-base"]), 4.5);
  return P;
}

/**
 * Evaluate every pairing for one theme. A pairing whose token is missing from
 * the palette fails (ratio NaN), so a renamed or deleted token cannot slip by.
 */
export function evaluate(t) {
  return pairs(t).map((p) => {
    const r = isHex(p.fgv) && isHex(p.bgv) ? ratio(p.fgv, p.bgv) : NaN;
    return { ...p, ratio: r, ok: r >= p.min };
  });
}
