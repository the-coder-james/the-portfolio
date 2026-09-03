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
  const step = (i: number) => ({
    initial: reduced ? false : { opacity: 0, y: 14 },
    animate: revealed ? { opacity: 1, y: 0 } : undefined,
    transition: {
      delay: reduced ? 0 : i * 0.08,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
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
            color: "var(--color-ink)",
            fontFamily: "'Space Grotesk', sans-serif",
            lineHeight: 1.2,
          }}
          {...step(1)}
        >
          {headline}
          {headlineAccent && (
            <>
              {" "}
              <span className="gradient-text">{headlineAccent}</span>
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
