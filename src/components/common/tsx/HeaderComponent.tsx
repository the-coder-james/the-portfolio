"use client";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { animateEl } from "@/lib/utils";
import { Code2, FolderGit2, GitCommitHorizontal, House, Mail, User, Wrench } from "lucide-react";

/** One icon per tab, so mobile can show the whole bar without a drawer. */
const TAB_ICONS: Record<string, typeof House> = {
  home: House,
  about: User,
  skills: Wrench,
  projects: FolderGit2,
  experience: GitCommitHorizontal,
  contact: Mail,
};
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/common/tsx/ThemeToggle";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import dataJson from "@/assets/data.json";

const navLinks = dataJson.nav;
const TAB_IDS = navLinks.map((l) => l.href.slice(1));
const DEFAULT_TAB = TAB_IDS[0];

/** Resolve a location hash to a tab id, or null if it names something else. */
function tabFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, "");
  return TAB_IDS.includes(id) ? id : null;
}

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
  const reduced = useReducedMotion();

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

  useEffect(() => {
    if (!navRef.current) return;
    animateEl(
      navRef.current as Element,
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
  }, [active]);

  // Canonicalise an empty or unrecognised hash without adding a history entry.
  useEffect(() => {
    if (!tabFromHash(window.location.hash)) {
      history.replaceState(null, "", `#${DEFAULT_TAB}`);
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
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      // Move focus into the panel, or keyboard and screen-reader users stay
      // parked in the header after switching.
      requestAnimationFrame(() => document.getElementById(id)?.focus());
    },
    [reduced]
  );

  // Slide the underline to the active tab.
  useEffect(() => {
    const indicator = indicatorRef.current;
    const activeBtn = linkRefs.current[active];
    if (!indicator || !activeBtn) return;
    const parent = indicator.parentElement;
    if (!parent) return;
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
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[min(1120px,calc(100%-1.5rem))]"
      style={{ opacity: 0 }}
      aria-label="Primary"
    >
      <div className="glass-surface rounded-full px-2 sm:px-4 py-2 flex items-center justify-between gap-1 sm:gap-3 relative">
        <button
          onClick={() => selectTab(DEFAULT_TAB)}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center group-hover:bg-brand-900 transition-colors">
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
              className="glass-pill absolute top-0 bottom-0 rounded-full pointer-events-none z-0"
              style={{ left: 0, width: 0, opacity: 0 }}
              aria-hidden="true"
            />
            {navLinks.map((link) => {
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
