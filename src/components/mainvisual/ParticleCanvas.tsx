import { useEffect, useRef } from "react";

/**
 * Drifting particle field layered over the static hero background.
 *
 * The previous version ran a 60-particle O(n²) nearest-neighbour mesh — 1,770
 * distance checks every frame, ~106k/second — with no DPR scaling, no
 * reduced-motion check, and no pausing when the hero scrolled away or the tab
 * was hidden. Most of that visual weight now lives in a 1.8KB static SVG, so
 * this only has to carry the drift:
 *
 *  - honours prefers-reduced-motion (renders nothing)
 *  - scales for devicePixelRatio, so it is no longer blurry on retina
 *  - pauses via IntersectionObserver when off-screen and on tab blur
 *  - links only nearby particles using a spatial grid rather than all pairs
 *
 * Decorative, so hidden from assistive tech.
 */

const COUNT = 34;
const LINK_DIST = 130;

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas can't resolve CSS custom properties, so read the brand token once.
    const brand = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-brand")
      .trim() || "#3b82f6";
    const rgb = (() => {
      const h = brand.replace("#", "");
      if (h.length !== 6) return "59,130,246";
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
    })();

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    // Bucket particles by LINK_DIST-sized cells so each one only tests its own
    // and neighbouring cells, instead of every other particle.
    const buckets = new Map<string, typeof particles>();
    const bucketKey = (x: number, y: number) =>
      `${Math.floor(x / LINK_DIST)},${Math.floor(y / LINK_DIST)}`;

    let animId = 0;
    let running = false;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      buckets.clear();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.alpha})`;
        ctx.fill();

        const key = bucketKey(p.x, p.y);
        const cell = buckets.get(key);
        if (cell) cell.push(p);
        else buckets.set(key, [p]);
      }

      ctx.lineWidth = 0.5;
      for (const [key, cell] of buckets) {
        const [cx, cy] = key.split(",").map(Number);
        for (let dx = 0; dx <= 1; dx++) {
          for (let dy = dx === 0 ? 0 : -1; dy <= 1; dy++) {
            const other = buckets.get(`${cx + dx},${cy + dy}`);
            if (!other) continue;
            for (const a of cell) {
              for (const b of other) {
                if (a === b) continue;
                const ddx = a.x - b.x;
                const ddy = a.y - b.y;
                const dist = Math.hypot(ddx, ddy);
                if (dist >= LINK_DIST) continue;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `rgba(${rgb},${0.08 * (1 - dist / LINK_DIST)})`;
                ctx.stroke();
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      animId = requestAnimationFrame(draw);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(animId);
    };

    // Don't burn frames while the hero is scrolled away or the tab is hidden.
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0 }
    );
    observer.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    />
  );
}
