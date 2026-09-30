"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme, toggleTheme } from "@/components/common/tsx/ThemeProvider";

interface ThemeToggleProps {
  /** Render the wide labelled form used inside the mobile drawer. */
  withLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ withLabel = false, className = "" }: ThemeToggleProps) {
  const theme = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Switch to standby mode" : "Switch to combat mode";

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        aria-pressed={dark}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-colors ${className}`}
        style={{ color: "var(--color-ink-dim)", background: "var(--tint-white-03)" }}
      >
        {dark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
        <span className="font-mono" style={{ fontSize: "0.75rem", letterSpacing: "0.06em" }}>
          {dark ? "COMBAT MODE" : "STANDBY MODE"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={dark}
      title={label}
      className={`icon-btn inline-flex w-9 h-9 items-center justify-center rounded-md transition-colors hover:bg-[var(--tint-white-06)] ${className}`}
    >
      {dark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
    </button>
  );
}
