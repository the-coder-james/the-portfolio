import { Check, Loader } from "lucide-react";
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

/**
 * The career drawn as a CI/CD run, top to bottom: each year a stage on one
 * connected track, every stage before the present "passed", the present one
 * still running.
 *
 * It used to be a horizontal rail with one stage's detail shown at a time --
 * a selector, which kept it inside one screen but hid five of the six entries
 * behind clicks. About is free to run on now, so every stage is printed in
 * full, in order, and the track fills as the reader scrolls down it (CSS,
 * global.css "Journey track").
 */
export function TimelineList({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="journey" aria-label="Career pipeline">
      {items.map((item, i) => (
        <Stage key={`${item.year}-${item.title}`} item={item} index={i} last={i === items.length - 1} />
      ))}
    </ol>
  );
}

function Stage({ item, index, last }: { item: TimelineItem; index: number; last: boolean }) {
  const { ref, revealed } = useRevealed<HTMLLIElement>("-80px");
  const reduced = useReducedMotion();
  const running = item.type === "present";

  return (
    <motion.li
      ref={ref}
      className="journey-stage"
      data-state={running ? "running" : "passed"}
      data-last={last ? "true" : undefined}
      // `initial` never branches on reduced motion (see SectionHeading):
      // reduced motion keeps the targets and drops the duration, and
      // `data-reveal` lets the CSS guarantee the end state.
      data-reveal=""
      initial={{ opacity: 0, x: index % 2 ? 24 : -24 }}
      animate={revealed ? { opacity: 1, x: 0 } : undefined}
      transition={reduced ? { duration: 0 } : { type: "spring", visualDuration: 0.55, bounce: 0.15 }}
    >
      {/* The year and the node sit on the track; the card hangs off it. */}
      <div className="journey-marker" aria-hidden="true">
        <span className="journey-year font-mono">{item.year}</span>
        <span className="journey-node" data-state={running ? "running" : "passed"}>
          {running ? (
            <Loader size={15} className={reduced ? "" : "spin-slow"} />
          ) : (
            <Check size={15} strokeWidth={3} />
          )}
        </span>
      </div>

      <article className="journey-card" data-state={running ? "running" : "passed"}>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge
            variant="outline"
            className="font-mono rounded"
            style={{ fontSize: "0.66rem", color: "var(--color-brand-text)", background: "var(--tint-brand-12)", border: "1px solid var(--tint-brand-20)" }}
          >
            {item.hash}
          </Badge>
          {/* The year again: for assistive tech at PC widths, where the one
              on the track is decoration, and printed on a phone, whose track
              has no room for it (global.css, .journey-card-year). */}
          <span className="journey-card-year font-mono">{item.year}</span>
          <Badge
            className="gap-1 rounded-full font-mono"
            style={
              running
                ? { fontSize: "0.64rem", color: "var(--color-success)", background: "var(--tint-success-10)", border: "1px solid var(--tint-success-20)" }
                : { fontSize: "0.64rem", color: "var(--color-ink-dim)", background: "var(--tint-white-05)", border: "1px solid var(--tint-white-08)" }
            }
          >
            {running ? (
              <>
                <span className="w-1 h-1 rounded-full bg-success cursor-blink" aria-hidden="true" />
                running
              </>
            ) : (
              <>
                <span aria-hidden="true">✓</span>
                passed
              </>
            )}
          </Badge>
        </div>

        <h4 className="journey-title">{item.title}</h4>
        <p className="journey-company">{item.company}</p>
        <p className="journey-desc">{item.description}</p>

        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {item.tags.map((tag) => (
            <li key={tag}>
              <Badge
                variant="outline"
                className="font-mono rounded"
                style={{ fontSize: "0.68rem", color: "var(--color-brand-text)", background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-12)" }}
              >
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
      </article>
    </motion.li>
  );
}
