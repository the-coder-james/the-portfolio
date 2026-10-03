"use client";
import { useState, useLayoutEffect, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { animateEl } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TabDef {
  id: string;
  label: string;
  icon: string;
}

/**
 * About, Skills and Experience folded into one panel as three sub-tabs.
 *
 * They were three full-viewport panels saying overlapping things: the bio
 * narrated the same career arc the timeline draws, the mindset cards restated
 * two of the bio's paragraphs, and the skill badges were rendered twice on the
 * Skills panel alone. Merging removed the repetition; sub-tabs keep the result
 * inside one viewport, which stacking the three would not have.
 *
 * This is the same DOM-driven design as the page tabs, and for the same
 * reason: the sub-panels hold islands of their own (AboutImage, SkillsTabs,
 * TimelineList). Passing them in as slots would route them through the React
 * adapter's StaticHtml bridge -- dangerouslySetInnerHTML with
 * shouldComponentUpdate pinned false -- which nests those islands under a
 * hydrating ancestor and strands them. Instead the panels stay siblings in
 * Astro markup and this island only toggles their `hidden` attribute, so
 * island nesting depth stays at 1.
 *
 * Unlike the page tabs there is no hash sync: a sub-tab is a view of #about,
 * not its own destination, and writing to the hash here would fight the
 * header's own hash handling.
 */
export function AboutTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "profile");
  const indicatorRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const reduced = useReducedMotion();
  // Mobile drops the sub-tabs along with the page tabs: the whole page is one
  // scroll there, so hiding two thirds of About behind a control the reader
  // has to find works against that.
  const [scrollMode, setScrollMode] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setScrollMode(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Before paint, so a second sub-panel is never briefly visible. Gated on
  // data-subtabs-ready the same way the page tabs are: without JS all three
  // stay in flow and the panel degrades to a readable stack.
  useLayoutEffect(() => {
    document.documentElement.toggleAttribute("data-subtabs-ready", !scrollMode);
    for (const t of tabs) {
      const el = document.getElementById(`about-${t.id}`);
      if (!el) continue;
      if (scrollMode) {
        // Cleared, not just ignored: a pane left hidden from a resize out of
        // tab mode would stay invisible with no control left to restore it.
        el.hidden = false;
        el.removeAttribute("aria-hidden");
        continue;
      }
      const isActive = t.id === active;
      el.hidden = !isActive;
      el.setAttribute("aria-hidden", String(!isActive));
    }
  }, [active, tabs, scrollMode]);

  const select = useCallback((id: string) => setActive(id), []);

  // Slide the pill to the active tab -- the same mechanism as the page tab bar,
  // so the two controls behave identically and not just look alike.
  useEffect(() => {
    if (scrollMode) return;
    const indicator = indicatorRef.current;
    const btn = triggerRefs.current[active];
    if (!indicator || !btn) return;
    const parent = indicator.parentElement;
    if (!parent) return;
    const pr = parent.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const to = { left: br.left - pr.left, width: br.width, opacity: 1 };
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
  }, [active, reduced, scrollMode]);

  // With every pane in flow the tablist controls nothing, and leaving it would
  // present three buttons that visibly do not switch anything.
  if (scrollMode) return null;

  return (
    <Tabs
      value={active}
      onValueChange={select}
      className="gap-0 shrink-0"
      activationMode="manual"
    >
      {/* Built like the page tab bar: a transparent track with one tab pill
          sliding behind the labels, rather than a filled track with a styled
          active stop. after:hidden kills the line variant's own ::after bar --
          2px of bg-foreground at bottom:-5px, which hangs below the control as
          a stray ink rule in either theme. The header suppresses it the same
          way. */}
      <TabsList
        variant="line"
        aria-label="About sections"
        className="about-subtabs relative h-auto gap-0.5 bg-transparent p-0 mx-auto [&_[data-slot=tabs-trigger]]:after:hidden"
      >
        <div
          ref={indicatorRef}
          className="tab-pill absolute top-0 bottom-0 rounded-full pointer-events-none z-0"
          style={{ left: 0, width: 0, opacity: 0 }}
          aria-hidden="true"
        />
        {tabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            id={`subtab-${t.id}`}
            aria-controls={`about-${t.id}`}
            ref={(el) => {
              triggerRefs.current[t.id] = el;
            }}
            className="about-subtab nav-link relative z-10 gap-1.5 px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-wider rounded-full data-[state=active]:text-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
