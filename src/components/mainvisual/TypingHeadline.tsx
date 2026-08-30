import { TextEffect } from "@/components/motion-primitives/text-effect";
import { TextLoop } from "@/components/motion-primitives/text-loop";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TypingHeadlineProps {
  name: string;
  sequences: string[];
  headlinePrefix: string;
  rolePrefix: string;
}

export function TypingHeadline({ name, sequences, headlinePrefix, rolePrefix }: TypingHeadlineProps) {
  const reduced = useReducedMotion();
  const headline = `${headlinePrefix} ${name}`;

  const headingStyle = {
    fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
    fontWeight: 700,
    lineHeight: 1.1,
    color: "var(--color-ink)",
    letterSpacing: "-0.02em",
    fontFamily: "'Space Grotesk', sans-serif",
  } as const;

  const roleStyle = {
    fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
    fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
  } as const;

  return (
    <>
      <div className="mb-2">
        {/*
          The heading previously animated by overwriting innerHTML with one
          <span> per character, which destroyed React's children and left the
          accessible name as a pile of single letters. TextEffect animates
          per-character segments while the <h1> keeps its real text content.
        */}
        {reduced ? (
          <h1 style={headingStyle}>{headline}</h1>
        ) : (
          <TextEffect
            as="h1"
            per="char"
            preset="blur"
            delay={0.3}
            style={headingStyle}
          >
            {headline}
          </TextEffect>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6" style={{ height: "2.5rem" }}>
        <span style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", color: "var(--color-ink-dim)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {rolePrefix}{" "}
        </span>
        {/*
          The roles used to cycle through a per-character typewriter with no
          live region, so the role was never stably announced. TextLoop swaps
          whole strings, and the list is exposed once to assistive tech below.
        */}
        {reduced ? (
          <span className="gradient-text" style={roleStyle}>
            {sequences[0]}
          </span>
        ) : (
          <>
            {/* TextLoop only forwards className, so style and aria-hidden
                live on a wrapper rather than being silently dropped. */}
            <span aria-hidden="true" style={roleStyle}>
              <TextLoop className="gradient-text" interval={3}>
                {sequences.map((role) => (
                  <span key={role}>{role}</span>
                ))}
              </TextLoop>
            </span>
            <span className="sr-only">{sequences.join(", ")}</span>
            <span
              className="cursor-blink inline-block w-0.5 h-7 bg-blue-400"
              style={{ marginLeft: "2px" }}
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </>
  );
}
