import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";

export function TimelineLine() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    animate(el, {
      scaleY: [0, 1],
      opacity: [0.3, 1],
      duration: 1500,
      delay: 300,
      ease: "inOut(2)",
      autoplay: onScroll({ target: el, enter: "bottom-=80 top" }),
    });
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
