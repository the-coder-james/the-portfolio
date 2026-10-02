import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProjectImage {
  url: string;
  alt: string;
}

interface Project {
  title: string;
  date: string;
  tags: string[];
  role: number;
  tech: number;
  provider: number;
  image: ProjectImage;
  description: string;
  siteurl: string | boolean;
  "siteurl-reason"?: string;
}

/** Cards per batch on mobile, where the page itself is the scroller. */
const MOBILE_PAGE = 8;

interface ProjectsGridProps {
  projects: Project[];
  taglist: Record<string, { name: string }>;
  roles: Record<string, { name: string }>;
  providers: Record<string, { name: string }>;
  baseUrl: string;
}

function parseDate(d: string): number {
  const [y, m, day] = d.split(".").map((n) => parseInt(n, 10));
  return new Date(y || 0, (m || 1) - 1, day || 1).getTime();
}

export function ProjectsGrid({
  projects,
  taglist,
  roles,
  providers,
  baseUrl,
}: ProjectsGridProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const sorted = useMemo(
    () => [...projects].sort((a, b) => parseDate(b.date) - parseDate(a.date)),
    [projects],
  );

  // Mobile is one scrolling page, so the grid is not in a scroll container of
  // its own: all 40 cards would stack into a single column ~18000px tall. There
  // the list pages in batches instead. On desktop the grid scrolls inside the
  // panel and everything renders, which is what the scroll hint points at.
  const [scrollMode, setScrollMode] = useState(false);
  const [shown, setShown] = useState(MOBILE_PAGE);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setScrollMode(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (activeRole && String(p.role) !== activeRole) return false;
      if (activeProvider && String(p.provider) !== activeProvider) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [sorted, query, activeTag, activeRole, activeProvider]);

  // A filter that narrows the list must not leave a stale offset behind, or the
  // count reads "showing 8 of 40" over three results.
  useEffect(() => { setShown(MOBILE_PAGE); }, [filtered]);

  // Desktop renders everything and lets the panel scroll; mobile pages.
  // The rail holds every card in one track -- it is swiped, not scrolled past --
  // so paging only applies to the mobile list view, where cards still stack.
  const paged = scrollMode && view === "list";

  // The rail's affordances retire once the reader has actually swiped -- an
  // edge fade and a "swipe" label that stay put after the gesture is understood
  // are just noise over the cards.
  const railRef = useRef<HTMLDivElement>(null);
  const [railScrolled, setRailScrolled] = useState(false);

  useEffect(() => {
    setRailScrolled(false);
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollLeft > 12) setRailScrolled(true);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollMode, view, filtered]);
  const visible = paged ? filtered.slice(0, shown) : filtered;

  const tagEntries = Object.entries(taglist);
  const hasFilters = Boolean(activeTag || activeRole || activeProvider);
  const roleEntries = Object.entries(roles);
  const providerEntries = Object.entries(providers);

  const resetVisible = () => {};  // kept so the filter handlers read the same

  return (
    <TooltipProvider delayDuration={200}>
      {/* Controls stay pinned; only the grid below them scrolls, so the panel
          holds one viewport no matter how many projects are shown. */}
      <div className="shrink-0 flex flex-col gap-2 mb-3">
        {/* One row: search, the three filters as selects, and the view toggle.
            Three wrapping chip rows cost four lines of the panel and grew with
            the data; selects stay one line however many tags exist. */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-ink-dim)" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetVisible();
              }}
              placeholder="search projects..."
              aria-label="Search projects by title"
              className="field-interactive projects-search w-full pl-9 pr-9 rounded-lg outline-none"
              style={{
                color: "var(--color-ink-muted)",
                fontFamily: "var(--font-mono)",
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="clear search"
                onClick={() => {
                  setQuery("");
                  resetVisible();
                }}
                className="icon-btn absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* md:, not sm: -- Tailwind's sm is min-width:640px, which is exactly the
            width scroll mode still treats as mobile, so at 640 the row went
            no-wrap while the page was still phone-width and pushed 34px past
            the edge. */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:shrink-0">
            <FilterSelect
              label="tag"
              value={activeTag}
              options={tagEntries}
              onChange={(v) => { setActiveTag(v); resetVisible(); }}
            />
            <FilterSelect
              label="role"
              value={activeRole}
              options={roleEntries}
              onChange={(v) => { setActiveRole(v); resetVisible(); }}
            />
            <FilterSelect
              label="via"
              value={activeProvider}
              options={providerEntries}
              onChange={(v) => { setActiveProvider(v); resetVisible(); }}
            />

            {/* View toggle */}
            <div
              role="group"
              aria-label="Layout"
              className="flex items-center rounded-lg p-0.5 shrink-0"
              style={{ background: "var(--tint-white-04)", border: "1px solid var(--tint-white-08)" }}
            >
              {([
                { id: "grid" as const, Icon: LayoutGrid, label: "Grid view" },
                { id: "list" as const, Icon: List, label: "List view" },
              ]).map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  aria-pressed={view === id}
                  aria-label={label}
                  title={label}
                  className="view-toggle-btn w-7 h-7 rounded-md grid place-items-center transition-colors"
                >
                  <Icon size={14} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono" style={{ fontSize: "0.68rem", color: "var(--color-ink-faint)" }}>
              // filtered by
            </span>
            {activeTag && (
              <ActiveFilter label={taglist[activeTag]?.name} onClear={() => { setActiveTag(null); resetVisible(); }} />
            )}
            {activeRole && (
              <ActiveFilter label={roles[activeRole]?.name} onClear={() => { setActiveRole(null); resetVisible(); }} />
            )}
            {activeProvider && (
              <ActiveFilter label={providers[activeProvider]?.name} onClear={() => { setActiveProvider(null); resetVisible(); }} />
            )}
            <button
              type="button"
              onClick={() => {
                setActiveTag(null); setActiveRole(null); setActiveProvider(null); resetVisible();
              }}
              className="icon-btn font-mono underline underline-offset-2"
              style={{ fontSize: "0.68rem" }}
            >
              clear all
            </button>
          </div>
        )}
      </div>

      <div
        className="font-mono mb-3 shrink-0"
        role="status"
        aria-live="polite"
        style={{ fontSize: "0.72rem", color: "var(--color-ink-dim)" }}
      >
        {/* Against the filtered total, not the catalogue: with a filter applied
            "8 of 40" describes neither what is on screen nor what matched. */}
        // showing {visible.length} of {filtered.length}
        {filtered.length !== sorted.length && ` (filtered from ${sorted.length})`}
      </div>

      <div className="panel-scroll flex-1 min-h-0 -mr-1 pr-1">
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            background: "var(--color-card-surface)",
            border: "1px solid var(--color-card-border)",
            color: "var(--color-ink-dim)",
          }}
        >
          <p style={{ fontSize: "0.95rem" }}>No projects match your filters.</p>
          <p className="font-mono mt-1" style={{ fontSize: "0.72rem", color: "var(--color-ink-faint)" }}>
            // try clearing the search or tag
          </p>
        </div>
      ) : (
        (() => {
          // Mobile grid view is a horizontal snap rail: 40 cards stacked one
          // per row made the section the longest scroll on the page, and a
          // phone-width card is already full-bleed, so a vertical list gained
          // nothing a swipe does not. List view stays a list -- that is what
          // the toggle is for.
          const isRail = scrollMode && view === "grid";
          const cards = visible.map((project, i) => (
            <ProjectCard
              key={`${project.title}-${project.date}`}
              project={project}
              index={i}
              view={view}
              taglist={taglist}
              roles={roles}
              providers={providers}
              baseUrl={baseUrl}
            />
          ));

          if (!isRail) {
            return (
              <div
                className={
                  view === "grid"
                    ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
                    : "flex flex-col gap-2"
                }
              >
                {cards}
              </div>
            );
          }

          return (
            <>
              <div
                className="projects-rail-wrap"
                data-scrolled={railScrolled ? "true" : undefined}
              >
                <div className="projects-rail" ref={railRef}>{cards}</div>
              </div>
              <p
                className="projects-rail-hint"
                data-scrolled={railScrolled ? "true" : undefined}
                aria-hidden="true"
              >
                swipe for more
                <span className="projects-rail-hint-arrow">→</span>
              </p>
            </>
          );
        })()
      )}

      {/* The sentinel doubles as the control: it loads on scroll once the grid
          is taller than the panel, and is clickable when it is not. */}
      </div>

      {!scrollMode && filtered.length > 4 && (
        <span className="scroll-hint" aria-hidden="true">
          scroll for more
          <span className="scroll-hint-arrow">↓</span>
        </span>
      )}

      {paged && shown < filtered.length && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => setShown((n) => n + MOBILE_PAGE)}
            className="flow-link"
          >
            <span>Show more</span>
            <span className="font-mono" style={{ fontSize: "0.72rem", opacity: 0.75 }}>
              {filtered.length - shown} left
            </span>
          </button>
        </div>
      )}
    </TooltipProvider>
  );
}

/**
 * A filter as a native <select>. Chips read nicely at three or four options but
 * this list grows with the data -- the tag row alone was already seven wide and
 * wrapping. A select is one line regardless, and gets keyboard handling, type
 * ahead and the platform's own picker on touch for free.
 */
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: [string, { name: string }][];
  onChange: (v: string | null) => void;
}) {
  const active = value !== null;
  return (
    /* Not flex-1: three equal shares of a phone row left each select ~90px, so
       every label truncated to "tag: a...". They size to their own content now
       and wrap instead, which is what flex-wrap on the row is for. */
    <label className="filter-field relative flex items-center min-w-0">
      <span className="sr-only">Filter by {label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="filter-select font-mono appearance-none rounded-lg outline-none cursor-pointer min-w-0 w-full"
        data-active={active ? "true" : undefined}
      >
        {/* The closed select shows the selected option's text, so the label has
            to live in it. Inside the open list it is the same word on every row
            -- dropped there, which is what buys the room to show the value. */}
        <option value="">{label}: all</option>
        {options.map(([id, o]) => (
          <option key={id} value={id}>
            {label}: {o.name}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 text-[0.55rem]"
        style={{ color: active ? "var(--color-brand-text)" : "var(--color-ink-dim)" }}
      >
        ▼
      </span>
    </label>
  );
}

/** A applied filter, shown so the active state is visible without opening a select. */
function ActiveFilter({ label, onClear }: { label?: string; onClear: () => void }) {
  if (!label) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      className="filter-chip font-mono rounded-full inline-flex items-center gap-1 px-2.5 py-1"
      aria-pressed="true"
      style={{ fontSize: "0.68rem" }}
    >
      {label}
      <X size={11} aria-hidden="true" />
      <span className="sr-only">remove filter</span>
    </button>
  );
}
