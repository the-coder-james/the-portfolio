import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRevealed } from "@/hooks/useRevealed";

interface SectionHeadingProps {
  eyebrow?: string;
  headline?: string;
  headlineAccent?: string;
  sub?: string;
  className?: string;
}

/**
 * A section's eyebrow, headline and supporting line, revealed as a short
 * stagger when the section scrolls into view.
 *
 * Sections previously appeared fully formed the moment they were reached, which
 * made every boundary land at once. Leading with the eyebrow and letting the
 * headline follow gives each section a sense of arrival, and matches how the
 * content inside them already reveals.
 *
 * Under reduced motion everything renders immediately.
 */
export function SectionHeading({
  eyebrow,
  headline,
  headlineAccent,
  sub,
  className,
}: SectionHeadingProps) {
  const { ref, revealed } = useRevealed<HTMLDivElement>("-80px");
  const reduced = useReducedMotion();

  // Small, quick offsets — this runs while the reader is already scrolling, so
  // a long or large movement would feel like lag rather than polish.
  //
  // `initial` never branches on reduced motion. The hook reports false until
  // after hydration, and Motion skips its first animation outright when
  // `initial` is false by the time `animate` arrives -- which left the SSR
  // opacity:0 in place for good. Reduced motion keeps the same targets and
  // drops the duration instead; `data-reveal` lets the CSS guarantee the end
  // state whatever the script does.
  const step = (i: number) => ({
    "data-reveal": "",
    initial: { opacity: 0, y: 14 },
    animate: revealed ? { opacity: 1, y: 0 } : undefined,
    transition: reduced
      ? { duration: 0 }
      : { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  });

  const heading = (
    <>
      {eyebrow && (
        <motion.p
          className="font-mono mb-2"
          style={{ fontSize: "0.75rem", color: "var(--color-brand)" }}
          {...step(0)}
        >
          {eyebrow}
        </motion.p>
      )}
      {headline && (
        <motion.h2
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            color: "var(--color-ink)",
          }}
          {...step(1)}
        >
          {/* Set like a manual's section title: the line in ink, the accent
              words picked out in the spot colour. */}
          {headline}
          {headlineAccent && (
            <>
              {" "}
              <span className="spot-text">{headlineAccent}</span>
            </>
          )}
        </motion.h2>
      )}
      {sub && (
        <motion.p
          className="mt-3"
          style={{ fontSize: "0.85rem", color: "var(--color-ink-dim)" }}
          {...step(2)}
        >
          {sub}
        </motion.p>
      )}
    </>
  );

  return (
    <div ref={ref} className={className}>
      {heading}
    </div>
  );
}
