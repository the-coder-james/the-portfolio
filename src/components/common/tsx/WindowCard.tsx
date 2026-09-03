import type { CSSProperties, ReactNode } from "react";
import { TrafficLights } from "@/components/common/tsx/TerminalShell";

interface WindowCardProps {
  /** Text shown centred in the titlebar, like a window name. */
  title?: string;
  /** Rendered at the right edge of the titlebar. */
  titlebarRight?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  /** Slightly lighter fill, for cards that should read as foreground. */
  raised?: boolean;
}

/**
 * A content card dressed as a macOS window: traffic-light titlebar over a
 * bordered surface.
 *
 * The controls are decorative — they are not buttons and carry no behaviour,
 * so they are marked aria-hidden and are not focusable. Making them look
 * interactive without acting interactive would be worse than leaving them out.
 *
 * The visible border is doing real work: cards were previously white at 2%
 * alpha over a near-black page, leaving their edge at ~1.03:1 against the
 * background. --color-card-border sits at 2.9:1 against the darkest section,
 * so the card boundary is actually perceivable.
 */
export function WindowCard({
  title,
  titlebarRight,
  children,
  className = "",
  style,
  bodyClassName = "p-5",
  bodyStyle,
  raised = false,
}: WindowCardProps) {
  return (
    <div
      className={`window-card rounded-xl overflow-hidden flex flex-col ${className}`}
      style={{
        background: raised
          ? "var(--color-card-surface-raised)"
          : "var(--color-card-surface)",
        border: "1px solid var(--color-card-border)",
        ...style,
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{
          background: "var(--color-card-titlebar)",
          borderBottom: "1px solid var(--color-card-border)",
        }}
      >
        <TrafficLights size="sm" />
        {title && (
          <span
            className="font-mono flex-1 text-center truncate"
            style={{ fontSize: "0.65rem", color: "var(--color-ink-dim)" }}
          >
            {title}
          </span>
        )}
        {/* Balances the traffic lights so a centred title stays centred. */}
        {titlebarRight ?? (title ? <span className="w-[38px] shrink-0" aria-hidden="true" /> : null)}
      </div>

      <div className={bodyClassName} style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
