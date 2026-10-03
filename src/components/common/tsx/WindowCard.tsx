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
 * The visible border is doing real work: it is the sheet's line-art edge
 * against the drafting paper. --color-card-border measures 4.2:1 on the page
 * and 4.5:1 on a sheet in Manual, 6.4:1 and 5.4:1 in Blueprint, above the 3:1
 * a component boundary needs (SC 1.4.11).
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
      // The border lives on .window-card rather than inline: an inline border
      // outranks the stylesheet, so its hover strengthening never showed.
      style={{
        background: raised
          ? "var(--color-card-surface-raised)"
          : "var(--color-card-surface)",
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
