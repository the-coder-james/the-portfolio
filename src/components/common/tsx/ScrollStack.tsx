import { useEffect } from "react";

/**
 * Turns the [data-stack-section] sections into a FILO card stack: each card
 * scrolls up over the pile, comes to rest at the top, and stays there while the
 * next one slides over it.
 *
 * Two earlier approaches failed, and both failure modes are worth recording:
 *
 *  - Pinning every section at 100vh and writing `el.scrollTop` each frame to
 *    reveal tall content. scrollTop is a scroll position, so browsers snap it
 *    to whole pixels and never interpolate it — that was the jitter.
 *
 *  - Making every section `position: sticky` directly. With no scroll distance
 *    between them they all pinned at once and rendered on top of each other at
 *    the same offset, and a tall section stuck to `bottom: 0` pinned the moment
 *    it entered the viewport instead of scrolling through.
 *
 * What works is the standard pattern: each card is wrapped in a plain-flow
 * spacer that supplies the scroll distance, and the card sticks to the top of
 * its own spacer. Because the spacers are in normal flow, the cards are laid
 * out one after another and each pins only once its own spacer reaches the top.
 * Nothing writes scroll positions or heights during scroll; the per-frame work
 * is one transform and one opacity, both compositor-friendly.
 */

const SCALE_STEP = 0.04;  // how far a covered card recedes
const VEIL_MAX = 0.5;     // how far a covered card darkens

export function ScrollStack() {
  useEffect(() => {
    // Under reduced motion the sections stay in normal document flow.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-stack-section]")
    );
    if (sections.length < 2) return;

    const spacers: HTMLElement[] = [];
    const veils: HTMLElement[] = [];
    const originalStyles: { el: HTMLElement; cssText: string }[] = [];

    sections.forEach((el, i) => {
      originalStyles.push({ el, cssText: el.style.cssText });

      const spacer = document.createElement("div");
      spacer.setAttribute("data-stack-spacer", "");
      spacer.style.position = "relative";
      el.parentElement?.insertBefore(spacer, el);
      spacer.appendChild(el);
      spacers.push(spacer);

      el.style.position = "sticky";
      el.style.top = "0";
      el.style.zIndex = `${i + 1}`;
      el.style.transformOrigin = "center top";
      el.style.willChange = "transform";

      const veil = document.createElement("div");
      veil.setAttribute("aria-hidden", "true");
      veil.style.cssText =
        "position:absolute;inset:0;pointer-events:none;opacity:0;z-index:60;" +
        "background:var(--color-surface-deep);border-radius:inherit;";
      el.appendChild(veil);
      veils.push(veil);
    });

    /**
     * The spacer is the card's own height plus one viewport of runway. That
     * runway is the distance over which the card sits pinned at the top while
     * the next one travels up and covers it — without it, a card would be
     * replaced the instant it finished scrolling.
     */
    const sizeSpacers = () => {
      sections.forEach((el, i) => {
        // The last card needs no cover runway; nothing follows it.
        const runway = i === sections.length - 1 ? 0 : window.innerHeight;
        spacers[i].style.height = `${el.offsetHeight + runway}px`;
      });
    };

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
        if (i === sections.length - 1) {
          el.style.transform = "";
          veils[i].style.opacity = "0";
          continue;
        }

        // Progress of this card being covered. The spacer is the card plus one
        // viewport of runway, and the runway only begins once the card itself
        // has scrolled past — so measure from the end of the card, not from the
        // top of the spacer. (Measuring from the spacer top counted the card's
        // own height as consumed runway, which pinned progress at 1 from the
        // very first frame.)
        const spacerRect = spacers[i].getBoundingClientRect();
        const scrolledPast = -spacerRect.top;
        const runwayUsed = scrolledPast - (el.offsetHeight - viewportHeight);
        const progress = Math.min(1, Math.max(0, runwayUsed / viewportHeight));

        el.style.transform = `scale(${1 - progress * SCALE_STEP})`;
        veils[i].style.opacity = `${progress * VEIL_MAX}`;
      }
    }

    const handleResize = () => {
      sizeSpacers();
      requestUpdate();
    };

    // Card height changes when content grows (the projects "see more" button),
    // which changes how much runway its spacer needs.
    const resizeObserver = new ResizeObserver(handleResize);
    sections.forEach((el) => resizeObserver.observe(el));

    sizeSpacers();
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", handleResize);
      veils.forEach((veil) => veil.remove());
      spacers.forEach((spacer) => {
        const el = spacer.firstElementChild;
        if (el) spacer.parentElement?.insertBefore(el, spacer);
        spacer.remove();
      });
      originalStyles.forEach(({ el, cssText }) => {
        el.style.cssText = cssText;
      });
    };
  }, []);

  return null;
}
