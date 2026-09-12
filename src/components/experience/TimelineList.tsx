import { TimelineEntry } from "@/components/experience/TimelineEntry";

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
 * The whole timeline as one island, laid out as a horizontal rail.
 *
 * Rendered as an ordered list because the entries are a chronological
 * sequence. Every entry is visible at desktop widths; on a narrow screen the
 * rail scrolls sideways with snap points rather than dropping any of them.
 */
export function TimelineList({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative flex-1 min-h-0 flex flex-col justify-center">
      <div className="relative">
        {/* The rail sits in the flow, level with the year nodes, so it tracks
            them rather than relying on a magic offset. */}
        <div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: "6px",
            background:
              "linear-gradient(90deg, transparent, var(--tint-brand-40) 8%, var(--tint-brand-40) 92%, transparent)",
          }}
          aria-hidden="true"
        />
        <ol className="timeline-rail flex gap-3 xl:gap-4 list-none p-0 m-0 w-full overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none items-start">
          {items.map((item, i) => (
            <TimelineEntry key={`${item.year}-${item.title}`} item={item} index={i} />
          ))}
        </ol>
      </div>
    </div>
  );
}
