"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { animateEl } from "@/lib/utils";
import { Code2, FolderGit2, House, Mail, User } from "lucide-react";
import { ThemeToggle } from "@/components/common/tsx/ThemeToggle";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import dataJson from "@/assets/data.json";

/** One icon per section, so the phone can show the whole bar without a drawer. */
const SECTION_ICONS: Record<string, typeof House> = {
  home: House,
  about: User,
  projects: FolderGit2,
  contact: Mail,
};

const navLinks = dataJson.nav;
const SECTION_IDS = navLinks.map((l) => l.href.slice(1));
const FIRST = SECTION_IDS[0];

/** Hashes that used to be sections of their own. Skills and Experience are
 *  sub-tabs of About now, so old links still land somewhere sensible instead
 *  of naming an element that no longer exists. */
const MERGED_SECTIONS: Record<string, string> = {
  skills: "about",
  experience: "about",
};

/** Resolve a location hash to a section id, or null if it names something else. */
function sectionFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, "");
  if (SECTION_IDS.includes(id)) return id;
  return MERGED_SECTIONS[id] ?? null;
}

/**
 * The floating nav over the one scrolling page.
 *
 * Every entry is a plain <a href="#section">: the browser does the scrolling
 * (smoothly, via html{scroll-behavior}), the history entry and the focus start
 * point, and the hero CTAs and flow links work the same way without knowing
 * this component exists. What this adds is the scroll-spy -- the pill follows
 * whichever section the reader is in -- and the measurements the section CSS
 * sizes itself against.
 */
export function HeaderComponent() {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // The server can't see the scroll position, so it renders the first section
  // active; the effects below correct it before paint.
  const [active, setActive] = useState<string>(FIRST);
  const reduced = useReducedMotion();

  // Landing on a hash. The browser resolves a fragment once, as the document
  // loads; a hash for a section that has since merged (#skills) names nothing,
  // so it is pointed at the section it moved into -- replaceState, so
  // canonicalising adds no history entry -- and the position is placed here,
  // instantly. Sections have a fixed height from the first paint, so there is
  // no later layout for the position to drift against; this only settles where
  // the browser could not.
  useLayoutEffect(() => {
    const id = location.hash.replace(/^#/, "");
    const target = sectionFromHash(location.hash);
    if (!target) return;
    if (target !== id) history.replaceState(null, "", `#${target}`);
    setActive(target);

    const root = document.documentElement;
    const prev = root.style.scrollBehavior;
    // html{scroll-behavior:smooth} would animate the correction from the top.
    root.style.scrollBehavior = "auto";
    const place = () => {
      const el = document.getElementById(target);
      if (!el) return;
      window.scrollTo(0, target === FIRST ? 0 : el.getBoundingClientRect().top + window.scrollY);
    };
    place();
    const raf = requestAnimationFrame(() => {
      place();
      root.style.scrollBehavior = prev;
    });

    // Landing on /#contact leaves the browser's sequential-focus start point
    // at the hash target, so the first Tab lands inside the section and the
    // skip link and whole nav come last -- useless exactly when they are most
    // needed (WCAG 2.4.3). Reset the start point to the top of the document.
    // Focus is not moved anywhere visible: body is focused then immediately
    // blurred, which restores document order without stealing the caret or
    // scrolling.
    const body = document.body;
    const hadTabIndex = body.hasAttribute("tabindex");
    if (!hadTabIndex) body.setAttribute("tabindex", "-1");
    body.focus({ preventScroll: true });
    body.blur();
    if (!hadTabIndex) body.removeAttribute("tabindex");

    return () => {
      cancelAnimationFrame(raf);
      root.style.scrollBehavior = prev;
    };
  }, []);

  // Later hash changes. A legacy hash is canonicalised as on landing. Back and
  // forward restore whatever scroll position the browser saved with the entry
  // -- on a phone that was caught part way through the smooth scroll that
  // left it -- so every section hash goes to the section itself. For a link
  // click the browser is already heading to the same place and this changes
  // nothing; hashes that are not sections (the skip link's #main) are left to
  // the browser.
  useEffect(() => {
    const onHashChange = () => {
      const id = location.hash.replace(/^#/, "");
      const target = sectionFromHash(location.hash);
      if (!target) return;
      if (target !== id) history.replaceState(null, "", `#${target}`);
      document.getElementById(target)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [reduced]);

  // Scroll-spy: the section crossing the middle of the screen is the one being
  // read. Every section is one screen tall, so exactly one of them spans that
  // line at any scroll position -- a zero-height band is enough, and steadier
  // than comparing intersection ratios. Only the pill moves: writing the hash
  // here would push a history entry per section and hijack the back button.
  useEffect(() => {
    const sections = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

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

  // Sections pad themselves clear of the nav, and Contact is shortened by the
  // footer, so measure both rather than trusting a constant: a wrapped nav or
  // an extra footer line would otherwise push a section past the screen.
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

  // Slide the pill to the active link.
  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;
    const parent = indicator.parentElement;
    if (!parent) return;

    // Home has no link in the list -- the logo is its control -- so there is
    // nothing for the pill to sit on. Leaving it parked on the last section it
    // highlighted read as that section being current while the hero was on
    // screen. Fade it out instead.
    const activeLink = linkRefs.current[active];
    if (!activeLink) {
      indicator.style.opacity = "0";
      return;
    }
    const parentRect = parent.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const to = {
      left: linkRect.left - parentRect.left,
      width: linkRect.width,
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
      <div className="sheet-surface rounded-full px-2.5 md:px-4 py-2.5 md:py-2 flex items-center justify-between gap-1 md:gap-3 relative">
        <a
          href={`#${FIRST}`}
          // The name starts with the visible "<james/>" (SC 2.5.3, label in
          // name), then says where the link goes. The brackets are glyphs,
          // not words, so they are left out.
          aria-label="james, home"
          aria-current={active === FIRST ? "true" : undefined}
          className="logo-home flex items-center gap-2 group rounded-full shrink-0"
        >
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center group-hover:bg-brand-900 transition-colors">
            <Code2 size={16} className="text-on-brand" />
          </div>
          <span className="font-mono text-ink hidden md:inline" style={{ fontSize: "0.9rem" }}>
            <span className="text-brand">&lt;</span>james<span className="text-brand">/&gt;</span>
          </span>
        </a>

        <div className="relative min-w-0 flex-1 md:flex-none">
          <div
            ref={indicatorRef}
            className="tab-pill absolute top-0 bottom-0 rounded-full pointer-events-none z-0"
            style={{ left: 0, width: 0, opacity: 0 }}
            aria-hidden="true"
          />
          {/* Phones: the three icons sit together in the middle of the bar,
              between the logo and the theme toggle, rather than spread to
              its ends. PC: the labelled links in a row. */}
          <ul className="relative flex items-center gap-5 md:gap-0.5 justify-center md:justify-start list-none m-0 p-0">
            {navLinks.filter((l) => l.href.slice(1) !== FIRST).map((link) => {
              const id = link.href.slice(1);
              const Icon = SECTION_ICONS[id];
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    ref={(el) => {
                      linkRefs.current[id] = el;
                    }}
                    aria-label={link.label}
                    aria-current={active === id ? "true" : undefined}
                    className="nav-link relative z-10 grid place-items-center md:block w-9 h-9 md:w-auto md:h-auto md:px-3.5 md:py-1.5 text-[0.7rem] font-mono uppercase tracking-wider rounded-full"
                  >
                    {Icon && <Icon size={17} className="md:hidden" aria-hidden="true" />}
                    <span className="hidden md:inline">{link.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
