import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

/**
 * "Should this element show itself yet?" -- true once the element has scrolled
 * into view, and it stays true.
 *
 * The page is one scrolling document, so this is what makes a section's
 * content arrive as the reader reaches it instead of having played, unseen, on
 * load. It works inside a section's own scroll region too: the observer clips
 * against every scrolling ancestor, so a project card below the fold of the
 * grid reveals when the grid is scrolled to it.
 *
 * There used to be a 1200ms timer that revealed everything regardless. It was
 * there for tab panels hidden with display:none, which never intersect; with
 * every section in the document it would only fire the reveals below the fold,
 * where nobody sees them. The end state still never depends on this hook:
 * reduced motion and no-JS pin every [data-reveal] node visible in CSS, and a
 * browser without IntersectionObserver reveals at once.
 */
export function useRevealed<T extends Element>(margin = "-60px") {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: margin as any });
  const [noObserver, setNoObserver] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") setNoObserver(true);
  }, []);

  return { ref, revealed: inView || noObserver };
}
