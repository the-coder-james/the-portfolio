import { useEffect, useRef, useState } from "react";
import { animate, createTimeline, stagger } from "animejs";
import { TrafficLights } from "@/components/common/tsx/TerminalShell";

const BOOT_LINES = [
  { prompt: "$", text: "init portfolio.engine" },
  { prompt: "›", text: "loading modules........... ok" },
  { prompt: "›", text: "compiling assets.......... ok" },
  { prompt: "›", text: "hydrating react islands... ok" },
  { prompt: "✓", text: "ready." },
];

export function LoadingScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Intro: logo + boot-line stagger (runs while assets load)
    const intro = createTimeline({ defaults: { ease: "out(3)" } });
    intro
      .add(logoRef.current!, {
        opacity: [0, 1],
        scale: [0.85, 1],
        duration: 500,
      })
      .add(
        root.querySelectorAll(".boot-line"),
        {
          opacity: [0, 1],
          translateX: [-12, 0],
          duration: 280,
          delay: stagger(140),
        },
        "-=200"
      );

    // A looping opacity flicker is a photosensitivity concern, so it only runs
    // when the user has not asked for reduced motion.
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Logo flicker loop while loading
    const flicker = prefersReduced ? null : animate(logoRef.current!, {
      opacity: [
        { to: 1, duration: 80 },
        { to: 0.55, duration: 60 },
        { to: 1, duration: 120 },
        { to: 0.85, duration: 80 },
        { to: 1, duration: 200 },
      ],
      duration: 2400,
      loop: true,
      ease: "linear",
    });

    // Real progress: track image loads + document.readyState.
    // Display value is eased toward the real target so the bar always feels alive.
    const display = { v: 0 };
    let target = 0;
    let pageLoaded = false;
    let done = false;

    const setTarget = (n: number) => { target = Math.max(target, Math.min(99, n)); };

    const renderBar = () => {
      if (barRef.current) barRef.current.style.width = `${display.v}%`;
      if (percentRef.current) percentRef.current.textContent = `${Math.floor(display.v).toString().padStart(2, "0")}%`;
    };

    // Drive the display value smoothly toward `target` every frame.
    let raf = 0;
    const tick = () => {
      // ease-out lerp; faster when far from target
      const diff = target - display.v;
      display.v += diff * 0.08;
      // small idle creep so the bar moves even before any image fires
      if (target < 15 && display.v < 12) display.v += 0.12;
      renderBar();
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Count <img> elements as they load. We re-query periodically since React
    // hydrates and mounts images after this effect runs.
    let totalImgs = 0;
    let loadedImgs = 0;
    const tracked = new WeakSet<HTMLImageElement>();

    const recomputeTarget = () => {
      // 0–80% from images, +15% when DOMContentLoaded, +5% when load fires
      const imgPct = totalImgs > 0 ? (loadedImgs / totalImgs) * 80 : 0;
      const domPct = document.readyState !== "loading" ? 15 : 0;
      const loadPct = pageLoaded ? 5 : 0;
      setTarget(imgPct + domPct + loadPct);
    };

    const trackImage = (img: HTMLImageElement) => {
      if (tracked.has(img)) return;
      tracked.add(img);
      totalImgs += 1;
      const onDone = () => {
        loadedImgs += 1;
        recomputeTarget();
      };
      if (img.complete && img.naturalWidth > 0) {
        onDone();
      } else {
        img.addEventListener("load", onDone, { once: true });
        img.addEventListener("error", onDone, { once: true });
      }
    };

    const scanImages = () => {
      document.querySelectorAll<HTMLImageElement>("img").forEach(trackImage);
      recomputeTarget();
    };

    // Initial scan + retry as React mounts more
    scanImages();
    const scanInterval = window.setInterval(scanImages, 250);

    const onDomReady = () => recomputeTarget();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onDomReady, { once: true });
    } else {
      recomputeTarget();
    }

    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.clearInterval(scanInterval);
      flicker?.pause();

      // Exit timeline: snap to 100 → logo pulse → fade overlay
      const tl = createTimeline({
        defaults: { ease: "out(3)" },
        onComplete: () => setHidden(true),
      });

      tl.add(display, {
        v: 100,
        duration: 350,
        ease: "out(2)",
        onUpdate: renderBar,
      })
        .add(
          logoRef.current!,
          {
            scale: [1, 1.08, 0.96],
            filter: ["blur(0px)", "blur(2px)", "blur(0px)"],
            duration: 360,
          },
          "-=100"
        )
        .add(root, {
          opacity: [1, 0],
          scale: [1, 1.04],
          filter: ["blur(0px)", "blur(8px)"],
          duration: 700,
          ease: "inOut(2)",
        });
    };

    const onLoad = () => {
      pageLoaded = true;
      recomputeTarget();
      // Brief beat so the user sees the bar fill, then exit
      window.setTimeout(finish, 250);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }

    // Last-resort unmount. Without this, an error anywhere in the animation
    // path leaves a full-screen overlay covering the site permanently.
    const failsafe = window.setTimeout(() => setHidden(true), 6000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(scanInterval);
      window.clearTimeout(failsafe);
      flicker?.pause();
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading site"
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 9999,
        background: "var(--color-surface-base)",
        backgroundImage:
          "radial-gradient(ellipse at center, var(--tint-brand-08) 0%, transparent 60%), linear-gradient(var(--tint-brand-04) 1px, transparent 1px), linear-gradient(90deg, var(--tint-brand-04) 1px, transparent 1px)",
        backgroundSize: "auto, 40px 40px, 40px 40px",
      }}
    >
      <div className="w-full max-w-md px-8">
        <div
          ref={logoRef}
          className="font-mono text-center mb-10"
          style={{
            fontSize: "2.4rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--color-ink)",
            textShadow: "0 0 20px var(--tint-brand-40)",
            opacity: 0,
          }}
        >
          <span style={{ color: "var(--color-brand-400)" }}>&lt;</span>
          james
          <span style={{ color: "var(--color-brand-400)" }}>/&gt;</span>
        </div>

        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{
            background: "var(--color-surface-code)",
            border: "1px solid var(--tint-brand-18)",
            boxShadow: "0 0 40px var(--tint-brand-08)",
          }}
        >
          <div
            className="flex items-center gap-1.5 px-3 py-2"
            style={{ background: "var(--color-surface-code-head)", borderBottom: "1px solid var(--tint-white-05)" }}
          >
            <TrafficLights />
            <span className="ml-2 font-mono" style={{ fontSize: "0.65rem", color: "var(--color-ink-dim)" }}>
              boot.sh
            </span>
          </div>
          <div className="px-5 py-4 font-mono" style={{ fontSize: "0.78rem", lineHeight: 1.9 }}>
            {BOOT_LINES.map((l, i) => (
              <div key={i} className="boot-line" style={{ opacity: 0 }}>
                <span style={{ color: l.prompt === "✓" ? "var(--color-success)" : "var(--color-success-strong)" }}>{l.prompt}</span>
                <span style={{ color: l.prompt === "✓" ? "var(--color-success)" : "var(--color-ink-dim)", marginLeft: "8px" }}>
                  {l.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono" style={{ fontSize: "0.7rem", color: "var(--color-ink-dim)" }}>
          <span>loading</span>
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: "var(--tint-white-05)", border: "1px solid var(--tint-brand-12)" }}
          >
            <div
              ref={barRef}
              className="h-full"
              style={{
                width: "0%",
                background: "linear-gradient(90deg, var(--color-brand-900), var(--color-brand), var(--color-brand-400))",
                boxShadow: "0 0 12px var(--tint-brand-60)",
              }}
            />
          </div>
          <span ref={percentRef} style={{ color: "var(--color-brand-400)", minWidth: "30px", textAlign: "right" }}>
            00%
          </span>
        </div>
      </div>
    </div>
  );
}
