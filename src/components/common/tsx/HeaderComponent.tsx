"use client";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { animateEl } from "@/lib/utils";
import { Code2, FolderGit2, House, Mail, User } from "lucide-react";

/** One icon per tab, so mobile can show the whole bar without a drawer. */
const TAB_ICONS: Record<string, typeof House> = {
  home: House,
  about: User,
  projects: FolderGit2,
  contact: Mail,
};
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/common/tsx/ThemeToggle";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import dataJson from "@/assets/data.json";

const navLinks = dataJson.nav;
const TAB_IDS = navLinks.map((l) => l.href.slice(1));
const DEFAULT_TAB = TAB_IDS[0];

/** Hashes that used to be their own tabs. Skills and Experience are sub-tabs
 *  of About now, so old links still land somewhere sensible instead of being
 *  treated as unknown and bounced to Home. */
const MERGED_TABS: Record<string, string> = {
  skills: "about",
  experience: "about",
};

/** Resolve a location hash to a tab id, or null if it names something else. */
function tabFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, "");
  if (TAB_IDS.includes(id)) return id;
  return MERGED_TABS[id] ?? null;
}

/** Below this width the page stops being tabs and becomes one scrolling
 *  document. Matches the 640px breakpoint the panel CSS uses. */
const SCROLL_MODE_QUERY = "(max-width: 640px)";

export function HeaderComponent() {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // The server can't see the hash, so it always renders the default tab. React
  // reuses that server HTML on hydration, which means seeding state from the
  // hash in the initial render leaves Radix's own markup (data-state,
  // aria-selected) stuck on the default. Start from the default to match the
  // server, then correct in a layout effect before paint.
  const [active, setActive] = useState<string>(DEFAULT_TAB);
  // Mobile shows every panel at once and scrolls between them. Starts false to
  // match the server render, then corrected before paint by the effect below.
  const [scrollMode, setScrollMode] = useState(false);
  const reduced = useReducedMotion();

  // Kept in a ref as well: the scroll listener and selectTab both need the
  // current value without being torn down and rebuilt on every change.
  const scrollModeRef = useRef(scrollMode);
  scrollModeRef.current = scrollMode;

  useLayoutEffect(() => {
    const mq = window.matchMedia(SCROLL_MODE_QUERY);
    const sync = () => {
      setScrollMode(mq.matches);
      document.documentElement.toggleAttribute("data-scroll-mode", mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const fromHash = tabFromHash(window.location.hash);
    if (fromHash && fromHash !== active) setActive(fromHash);

    // Landing on /#contact leaves the browser's sequential-focus start point
    // at the hash target, so the first Tab lands inside the panel and the skip
    // link and whole nav come last -- useless exactly when they are most
    // needed (WCAG 2.4.3). Reset the start point to the top of the document.
    // Focus is not moved anywhere visible: body is focused then immediately
    // blurred, which is enough to restore document order without stealing the
    // caret or scrolling.
    if (fromHash) {
      const body = document.body;
      const hadTabIndex = body.hasAttribute("tabindex");
      if (!hadTabIndex) body.setAttribute("tabindex", "-1");
      body.focus({ preventScroll: true });
      body.blur();
      if (!hadTabIndex) body.removeAttribute("tabindex");
    }
    // Only on mount: later hash changes are handled by the listener below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll mode: the browser resolves the landing #hash as a fragment and
  // scrolls to that panel itself. That happens before the loading screen has
  // cleared and before the islands below have their final height, so the
  // position it lands on is measured against a layout that no longer exists --
  // a plain /#home load came to rest ~1200px down the page. Re-resolve it once
  // the layout has settled: the top for #home, the panel for anything else.
  useEffect(() => {
    if (!scrollMode) return;
    const id = tabFromHash(window.location.hash) ?? DEFAULT_TAB;
    const root = document.documentElement;

    // The landing position has to be corrected *and* held. Entering scroll mode
    // unhides three panels and roughly doubles the document, and the browser is
    // still resolving the landing #hash against the old layout while that
    // happens -- a plain /#home load drifted to ~1220px over about 900ms.
    //
    // It drifts rather than jumps because html{scroll-behavior:smooth} turns
    // every correction into an animation, including this one: a single
    // scrollTo here would be overtaken by the one already in flight. So the
    // smooth behaviour is suspended for the settling window, the position is
    // reasserted across a few frames, and only then is it handed back.
    const prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    // Aligned in layout-viewport coordinates, against the same offset the CSS
    // scroll-padding gives the browser. scrollIntoView aligns to the *visual*
    // viewport instead, and on a phone that is still sliding while the URL
    // bar animates away during load -- each correction chased a moving frame
    // and the panel settled 6-55px low, by a different amount every load. The
    // fixed nav lives in layout coordinates, so the panel has to as well.
    const place = () => {
      if (id === DEFAULT_TAB) {
        window.scrollTo(0, 0);
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      window.scrollTo(0, Math.max(0, window.scrollY + el.getBoundingClientRect().top - pad));
    };

    place();
    const frames = [
      requestAnimationFrame(place),
      window.setTimeout(place, 60),
      window.setTimeout(place, 180),
      // An explicit /#home is the slow case: the browser re-resolves that
      // fragment against the grown document after the earlier corrections have
      // run, so #home alone needs the window held open longer. Any other hash
      // resolves to the same place the browser was already heading.
      window.setTimeout(place, 420),
      window.setTimeout(place, 700),
      window.setTimeout(() => { root.style.scrollBehavior = prev; }, 780),
    ];

    return () => {
      cancelAnimationFrame(frames[0] as number);
      frames.slice(1).forEach((t) => clearTimeout(t as number));
      root.style.scrollBehavior = prev;
    };
    // Mount of scroll mode only; later navigation goes through selectTab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollMode]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    // Read the media query directly: useReducedMotion reports false on the
    // first render, which is exactly when this entrance runs, so gating on it
    // would still slide the nav in for a visitor who asked for no motion. The
    // nav cannot carry data-reveal -- its centring is a transform.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nav.style.opacity = "1";
      return;
    }
    animateEl(
      nav as Element,
      { y: [-80, 0], opacity: [0, 1] },
      { type: "spring", visualDuration: 0.55, bounce: 0.2 }
    );
  }, []);

  // Panels are sized against the nav and footer, so measure both rather than
  // trusting a constant: a wrapped nav or an extra footer line would otherwise
  // push every panel past the viewport.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const nav = navRef.current;
      const footer = document.querySelector("footer");
      if (nav) {
        // offsetTop/offsetHeight, not getBoundingClientRect: the nav plays a
        // slide-in transform on mount, and the rect would measure it mid-flight
        // (it reads negative while the nav is still above the viewport).
        const bottom = nav.offsetTop + nav.offsetHeight;
        root.style.setProperty("--nav-h", `${Math.round(bottom)}px`);
      }
      if (footer) root.style.setProperty("--footer-h", `${Math.round(footer.offsetHeight)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (navRef.current) ro.observe(navRef.current);
    const footer = document.querySelector("footer");
    if (footer) ro.observe(footer);
    window.addEventListener("resize", sync);
    return () => { ro.disconnect(); window.removeEventListener("resize", sync); };
  }, []);

  // Show only the active panel. Runs before paint so no second panel is ever
  // briefly visible. `data-tabs-ready` gates the CSS that does the hiding, so
  // without JS every panel stays on the page as a plain scrolling document.
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-tabs-ready", "");
    for (const id of TAB_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      // Scroll mode: every panel is in flow, so nothing is hidden and the
      // attributes are actively cleared -- a panel left hidden from a resize
      // out of tab mode would stay invisible with no way to bring it back.
      if (scrollModeRef.current) {
        el.hidden = false;
        el.removeAttribute("aria-hidden");
        el.removeAttribute("data-entering");
        continue;
      }
      const isActive = id === active;
      el.hidden = !isActive;
      el.setAttribute("aria-hidden", String(!isActive));
      // Re-triggers the entrance animation on every switch. The attribute has
      // to be removed and re-added (with a reflow between) or the browser sees
      // no change and the animation only ever plays once.
      if (isActive) {
        el.removeAttribute("data-entering");
        void el.offsetWidth;
        el.setAttribute("data-entering", "");
      } else {
        el.removeAttribute("data-entering");
      }
    }
  }, [active, scrollMode]);

  // Canonicalise an empty or unrecognised hash without adding a history entry.
  useEffect(() => {
    const resolved = tabFromHash(window.location.hash);
    const target = resolved ?? DEFAULT_TAB;
    // Covers both an unknown hash and a merged one (#skills -> #about), so the
    // address bar never keeps a hash that no longer names a panel.
    if (window.location.hash !== `#${target}`) {
      history.replaceState(null, "", `#${target}`);
    }
  }, []);

  // Hash changes drive the tabs, which is what keeps the browser's back and
  // forward buttons working and lets plain <a href="#projects"> links (the
  // hero CTAs) switch tabs without knowing anything about this component.
  useEffect(() => {
    const onHashChange = () => {
      const id = tabFromHash(window.location.hash);
      // Ignore hashes that are not tabs -- the skip link targets #main, and it
      // must move focus without resetting the active panel.
      if (id) setActive(id);
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, []);

  const selectTab = useCallback(
    (id: string) => {
      if (!TAB_IDS.includes(id)) return;
      if (window.location.hash !== `#${id}`) {
        history.pushState(null, "", `#${id}`);
      }
      setActive(id);

      const el = document.getElementById(id);

      if (scrollModeRef.current) {
        // Every panel is on the page, so this scrolls to one instead of
        // swapping. scroll-margin-top on the panel keeps it clear of the
        // floating nav.
        el?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      }

      // Move focus into the panel, or keyboard and screen-reader users stay
      // parked in the header after switching. preventScroll in scroll mode:
      // focus() would otherwise jump straight there and cancel the smooth
      // scroll that just started.
      requestAnimationFrame(() =>
        el?.focus({ preventScroll: scrollModeRef.current })
      );
    },
    [reduced]
  );

  // Scroll mode: the active pill follows the section the reader is actually
  // looking at. An IntersectionObserver with a band across the upper-middle of
  // the viewport picks the section occupying it, which is steadier than
  // measuring offsets on every scroll event.
  useEffect(() => {
    if (!scrollMode) return;

    const panels = TAB_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!panels.length) return;

    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) { best = id; bestRatio = ratio; }
        }
        // Only the pill moves. Writing the hash here would push a history
        // entry per section and hijack the back button while scrolling.
        if (best) setActive(best);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [scrollMode]);

  // Slide the underline to the active tab.
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;
    const parent = indicator.parentElement;
    if (!parent) return;

    // Home has no trigger in the tablist -- the logo is its control -- so there
    // is nothing for the pill to sit on. Returning early left it parked on
    // whichever tab it highlighted last, which read as that section being
    // active while the hero was on screen. Fade it out instead.
    const activeBtn = linkRefs.current[active];
    if (!activeBtn) {
      indicator.style.opacity = "0";
      return;
    }
    const parentRect = parent.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const to = {
      left: btnRect.left - parentRect.left,
      width: btnRect.width,
      opacity: 1,
    };
    if (reduced) {
      Object.assign(indicator.style, {
        left: `${to.left}px`,
        width: `${to.width}px`,
        opacity: "1",
      });
      return;
    }
    animateEl(indicator as Element, to, {
      type: "spring",
      visualDuration: 0.3,
      bounce: 0.1,
    });
  }, [active, reduced]);

  return (
    <nav
      ref={navRef}
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[min(1120px,calc(100%-1.25rem))]"
      style={{ opacity: 0 }}
      aria-label="Primary"
    >
      <div className="sheet-surface rounded-full px-2.5 sm:px-4 py-2.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-3 relative">
        <button
          onClick={() => selectTab(DEFAULT_TAB)}
          // The name starts with the visible "<james/>" (SC 2.5.3, label in
          // name), then says where the button goes. The brackets are glyphs,
          // not words, so they are left out.
          aria-label="james, home"
          aria-current={active === DEFAULT_TAB ? "true" : undefined}
          className="logo-home flex items-center gap-2 group rounded-full shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center group-hover:bg-brand-900 transition-colors">
            <Code2 size={16} className="text-on-brand" />
          </div>
          <span className="font-mono text-ink hidden sm:inline" style={{ fontSize: "0.9rem" }}>
            <span className="text-brand">&lt;</span>james<span className="text-brand">/&gt;</span>
          </span>
        </button>

        {/* Radix drives the roving tabindex, arrow keys and Home/End. The
            panels live in Astro markup rather than TabsContent, so each
            trigger points at its section with an explicit aria-controls. */}
        <Tabs
          value={active}
          onValueChange={selectTab}
          className="min-w-0 flex-1 md:flex-none"
          activationMode="manual"
        >
          <TabsList
            variant="line"
            aria-label="Sections"
            className="relative h-auto gap-0.5 bg-transparent p-0 w-full md:w-auto justify-between md:justify-start [&_[data-slot=tabs-trigger]]:after:hidden"
          >
            <div
              ref={indicatorRef}
              className="tab-pill absolute top-0 bottom-0 rounded-full pointer-events-none z-0"
              style={{ left: 0, width: 0, opacity: 0 }}
              aria-hidden="true"
            />
            {navLinks.filter((l) => l.href.slice(1) !== DEFAULT_TAB).map((link) => {
              const id = link.href.slice(1);
              return (
                <TabsTrigger
                  key={link.label}
                  value={id}
                  id={`tab-${id}`}
                  aria-controls={id}
                  ref={(el) => {
                    linkRefs.current[id] = el;
                  }}
                  aria-label={link.label}
                  className="nav-link relative z-10 grid place-items-center md:block w-8 h-8 sm:w-9 sm:h-9 md:w-auto md:h-auto md:px-3.5 md:py-1.5 text-[0.7rem] font-mono uppercase tracking-wider rounded-full data-[state=active]:text-brand data-[state=active]:bg-transparent"
                >
                  {(() => { const Icon = TAB_ICONS[id]; return Icon ? <Icon size={17} className="md:hidden" aria-hidden="true" /> : null; })()}
                  <span className="hidden md:inline">{link.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex items-center shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
