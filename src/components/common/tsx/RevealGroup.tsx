import { useRef, type ReactNode } from "react";
import { useInView } from "motion/react";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Preset = "fade" | "slide" | "scale" | "blur" | "blur-slide" | "zoom" | "flip" | "bounce" | "rotate" | "swing";

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  preset?: Preset;
  /** Margin passed to the in-view observer. */
  margin?: string;
}

/**
 * Staggered reveal that fires when the group scrolls into view.
 *
 * AnimatedGroup animates on mount, which is wrong for below-the-fold content:
 * the animation would play unseen and the cards would look static by the time
 * they scroll in. This gates it on an in-view check, matching the behaviour of
 * the `inView(...)` calls it replaces.
 *
 * The sentinel is a zero-height element rather than a wrapper around the
 * children, so the caller's `className` stays on the element that actually
 * lays the children out (grids and flex rows depend on being the direct
 * parent). Under reduced motion the children render immediately.
 */
export function RevealGroup({
  children,
  className,
  preset = "fade",
  margin = "-60px",
}: RevealGroupProps) {
  const sentinel = useRef<HTMLSpanElement>(null);
  const inView = useInView(sentinel, { once: true, margin: margin as any });
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <>
      <span ref={sentinel} aria-hidden="true" style={{ display: "block", height: 0 }} />
      {inView ? (
        <AnimatedGroup className={className} preset={preset}>
          {children}
        </AnimatedGroup>
      ) : (
        <div className={className} style={{ opacity: 0 }}>
          {children}
        </div>
      )}
    </>
  );
}
