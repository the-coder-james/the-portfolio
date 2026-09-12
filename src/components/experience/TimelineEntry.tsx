import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/useReducedMotion";
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
  expanded: boolean;
  onFocus: () => void;
  onLeave: () => void;
}

/**
 * One stop on the horizontal timeline.
 *
 * Six equal columns made every card narrow enough that the descriptions wrapped
 * to eight or nine lines and the whole rail read as cramped. Instead the active
 * card takes roughly half the rail and shows its full detail, while the rest
 * collapse to a spine of year + title. Flex-basis does the work, so opening one
 * card closes the others in the same transition.
 *
 * Pointer hover and keyboard focus drive the same state, so this is reachable
 * without a mouse; the whole card is a button for that reason.
 */
export function TimelineEntry({ item, index, expanded, onFocus, onLeave }: TimelineEntryProps) {
  const { ref, revealed } = useRevealed<HTMLLIElement>("-40px");
  const reduced = useReducedMotion();
  const isPresent = item.type === "present";

  return (
    <motion.li
      ref={ref}
      className="relative flex flex-col min-w-0 snap-start"
      style={{ flex: expanded ? "1 1 0%" : "0 1 auto" }}
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={revealed ? { opacity: 1, y: 0 } : undefined}
      transition={{ delay: 0.05 + index * 0.06, type: "spring", visualDuration: 0.5, bounce: 0.2 }}
      onMouseEnter={onFocus}
      onMouseLeave={onLeave}
    >
      {/* Node on the rail */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full relative shrink-0"
          style={{
            background: isPresent ? "var(--color-success)" : "var(--color-brand)",
            boxShadow: isPresent ? "0 0 10px var(--tint-success-60)" : "0 0 10px var(--tint-brand-50)",
          }}
          aria-hidden="true"
        >
          {isPresent && !reduced && (
            <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: "var(--tint-success-30)" }} />
          )}
        </span>
        <span style={{ fontSize: "0.9rem", color: "var(--color-brand)", fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
          {item.year}
        </span>
        {isPresent && (
          <Badge
            className="gap-1 rounded-full shrink-0"
            style={{ fontSize: "0.55rem", color: "var(--color-success)", background: "var(--tint-success-10)", border: "1px solid var(--tint-success-20)" }}
          >
            <span className="w-1 h-1 rounded-full bg-success cursor-blink" />
            Live
          </Badge>
        )}
      </div>

      <button
        type="button"
        onFocus={onFocus}
        onClick={onFocus}
        aria-expanded={expanded}
        className="timeline-card card-glow group relative w-full text-left rounded-xl overflow-hidden transition-colors"
        style={{
          background: "var(--color-card-surface)",
          border: `1px solid ${expanded ? "var(--color-brand)" : "var(--color-card-border)"}`,
        }}
      >
        <div className="flex flex-col p-3.5">
          <div className="flex items-start gap-2 mb-1">
            <h3
              className="min-w-0"
              style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.25 }}
            >
              {item.title}
            </h3>
          </div>
          <p
            className="truncate"
            style={{ fontSize: "0.72rem", color: "var(--color-brand)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "8px" }}
          >
            {item.company}
          </p>

          {/* Detail only renders open on the active card, but stays in the DOM
              so it is always available to assistive tech and to find-in-page. */}
          <div
            className="timeline-detail min-h-0 flex flex-col"
            data-open={expanded ? "true" : "false"}
          >
            <Badge
              variant="outline"
              className="font-mono rounded mb-2 self-start shrink-0"
              style={{ fontSize: "0.55rem", color: "var(--color-brand-400)", background: "var(--tint-brand-12)", border: "1px solid var(--tint-brand-20)" }}
            >
              {item.hash}
            </Badge>
            <p
              style={{ fontSize: "0.78rem", color: "var(--color-ink-dim)", lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}
            >
              {item.description}
            </p>
            <div className="flex flex-wrap gap-1 shrink-0">
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
          </div>

          {/* Collapsed affordance */}
          <span
            className="timeline-hint pt-1 font-mono shrink-0"
            data-open={expanded ? "true" : "false"}
            style={{ fontSize: "0.58rem", color: "var(--color-ink-faint)" }}
            aria-hidden="true"
          >
            {item.tags.length} tags · more
          </span>
        </div>
      </button>
    </motion.li>
  );
}
