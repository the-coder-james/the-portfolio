import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { OptimizedImage } from "@/components/common/tsx/OptimizedImage";
import { useRevealed } from "@/hooks/useRevealed";
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
  siteurl: string | boolean;
  "siteurl-reason"?: string;
}

type CardView = "grid" | "list";

interface ProjectCardProps {
  project: Project;
  index: number;
  taglist: Record<string, { name: string }>;
  roles: Record<string, { name: string }>;
  providers: Record<string, { name: string }>;
  baseUrl: string;
  /** Grid shows a tall card; list a compact row. */
  view?: CardView;
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

export function ProjectCard({ project, index, taglist, roles, providers, baseUrl, view = "grid" }: ProjectCardProps) {
  const isList = view === "list";
  const { ref, revealed } = useRevealed<HTMLDivElement>("-60px");
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Pointer devices reveal on hover/focus; touch devices while pressed.
  const showDetail = canHover ? hovered : pressed;
  const accent = ACCENTS[index % ACCENTS.length];
  const roleName = roles[String(project.role)]?.name;
  const providerName = providers[String(project.provider)]?.name;


  return (
    /*
      The card reveals its screenshot on hover. It used to be a plain <div>
      with mouse handlers only, so keyboard users never saw that image — the
      focus handlers below give them the same reveal.
    */
    <motion.div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onPointerDown={(e) => { if (e.pointerType !== "mouse") setPressed(true); }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      tabIndex={0}
      initial={reduced ? false : { opacity: 0, y: 50, scale: 0.95 }}
      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : undefined}
      /* The stagger is capped rather than unbounded: at index * 0.07 the 40th
         card started animating 2.8s after the grid revealed, so scrolling
         straight to the end of the list showed a row of half-faded cards and
         one still fully invisible. Nine steps is enough to read as a cascade
         in the rows actually on screen; past that the delay is flat. */
      transition={{ delay: Math.min(index, 9) * 0.07, type: "spring", visualDuration: 0.7, bounce: 0.2 }}
      className={`rounded-xl overflow-hidden flex ${isList ? "flex-row items-stretch" : "flex-col"}`}
      style={{
        background: "var(--color-card-surface)",
        border: `1px solid ${showDetail ? tint(accent, 55) : "var(--color-card-border)"}`,
        boxShadow: showDetail ? `0 0 30px ${tint(accent, 12)}, 0 12px 32px var(--shadow-black-40)` : "none",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      {/* Window titlebar. The controls are decorative — not buttons, no
          behaviour — so the whole bar is hidden from assistive tech. The list
          row is not dressed as a window, so it has none. */}
      <div
        className={`${isList ? "hidden" : "flex"} items-center gap-2 px-3 py-2 shrink-0`}
        style={{
          background: "var(--color-card-titlebar)",
          borderBottom: "1px solid var(--color-card-border)",
        }}
      >
        <TrafficLights size="sm" />
        <span
          className="font-mono flex-1 text-center truncate"
          style={{ fontSize: "0.62rem", color: "var(--color-ink-dim)" }}
        >
          {project.title.toLowerCase().replace(/ /g, "-")}.ts
        </span>
        <span className="w-[38px] shrink-0" aria-hidden="true" />
      </div>
      {/* The screenshot is the card's face. Detail floats over it on hover
          (pointer) or press (touch) -- see `revealed` below. */}
      <div
        className={`relative overflow-hidden shrink-0 ${isList ? "w-[104px] sm:w-[140px]" : "project-media"}`}
        style={{
          background: "var(--color-surface-code)",
          ...(isList
            ? { borderRight: "1px solid var(--color-card-border)" }
            : { borderBottom: "1px solid var(--color-card-border)" }),
        }}
      >
        <OptimizedImage
          src={project.image.url}
          alt={project.image.alt}
          baseUrl={baseUrl}
          className="w-full h-full object-cover"
          style={{
            transform: showDetail && !reduced ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        <div
          className={`absolute left-0 right-0 pointer-events-none${reduced ? "" : " scan-line"}`}
          aria-hidden="true"
          style={{
            height: "2px",
            top: "-10%",
            background: `linear-gradient(90deg, transparent, ${tint(accent, 25)}, transparent)`,
            zIndex: 2,
          }}
        />

        {/* Floating detail. Hidden from assistive tech: everything in it is
            already in the card body below, which is always present. */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex-col justify-end p-3 overflow-hidden ${isList ? "hidden" : "flex"}`}
          style={{
            zIndex: 3,
            opacity: showDetail ? 1 : 0,
            transition: "opacity 0.28s ease",
            pointerEvents: "none",
            background: `linear-gradient(180deg, var(--scrim-soft) 0%, var(--scrim-strong) 62%)`,
          }}
        >
          <div
            className="rounded-lg p-3 max-h-full overflow-hidden"
            style={{
              background: "var(--glass-bg)",
              border: `1px solid ${tint(accent, 35)}`,
              boxShadow: `var(--glass-shadow)`,
              WebkitBackdropFilter: "blur(14px) saturate(160%)",
              backdropFilter: "blur(14px) saturate(160%)",
              transform: showDetail || reduced ? "translateY(0)" : "translateY(10px)",
              transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <p
              style={{
                fontSize: "0.76rem",
                lineHeight: 1.55,
                color: "var(--color-ink)",
                fontFamily: "'Space Grotesk', sans-serif",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 5,
                overflow: "hidden",
              }}
            >
              {project.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {roleName && (
                <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--color-ink-dim)" }}>
                  role: <span style={{ color: "var(--color-brand-text)" }}>{roleName}</span>
                </span>
              )}
              {providerName && (
                <span className="font-mono" style={{ fontSize: "0.58rem", color: "var(--color-ink-dim)", marginLeft: "8px" }}>
                  via: <span style={{ color: "var(--color-syn-violet)" }}>{providerName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div
          className={`absolute top-3 right-3 ${isList ? "hidden" : "flex"} flex-wrap gap-1 justify-end max-w-[62%]`}
          style={{ zIndex: 4 }}
        >
          {project.tags.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="font-mono rounded-md"
              style={{ fontSize: "0.6rem", color: accent, background: tint(accent, 14), border: `1px solid ${tint(accent, 30)}`, backdropFilter: "blur(6px)" }}
            >
              {taglist[t]?.name || t}
            </Badge>
          ))}
        </div>
      </div>

      <div className={`flex flex-col flex-1 min-w-0 ${isList ? "px-4 py-2.5 gap-1.5" : "p-3 gap-1.5"}`}>
        <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {project.title}
        </h3>

        {isList && (
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--color-ink-dim)",
              lineHeight: 1.55,
              fontFamily: "'Space Grotesk', sans-serif",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {project.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {roleName && (
            <Badge
              variant="outline"
              className="font-mono rounded gap-1"
              style={{ fontSize: "0.6rem", color: "var(--color-brand-text)", background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-18)" }}
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

        <div className={`flex items-center ${isList ? "" : "mt-auto"}`}>
          {typeof project.siteurl !== "string" || !project.siteurl ? (
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
                  color: "var(--color-code-ink-dim)",
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
    </motion.div>
  );
}
