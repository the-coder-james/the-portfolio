import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting.
 *
 * Returns false on the server and during the first client render so markup
 * matches between the two; the real value lands in an effect right after
 * hydration. Components should use it to skip or shorten animation, never to
 * hide content.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export default useReducedMotion;
