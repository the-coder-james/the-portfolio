import { useEffect, useMemo, useRef, useState } from "react";
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

interface ProjectsGridProps {
  projects: Project[];
  taglist: Record<string, { name: string }>;
  roles: Record<string, { name: string }>;
  providers: Record<string, { name: string }>;
  baseUrl: string;
  initialCount?: number;
  step?: number;
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
  initialCount = 4,
  step = 4,
}: ProjectsGridProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [visible, setVisible] = useState(initialCount);
  const [view, setView] = useState<"grid" | "list">("grid");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => [...projects].sort((a, b) => parseDate(b.date) - parseDate(a.date)),
    [projects],
  );

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

  const tagEntries = Object.entries(taglist);
  const hasFilters = Boolean(activeTag || activeRole || activeProvider);
  const roleEntries = Object.entries(roles);
  const providerEntries = Object.entries(providers);
  const displayed = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const remaining = filtered.length - visible;

  // Extend as the sentinel scrolls into view -- but only once the reader has
  // actually scrolled. The panel is sized so the first row fits exactly, so on
  // a tall screen the sentinel starts in view and would chain-load the whole
  // list before anyone touched the page.
  //
  // When the row fits exactly there is nothing to scroll and the observer can
  // never fire, so the button below is the real affordance; the observer only
  // helps once the grid has grown past the fold.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const root = el.closest<HTMLElement>(".panel-scroll") ?? null;
    if (!root) return;

    let armed = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (armed && entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + step, filtered.length));
        }
      },
      { root, rootMargin: "120px 0px" },
    );

    const arm = () => {
      armed = true;
      io.observe(el);
      root.removeEventListener("scroll", arm);
    };
    root.addEventListener("scroll", arm, { passive: true });

    return () => {
      io.disconnect();
      root.removeEventListener("scroll", arm);
    };
  }, [hasMore, step, filtered.length]);

  const resetVisible = () => setVisible(initialCount);

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
              className="field-interactive w-full pl-9 pr-9 py-2 rounded-lg outline-none"
              style={{
                color: "var(--color-ink-muted)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.8rem",
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

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
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
        // showing {displayed.length} of {filtered.length}
        {filtered.length !== sorted.length && ` (${sorted.length} total)`}
      </div>

      <div className="panel-scroll flex-1 min-h-0 -mr-1 pr-1">
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            background: "var(--color-card-surface)",
            border: "1px solid var(--color-card-border)",
            color: "var(--color-ink-dim)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          <p style={{ fontSize: "0.95rem" }}>No projects match your filters.</p>
          <p className="font-mono mt-1" style={{ fontSize: "0.72rem", color: "var(--color-ink-faint)" }}>
            // try clearing the search or tag
          </p>
        </div>
      ) : (
        <div
          className={
            view === "grid"
              ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
              : "flex flex-col gap-2"
          }
        >
          {displayed.map((project, i) => (
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
          ))}
        </div>
      )}

      {/* The sentinel doubles as the control: it loads on scroll once the grid
          is taller than the panel, and is clickable when it is not. */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-2 shrink-0">
          <button
            type="button"
            onClick={() => setVisible((v) => Math.min(v + step, filtered.length))}
            className="btn-soft inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              color: "var(--color-brand-text)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.78rem",
              fontWeight: 500,
            }}
          >
            Show {Math.min(step, remaining)} more
            <span className="font-mono" style={{ fontSize: "0.66rem", color: "var(--color-ink-faint)" }}>
              +{remaining}
            </span>
          </button>
        </div>
      )}
      </div>
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
    <label className="relative flex items-center min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">Filter by {label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="filter-select font-mono appearance-none rounded-lg pl-2.5 pr-6 py-1.5 outline-none cursor-pointer min-w-0 w-full sm:w-auto truncate"
        data-active={active ? "true" : undefined}
        style={{ fontSize: "0.72rem" }}
      >
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
