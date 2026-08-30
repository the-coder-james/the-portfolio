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
 * Wraps the timeline in a single island. Each entry used to be its own
 * `client:load` root with its own observer; this mounts one React tree.
 *
 * Rendered as an ordered list because the entries are a chronological
 * sequence — previously a flat stack of divs with no list semantics.
 */
export function TimelineList({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="space-y-10 list-none p-0 m-0">
      {items.map((item, i) => (
        <TimelineEntry key={`${item.year}-${item.title}`} item={item} index={i} />
      ))}
    </ol>
  );
}
