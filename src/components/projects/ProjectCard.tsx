import { useEffect, useRef, useState } from "react";
import { inView } from "motion";
import { animateEl } from "@/lib/utils";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrafficLights } from "@/components/common/tsx/TerminalShell";

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
  siteurl: string | false;
  "siteurl-reason"?: string;
}

interface ProjectCardProps {
  project: Project;
  index: number;
  taglist: Record<string, { name: string }>;
  roles: Record<string, { name: string }>;
  providers: Record<string, { name: string }>;
  baseUrl: string;
}

const ACCENTS = [
  "var(--color-brand)",
  "var(--color-accent-2)",
  "var(--color-accent-3)",
  "var(--color-accent-4)",
  "var(--color-accent-5)",
  "var(--color-brand-400)",
];

/**
 * Translucent variant of an accent token. The accents used to be raw hex, so
 * alpha was applied by string-concatenating a hex suffix. That trick doesn't
 * work on `var(...)`, so mix toward transparent instead.
 * `pct` is the opacity percentage, matching the old two-digit hex alpha.
 */
const tint = (accent: string, pct: number) =>
  `color-mix(in srgb, ${accent} ${pct}%, transparent)`;

const CODE_PREVIEWS = [
  [
    { num: 1, code: <><span style={{color:"var(--color-syn-keyword)"}}>export</span> <span style={{color:"var(--color-brand-400)"}}>function</span> <span style={{color:"var(--color-syn-fn)"}}>Page</span>() {"{"}</> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-syn-keyword)"}}>return</span> &lt;<span style={{color:"var(--color-brand-400)"}}>main</span>&gt;</> },
    { num: 3, code: <>&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span style={{color:"var(--color-syn-string)"}}>Hero</span> /&gt;</> },
    { num: 4, code: <>&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span style={{color:"var(--color-syn-string)"}}>Content</span> /&gt;</> },
    { num: 5, code: <>&nbsp;&nbsp;&lt;/<span style={{color:"var(--color-brand-400)"}}>main</span>&gt;</> },
  ],
  [
    { num: 1, code: <><span style={{color:"var(--color-syn-keyword)"}}>const</span> query = <span style={{color:"var(--color-syn-string)"}}>`</span></> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-syn-fn)"}}>SELECT</span> * <span style={{color:"var(--color-syn-fn)"}}>FROM</span> products</> },
    { num: 3, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-syn-fn)"}}>WHERE</span> active = <span style={{color:"var(--color-syn-number)"}}>true</span></> },
    { num: 4, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-syn-fn)"}}>ORDER BY</span> date <span style={{color:"var(--color-syn-fn)"}}>DESC</span></> },
    { num: 5, code: <><span style={{color:"var(--color-syn-string)"}}>`</span>;</> },
  ],
  [
    { num: 1, code: <><span style={{color:"var(--color-syn-keyword)"}}>function</span> <span style={{color:"var(--color-syn-fn)"}}>init</span>() {"{"}</> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-ink-dim)"}}>// Bootstrap app</span></> },
    { num: 3, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-brand-400)"}}>app</span>.<span style={{color:"var(--color-syn-fn)"}}>use</span>(middleware);</> },
    { num: 4, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-brand-400)"}}>app</span>.<span style={{color:"var(--color-syn-fn)"}}>listen</span>(<span style={{color:"var(--color-syn-number)"}}>3000</span>);</> },
    { num: 5, code: <>{"}"}</> },
  ],
  [
    { num: 1, code: <><span style={{color:"var(--color-syn-keyword)"}}>class</span> <span style={{color:"var(--color-brand-400)"}}>Controller</span> {"{"}</> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-syn-fn)"}}>index</span>() {"{"}</> },
    { num: 3, code: <>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:"var(--color-syn-keyword)"}}>return</span> view(<span style={{color:"var(--color-syn-string)"}}>'home'</span>);</> },
    { num: 4, code: <>&nbsp;&nbsp;{"}"}</> },
    { num: 5, code: <>{"}"}</> },
  ],
  [
    { num: 1, code: <><span style={{color:"var(--color-syn-keyword)"}}>import</span> <span style={{color:"var(--color-ink-muted)"}}>WordPress</span> <span style={{color:"var(--color-syn-keyword)"}}>from</span> <span style={{color:"var(--color-syn-string)"}}>'@/cms'</span>;</> },
    { num: 2, code: <></> },
    { num: 3, code: <><span style={{color:"var(--color-syn-keyword)"}}>const</span> posts = <span style={{color:"var(--color-syn-keyword)"}}>await</span></> },
    { num: 4, code: <>&nbsp;&nbsp;WordPress.<span style={{color:"var(--color-syn-fn)"}}>getPosts</span>();</> },
    { num: 5, code: <><span style={{color:"var(--color-syn-keyword)"}}>return</span> {"{"} posts {"}"};</> },
  ],
  [
    { num: 1, code: <><span style={{color:"var(--color-syn-keyword)"}}>const</span> router = <span style={{color:"var(--color-syn-fn)"}}>createRouter</span>();</> },
    { num: 2, code: <></> },
    { num: 3, code: <><span style={{color:"var(--color-brand-400)"}}>router</span>.<span style={{color:"var(--color-syn-fn)"}}>get</span>(<span style={{color:"var(--color-syn-string)"}}>'/api'</span>,</> },
    { num: 4, code: <>&nbsp;&nbsp;<span style={{color:"var(--color-syn-keyword)"}}>async</span> (req, res) =&gt; {"{"}</> },
    { num: 5, code: <>&nbsp;&nbsp;&nbsp;&nbsp;res.<span style={{color:"var(--color-syn-fn)"}}>json</span>(data);</> },
  ],
];

export function ProjectCard({ project, index, taglist, roles, providers, baseUrl }: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const accent = ACCENTS[index % ACCENTS.length];
  const lines = CODE_PREVIEWS[index % CODE_PREVIEWS.length];
  const imageSrc = `${baseUrl}${project.image.url}`;
  const roleName = roles[String(project.role)]?.name;
  const providerName = providers[String(project.provider)]?.name;

  useEffect(() => {
    const el = ref.current;
    const scan = scanRef.current;
    if (!el) return;

    inView(el, () => {
      animateEl(
        el as Element,
        { opacity: [0, 1], y: [50, 0], rotateX: [10, 0], scale: [0.95, 1] },
        { delay: index * 0.07, type: "spring", visualDuration: 0.7, bounce: 0.2 }
      );
    }, { margin: "-60px" });

    // Scan line: CSS animation — cleaner than a JS loop
    if (scan) {
      scan.style.animation = "scanLine 2.2s linear infinite";
    }
  }, [index]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--color-surface-code)",
        border: `1px solid ${hovered ? tint(accent, 31) : "var(--tint-white-07)"}`,
        boxShadow: hovered ? `0 0 30px ${tint(accent, 8)}` : "none",
        transition: "all 0.3s ease",
        opacity: 0,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      <div
        className="p-5 relative overflow-hidden"
        style={{ background: "var(--color-surface-base)", borderBottom: "1px solid var(--tint-white-05)", minHeight: "180px" }}
      >
        <div
          ref={scanRef}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: "2px",
            top: "-10%",
            background: `linear-gradient(90deg, transparent, ${tint(accent, 25)}, transparent)`,
            zIndex: 2,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 1, opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }}
        >
          <img
            src={imageSrc}
            alt={project.image.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, var(--scrim-soft) 0%, var(--scrim-strong) 100%)` }}
          />
        </div>
        <div className="relative flex items-center gap-1.5 mb-4" style={{ zIndex: 3 }}>
          <TrafficLights size="sm" />
          <span className="ml-2 font-mono" style={{ fontSize: "0.62rem", color: "var(--color-ink-faint)" }}>
            {project.title.toLowerCase().replace(/ /g, "-")}.ts
          </span>
        </div>
        <div className="font-mono flex gap-3" style={{ fontSize: "0.72rem" }}>
          <div className="flex flex-col" style={{ color: "var(--color-chrome-line)", minWidth: "16px", textAlign: "right" }}>
            {lines.map((l) => <span key={l.num} style={{ lineHeight: 1.7 }}>{l.num}</span>)}
          </div>
          <div className="flex-1 overflow-hidden">
            {lines.map((l, i) => <div key={i} style={{ lineHeight: 1.7, color: "var(--color-ink-muted)", whiteSpace: "nowrap" }}>{l.code}</div>)}
          </div>
        </div>
        <div
          className="absolute top-4 right-4 flex flex-wrap gap-1 justify-end max-w-[60%]"
          style={{ zIndex: 3 }}
        >
          {project.tags.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="font-mono rounded-md"
              style={{ fontSize: "0.6rem", color: accent, background: tint(accent, 9), border: `1px solid ${tint(accent, 19)}` }}
            >
              {taglist[t]?.name || t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}>
          {project.title}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {roleName && (
            <Badge
              variant="outline"
              className="font-mono rounded gap-1"
              style={{ fontSize: "0.6rem", color: "var(--color-brand-300)", background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-18)" }}
            >
              <span style={{ color: "var(--color-ink-dim)" }}>role:</span> {roleName}
            </Badge>
          )}
          {providerName && (
            <Badge
              variant="outline"
              className="font-mono rounded gap-1"
              style={{ fontSize: "0.6rem", color: "var(--color-syn-violet)", background: "var(--tint-violet-07)", border: "1px solid var(--tint-violet-20)" }}
            >
              <span style={{ color: "var(--color-ink-dim)" }}>via:</span> {providerName}
            </Badge>
          )}
        </div>

        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--color-ink-dim)",
                lineHeight: 1.7,
                fontFamily: "'Space Grotesk', sans-serif",
                marginBottom: "16px",
                flex: 1,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 3,
                overflow: "hidden",
                cursor: "help",
              }}
            >
              {project.description}
            </p>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="max-w-sm font-[Space_Grotesk] leading-relaxed"
            style={{
              background: "var(--color-surface-code)",
              border: `1px solid ${tint(accent, 25)}`,
              color: "var(--color-ink-muted)",
              fontSize: "0.8rem",
              padding: "10px 12px",
              boxShadow: `0 8px 24px var(--shadow-black-50), 0 0 20px ${tint(accent, 8)}`,
            }}
          >
            {project.description}
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center">
          {project.siteurl === false ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <span
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-default select-none"
                  style={{
                    fontSize: "0.8rem",
                    fontFamily: "'Space Grotesk'",
                    background: "var(--tint-white-02)",
                    border: "1px solid var(--tint-white-05)",
                    color: "var(--color-ink-faint)",
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Not Available</span>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="end"
                className="max-w-xs font-[Space_Grotesk] leading-relaxed"
                style={{
                  background: "var(--color-surface-code)",
                  border: `1px solid ${tint(accent, 25)}`,
                  color: "var(--color-ink-dim)",
                  fontSize: "0.78rem",
                  padding: "8px 12px",
                  boxShadow: `0 8px 24px var(--shadow-black-50), 0 0 20px ${tint(accent, 8)}`,
                }}
              >
                {project["siteurl-reason"] ?? "No live URL available."}
              </TooltipContent>
            </Tooltip>
          ) : (
            <a
              href={project.siteurl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto group inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300"
              style={{
                fontSize: "0.8rem",
                fontFamily: "'Space Grotesk'",
                background: hovered ? tint(accent, 13) : "var(--tint-white-04)",
                border: `1px solid ${hovered ? tint(accent, 25) : "var(--tint-white-07)"}`,
                color: hovered ? accent : "var(--color-ink-dim)",
                textDecoration: "none",
              }}
            >
              <ExternalLink size={14} />
              <span>Live Site</span>
              <ArrowUpRight
                size={14}
                style={{
                  transition: "transform 0.3s ease",
                  transform: hovered ? "translate(2px, -2px)" : "none",
                }}
              />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
