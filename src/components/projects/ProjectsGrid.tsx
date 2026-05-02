import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, X } from "lucide-react";
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
  siteurl: string;
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
  initialCount = 6,
  step = 6,
}: ProjectsGridProps) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [visible, setVisible] = useState(initialCount);

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
  const roleEntries = Object.entries(roles);
  const providerEntries = Object.entries(providers);
  const displayed = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const remaining = filtered.length - visible;

  const resetVisible = () => setVisible(initialCount);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mb-10 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#475569" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetVisible();
            }}
            placeholder="search projects..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl outline-none transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)";
              e.currentTarget.style.background = "rgba(59,130,246,0.05)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
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
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={{ color: "#475569" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#93c5fd")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#475569")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="all"
            active={activeTag === null}
            onClick={() => {
              setActiveTag(null);
              resetVisible();
            }}
          />
          {tagEntries.map(([id, tag]) => (
            <FilterChip
              key={id}
              label={tag.name}
              active={activeTag === id}
              onClick={() => {
                setActiveTag(activeTag === id ? null : id);
                resetVisible();
              }}
            />
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <FilterRow label="role">
          <FilterChip
            label="all"
            active={activeRole === null}
            onClick={() => {
              setActiveRole(null);
              resetVisible();
            }}
          />
          {roleEntries.map(([id, role]) => (
            <FilterChip
              key={id}
              label={role.name}
              active={activeRole === id}
              onClick={() => {
                setActiveRole(activeRole === id ? null : id);
                resetVisible();
              }}
            />
          ))}
        </FilterRow>

        <FilterRow label="via">
          <FilterChip
            label="all"
            active={activeProvider === null}
            onClick={() => {
              setActiveProvider(null);
              resetVisible();
            }}
          />
          {providerEntries.map(([id, provider]) => (
            <FilterChip
              key={id}
              label={provider.name}
              active={activeProvider === id}
              onClick={() => {
                setActiveProvider(activeProvider === id ? null : id);
                resetVisible();
              }}
            />
          ))}
        </FilterRow>
      </div>

      <div
        className="font-mono mb-6"
        style={{ fontSize: "0.72rem", color: "#475569" }}
      >
        // showing {displayed.length} of {filtered.length}
        {filtered.length !== sorted.length && ` (${sorted.length} total)`}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#475569",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          <p style={{ fontSize: "0.95rem" }}>No projects match your filters.</p>
          <p className="font-mono mt-1" style={{ fontSize: "0.72rem", color: "#334155" }}>
            // try clearing the search or tag
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((project, i) => (
            <ProjectCard
              key={`${project.title}-${project.date}`}
              project={project}
              index={i}
              taglist={taglist}
              roles={roles}
              providers={providers}
              baseUrl={baseUrl}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-12">
          <button
            type="button"
            onClick={() => setVisible((v) => Math.min(v + step, filtered.length))}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 active:scale-95 hover:scale-[1.03]"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.25)",
              color: "#93c5fd",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(59,130,246,0.15)";
              el.style.borderColor = "rgba(59,130,246,0.45)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "rgba(59,130,246,0.08)";
              el.style.borderColor = "rgba(59,130,246,0.25)";
            }}
          >
            <Plus size={16} />
            See more
            <span
              className="font-mono"
              style={{ fontSize: "0.7rem", color: "#60a5fa", marginLeft: "4px" }}
            >
              +{Math.min(step, remaining)}
            </span>
          </button>
        </div>
      )}
    </TooltipProvider>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="font-mono"
        style={{
          fontSize: "0.7rem",
          color: "#475569",
          minWidth: "42px",
        }}
      >
        // {label}
      </span>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono rounded-xl transition-colors"
      style={{
        padding: "8px 14px",
        fontSize: "0.75rem",
        background: active ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)"}`,
        color: active ? "#93c5fd" : "#64748b",
      }}
      onMouseEnter={(e) => {
        if (active) return;
        const el = e.currentTarget as HTMLElement;
        el.style.color = "#93c5fd";
        el.style.borderColor = "rgba(59,130,246,0.3)";
      }}
      onMouseLeave={(e) => {
        if (active) return;
        const el = e.currentTarget as HTMLElement;
        el.style.color = "#64748b";
        el.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {label}
    </button>
  );
}
