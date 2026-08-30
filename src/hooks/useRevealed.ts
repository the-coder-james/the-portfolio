import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

/**
 * "Should this element show itself yet?" — an in-view check with a guaranteed
 * fallback.
 *
 * Every animated section on this page sits inside ScrollStack, which pins each
 * section, clips it to one viewport (`overflow: hidden`) and scrolls its
 * content internally via scrollTop. An IntersectionObserver measured against
 * the viewport can therefore fail to fire for content that the reader can
 * plainly see.
 *
 * Because these reveals animate *from* `opacity: 0`, a missed observer doesn't
 * just skip an animation — it leaves the content invisible for good. The timer
 * below makes that unreachable: whatever the observer reports, the element
 * reveals itself shortly after mount.
 */
export function useRevealed<T extends Element>(margin = "-60px") {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: margin as any });
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setElapsed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return { ref, revealed: inView || elapsed };
}
