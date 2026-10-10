import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type PointerEvent as ReactPointerEvent, type SyntheticEvent } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { OptimizedImage } from "@/components/common/tsx/OptimizedImage";
import { useRevealed } from "@/hooks/useRevealed";
import { ExternalLink, ArrowUpRight, Hand, Info } from "lucide-react";
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
  /**
   * Play the card's own scroll reveal. Off in the PC slide deck, where the
   * deck scales each card in and out itself and two entrances would fight.
   */
  reveal?: boolean;
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

/**
 * Opaque variant: the accent printed onto the card sheet. For anything that
 * sits over the screenshot, where a translucent tint needed a backdrop blur to
 * stay legible and a printed sheet has no such thing.
 */
const sheetTint = (accent: string, pct: number) =>
  `color-mix(in srgb, ${accent} ${pct}%, var(--color-card-surface))`;

/** How long a finger rests on a card before its description opens. */
const HOLD_MS = 450;
/** How far it may drift in that time -- further is a scroll or a swipe. */
const HOLD_SLOP = 10;

export function ProjectCard({ project, index, taglist, roles, providers, baseUrl, view = "grid", reveal = true }: ProjectCardProps) {
  const isList = view === "list";
  const { ref, revealed } = useRevealed<HTMLDivElement>("-60px");
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // ── The description popup ──
  // The full description, with the role and via line, in a tooltip over the
  // card. It used to float inside the screenshot, clamped to whatever lines
  // the screenshot had room for -- often one, or none. A pointer opens it by
  // hovering (Radix, after a short delay) and the keyboard by focusing the
  // card; a finger by resting on the card (`held`), since touch has no hover.
  const [tipOpen, setTipOpen] = useState(false);
  const [held, setHeld] = useState(false);
  // While the pointer or focus is on the "No public link" button its own
  // tooltip is the one showing. The button is inside the card, so its pointer
  // and focus events also reach the card's trigger, which would open the
  // description on top -- and Radix keeps one tooltip open at a time, so the
  // description won by closing the reason. The card's trigger ignores events
  // from inside the button (marking them default-prevented, which Radix
  // honours), and the description stays shut while the button is engaged.
  // Not stopPropagation: that also hid the moves from Radix's document-level
  // tracking, which is what closes a tooltip whose trigger was left.
  const [onInnerTip, setOnInnerTip] = useState(false);
  const fromInnerTip = (e: SyntheticEvent) =>
    !!(e.target as Element).closest?.("button[data-slot='tooltip-trigger']");
  const cardTriggerProps = {
    onPointerMove: (e: ReactPointerEvent) => {
      if (fromInnerTip(e)) e.preventDefault();
    },
    onFocus: (e: FocusEvent) => {
      if (fromInnerTip(e)) e.preventDefault();
    },
  };
  const tipRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | undefined>(undefined);
  const holdFrom = useRef<{ x: number; y: number } | null>(null);
  // A hold must not end in the click (or context menu) its release can fire.
  const swallowClick = useRef(false);

  const cancelHold = () => {
    window.clearTimeout(holdTimer.current);
    holdFrom.current = null;
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    swallowClick.current = false;
    if (e.pointerType === "mouse" || (e.target as Element).closest("a, button")) return;
    holdFrom.current = { x: e.clientX, y: e.clientY };
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      holdFrom.current = null;
      swallowClick.current = true;
      setHeld(true);
    }, HOLD_MS);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const from = holdFrom.current;
    if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) > HOLD_SLOP) cancelHold();
  };
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  // A held popup stays up once the finger lifts, so it can be read, and closes
  // on the next tap anywhere outside it, on a scroll, or on Escape. Radix's
  // own close requests (a touch pointer "leaving" as it lifts) only end the
  // hover-opened state, never this one.
  useEffect(() => {
    if (!held) return;
    const close = (e: Event) => {
      if (e.type === "pointerdown" && tipRef.current?.contains(e.target as Node)) return;
      setHeld(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHeld(false);
    };
    document.addEventListener("pointerdown", close, true);
    window.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close, true);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [held]);

  const tipShown = held || (tipOpen && !onInnerTip);
  const innerTipProps = {
    onPointerEnter: () => setOnInnerTip(true),
    onPointerLeave: () => setOnInnerTip(false),
    onFocus: () => setOnInnerTip(true),
    onBlur: () => setOnInnerTip(false),
  };

  // Pointer devices lift the card on hover/focus; touch devices while held.
  const showDetail = canHover ? hovered : held;
  const accent = ACCENTS[index % ACCENTS.length];
  const roleName = roles[String(project.role)]?.name;
  const providerName = providers[String(project.provider)]?.name;


  return (
    <Tooltip open={tipShown} onOpenChange={setTipOpen} delayDuration={350}>
    <TooltipTrigger asChild {...cardTriggerProps}>
    {/*
      The card lifts on hover. It used to be a plain <div> with mouse handlers
      only, so keyboard users never saw that -- the focus handlers give them
      the same, and focus opens the description too.
    */}
    <motion.div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onContextMenu={(e) => {
        if (held || swallowClick.current) e.preventDefault();
      }}
      onClick={(e) => {
        // preventDefault also keeps Radix from treating the release as a
        // click that closes the tooltip.
        if (swallowClick.current) {
          swallowClick.current = false;
          e.preventDefault();
        }
      }}
      tabIndex={0}
      /* `initial` never branches on reduced motion (see SectionHeading):
         reduced motion keeps the targets and drops the duration, and
         `data-reveal` lets the CSS guarantee the card ends up visible. */
      data-reveal={reveal ? "" : undefined}
      initial={reveal ? { opacity: 0, y: 50, scale: 0.95 } : false}
      animate={reveal && revealed ? { opacity: 1, y: 0, scale: 1 } : undefined}
      /* The stagger is capped rather than unbounded: at index * 0.07 the 40th
         card started animating 2.8s after the grid revealed, so scrolling
         straight to the end of the list showed a row of half-faded cards and
         one still fully invisible. Nine steps is enough to read as a cascade
         in the rows actually on screen; past that the delay is flat. */
      transition={reduced ? { duration: 0 } : { delay: Math.min(index, 9) * 0.07, type: "spring", visualDuration: 0.7, bounce: 0.2 }}
      className={`project-card rounded-xl overflow-hidden flex ${isList ? "flex-row items-stretch" : "flex-col"}`}
      style={{
        background: "var(--color-card-surface)",
        // The edge strengthens on hover, as on every other sheet. It used to
        // swap to a 55% accent tint, which thinned it to ~2.3:1.
        border: `1px solid ${showDetail ? "var(--color-card-border-strong)" : "var(--color-card-border)"}`,
        boxShadow: showDetail ? "var(--shadow-print)" : "none",
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
          // The card's accent, printed as a rule across the top on hover.
          boxShadow: showDetail ? `inset 0 2px 0 ${accent}` : "none",
          transition: "box-shadow 0.3s ease",
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
      {/* The screenshot is the card's face; its description opens over the
          card as a popup (below). */}
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
          className={`absolute top-3 right-3 ${isList ? "hidden" : "flex"} flex-wrap gap-1 justify-end max-w-[62%]`}
          style={{ zIndex: 4 }}
        >
          {project.tags.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="font-mono rounded-md"
              style={{ fontSize: "0.6rem", color: accent, background: sheetTint(accent, 14), border: `1px solid ${tint(accent, 30)}` }}
            >
              {taglist[t]?.name || t}
            </Badge>
          ))}
        </div>
      </div>

      <div className={`flex flex-col flex-1 min-w-0 ${isList ? "px-4 py-2.5 gap-1.5" : "p-3 gap-1.5"}`}>
        <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--color-ink)" }}>
          {project.title}
        </h3>

        {/* The grid card prints no description of its own; this is it for
            screen readers, who cannot hover or hold. */}
        {!isList && <p className="sr-only">{project.description}</p>}

        {isList && (
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--color-ink-dim)",
              lineHeight: 1.55,
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

        <div className={`flex items-center gap-2 ${isList ? "" : "mt-auto"}`}>
          {/* Touch screens only: there is no hover there to discover the
              description by. */}
          <span className="project-hold-hint" aria-hidden="true">
            <Hand size={12} />
            Tap and hold to see description
          </span>
          {typeof project.siteurl !== "string" || !project.siteurl ? (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild {...innerTipProps}>
                {/* A button, so keyboard and touch users can reach the reason:
                    Radix opens the tooltip on focus. It does nothing on its
                    own and does not pretend to be a link -- a dashed ink stamp
                    with no external-link icon, where "Live Site" is a solid
                    sheet. */}
                <button
                  type="button"
                  className="ml-auto shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-2 rounded-[10px] cursor-help"
                  style={{
                    fontSize: "0.8rem",
                    background: "transparent",
                    border: "1px dashed var(--color-card-border)",
                    color: "var(--color-ink-faint)",
                  }}
                >
                  <Info size={14} aria-hidden="true" />
                  <span>No public link</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="end"
                className="max-w-xs leading-relaxed"
                style={{
                  // The arrow reads --tooltip-bg (ui/tooltip.tsx), so it is
                  // the same colour as the body instead of the default ink.
                  "--tooltip-bg": "var(--color-surface-code)",
                  background: "var(--tooltip-bg)",
                  border: `1px solid ${tint(accent, 25)}`,
                  color: "var(--color-code-ink-dim)",
                  fontSize: "0.78rem",
                  padding: "8px 12px",
                  boxShadow: "var(--shadow-print-sm)",
                } as CSSProperties}
              >
                {project["siteurl-reason"] ?? "No live URL available."}
              </TooltipContent>
            </Tooltip>
          ) : (
            <a
              href={project.siteurl}
              target="_blank"
              rel="noopener noreferrer"
              // The secondary button primitive; while the card is hovered its
              // label picks up the card's accent (every accent clears 4.5:1 on
              // the sheet).
              className="btn-sheet ml-auto shrink-0 whitespace-nowrap group px-3 py-2 text-[0.8rem]"
              style={{ color: hovered ? accent : undefined }}
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
    </TooltipTrigger>
    <TooltipContent
      ref={tipRef}
      side="top"
      align="center"
      sideOffset={8}
      collisionPadding={12}
      className="project-tip"
      style={{
        // The arrow reads --tooltip-bg (ui/tooltip.tsx), so it is the same
        // sheet as the body.
        "--tooltip-bg": "var(--color-card-surface)",
        background: "var(--tooltip-bg)",
        border: `1px solid ${tint(accent, 45)}`,
        boxShadow: "var(--shadow-print)",
      } as CSSProperties}
    >
      <p className="project-tip-title">{project.title}</p>
      <p className="project-tip-desc">{project.description}</p>
      <p className="project-tip-meta font-mono">
        {roleName && (
          <span>
            role: <span style={{ color: "var(--color-brand-text)" }}>{roleName}</span>
          </span>
        )}
        {providerName && (
          <span>
            via: <span style={{ color: "var(--color-syn-violet)" }}>{providerName}</span>
          </span>
        )}
      </p>
    </TooltipContent>
    </Tooltip>
  );
}
