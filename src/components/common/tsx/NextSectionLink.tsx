"use client";

import { ArrowRight } from "lucide-react";
import navData from "@/assets/data.json";

const navLinks = navData.nav;

interface NextSectionLinkProps {
  /** The id of the section this link sits in. */
  from: string;
}

/**
 * A link to the next section in the tour.
 *
 * The tab bar lets people jump anywhere, but it does not say what order the
 * sections are meant to be read in, so a first-time visitor has no suggested
 * path through the site. This gives each panel an onward step -- the last one
 * wraps back to the start so the tour never dead-ends.
 *
 * It is a real <a href="#next">, not a button: the header already drives tabs
 * from the location hash, so this needs no click handler, works on middle-click
 * and "copy link address", and still navigates if the JS never hydrates.
 */
export function NextSectionLink({ from }: NextSectionLinkProps) {
  const ids = navLinks.map((l) => l.href.slice(1));
  const i = ids.indexOf(from);
  if (i === -1) return null;

  // Wrap at the end rather than hiding the link: "back to the top" is a more
  // useful last step than nothing at all.
  const nextIndex = (i + 1) % navLinks.length;
  const next = navLinks[nextIndex];
  const isWrap = nextIndex === 0;

  return (
    <div className="next-section-row shrink-0 flex justify-end pt-2">
      <a
        href={next.href}
        aria-label={isWrap ? `Back to ${next.label}` : `Next section: ${next.label}`}
        className="next-section-link group inline-flex items-center gap-2 rounded-full px-3.5 py-2"
      >
        <span
          className="font-mono uppercase tracking-wider"
          style={{ fontSize: "0.6rem", color: "var(--color-ink-faint)" }}
        >
          {isWrap ? "back to" : "next"}
        </span>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif",
            color: "var(--color-brand-text)",
          }}
        >
          {next.label}
        </span>
        <ArrowRight
          size={15}
          aria-hidden="true"
          className="next-section-arrow"
          style={{ color: "var(--color-brand-text)" }}
        />
      </a>
    </div>
  );
}
