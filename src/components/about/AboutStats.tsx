import { useEffect, useRef } from "react";
import { stagger, inView } from "motion";
import { animateEl } from "@/lib/utils";

interface Stat {
  label: string;
  value: string;
  icon: string;
}

interface AboutStatsProps {
  stats: Stat[];
}

function parseNumeric(v: string): { num: number; suffix: string } | null {
  const m = v.match(/^([\d.]+)(.*)$/);
  if (!m) return null;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return null;
  return { num, suffix: m[2] || "" };
}

export function AboutStats({ stats }: AboutStatsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    inView(root, () => {
      animateEl(
        root.querySelectorAll<Element>(".stat-card"),
        { opacity: [0, 1], y: [30, 0], scale: [0.9, 1] },
        { delay: stagger(0.1, { startDelay: 0.1 }), type: "spring", visualDuration: 0.5, bounce: 0.2 }
      );

      // Count-up for numeric stats
      root.querySelectorAll<HTMLElement>(".stat-value").forEach((el) => {
        const original = el.dataset.value || el.textContent || "";
        const parsed = parseNumeric(original);
        if (!parsed) return;
        let start: number | null = null;
        const duration = 1400;
        const tick = (ts: number) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const val = eased * parsed.num;
          const fixed = parsed.num % 1 !== 0 ? val.toFixed(1) : Math.floor(val).toString();
          el.textContent = fixed + parsed.suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        setTimeout(() => requestAnimationFrame(tick), 300);
      });
    }, { margin: "-80px" });
  }, [stats]);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="stat-card card-glow rounded-xl p-5"
          style={{ background: "var(--tint-white-02)", border: "1px solid var(--tint-white-06)", opacity: 0 }}
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div
            className="stat-value gradient-text"
            data-value={stat.value}
            style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {stat.value}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-ink-dim)", marginTop: "4px", fontFamily: "'Space Grotesk', sans-serif" }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
