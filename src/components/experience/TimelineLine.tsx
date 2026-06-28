import { useEffect, useRef } from "react";
import { inView } from "motion";
import { animateEl } from "@/lib/utils";

export function TimelineLine() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    inView(el, () => {
      animateEl(
        el as Element,
        { scaleY: [0, 1], opacity: [0.3, 1] },
        { duration: 1.4, delay: 0.2, ease: "easeInOut" }
      );
    }, { margin: "-60px" });
  }, []);

  return (
    <div
      ref={ref}
      className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px"
      style={{
        background: "linear-gradient(180deg, #1d4ed8, #3b82f6, #60a5fa, transparent)",
        transformOrigin: "top",
        transform: "scaleY(0)",
      }}
    />
  );
}
