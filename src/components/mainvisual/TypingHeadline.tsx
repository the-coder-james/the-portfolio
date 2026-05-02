import { useState, useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

interface TypingHeadlineProps {
  name: string;
  sequences: string[];
  headlinePrefix: string;
  rolePrefix: string;
}

function useTypingEffect(sequences: string[]) {
  const [text, setText] = useState("");
  const [seqIndex, setSeqIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const current = sequences[seqIndex];
    if (!deleting && charIndex < current.length) {
      const t = setTimeout(() => { setText(current.slice(0, charIndex + 1)); setCharIndex((c) => c + 1); }, 65);
      return () => clearTimeout(t);
    } else if (!deleting && charIndex === current.length) {
      setPaused(true);
      const t = setTimeout(() => { setPaused(false); setDeleting(true); }, 2000);
      return () => clearTimeout(t);
    } else if (deleting && charIndex > 0) {
      const t = setTimeout(() => { setText(current.slice(0, charIndex - 1)); setCharIndex((c) => c - 1); }, 35);
      return () => clearTimeout(t);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setSeqIndex((s) => (s + 1) % sequences.length);
    }
  }, [charIndex, deleting, paused, sequences, seqIndex]);

  return text;
}

export function TypingHeadline({ name, sequences, headlinePrefix, rolePrefix }: TypingHeadlineProps) {
  const typedText = useTypingEffect(sequences);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = headlineRef.current;
    if (!h) return;
    const fullText = `${headlinePrefix} ${name}`;
    h.innerHTML = fullText
      .split("")
      .map((ch) =>
        ch === " "
          ? `<span class="ah-char" style="display:inline-block;width:0.25em;">&nbsp;</span>`
          : `<span class="ah-char" style="display:inline-block;will-change:transform,opacity,filter;">${ch}</span>`
      )
      .join("");

    animate(".ah-char", {
      opacity: [0, 1],
      translateY: [40, 0],
      filter: ["blur(8px)", "blur(0px)"],
      rotateX: [-90, 0],
      duration: 700,
      delay: stagger(35, { start: 300 }),
      ease: "out(3)",
    });
  }, [name, headlinePrefix]);

  useEffect(() => {
    if (!roleRef.current) return;
    animate(roleRef.current, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 600,
      delay: 900,
      ease: "out(2)",
    });
  }, []);

  return (
    <>
      <div className="mb-2">
        <h1
          ref={headlineRef}
          className="glitch"
          data-text={`${headlinePrefix} ${name}`}
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            fontFamily: "'Space Grotesk', sans-serif",
            perspective: "800px",
          }}
        >
          {headlinePrefix} {name}
        </h1>
      </div>

      <div
        ref={roleRef}
        className="flex items-center gap-2 mb-6"
        style={{ height: "2.5rem", opacity: 0 }}
      >
        <span style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", color: "#94a3b8", fontFamily: "'Space Grotesk', sans-serif" }}>
          {rolePrefix}{" "}
        </span>
        <span
          className="gradient-text"
          style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {typedText}
        </span>
        <span
          className="cursor-blink inline-block w-0.5 h-7 bg-blue-400"
          style={{ marginLeft: "2px" }}
        />
      </div>
    </>
  );
}
