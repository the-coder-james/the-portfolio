import type { CSSProperties, ReactNode } from "react";

/**
 * The macOS-style traffic-light dots. These were duplicated byte-for-byte
 * across five components, varying only in size.
 *
 * Purely decorative, so hidden from assistive tech.
 */
export function TrafficLights({ size = "md" }: { size?: "sm" | "md" }) {
  const dot = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      <div className={`${dot} rounded-full`} style={{ background: "var(--color-chrome-red)" }} />
      <div className={`${dot} rounded-full`} style={{ background: "var(--color-chrome-yellow)" }} />
      <div className={`${dot} rounded-full`} style={{ background: "var(--color-chrome-green)" }} />
    </div>
  );
}

interface TerminalShellProps {
  /** Filename shown beside the traffic lights. */
  filename?: string;
  /** Rendered at the right edge of the header bar. */
  headerRight?: ReactNode;
  /** Optional status bar pinned under the body. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
}

/**
 * The editor/terminal window chrome shared by the code block, terminal card,
 * loading screen and contact panel: rounded surface, header bar with traffic
 * lights and a filename, body, optional status bar.
 */
export function TerminalShell({
  filename,
  headerRight,
  footer,
  children,
  className = "",
  style,
  bodyClassName = "",
  bodyStyle,
}: TerminalShellProps) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "var(--color-surface-code)",
        border: "1px solid var(--tint-brand-15)",
        boxShadow: "0 20px 50px var(--shadow-black-40)",
        ...style,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--color-surface-code-head)",
          borderBottom: "1px solid var(--tint-white-05)",
        }}
      >
        <div className="flex items-center gap-2">
          <TrafficLights />
          {filename && (
            <span className="ml-2 font-mono" style={{ fontSize: "0.7rem", color: "var(--color-ink-dim)" }}>
              {filename}
            </span>
          )}
        </div>
        {headerRight}
      </div>

      <div className={bodyClassName} style={bodyStyle}>
        {children}
      </div>

      {footer && (
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: "var(--color-surface-code-head)",
            borderTop: "1px solid var(--tint-white-05)",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
