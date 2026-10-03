"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme, toggleTheme } from "@/components/common/tsx/ThemeProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThemeToggleProps {
  /** Render the wide labelled form used inside the mobile drawer. */
  withLabel?: boolean;
  className?: string;
}

/**
 * The Manual / Blueprint switch -- named for the paper each theme prints on.
 * The icons stay sun/moon: that is the affordance people recognise as a theme
 * switch.
 *
 * A toggle button keeps one name and reports its state through aria-pressed
 * (WAI-ARIA APG). The name used to flip with the state as well, so assistive
 * tech announced "Switch to standby mode, pressed" -- a name describing the
 * press while the state described the current mode. Now it reads "Blueprint
 * mode, pressed" or "not pressed", and only the tooltip names the action.
 *
 * The action used to sit in title=, which keyboard and touch users never see.
 * It is a real tooltip now: Radix opens it on keyboard focus as well as hover.
 */
export function ThemeToggle({ withLabel = false, className = "" }: ThemeToggleProps) {
  const theme = useTheme();
  const dark = theme === "dark";
  const name = "Blueprint mode";
  const action = dark ? "Switch to manual mode" : "Switch to blueprint mode";

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={dark}
        title={action}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm transition-colors ${className}`}
        style={{ color: "var(--color-ink-dim)", background: "var(--tint-white-03)" }}
      >
        {dark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
        {/* The visible text is the accessible name, so it stays constant too;
            the icon and aria-pressed carry the state. */}
        <span className="font-mono" style={{ fontSize: "0.75rem", letterSpacing: "0.06em" }}>
          BLUEPRINT MODE
        </span>
      </button>
    );
  }

  return (
    // Its own provider: the toggle lives in the header island, which has no
    // other tooltips to share one with.
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={name}
            aria-pressed={dark}
            className={`icon-btn inline-flex w-9 h-9 items-center justify-center rounded-md transition-colors hover:bg-[var(--tint-white-06)] ${className}`}
          >
            {dark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{action}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
