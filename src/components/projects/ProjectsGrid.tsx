import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent, type Variants } from "motion/react";
import { ArrowDown, LayoutGrid, List, Search, X } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { FilterSelect, type FilterOption } from "@/components/projects/FilterSelect";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SP_QUERY, useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
}

/** The three ways to narrow the list, each a multi-select box. */
const FACETS = ["tag", "role", "via"] as const;
type Facet = (typeof FACETS)[number];
type Selection = Record<Facet, string[]>;

const NONE: Selection = { tag: [], role: [], via: [] };

/** The ids a project carries for a facet. Tags are many; role and via one. */
const valuesOf: Record<Facet, (p: Project) => string[]> = {
  tag: (p) => p.tags,
  role: (p) => [String(p.role)],
  via: (p) => [String(p.provider)],
};

/**
 * Within a facet the chosen values are alternatives (tag WordPress *or*
 * Welcart); across facets they narrow (that tag *and* that role). It is the
 * only reading under which adding a value never empties a list the reader is
 * widening, and adding a facet never widens one they are narrowing.
 */
function passes(p: Project, q: string, sel: Selection, skip?: Facet) {
  for (const f of FACETS) {
    if (f === skip || sel[f].length === 0) continue;
    if (!valuesOf[f](p).some((v) => sel[f].includes(v))) return false;
  }
  if (!q) return true;
  return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
}

function parseDate(d: string): number {
  const [y, m, day] = d.split(".").map((n) => parseInt(n, 10));
  return new Date(y || 0, (m || 1) - 1, day || 1).getTime();
}

/** Cards per batch in the phone's list view, where the page grows with them. */
const PHONE_PAGE = 8;

/**
 * The deck's slide change, in seconds. The leaving cards shrink from 100% to
 * nothing inside the first half second; each arriving card waits a random
 * 0.50-1.00s before it grows from nothing to 100%, so a slide assembles piece
 * by piece rather than landing as one block.
 */
const ENTER_MIN = 0.5;
const ENTER_MAX = 1;
const LEAVE_SPREAD = 0.15;
const ENTER_DURATION = 0.4;
const LEAVE_DURATION = 0.3;

/**
 * A slide change this soon after the last one is the reader scrolling
 * *through* the deck, not stopping on a slide. Holding each slide's cards
 * back for half a second then left the stage empty for as long as the scroll
 * went on, and still waiting when it stopped. Those changes swap at once
 * instead: the arriving cards grow in almost together, the leaving ones clear
 * immediately. The first step after a pause keeps the full assembly.
 */
const FAST_GAP_MS = 700;
const FAST_ENTER_SPREAD = 0.08;
const FAST_DURATION = 0.2;
const FAST_LEAVE = 0.1;

/**
 * One wheel or swipe gesture turns the deck one slide. A gesture ends when
 * its events stop for this long -- a trackpad keeps sending a decaying tail of
 * "momentum" events after the fingers lift, and those belong to the swipe
 * that started them. A fresh swipe inside that tail shows as a sudden jump in
 * size over the last few events.
 */
const GESTURE_GAP_MS = 220;
const FRESH_SWIPE_RATIO = 2;
const FRESH_SWIPE_MIN = 30;
/** Pixels of wheel travel before a gesture commits to a step. */
const STEP_PX = 12;
/** Finger travel before a swipe commits to a step. */
const SWIPE_PX = 40;

/** Per-card timing, drawn when its slide is created. */
interface Timing {
  enter: number;
  leave: number;
  duration: number;
  instant?: boolean;
}

const itemVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  shown: (t: Timing) => ({
    scale: 1,
    opacity: 1,
    transition: t.instant ? { duration: 0 } : { delay: t.enter, duration: t.duration, ease: [0.22, 1, 0.36, 1] },
  }),
  gone: (t: Timing) => ({
    scale: 0,
    opacity: 0,
    transition: t.instant ? { duration: 0 } : { delay: t.leave, duration: LEAVE_DURATION, ease: [0.55, 0, 1, 0.45] },
  }),
};

/**
 * A leaving slide waits for its cards before AnimatePresence removes it --
 * unless the reader is scrolling through, when the whole slide clears at once
 * (AnimatePresence passes `fast` in as `custom` at the moment it leaves).
 */
const slideVariants: Variants = {
  hidden: {},
  shown: {},
  gone: (fast?: boolean) =>
    fast
      ? { opacity: 0, transition: { duration: FAST_LEAVE } }
      : { transition: { when: "afterChildren" } },
};

/**
 * How a slide lays out its six cards: three across and two down in grid view,
 * two across and three down in list view. A stage too short to hold that many
 * rows of a card's text (a laptop with the browser docked) drops a row rather
 * than cutting cards off.
 */
const PER_SLIDE = 6;
function layoutFor(view: "grid" | "list", w: number, h: number) {
  const gap = 12;
  if (!w || !h) return { cols: 3, rows: 2 };
  if (view === "list") {
    // A list row is about 156px tall: thumbnail, title, two lines, badges, link.
    const rows = Math.max(1, Math.min(PER_SLIDE / 2, Math.floor((h + gap) / (156 + gap))));
    return { cols: 2, rows };
  }
  const cols = 3;
  const colW = (w - gap * (cols - 1)) / cols;
  // A grid card is a titlebar, a 16:9 shot and ~120px of text. On a short
  // laptop the shot gives up most of its height -- down to a banner of the
  // site -- so two rows still fit; below that it would show nothing, and the
  // slide keeps one row.
  const minCard = 34 + colW * (9 / 16) * 0.18 + 120;
  const rows = h + gap >= 2 * (minCard + gap) ? PER_SLIDE / cols : 1;
  return { cols, rows };
}

export function ProjectsGrid({
  projects,
  taglist,
  roles,
  providers,
  baseUrl,
}: ProjectsGridProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selection>(NONE);
  const [view, setView] = useState<"grid" | "list">("grid");
  const isSP = useMediaQuery(SP_QUERY);
  const reduced = useReducedMotion();

  // The server cannot measure anything, so it renders every card in a plain
  // grid -- which is also exactly what a visitor without JS gets. The deck and
  // the rail take over before the first paint.
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => setReady(true), []);

  const sorted = useMemo(
    () => [...projects].sort((a, b) => parseDate(b.date) - parseDate(a.date)),
    [projects],
  );

  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () => sorted.filter((p) => passes(p, q, selected)),
    [sorted, q, selected],
  );

  const names: Record<Facet, Record<string, { name: string }>> = { tag: taglist, role: roles, via: providers };

  // Each box counts what its options would show against everything *else*
  // that is set -- the search and the other two boxes, never its own. Counting
  // against its own selection would read 0 on every option but the chosen ones,
  // which says nothing about what picking another would add.
  const options = useMemo(() => {
    const out = {} as Record<Facet, FilterOption[]>;
    for (const f of FACETS) {
      const base = sorted.filter((p) => passes(p, q, selected, f));
      out[f] = Object.entries(names[f]).map(([id, o]) => ({
        id,
        name: o.name,
        count: base.filter((p) => valuesOf[f](p).includes(id)).length,
      }));
    }
    return out;
    // names is rebuilt each render from props that never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, q, selected]);

  const setFacet = (f: Facet, ids: string[]) => setSelected((s) => ({ ...s, [f]: ids }));
  const hasFilters = FACETS.some((f) => selected[f].length > 0);

  // PC: a deck. Phone, grid view: a swipe rail. Phone, list view: a list that
  // grows the page a batch at a time.
  const mode: "static" | "deck" | "rail" | "list" =
    !ready ? "static" : !isSP ? "deck" : view === "grid" ? "rail" : "list";

  // ── Deck ──
  const stageRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (mode !== "deck" || !el) return;
    const sync = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode, filtered.length === 0]);

  const { cols, rows } = layoutFor(view, stage.w, stage.h);
  const perSlide = cols * rows;
  const slides = Math.max(1, Math.ceil(filtered.length / perSlide));

  // The section is one screen of scroll per slide, and the frame sticks while
  // the page scrolls through it (global.css, "Projects deck").
  const [section, setSection] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => setSection(document.getElementById("projects")), []);
  useLayoutEffect(() => {
    if (!section) return;
    section.toggleAttribute("data-deck", mode === "deck");
    section.style.setProperty("--slides", String(mode === "deck" ? slides : 1));
  }, [section, mode, slides]);

  // Which slide the scroll position names: each takes one screen, and the
  // change comes half way between two.
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (mode !== "deck") return;
    const section = document.getElementById("projects");
    if (!section) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const screen = section.offsetHeight / slides;
      const i = Math.round(-section.getBoundingClientRect().top / screen);
      setIndex(Math.max(0, Math.min(slides - 1, i)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode, slides]);

  // A new result set starts at its first slide. Without this, narrowing the
  // list while on slide 4 shrank the section out from under the reader and
  // left them part way into Contact. The frame is stuck to the screen, so the
  // jump back to the deck's start moves nothing they are looking at.
  const filterSig = `${q}|${FACETS.map((f) => selected[f].join(",")).join("|")}|${view}`;
  const lastSig = useRef(filterSig);
  useEffect(() => {
    if (lastSig.current === filterSig) return;
    lastSig.current = filterSig;
    const section = document.getElementById("projects");
    if (mode !== "deck" || !section) return;
    const top = section.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: window.scrollY + top, behavior: "instant" });
  }, [filterSig, mode]);

  const slide = Math.min(index, slides - 1);
  const from = slide * perSlide;
  const slideItems = filtered.slice(from, from + perSlide);

  // The first slide waits for the section to arrive before its cards grow
  // in; every later one starts as soon as the scroll names it. The section is
  // observed, not the stage: the stage only mounts once the deck takes over.
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    const section = document.getElementById("projects");
    if (mode !== "deck" || arrived || !section) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setArrived(true);
          io.disconnect();
        }
      },
      // As soon as any of it shows: the cards' own delay is the pause, and
      // waiting for the section to be well in view on top of it read as lag.
      { rootMargin: "0px" },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [mode, arrived]);

  // Drawn once per slide: a new key (another slide, filter or layout) draws
  // new offsets, so no two arrivals assemble the same way.
  const slideKey = `${filterSig}|${perSlide}|${slide}`;

  // When the previous slide change happened, to tell scrolling through from
  // stepping onto a slide. Updated after each change commits.
  const lastChange = useRef(-Infinity);
  const timings = useMemo(() => {
    const fast = performance.now() - lastChange.current < FAST_GAP_MS;
    const items: Timing[] = slideItems.map(() =>
      fast
        ? { enter: Math.random() * FAST_ENTER_SPREAD, leave: 0, duration: FAST_DURATION }
        : {
            enter: ENTER_MIN + Math.random() * (ENTER_MAX - ENTER_MIN),
            leave: Math.random() * LEAVE_SPREAD,
            duration: ENTER_DURATION,
          },
    );
    return { fast, items };
    // slideKey covers everything that changes which cards the slide holds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey]);
  useEffect(() => {
    lastChange.current = performance.now();
  }, [slideKey]);

  /** Where the deck sits in the document: its first and last slide, a screen apart each. */
  const geometry = () => {
    const screen = section ? section.offsetHeight / slides : window.innerHeight;
    const top = section ? section.getBoundingClientRect().top + window.scrollY : 0;
    return { screen, top, last: top + (slides - 1) * screen };
  };

  const scrollToSlide = (i: number, behavior: ScrollBehavior = reduced ? "auto" : "smooth") => {
    const { screen, top } = geometry();
    window.scrollTo({ top: top + i * screen, behavior });
  };

  // When the current slide's cards will all be in place. The deck does not
  // turn again before then: a reader sees every card of a slide before the
  // next one replaces it.
  const shownUntil = useRef(0);
  useEffect(() => {
    if (mode !== "deck" || !(arrived || reduced)) return;
    const end = reduced ? 0 : Math.max(0, ...timings.items.map((t) => t.enter + t.duration));
    shownUntil.current = performance.now() + end * 1000;
  }, [mode, arrived, reduced, timings]);

  // One gesture, one slide. While the deck fills the screen, wheel and touch
  // scrolling are taken over and turned into single steps, each held until
  // the slide has assembled and the gesture -- momentum tail included -- has
  // ended. At either end a new gesture outward is left alone and scrolls on
  // into About or Contact; scrolling in from either side lands on the nearest
  // slide rather than sailing into the middle of the deck. Keyboard and
  // scrollbar scrolling stay native: Space and Page Down move a screen, which
  // is a slide, and nobody's keys are hijacked.
  //
  // The step itself is an instant scroll to the slide's position: the frame
  // is stuck to the screen, so nothing visibly moves but the cards.
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;
  useEffect(() => {
    if (mode !== "deck" || !section) return;

    const step = (to: number) => {
      // Held provisionally until the new slide's own timings are known.
      shownUntil.current = performance.now() + (reduced ? 0 : (ENTER_MAX + ENTER_DURATION) * 1000);
      const { screen, top } = geometryRef.current();
      window.scrollTo({ top: top + to * screen, behavior: "instant" });
    };
    const ready = () => performance.now() >= shownUntil.current;
    /** The deck fills the screen: the page sits on or between its slides. */
    const where = () => {
      const { screen, top, last } = geometryRef.current();
      const y = window.scrollY;
      return { y, top, last, engaged: y >= top - 2 && y <= last + 2, current: Math.round((y - top) / screen) };
    };

    const gesture = { last: 0, consumed: false, travel: 0, recent: [] as number[] };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // pinch-zoom, sideways
      if ((e.target as Element | null)?.closest?.(".filter-popover")) return; // its own list scrolls
      const px = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!px) return;
      const dir = Math.sign(px);
      const mag = Math.abs(px);
      const now = performance.now();

      if (now - gesture.last > GESTURE_GAP_MS) {
        gesture.consumed = false;
        gesture.travel = 0;
        gesture.recent = [];
      } else if (
        gesture.consumed &&
        gesture.recent.length >= 3 &&
        mag > FRESH_SWIPE_MIN &&
        mag > FRESH_SWIPE_RATIO * Math.max(...gesture.recent.slice(-3))
      ) {
        gesture.consumed = false;
        gesture.travel = 0;
      }
      gesture.last = now;
      gesture.recent.push(mag);
      if (gesture.recent.length > 8) gesture.recent.shift();

      const { y, top, last, engaged, current } = where();
      if (!engaged) {
        if ((dir > 0 && y < top && y + px >= top) || (dir < 0 && y > last && y + px <= last)) {
          e.preventDefault();
          window.scrollTo({ top: dir > 0 ? top : last, behavior: "instant" });
          gesture.consumed = true;
        }
        return;
      }

      const target = current + dir;
      const outward = target < 0 || target > slides - 1;
      if (outward && !gesture.consumed && ready()) return; // leave the deck
      e.preventDefault();
      if (gesture.consumed || !ready()) return;
      gesture.travel += px;
      if (Math.abs(gesture.travel) < STEP_PX) return;
      gesture.consumed = true;
      if (!outward) step(target);
    };

    // A tablet at PC width swipes instead: the same one-step rule, decided by
    // the swipe's first few pixels of travel.
    const touch = { startY: 0, decided: false, intercept: false, stepped: false, dir: 0 };
    const onTouchStart = (e: TouchEvent) => {
      touch.decided = e.touches.length !== 1 || !!(e.target as Element | null)?.closest?.(".filter-popover");
      touch.intercept = false;
      touch.stepped = false;
      touch.startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dy = touch.startY - e.touches[0].clientY;
      if (!touch.decided) {
        if (Math.abs(dy) < 6) return;
        touch.decided = true;
        touch.dir = Math.sign(dy);
        const { engaged, current } = where();
        const target = current + touch.dir;
        touch.intercept = engaged && (!ready() || (target >= 0 && target <= slides - 1));
      }
      if (!touch.intercept) return;
      if (e.cancelable) e.preventDefault();
      if (touch.stepped || Math.abs(dy) < SWIPE_PX || !ready()) return;
      touch.stepped = true;
      const target = where().current + touch.dir;
      if (target >= 0 && target <= slides - 1) step(target);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [mode, section, slides, reduced]);

  // ── Phone list ──
  const [shown, setShown] = useState(PHONE_PAGE);
  // A filter that narrows the list must not leave a stale count behind.
  useEffect(() => { setShown(PHONE_PAGE); }, [filtered]);

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
  }, [mode, filtered]);

  // What the status line counts as on screen.
  const [visibleFrom, visibleTo] =
    mode === "deck" ? [from + 1, from + slideItems.length]
    : mode === "list" ? [1, Math.min(shown, filtered.length)]
    : [1, filtered.length];
  const range =
    filtered.length === 0 ? "0"
    : visibleFrom === 1 && visibleTo === filtered.length ? `${filtered.length}`
    : `${visibleFrom}–${visibleTo}`;

  const card = (project: Project, i: number, reveal = true) => (
    <ProjectCard
      key={`${project.title}-${project.date}`}
      project={project}
      index={i}
      view={view}
      taglist={taglist}
      roles={roles}
      providers={providers}
      baseUrl={baseUrl}
      reveal={reveal}
    />
  );

  return (
    <TooltipProvider delayDuration={200}>
      {/* The controls ride with the frame, so in the deck they are there on
          every slide. */}
      <div className="projects-controls shrink-0 flex flex-col gap-2 mb-3">
        {/* One row on PC: search, the three filter boxes and the view toggle.
            On a phone the toggle rides beside the search and the boxes take
            the whole second row -- three boxes and the toggle sharing one
            phone row left each box too narrow to show "tag: all". */}
        <div className="projects-toolbar">
          <div className="projects-search-wrap relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-ink-dim)" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search projects..."
              aria-label="Search projects by title"
              className="field-interactive projects-search w-full pl-9 pr-9 rounded-lg"
              style={{
                color: "var(--color-ink-muted)",
                fontFamily: "var(--font-mono)",
              }}
            />
            {query && (
              <button
                type="button"
                aria-label="clear search"
                onClick={() => setQuery("")}
                className="icon-btn absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="projects-filter-row">
            {FACETS.map((f) => (
              <FilterSelect
                key={f}
                label={f}
                options={options[f]}
                selected={selected[f]}
                onChange={(ids) => setFacet(f, ids)}
              />
            ))}
          </div>

          {/* View toggle */}
          <div
            role="group"
            aria-label="Layout"
            className="projects-view-toggle flex items-center rounded-lg p-0.5"
            style={{ background: "var(--color-card-surface)", border: "1px solid var(--color-card-border)" }}
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

        {/* Every chosen value as a chip, so what is applied reads at a glance
            without opening three boxes -- and any one comes off in a click. */}
        {hasFilters && (
          <div className="projects-chips flex items-center gap-2 flex-wrap">
            <span className="font-mono" style={{ fontSize: "0.68rem", color: "var(--color-ink-faint)" }}>
              // filtered by
            </span>
            {FACETS.flatMap((f) =>
              selected[f].map((id) => (
                <ActiveFilter
                  key={`${f}-${id}`}
                  facet={f}
                  label={names[f][id]?.name}
                  onClear={() => setFacet(f, selected[f].filter((v) => v !== id))}
                />
              )),
            )}
            <button
              type="button"
              onClick={() => setSelected(NONE)}
              className="icon-btn font-mono underline underline-offset-2"
              style={{ fontSize: "0.68rem" }}
            >
              clear all
            </button>
          </div>
        )}
      </div>

      <div
        className="projects-status font-mono mb-3 shrink-0"
        role="status"
        aria-live="polite"
        style={{ fontSize: "0.72rem", color: "var(--color-ink-dim)" }}
      >
        // showing {range} of {filtered.length}
        {filtered.length !== sorted.length && ` (filtered from ${sorted.length})`}
      </div>

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
            // try clearing the search or a filter
          </p>
        </div>
      ) : mode === "deck" ? (
        <>
          <div
            ref={stageRef}
            className="projects-stage"
            data-view={view}
            style={{ "--cols": cols, "--rows": rows } as CSSProperties}
          >
            <AnimatePresence initial={false} custom={timings.fast}>
              <Slide key={slideKey} show={arrived || reduced}>
                {slideItems.map((project, i) => (
                  <motion.div
                    key={`${project.title}-${project.date}`}
                    className="projects-slide-item"
                    // The deck's own entrance, pinned to its end state by CSS
                    // under reduced motion and without JS.
                    data-reveal=""
                    variants={itemVariants}
                    custom={{ ...timings.items[i], instant: reduced }}
                  >
                    {card(project, from + i, false)}
                  </motion.div>
                ))}
              </Slide>
            </AnimatePresence>
          </div>

          {slides > 1 && (
            <nav className="projects-pager" aria-label="Project pages">
              <ol>
                {Array.from({ length: slides }, (_, i) => {
                  const a = i * perSlide + 1;
                  const b = Math.min(filtered.length, (i + 1) * perSlide);
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        className="projects-pager-dot"
                        aria-current={i === slide ? "true" : undefined}
                        aria-label={`Projects ${a} to ${b}`}
                        onClick={() => scrollToSlide(i)}
                      />
                    </li>
                  );
                })}
              </ol>
              <span className="projects-pager-label font-mono" aria-hidden="true">
                {String(slide + 1).padStart(2, "0")} / {String(slides).padStart(2, "0")}
              </span>
              {slide < slides - 1 && (
                <span className="projects-pager-hint font-mono" aria-hidden="true">
                  scroll <ArrowDown size={11} />
                </span>
              )}
            </nav>
          )}
        </>
      ) : mode === "rail" ? (
        <>
          <div
            className="projects-rail-wrap"
            data-scrolled={railScrolled ? "true" : undefined}
          >
            <div className="projects-rail" ref={railRef}>
              {filtered.map((p, i) => card(p, i))}
            </div>
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
      ) : (
        <>
          <div
            className={
              mode === "static" && view === "grid"
                ? "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
                : "flex flex-col gap-2"
            }
          >
            {(mode === "list" ? filtered.slice(0, shown) : filtered).map((p, i) => card(p, i))}
          </div>

          {mode === "list" && shown < filtered.length && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => setShown((n) => n + PHONE_PAGE)}
                className="flow-link"
              >
                <span>Show more</span>
                <span className="font-mono" style={{ fontSize: "0.72rem", opacity: 0.85 }}>
                  {filtered.length - shown} left
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </TooltipProvider>
  );
}

/**
 * One slide of the deck. While it shrinks away it is still in the DOM, laid
 * over the arriving one, so it is made inert: its cards can be neither focused
 * nor clicked, and assistive tech no longer lists them.
 */
function Slide({ show, children }: { show: boolean; children: ReactNode }) {
  const present = useIsPresent();
  return (
    <motion.div
      className="projects-slide"
      variants={slideVariants}
      initial="hidden"
      animate={show ? "shown" : "hidden"}
      exit="gone"
      inert={!present}
      data-leaving={present ? undefined : "true"}
    >
      {children}
    </motion.div>
  );
}

/** An applied filter value, shown so the active state is visible without opening a box. */
function ActiveFilter({ facet, label, onClear }: { facet: Facet; label?: string; onClear: () => void }) {
  if (!label) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      className="filter-chip font-mono rounded-full inline-flex items-center gap-1 px-2.5 py-1"
      data-applied=""
      style={{ fontSize: "0.68rem" }}
    >
      <span style={{ color: "var(--color-ink-dim)" }}>{facet}:</span>{" "}
      {label}
      <X size={11} aria-hidden="true" />
      <span className="sr-only"> remove filter</span>
    </button>
  );
}
