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

/**
 * One stop on the horizontal timeline rail.
 *
 * This was a full-width row in a vertical stack, which made the panel grow to
 * roughly 2,200px -- two and a half screens. Laid out along a rail instead,
 * every entry keeps all of its content (hash, year, title, company,
 * description, tags) and the whole journey fits one viewport.
 */
export function TimelineEntry({ item, index }: TimelineEntryProps) {
  const { ref, revealed } = useRevealed<HTMLLIElement>("-40px");
  const reduced = useReducedMotion();
  const isPresent = item.type === "present";

  return (
    <motion.li
      ref={ref}
      className="relative flex flex-col shrink-0 lg:shrink lg:flex-1 w-[min(78vw,280px)] lg:w-auto lg:min-w-0 snap-start"
      initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={revealed ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ delay: 0.05 + index * 0.07, type: "spring", visualDuration: 0.55, bounce: 0.2 }}
    >
      {/* Node on the rail */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <motion.span
          className="w-3 h-3 rounded-full relative shrink-0"
          initial={reduced ? false : { scale: 0, opacity: 0 }}
          animate={revealed ? { scale: [0, 1.4, 1], opacity: 1 } : undefined}
          transition={{ delay: 0.18 + index * 0.07, type: "spring", visualDuration: 0.4, bounce: 0.05 }}
          style={{
            background: isPresent ? "var(--color-success)" : "var(--color-brand)",
            boxShadow: isPresent ? "0 0 12px var(--tint-success-60)" : "0 0 12px var(--tint-brand-50)",
          }}
          aria-hidden="true"
        >
          {isPresent && !reduced && (
            <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: "var(--tint-success-30)" }} />
          )}
        </motion.span>
        <span style={{ fontSize: "0.95rem", color: "var(--color-brand)", fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
          {item.year}
        </span>
        {isPresent && (
          <Badge
            className="gap-1 rounded-full"
            style={{ fontSize: "0.55rem", color: "var(--color-success)", background: "var(--tint-success-10)", border: "1px solid var(--tint-success-20)" }}
          >
            <span className="w-1 h-1 rounded-full bg-success cursor-blink" />
            Live
          </Badge>
        )}
      </div>

      <WindowCard
        title={`${item.year}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        raised={isPresent}
        className="text-left flex-1"
        style={isPresent ? { borderColor: "var(--color-brand)" } : undefined}
      >
        <Badge
          variant="outline"
          className="font-mono rounded mb-2"
          style={{ fontSize: "0.55rem", color: "var(--color-brand-400)", background: "var(--tint-brand-12)", border: "1px solid var(--tint-brand-20)" }}
        >
          {item.hash}
        </Badge>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "2px" }}>
          {item.title}
        </h3>
        <p style={{ fontSize: "0.72rem", color: "var(--color-brand)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "8px" }}>
          {item.company}
        </p>
        <p style={{ fontSize: "0.76rem", color: "var(--color-ink-dim)", lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}>
          {item.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="font-mono rounded"
              style={{ fontSize: "0.55rem", color: "var(--color-brand-400)", background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-12)" }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </WindowCard>
    </motion.li>
  );
}
