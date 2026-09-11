"use client";
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { animateEl } from "@/lib/utils";
import { Menu, Code2 } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
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
  const [scrolled, setScrolled] = useState(false);

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

  // The header still gains its backdrop once the active panel scrolls.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
      className="fixed top-0 left-0 right-0 z-[60] transition-all duration-300"
      style={{
        background: scrolled ? "var(--scrim-base-90)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--tint-brand-12)" : "none",
        opacity: 0,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
        <button
          onClick={() => selectTab(DEFAULT_TAB)}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center group-hover:bg-brand-900 transition-colors">
            <Code2 size={16} className="text-on-brand" />
          </div>
          <span className="font-mono text-ink" style={{ fontSize: "0.9rem" }}>
            <span className="text-brand">&lt;</span>james<span className="text-brand">/&gt;</span>
          </span>
        </button>

        {/* Radix drives the roving tabindex, arrow keys and Home/End. The
            panels live in Astro markup rather than TabsContent, so each
            trigger points at its section with an explicit aria-controls. */}
        <Tabs
          value={active}
          onValueChange={selectTab}
          className="hidden md:block"
          activationMode="manual"
        >
          <TabsList
            variant="line"
            aria-label="Sections"
            className="relative h-auto gap-1 bg-transparent p-0"
          >
            <div
              ref={indicatorRef}
              className="absolute bottom-0 h-0.5 bg-brand rounded-full pointer-events-none"
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
                  className="nav-link relative px-4 py-2 text-xs font-mono uppercase tracking-wider data-[state=active]:text-brand-400 data-[state=active]:bg-transparent"
                >
                  {link.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger className="md:hidden inline-flex w-9 h-9 items-center justify-center rounded-md text-ink hover:bg-[var(--tint-white-06)] transition-colors">
              <Menu size={22} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] border-l-[var(--tint-brand-15)] flex flex-col gap-0 pt-16"
              style={{ background: "var(--scrim-base-98)", backdropFilter: "blur(20px)" }}
            >
              <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-7 h-7 rounded-lg bg-brand-700 flex items-center justify-center">
                  <Code2 size={14} className="text-on-brand" />
                </div>
                <span className="font-mono text-ink" style={{ fontSize: "0.85rem" }}>
                  <span className="text-brand">&lt;</span>james<span className="text-brand">/&gt;</span>
                </span>
              </div>
              <ThemeToggle withLabel className="mx-2 mb-4" />
              {/* Plain buttons, not a second tablist: one set of tab semantics
                  per page keeps assistive tech unambiguous. */}
              <nav className="flex flex-col gap-1 flex-1" aria-label="Sections">
                {navLinks.map((link) => {
                  const id = link.href.slice(1);
                  const isActive = active === id;
                  return (
                    <SheetClose
                      key={link.label}
                      onClick={() => selectTab(id)}
                      aria-current={isActive ? "page" : undefined}
                      className="text-left px-4 py-3 rounded-lg text-sm transition-colors"
                      style={{
                        color: isActive ? "var(--color-brand-400)" : "var(--color-ink-dim)",
                        background: isActive ? "var(--tint-brand-10)" : "transparent",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      <span className="text-brand font-mono mr-2">//</span>
                      {link.label}
                    </SheetClose>
                  );
                })}
              </nav>
              <SheetClose
                onClick={() => selectTab("contact")}
                className="m-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm text-ink border border-[var(--tint-brand-40)] bg-[var(--tint-brand-20)] hover:bg-[var(--tint-brand-35)] transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Hire Me
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
