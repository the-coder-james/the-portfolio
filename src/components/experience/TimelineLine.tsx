import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRevealed } from "@/hooks/useRevealed";

/**
 * The vertical rule running down the timeline.
 *
 * Two constraints shape this:
 *
 * 1. The experience section is pinned by ScrollStack, which clips it to one
 *    viewport (`overflow: hidden`) and scrolls its content internally via
 *    scrollTop. Viewport-relative scroll progress therefore doesn't track what
 *    the reader sees — a `useScroll`-driven version left the rule stopping
 *    partway down the timeline.
 * 2. For the same reason an IntersectionObserver against the viewport can fail
 *    to fire here, so useRevealed guarantees the line draws regardless.
 *
 * Decorative, so hidden from assistive tech.
 */
export function TimelineLine() {
  const { ref, revealed } = useRevealed<HTMLDivElement>("-40px");
  const reduced = useReducedMotion();

  // Stops are placed explicitly: with four evenly-spaced stops the last one
  // (transparent) landed around the 4th of six entries, so the rule faded out
  // before reaching the end. Hold colour to 92%, fade only at the tail.
  const background =
    "linear-gradient(180deg, var(--color-brand-900) 0%, var(--color-brand) 35%, var(--color-brand-400) 70%, var(--color-brand-400) 92%, transparent 100%)";

  if (reduced) {
    return (
      <div
        className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px"
        aria-hidden="true"
        style={{ background }}
      />
    );
  }

  return (
    <motion.div
      ref={ref}
      className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px"
      aria-hidden="true"
      style={{ background, transformOrigin: "top" }}
      initial={{ scaleY: 0, opacity: 0.3 }}
      animate={revealed ? { scaleY: 1, opacity: 1 } : undefined}
      transition={{ duration: 1.4, delay: 0.2, ease: "easeInOut" }}
    />
  );
}
