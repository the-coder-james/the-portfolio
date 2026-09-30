import { useEffect, useRef, useState } from "react";

import { SlidingNumber } from "@/components/motion-primitives/sliding-number";
import { RevealGroup } from "@/components/common/tsx/RevealGroup";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRevealed } from "@/hooks/useRevealed";

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
  const { ref, revealed } = useRevealed<HTMLDivElement>("-80px");

  return (
    <div ref={ref}>
      {/* Columns follow the count. grid-cols-4 dates from when there were four
          stats; with two it left each card at a quarter width and the pair
          floating in a third of the row. */}
      <RevealGroup className="stats-grid grid gap-2 sm:gap-2.5" preset="scale" margin="-80px">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card card-glow rounded-xl text-center"
            style={{ background: "var(--color-card-surface)", border: "1px solid var(--color-card-border)" }}
          >
            {/* Sized in CSS, not inline: an inline style outranks every
                stylesheet rule regardless of media query, so a per-viewport
                scale could never reach these here. */}
            <div className="stat-icon leading-none" aria-hidden="true">{stat.icon}</div>
            <div className="stat-value gradient-text">
              <StatValue value={stat.value} start={revealed} />
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </RevealGroup>
    </div>
  );
}
