// In-page measuring helpers, installed into every page as `window.__qa` by the
// fixtures. They work on computed styles: colours are parsed exactly from
// rgb()/color(srgb) strings (canvas only as a fallback), backgrounds are
// alpha-composited through the ancestor chain onto the page colour, and
// contrast is WCAG 2.x.

export type RGBA = [number, number, number, number];

export interface QA {
  parse(c: string): RGBA;
  over(top: RGBA, bottom: RGBA): RGBA;
  ratio(a: RGBA, b: RGBA): number;
  hex(c: RGBA): string;
  /** The flat page colour (.site-backdrop). */
  page(): RGBA;
  /** The least-contrasting page pixel: major rule + peak grain (QA D7). */
  texturedPage(): RGBA;
  /** Composited background under `el`, and whether it is the bare page. */
  ground(el: Element): { color: RGBA; onPage: boolean };
  /** Product of opacity up the ancestor chain. */
  opacity(el: Element): number;
  /** Visible, non-decorative elements that directly hold text under `root`. */
  textHolders(root: Element): Element[];
  /** WCAG "large text": >= 24px, or >= 18.66px bold. */
  isLarge(el: Element): boolean;
  describe(el: Element): string;
}

declare global {
  interface Window {
    __qa: QA;
  }
}

function install() {
  if ((window as Window).__qa) return;
  let cx: CanvasRenderingContext2D | null = null;
  const canvasParse = (s: string): RGBA => {
    if (!cx) {
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      cx = c.getContext("2d", { willReadFrequently: true });
    }
    const x = cx!;
    x.clearRect(0, 0, 1, 1);
    x.fillStyle = "#000";
    x.fillStyle = s;
    x.fillRect(0, 0, 1, 1);
    const d = x.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const parse = (s: string): RGBA => {
    const v = s.trim();
    if (v === "transparent") return [0, 0, 0, 0];
    let m = v.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p[3] ?? 1];
    }
    m = v.match(/^color\(srgb\s+([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
      return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1];
    }
    return canvasParse(v);
  };
  const over = (t: RGBA, b: RGBA): RGBA => [
    t[0] * t[3] + b[0] * (1 - t[3]),
    t[1] * t[3] + b[1] * (1 - t[3]),
    t[2] * t[3] + b[2] * (1 - t[3]),
    1,
  ];
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (c: RGBA) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a: RGBA, b: RGBA) => {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const hex = (c: RGBA) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const page = () => parse(getComputedStyle(document.querySelector(".site-backdrop")!).backgroundColor);
  const token = (name: string) => parse(getComputedStyle(document.documentElement).getPropertyValue(name));
  const texturedPage = (): RGBA => {
    const stock = page();
    if (lum(stock) > 0.5) {
      // Manual: brand major rule at 8.5%, then black grain at its 6.4% peak.
      const rule = over([...token("--t-brand").slice(0, 3), 0.085] as RGBA, stock);
      return over([0, 0, 0, 0.064], rule);
    }
    // Blueprint: a white major rule at 9% lightens the paper.
    return over([255, 255, 255, 0.09], stock);
  };
  // Everything between the element and <body>; body's own fill lies under the
  // fixed .site-backdrop, so the page colour is the true ground.
  const ancestors = (el: Element) => {
    const chain: Element[] = [];
    for (let n: Element | null = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) chain.push(n);
    return chain.reverse();
  };
  const ground = (el: Element) => {
    let color = page();
    let onPage = true;
    for (const n of ancestors(el)) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) color = over(c, color);
      if (c[3] >= 1) onPage = false;
    }
    return { color, onPage };
  };
  const opacity = (el: Element) => {
    let o = 1;
    for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };
  const textHolders = (root: Element) => {
    const out = new Set<Element>();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.textContent || !t.textContent.trim()) continue;
      const el = t.parentElement;
      if (!el || el.closest("[aria-hidden='true'], [hidden], .sr-only, noscript, script, style, option")) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;
      if (getComputedStyle(el).visibility === "hidden") continue;
      out.add(el);
    }
    return [...out];
  };
  const isLarge = (el: Element) => {
    const s = getComputedStyle(el);
    const px = parseFloat(s.fontSize);
    return px >= 24 || (px >= 18.66 && Number(s.fontWeight) >= 700);
  };
  const describe = (el: Element) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 32);
    return `${el.tagName.toLowerCase()}${id}${cls} "${text}"`;
  };
  (window as Window).__qa = { parse, over, ratio, hex, page, texturedPage, ground, opacity, textHolders, isLarge, describe };
}

export const QA_HELPERS = `(${install.toString()})();`;
