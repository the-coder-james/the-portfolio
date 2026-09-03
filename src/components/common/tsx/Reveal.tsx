import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useRevealed } from "@/hooks/useRevealed";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Direction the element travels in from. */
  x?: number;
  y?: number;
  delay?: number;
  margin?: string;
}

/**
 * Single-element scroll reveal — the declarative replacement for the
 * `inView(el, () => animateEl(...))` pattern this codebase used in a dozen
 * places. Renders children unanimated under reduced motion.
 */
export function Reveal({
  children,
  className,
  x = 0,
  y = 0,
  delay = 0,
  margin = "-60px",
}: RevealProps) {
  const { ref, revealed } = useRevealed<HTMLDivElement>(margin);
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={revealed ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{ delay, type: "spring", visualDuration: 0.5, bounce: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
