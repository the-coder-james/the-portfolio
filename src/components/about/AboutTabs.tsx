"use client";
import { useState, useLayoutEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <TabsList
        aria-label="About sections"
        variant="line"
        className="about-subtabs h-auto p-1 flex-wrap justify-center gap-1 mx-auto"
      >
        {tabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            id={`subtab-${t.id}`}
            aria-controls={`about-${t.id}`}
            className="about-subtab gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[0.72rem] uppercase tracking-wider data-[state=active]:shadow-none"
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
