import { useState } from "react";
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
 * One card is expanded at a time and shows its full detail; the others
 * collapse to year + title. Hovering or focusing a card expands it, and the
 * newest entry is open by default so the panel never starts blank.
 *
 * Rendered as an ordered list because the entries are a chronological sequence.
 */
export function TimelineList({ items }: { items: TimelineItem[] }) {
  // Default to the most recent entry rather than the oldest: it is the one a
  // visitor is most likely to care about.
  const initial = Math.max(0, items.length - 1);
  const [active, setActive] = useState(initial);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* my-auto rather than justify-center on the parent: a centred flex
          child can overflow both ends invisibly, and the panel's scroll
          region would never measure it. */}
      <div className="relative my-auto min-h-0">
        {/* The rail sits in the flow, level with the year nodes. */}
        <div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: "5px",
            background:
              "linear-gradient(90deg, transparent, var(--tint-brand-40) 6%, var(--tint-brand-40) 94%, transparent)",
          }}
          aria-hidden="true"
        />
        <ol
          className="timeline-rail flex gap-2.5 list-none p-0 m-0 w-full flex-1 min-h-0 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none items-start"
          onMouseLeave={() => setActive(initial)}
        >
          {items.map((item, i) => (
            <TimelineEntry
              key={`${item.year}-${item.title}`}
              item={item}
              index={i}
              expanded={active === i}
              onFocus={() => setActive(i)}
              onLeave={() => {}}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
