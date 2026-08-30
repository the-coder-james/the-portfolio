import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The vertical timeline rule, drawn in as the section scrolls past.
 *
 * This used to be a one-shot `inView` trigger that played a fixed 1.4s
 * animation regardless of scroll position. Tying it to scroll progress means
 * the line tracks the entries it belongs to, and scrubs back when scrolling up.
 *
 * Decorative, so hidden from assistive tech.
 */
export function TimelineLine() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 85%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const opacity = useTransform(scrollYProgress, [0, 0.15], [0.3, 1]);

  const background =
    "linear-gradient(180deg, var(--color-brand-900), var(--color-brand), var(--color-brand-400), transparent)";

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
      style={{ background, transformOrigin: "top", scaleY, opacity }}
    />
  );
}
