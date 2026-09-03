import { useRef } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { WindowCard } from "@/components/common/tsx/WindowCard";
import { useRevealed } from "@/hooks/useRevealed";

interface TimelineItem {
  year: string;
  hash: string;
  title: string;
  company: string;
  type: string;
  description: string;
  tags: string[];
}

interface TimelineEntryProps {
  item: TimelineItem;
  index: number;
}

export function TimelineEntry({ item, index }: TimelineEntryProps) {
  const { ref, revealed } = useRevealed<HTMLLIElement>("-60px");
  const reduced = useReducedMotion();
  const isEven = index % 2 === 0;
  const isPresent = item.type === "present";

  return (
    <motion.li
      ref={ref}
      className={`relative flex items-start gap-6 md:gap-0 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
      initial={reduced ? false : { opacity: 0, x: isEven ? -50 : 50, filter: "blur(6px)" }}
      animate={revealed ? { opacity: 1, x: 0, filter: "blur(0px)" } : undefined}
      transition={{ delay: 0.05 + index * 0.06, type: "spring", visualDuration: 0.6, bounce: 0.2 }}
    >
      <div className={`md:w-[45%] pl-14 md:pl-0 ${isEven ? "md:pr-10 md:text-right" : "md:pl-10 md:text-left"}`}>
        <WindowCard
          title={`${item.year}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          raised={isPresent}
          className="text-left"
          style={isPresent ? { borderColor: "var(--color-brand)" } : undefined}
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge
              variant="outline"
              className="font-mono rounded"
              style={{ fontSize: "0.6rem", color: "var(--color-brand-400)", background: "var(--tint-brand-12)", border: "1px solid var(--tint-brand-20)" }}
            >
              {item.hash}
            </Badge>
            <span style={{ fontSize: "0.75rem", color: "var(--color-brand)", fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>
              {item.year}
            </span>
            {item.type === "present" && (
              <Badge
                className="gap-1 rounded-full"
                style={{ fontSize: "0.6rem", color: "var(--color-success)", background: "var(--tint-success-10)", border: "1px solid var(--tint-success-20)" }}
              >
                <span className="w-1 h-1 rounded-full bg-green-400 cursor-blink" />
                Live
              </Badge>
            )}
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "2px" }}>
            {item.title}
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--color-brand)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}>
            {item.company}
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--color-ink-dim)", lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px" }}>
            {item.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="font-mono rounded"
                style={{ fontSize: "0.6rem", color: "var(--color-brand-400)", background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-12)" }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </WindowCard>
      </div>

      <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 top-6" aria-hidden="true">
        <motion.div
          className="w-3 h-3 rounded-full relative"
          initial={reduced ? false : { scale: 0, opacity: 0 }}
          animate={revealed ? { scale: [0, 1.4, 1], opacity: 1 } : undefined}
          transition={{ delay: 0.2 + index * 0.06, type: "spring", visualDuration: 0.4, bounce: 0.05 }}
          style={{
            background: isPresent ? "var(--color-success)" : "var(--color-brand)",
            boxShadow: isPresent ? "0 0 12px var(--tint-success-60)" : "0 0 12px var(--tint-brand-50)",
          }}
        >
          {/* The "currently here" pulse loops forever, so it is suppressed
              under reduced motion rather than left running. */}
          {isPresent && !reduced && (
            <div
              className="absolute inset-0 rounded-full pulse-ring"
              style={{ background: "var(--tint-success-30)" }}
            />
          )}
        </motion.div>
      </div>

      <div className="hidden md:block md:w-[45%]" />
    </motion.li>
  );
}
