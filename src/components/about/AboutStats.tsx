import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { SlidingNumber } from "@/components/motion-primitives/sliding-number";
import { RevealGroup } from "@/components/common/tsx/RevealGroup";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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

/**
 * Counts up to a stat's numeric value once the group scrolls into view.
 *
 * Replaces a hand-rolled rAF loop that wrote to `textContent` on every frame
 * with no live region — screen readers had no stable value to announce. The
 * accessible value now comes from a single visually-hidden node, so the
 * animation is presentational only.
 */
function StatValue({ value, start }: { value: string; start: boolean }) {
  const parsed = parseNumeric(value);
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!parsed) return;
    if (!start || reduced) {
      setCurrent(parsed.num);
      return;
    }
    setCurrent(parsed.num);
  }, [start, reduced, parsed?.num]);

  // Non-numeric stats (or reduced motion) render as plain text.
  if (!parsed || reduced) {
    return <span>{value}</span>;
  }

  const isWhole = parsed.num % 1 === 0;

  return (
    <>
      <span aria-hidden="true" className="inline-flex items-center">
        {isWhole ? <SlidingNumber value={current} /> : <span>{current.toFixed(1)}</span>}
        {parsed.suffix}
      </span>
      <span className="sr-only">{value}</span>
    </>
  );
}

export function AboutStats({ stats }: AboutStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref}>
      <RevealGroup className="grid grid-cols-2 gap-4" preset="scale" margin="-80px">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card-glow rounded-xl p-5"
            style={{ background: "var(--tint-white-02)", border: "1px solid var(--tint-white-06)" }}
          >
            <div className="text-2xl mb-2" aria-hidden="true">{stat.icon}</div>
            <div
              className="gradient-text"
              style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <StatValue value={stat.value} start={inView} />
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-ink-dim)", marginTop: "4px", fontFamily: "'Space Grotesk', sans-serif" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </RevealGroup>
    </div>
  );
}
