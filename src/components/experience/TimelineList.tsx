import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
 * Split-view timeline: a compact rail of years on the left, the selected
 * entry's full detail on the right.
 *
 * The previous version fanned all six entries across the viewport as equal
 * columns. That is the failure mode horizontal timelines are known for -- once
 * an entry needs more than roughly fifteen words, the columns get too narrow
 * and every description wraps into a thin ragged strip. These entries run
 * 19-30 words each, so the horizontal form was working against the content.
 *
 * Master-detail fixes it by separating the two jobs: the rail answers "when did
 * what happen" at a glance, and the panel gives one entry the full width it
 * needs. Selection is explicit rather than hover-only, so it holds still while
 * you read.
 */
export function TimelineList({ items }: { items: TimelineItem[] }) {
  // The most recent entry is the one a visitor is most likely to want.
  const [active, setActive] = useState(Math.max(0, items.length - 1));
  const reduced = useReducedMotion();
  const railRef = useRef<HTMLOListElement>(null);

  // On narrow screens the rail is a horizontal strip, so the selected entry can
  // start off-screen -- the default selection is the last one. Bring it into
  // view without scrolling the panel itself.
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!rail || !el) return;
    if (rail.scrollWidth <= rail.clientWidth && rail.scrollHeight <= rail.clientHeight) return;
    el.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [active, reduced]);
  const item = items[active];
  const isPresent = item.type === "present";

  const spring = { type: "spring" as const, visualDuration: 0.35, bounce: 0.18 };

  return (
    <div className="min-h-0 grid lg:grid-cols-[max-content_max-content] gap-6 xl:gap-10 items-start content-start justify-center m-auto">
      {/* ── Rail ── */}
      <ol
        className="timeline-rail relative flex lg:flex-col gap-0.5 list-none p-0 m-0 lg:pl-4 min-h-0 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto snap-x lg:snap-none"
        aria-label="Career timeline"
        ref={railRef}
      >
        {/* The spine behind the year dots. Hidden on the horizontal
            (small-screen) arrangement, where it would run the wrong way. */}
        <span
          className="hidden lg:block absolute left-0 top-2 bottom-2 w-px pointer-events-none"
          style={{ background: "linear-gradient(180deg, transparent, var(--tint-brand-30) 6%, var(--tint-brand-30) 94%, transparent)" }}
          aria-hidden="true"
        />
        {items.map((entry, i) => {
          const selected = i === active;
          return (
            <li key={`${entry.year}-${entry.title}`} data-index={i} className="shrink-0 lg:shrink snap-start">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={selected ? "true" : undefined}
                className="timeline-rail-item relative w-full text-left rounded-lg px-2.5 py-2 transition-colors"
              >
                {/* One shared element slides between entries instead of six
                    separate highlights fading in and out. */}
                {selected && (
                  <motion.span
                    layoutId="rail-active"
                    className="absolute inset-0 rounded-lg -z-10"
                    style={{
                      background: "var(--tint-brand-12)",
                      border: "1px solid var(--tint-brand-30)",
                    }}
                    transition={reduced ? { duration: 0 } : spring}
                  />
                )}
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 relative"
                    style={{
                      background: isPresentEntry(entry) ? "var(--color-success)" : "var(--color-brand)",
                      boxShadow: selected
                        ? `0 0 10px ${isPresentEntry(entry) ? "var(--tint-success-60)" : "var(--tint-brand-50)"}`
                        : "none",
                    }}
                    aria-hidden="true"
                  >
                    {isPresentEntry(entry) && !reduced && (
                      <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: "var(--tint-success-30)" }} />
                    )}
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: selected ? "var(--color-brand)" : "var(--color-ink-dim)",
                    }}
                  >
                    {entry.year}
                  </span>
                </span>
                <span
                  className="block mt-0.5 truncate"
                  style={{
                    fontSize: "0.78rem",
                    color: selected ? "var(--color-ink)" : "var(--color-ink-faint)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {entry.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* ── Detail ── */}
      <div className="relative min-h-0 min-w-0 flex flex-col justify-center items-start">
        <AnimatePresence mode="wait">
          <motion.article
            key={item.year + item.title}
            className="timeline-detail-card w-full max-w-xl rounded-2xl p-4 xl:p-5 flex flex-col"
            style={{
              background: "var(--color-card-surface)",
              border: `1px solid ${isPresent ? "var(--color-brand)" : "var(--color-card-border)"}`,
            }}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={reduced ? { duration: 0 } : { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 flex-wrap mb-2.5 shrink-0">
              <Badge
                variant="outline"
                className="font-mono rounded"
                style={{ fontSize: "0.6rem", color: "var(--color-brand-text)", background: "var(--tint-brand-12)", border: "1px solid var(--tint-brand-20)" }}
              >
                {item.hash}
              </Badge>
              <span style={{ fontSize: "0.8rem", color: "var(--color-brand)", fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
                {item.year}
              </span>
              {isPresent && (
                <Badge
                  className="gap-1 rounded-full"
                  style={{ fontSize: "0.6rem", color: "var(--color-success)", background: "var(--tint-success-10)", border: "1px solid var(--tint-success-20)" }}
                >
                  <span className="w-1 h-1 rounded-full bg-success cursor-blink" />
                  Live
                </Badge>
              )}
            </div>

            <h3
              style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2, marginBottom: "2px" }}
            >
              {item.title}
            </h3>
            <p
              style={{ fontSize: "0.82rem", color: "var(--color-brand)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}
            >
              {item.company}
            </p>

            <p
              className="min-h-0"
              style={{ fontSize: "0.88rem", color: "var(--color-ink-dim)", lineHeight: 1.65, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px", maxWidth: "58ch" }}
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

function isPresentEntry(entry: TimelineItem) {
  return entry.type === "present";
}
