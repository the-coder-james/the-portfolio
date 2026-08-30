import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AboutImageProps {
  name: string;
  imageUrl: string;
  hoverImageUrl?: string;
}

export function AboutImage({ name, imageUrl, hoverImageUrl }: AboutImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapperRef, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const reveal = (delay: number, from: Record<string, number>) => ({
    initial: reduced ? false : { opacity: 0, ...from },
    animate: inView ? { opacity: 1, scale: 1, x: 0, rotate: 0 } : undefined,
    transition: { delay, type: "spring" as const, visualDuration: 0.5, bounce: 0.2 },
  });

  return (
    <motion.div
      ref={wrapperRef}
      className="flex justify-center lg:justify-start mb-10"
      initial={reduced ? false : { opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : undefined}
      transition={{ delay: 0.15, type: "spring", visualDuration: 0.6, bounce: 0.25 }}
    >
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(135deg, var(--color-brand), var(--color-brand-900), var(--color-surface-code))",
            padding: "3px",
            borderRadius: "9999px",
            boxShadow: "0 0 40px var(--tint-brand-45), 0 0 80px var(--tint-brand-15)",
          }}
        />
        <div
          className={`absolute -inset-2 rounded-full pointer-events-none${reduced ? "" : " spin-slow"}`}
          aria-hidden="true"
          style={{ border: "1.5px dashed var(--tint-brand-30)", borderRadius: "9999px" }}
        />
        <motion.div
          className="relative rounded-full overflow-hidden"
          style={{ width: "170px", height: "170px", border: "3px solid var(--tint-brand-60)", boxShadow: "0 0 30px var(--tint-brand-35)" }}
          initial={reduced ? false : { rotate: -12 }}
          animate={inView ? { rotate: 0 } : undefined}
          transition={{ delay: 0.25, type: "spring", visualDuration: 0.7, bounce: 0.05 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          tabIndex={hoverImageUrl ? 0 : undefined}
        >
          <img
            src={imageUrl}
            alt={`${name} photo`}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
            style={{ opacity: hovered && hoverImageUrl ? 0 : 1 }}
          />
          {hoverImageUrl && (
            <img
              src={hoverImageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
              style={{ opacity: hovered ? 1 : 0 }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 60%, var(--scrim-base-35) 100%)" }} />
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -right-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "var(--color-surface-code)", border: "1px solid var(--tint-brand-35)", boxShadow: "0 4px 12px var(--shadow-black-40)" }}
          {...reveal(0.45, { scale: 0 })}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cursor-blink" />
          <span className="font-mono" style={{ fontSize: "0.6rem", color: "var(--color-success-soft)", whiteSpace: "nowrap" }}>available</span>
        </motion.div>
        <motion.div
          className="absolute -top-2 -left-4 px-2.5 py-1 rounded-lg font-mono"
          style={{ background: "var(--tint-brand-15)", border: "1px solid var(--tint-brand-30)", fontSize: "0.6rem", color: "var(--color-brand-300)", whiteSpace: "nowrap" }}
          {...reveal(0.35, { x: -12 })}
        >
          10+ yrs coding
        </motion.div>
      </div>
    </motion.div>
  );
}
