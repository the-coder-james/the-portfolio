import { useLayoutEffect, useState } from "react";

/**
 * The phone (SP) layout: 767px and below. Its complement is Tailwind's `md:`
 * (min-width: 768px), so a `md:` variant is always the PC side of this split.
 * Never `sm:` for that: sm is 640px, which is still phone-width here.
 */
export const SP_QUERY = "(max-width: 767px)";

/**
 * Tracks a media query. False on the server and during the first client
 * render, so markup matches between the two; the real value lands in a layout
 * effect, before the browser paints.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);

  return matches;
}
