import { useEffect } from "react";

/**
 * Drives the "stacking cards" scroll effect for sections marked
 * [data-stack-section]. A naive `position: sticky` stack only ever shows a
 * section's first viewport-height of content while pinned — anything taller
 * gets skipped past in the instant before the next section covers it.
 *
 * Instead, each stacked section is pinned inside a spacer sized to its own
 * natural content height, clipped to one viewport, and its content is
 * translated upward in sync with scroll so all of it is revealed before the
 * cover/fade transition (confined to the final viewport-height of the
 * spacer) begins.
 */
export function ScrollStack() {
  useEffect(() => {
    // Pinning clips every section to one viewport and animates scale/opacity as
    // they cover each other. Under reduced motion, leave the document in normal
    // flow instead — the sections simply stack and scroll.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-stack-section]")
    );
    if (sections.length === 0) return;

    const spacers: HTMLElement[] = [];
    const veils: HTMLElement[] = [];
    const originalStyles: { el: HTMLElement; cssText: string }[] = [];

    // Reserve the content's own height (for the reveal scroll) plus one
    // extra viewport-height as dedicated runway for the cover transition,
    // so the fade-out never overlaps content still being revealed. Content
    // can grow after mount (e.g. a "see more" button) or the viewport can
    // resize, so this is recomputed rather than measured once.
    const sizeSpacer = (el: HTMLElement, spacer: HTMLElement) => {
      const contentHeight = el.scrollHeight;
      const viewportHeight = window.innerHeight;
      spacer.style.height = `${Math.max(contentHeight, viewportHeight) + viewportHeight}px`;
    };

    sections.forEach((el, i) => {
      originalStyles.push({ el, cssText: el.style.cssText });

      const spacer = document.createElement("div");
      spacer.setAttribute("data-stack-spacer", "");
      spacer.style.position = "relative";

      el.parentElement?.insertBefore(spacer, el);
      spacer.appendChild(el);

      el.style.position = "sticky";
      el.style.top = "0";
      el.style.height = "100vh";
      el.style.overflow = "hidden";
      el.style.zIndex = `${i}`;

      // Darkening layer used instead of fading the section itself, so text and
      // borders keep their contrast for as long as they are legible. Fixed
      // rather than absolute: the section is scrolled internally via scrollTop,
      // so an absolute child would scroll away with the content. A pinned
      // section always fills the viewport, so fixed covers exactly it.
      const veil = document.createElement("div");
      veil.setAttribute("aria-hidden", "true");
      veil.style.cssText =
        "position:fixed;inset:0;pointer-events:none;opacity:0;" +
        "background:var(--color-surface-base);z-index:50;";
      el.appendChild(veil);
      veils.push(veil);

      sizeSpacer(el, spacer);
      spacers.push(spacer);
    });

    // `el` itself is clamped to 100vh with overflow hidden, so its own box
    // never resizes when inner content grows (e.g. a "see more" button) —
    // ResizeObserver on `el` would never fire. Watch the DOM subtree instead.
    let frame = 0;
    let queued = false;

    // The old version ran update() on every frame for the life of the page,
    // reading layout for each section whether or not anything had moved. Drive
    // it from scroll instead, coalescing to at most one update per frame.
    // `update` is a function declaration below, so it is hoisted.
    const requestUpdate = () => {
      if (queued) return;
      queued = true;
      frame = requestAnimationFrame(update);
    };

    const mutationObserver = new MutationObserver(() => {
      sections.forEach((el, i) => sizeSpacer(el, spacers[i]));
      requestUpdate();
    });
    sections.forEach((el) =>
      mutationObserver.observe(el, { childList: true, subtree: true })
    );

    const handleResize = () => {
      sections.forEach((el, i) => sizeSpacer(el, spacers[i]));
      requestUpdate();
    };
    window.addEventListener("resize", handleResize);

    function update() {
      queued = false;
      const viewportHeight = window.innerHeight;

      sections.forEach((el, i) => {
        const contentHeight = el.scrollHeight;
        const spacerRect = spacers[i].getBoundingClientRect();
        const scrolledPast = -spacerRect.top;

        const revealDistance = Math.max(0, contentHeight - viewportHeight);
        const revealProgress = revealDistance === 0
          ? 0
          : Math.min(1, Math.max(0, scrolledPast / revealDistance));
        el.scrollTop = revealProgress * revealDistance;

        const isLast = i === sections.length - 1;
        if (!isLast) {
          const spacerHeight = spacerRect.height;
          const remaining = spacerHeight - scrolledPast - viewportHeight;
          const transitionProgress = Math.min(1, Math.max(0, 1 - remaining / viewportHeight));

          // Recede with scale only. This used to also drop opacity to 0.65,
          // which dimmed text and card borders while they were still being
          // read — the depth cue cost real contrast. A dark overlay above the
          // content gives the same sense of falling back without touching the
          // opacity of the content itself.
          el.style.transform = `scale(${1 - transitionProgress * 0.06})`;
          const veil = veils[i];
          if (veil) veil.style.opacity = `${transitionProgress * 0.55}`;
        }
      });
    }

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
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
