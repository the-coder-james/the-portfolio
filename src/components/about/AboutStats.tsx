import { useEffect, useRef } from "react";
import { animate, stagger, onScroll } from "animejs";

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

    animate(root.querySelectorAll(".stat-card"), {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.9, 1],
      duration: 600,
      delay: stagger(100, { start: 300 }),
      ease: "out(3)",
      autoplay: onScroll({ target: root, enter: "bottom-=100 top" }),
    });

    // Count-up tween for any numeric stat values
    root.querySelectorAll<HTMLElement>(".stat-value").forEach((el) => {
      const original = el.dataset.value || el.textContent || "";
      const parsed = parseNumeric(original);
      if (!parsed) return;
      const counter = { v: 0 };
      animate(counter, {
        v: parsed.num,
        duration: 1400,
        delay: 600,
        ease: "out(3)",
        onUpdate: () => {
          const fixed = parsed.num % 1 !== 0 ? counter.v.toFixed(1) : Math.floor(counter.v).toString();
          el.textContent = fixed + parsed.suffix;
        },
        autoplay: onScroll({ target: root, enter: "bottom-=100 top" }),
      });
    });
  }, [stats]);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="stat-card card-glow rounded-xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", opacity: 0 }}
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div
            className="stat-value gradient-text"
            data-value={stat.value}
            style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {stat.value}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "4px", fontFamily: "'Space Grotesk', sans-serif" }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
