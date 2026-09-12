import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, GitCommitVertical, Loader } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
 * The career timeline drawn as a CI/CD pipeline: each year is a stage on a
 * connected run, every stage before the present reads as "passed", and the
 * present one is still running.
 *
 * A plain vertical list of years never said what the entries *were*; a pipeline
 * carries the same chronology but makes the shape of the career legible at a
 * glance -- each stage completed, the last still in progress. It also suits the
 * `git log --oneline` framing the panel already uses.
 *
 * Selection is explicit -- click or Enter/Space only. Wiring it to focus or
 * hover as well meant tabbing through the stages, or merely dragging the mouse
 * across them, silently replaced whatever the reader was looking at with no way
 * back (WCAG 3.2.1, On Focus).
 */
export function TimelineList({ items }: { items: TimelineItem[] }) {
  // Default to the present: it is the stage a visitor is most likely to want,
  // and the one still running.
  const initial = Math.max(0, items.length - 1);
  const [active, setActive] = useState(initial);
  const reduced = useReducedMotion();
  const railRef = useRef<HTMLOListElement>(null);

  // The pipeline scrolls sideways on narrow screens and the default selection
  // is the last stage, so it would otherwise start off the right edge.
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!rail || !el) return;
    // A frame later: on first mount the rail has not been laid out yet.
    const raf = requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [active, reduced]);

  const item = items[active];
  const isPresent = item.type === "present";

  return (
    <div className="min-h-0 flex flex-col gap-5 xl:gap-6 w-full max-w-4xl mx-auto mt-0 mb-auto">
      {/* ── Pipeline ── */}
      <ol
        className="pipeline relative flex list-none p-0 m-0 gap-0 shrink-0 overflow-x-auto"
        aria-label="Career pipeline"
        ref={railRef}
      >
        {items.map((entry, i) => {
          const selected = i === active;
          const running = entry.type === "present";
          const passed = !running;
          return (
            <li
              key={`${entry.year}-${entry.title}`}
              data-index={i}
              className="pipeline-stage relative flex-1 min-w-[104px] snap-start"
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={selected ? "true" : undefined}
                className="pipeline-stage-btn group relative w-full flex flex-col items-center gap-2 px-1 py-2 rounded-lg"
              >
                {/* The run's connecting track, drawn behind the node. */}
                <span
                  className="pipeline-track absolute top-[22px] left-0 right-0 h-0.5 pointer-events-none"
                  data-first={i === 0 ? "true" : undefined}
                  data-last={i === items.length - 1 ? "true" : undefined}
                  aria-hidden="true"
                />
                <span
                  className="pipeline-node relative z-10 grid place-items-center w-7 h-7 rounded-full shrink-0"
                  data-state={running ? "running" : "passed"}
                  data-selected={selected ? "true" : undefined}
                  aria-hidden="true"
                >
                  {running ? (
                    <Loader size={13} className={reduced ? "" : "spin-slow"} />
                  ) : passed ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    <GitCommitVertical size={13} />
                  )}
                </span>
                <span className="flex flex-col items-center gap-0.5 min-w-0 w-full">
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: selected ? "var(--color-brand-text)" : "var(--color-ink-dim)",
                    }}
                  >
                    {entry.year}
                  </span>
                  <span
                    className="block truncate w-full text-center px-1"
                    style={{
                      fontSize: "0.7rem",
                      color: selected ? "var(--color-ink)" : "var(--color-ink-faint)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    {entry.title}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* ── Stage detail ── */}
      <div className="relative min-h-0 min-w-0">
        <AnimatePresence mode="wait">
          <motion.article
            key={item.year + item.title}
            className="timeline-detail-card w-full rounded-2xl p-4 xl:p-5 flex flex-col"
            style={{
              background: "var(--color-card-surface)",
              border: `1px solid ${isPresent ? "var(--color-brand)" : "var(--color-card-border)"}`,
            }}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={reduced ? { duration: 0 } : { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 flex-wrap mb-2.5 shrink-0">
              <Badge
                variant="outline"
                className="font-mono rounded"
                style={{ fontSize: "0.6rem", color: "var(--color-brand-text)", background: "var(--tint-brand-12)", border: "1px solid var(--tint-brand-20)" }}
              >
                {item.hash}
              </Badge>
              <span style={{ fontSize: "0.8rem", color: "var(--color-brand-text)", fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
                {item.year}
              </span>
              <Badge
                className="gap-1 rounded-full font-mono"
                style={
                  isPresent
                    ? { fontSize: "0.58rem", color: "var(--color-success)", background: "var(--tint-success-10)", border: "1px solid var(--tint-success-20)" }
                    : { fontSize: "0.58rem", color: "var(--color-ink-dim)", background: "var(--tint-white-05)", border: "1px solid var(--tint-white-08)" }
                }
              >
                {isPresent ? (
                  <>
                    <span className="w-1 h-1 rounded-full bg-success cursor-blink" />
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

            <h3
              style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2, marginBottom: "2px" }}
            >
              {item.title}
            </h3>
            <p
              style={{ fontSize: "0.82rem", color: "var(--color-brand-text)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}
            >
              {item.company}
            </p>

            <p
              className="min-h-0"
              style={{ fontSize: "0.88rem", color: "var(--color-ink-dim)", lineHeight: 1.65, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px", maxWidth: "62ch" }}
            >
              {item.description}
            </p>

            <motion.div
              className="flex flex-wrap gap-1.5 shrink-0"
              initial={reduced ? false : "hidden"}
              animate="shown"
              variants={{ shown: { transition: { staggerChildren: 0.04 } } }}
            >
              {item.tags.map((tag) => (
                <motion.span
                  key={tag}
                  variants={{ hidden: { opacity: 0, y: 6 }, shown: { opacity: 1, y: 0 } }}
                  transition={reduced ? { duration: 0 } : { duration: 0.2 }}
                >
                  <Badge
                    variant="outline"
                    className="font-mono rounded"
                    style={{ fontSize: "0.62rem", color: "var(--color-brand-text)", background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-12)" }}
                  >
                    {tag}
                  </Badge>
                </motion.span>
              ))}
            </motion.div>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  );
}
