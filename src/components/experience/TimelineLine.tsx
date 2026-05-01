import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function TimelineLine() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px"
      initial={{ scaleY: 0, originY: 0 }}
      animate={inView ? { scaleY: 1 } : {}}
      transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
      style={{
        background: "linear-gradient(180deg, #1d4ed8, #3b82f6, #60a5fa, transparent)",
        transformOrigin: "top",
      }}
    />
  );
}
