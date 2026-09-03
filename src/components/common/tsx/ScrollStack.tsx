import { useEffect } from "react";

/**
 * Turns the [data-stack-section] sections into a FILO card stack: each section
 * slides up over the one before it and settles on the pile, which stays pinned
 * underneath and recedes slightly.
 *
 * The previous implementation pinned every section at 100vh with
 * `overflow: hidden` and wrote `el.scrollTop` on each frame to reveal content
 * taller than the viewport. That is what made it feel rough — scrollTop is a
 * scroll position, so browsers snap it to whole pixels and never interpolate
 * it, and each write also invalidated layout. Nothing here writes scroll
 * positions or heights during scroll: sections are their natural height, the
 * page scrolls normally through them, and `position: sticky` does the pinning.
 * The only per-frame work is a transform and an opacity on the covered cards,
 * both of which stay on the compositor.
 */

const STACK_TOP = 0;      // where a card comes to rest
const SCALE_STEP = 0.03;  // how much each covered card shrinks
const VEIL_MAX = 0.45;    // how far a covered card darkens

export function ScrollStack() {
  useEffect(() => {
    // Under reduced motion the sections are left in normal document flow.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-stack-section]")
    );
    if (sections.length < 2) return;

    const veils: HTMLElement[] = [];
    const originalStyles: { el: HTMLElement; cssText: string }[] = [];

    sections.forEach((el, i) => {
      originalStyles.push({ el, cssText: el.style.cssText });

      // Position, height and radius come from the .stack-card class in CSS so
      // the layout is correct before JS runs. Only the stacking order and the
      // transform hint are set here.
      el.style.zIndex = `${i + 1}`;
      el.style.transformOrigin = "center top";
      el.style.willChange = "transform";

      // A sticky element taller than the viewport pins whichever edge its
      // offset names. With `top: 0` a tall section would pin its top edge and
      // its lower content would never scroll into view. Sticking such sections
      // to the bottom instead lets them scroll through normally and only pin
      // once their end is reached.
      applyStickyEdge(el);

      // Darkening layer for cards that have been covered. Absolute here (not
      // fixed, as before) because these sections are no longer internally
      // scrolled — it simply covers the card it belongs to.
      const veil = document.createElement("div");
      veil.setAttribute("aria-hidden", "true");
      veil.style.cssText =
        "position:absolute;inset:0;pointer-events:none;opacity:0;z-index:60;" +
        "background:var(--color-surface-deep);border-radius:inherit;" +
        "transition:opacity 120ms linear;";
      el.appendChild(veil);
      veils.push(veil);
    });

    // Chosen per section and re-evaluated on resize, since a section can cross
    // the viewport-height threshold when the window changes.
    function applyStickyEdge(el: HTMLElement) {
      const overflows = el.offsetHeight > window.innerHeight;
      if (overflows) {
        el.style.top = "auto";
        el.style.bottom = `${STACK_TOP}px`;
      } else {
        el.style.top = `${STACK_TOP}px`;
        el.style.bottom = "auto";
      }
    }

    let frame = 0;
    let queued = false;

    const requestUpdate = () => {
      if (queued) return;
      queued = true;
      frame = requestAnimationFrame(update);
    };

    function update() {
      queued = false;
      const viewportHeight = window.innerHeight;

      for (let i = 0; i < sections.length; i++) {
        const el = sections[i];
        const next = sections[i + 1];
        if (!next) {
          // The last card is never covered.
          el.style.transform = "";
          veils[i].style.opacity = "0";
          continue;
        }

        // How far the next card has travelled across this one: 0 when it is
        // still a full viewport below, 1 once it has fully covered this card.
        const nextTop = next.getBoundingClientRect().top;
        const progress = Math.min(1, Math.max(0, 1 - (nextTop - STACK_TOP) / viewportHeight));

        // Cards deeper in the pile recede a little further, so the stack reads
        // as depth rather than a single swap.
        el.style.transform = `scale(${1 - progress * SCALE_STEP})`;
        veils[i].style.opacity = `${progress * VEIL_MAX}`;
      }
    }

    const handleResize = () => {
      sections.forEach(applyStickyEdge);
      requestUpdate();
    };

    // A section can cross the viewport-height threshold when its content grows
    // (the projects grid has a "see more" button), so the sticky edge has to be
    // re-evaluated rather than decided once at mount.
    const resizeObserver = new ResizeObserver(() => {
      sections.forEach(applyStickyEdge);
      requestUpdate();
    });
    sections.forEach((el) => resizeObserver.observe(el));

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", handleResize);
      veils.forEach((veil) => veil.remove());
      originalStyles.forEach(({ el, cssText }) => {
        el.style.cssText = cssText;
      });
    };
  }, []);

  return null;
}
