import { useEffect, useRef } from "react";
import { stagger } from "motion";
import { animateEl } from "@/lib/utils";

interface TerminalCardProps {
  name: string;
  since: number;
  professional: number;
  stackLabels: string[];
}

export function TerminalCard({ name, since, professional, stackLabels }: TerminalCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const stackContent = stackLabels.flatMap((label, i) => {
    const items = [<span key={`s${i}`} style={{ color: "var(--color-syn-tag)" }}>"{label}"</span>];
    if (i < stackLabels.length - 1) items.push(<span key={`c${i}`} style={{ color: "var(--color-ink-dim)" }}>, </span>);
    return items;
  });

  const terminalLines = [
    <><span style={{ color: "var(--color-brand-400)" }}>const</span> <span style={{ color: "var(--color-brand-300)" }}>developer</span> <span style={{ color: "var(--color-ink-muted)" }}>=</span> <span style={{ color: "var(--color-syn-string)" }}>{`{`}</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>name</span><span style={{ color: "var(--color-ink-muted)" }}>:</span> <span style={{ color: "var(--color-syn-tag)" }}>"{name}"</span><span style={{ color: "var(--color-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>since</span><span style={{ color: "var(--color-ink-muted)" }}>:</span> <span style={{ color: "var(--color-syn-number)" }}>{since}</span><span style={{ color: "var(--color-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>professional</span><span style={{ color: "var(--color-ink-muted)" }}>:</span> <span style={{ color: "var(--color-syn-number)" }}>{professional}</span><span style={{ color: "var(--color-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>stack</span><span style={{ color: "var(--color-ink-muted)" }}>:</span> <span style={{ color: "var(--color-syn-string)" }}>[</span>{stackContent}<span style={{ color: "var(--color-syn-string)" }}>]</span><span style={{ color: "var(--color-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>available</span><span style={{ color: "var(--color-ink-muted)" }}>:</span> <span style={{ color: "var(--color-syn-string)" }}>true</span></>,
    <><span style={{ color: "var(--color-syn-string)" }}>{`}`}</span><span style={{ color: "var(--color-ink-dim)" }}>;</span></>,
  ];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Card entrance with spring
    animateEl(
      root as Element,
      { x: [60, 0], opacity: [0, 1], scale: [0.96, 1] },
      { delay: 0.4, type: "spring", visualDuration: 0.8, bounce: 0.25 }
    );

    // Traffic light dots pop in
    animateEl(
      root.querySelectorAll<Element>(".tc-dot"),
      { scale: [0, 1], opacity: [0, 0.8] },
      { delay: stagger(0.08, { startDelay: 0.55 }), type: "spring", visualDuration: 0.4, bounce: 0.1 }
    );

    // Code lines blur-slide in
    animateEl(
      root.querySelectorAll<Element>(".tc-line"),
      { x: [-12, 0], opacity: [0, 1], filter: ["blur(4px)", "blur(0px)"] },
      { delay: stagger(0.1, { startDelay: 0.7 }), type: "spring", visualDuration: 0.4, bounce: 0.3 }
    );

    // Line numbers fade in sync
    animateEl(
      root.querySelectorAll<Element>(".tc-lineno"),
      { opacity: [0, 1] },
      { delay: stagger(0.1, { startDelay: 0.7 }), duration: 0.25 }
    );

    // Output lines slide up
    animateEl(
      root.querySelectorAll<Element>(".tc-output"),
      { y: [8, 0], opacity: [0, 1] },
      { delay: stagger(0.12, { startDelay: 1.4 }), type: "spring", visualDuration: 0.5, bounce: 0.2 }
    );

    // Gentle float idle loop via CSS (avoids JS loop overhead)
    root.style.animation = "terminalFloat 4s ease-in-out infinite";
  }, []);

  return (
    <div ref={rootRef} className="hidden lg:block" style={{ opacity: 0 }}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface-code)",
          border: "1px solid var(--tint-brand-20)",
          boxShadow: "0 0 50px var(--tint-brand-10), 0 30px 60px var(--shadow-black-50)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ background: "var(--color-surface-code-head)", borderBottom: "1px solid var(--tint-white-06)" }}
        >
          <div className="tc-dot w-3 h-3 rounded-full bg-red-500 opacity-80" />
          <div className="tc-dot w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
          <div className="tc-dot w-3 h-3 rounded-full bg-green-500 opacity-80" />
          <span className="ml-2 font-mono" style={{ fontSize: "0.72rem", color: "var(--color-ink-dim)" }}>
            developer.config.ts
          </span>
        </div>

        <div className="px-6 py-6 font-mono" style={{ fontSize: "0.82rem", lineHeight: 1.8 }}>
          <div className="flex gap-4">
            <div
              className="flex flex-col"
              style={{ color: "var(--color-ink-faint)", userSelect: "none", minWidth: "20px", textAlign: "right" }}
            >
              {terminalLines.map((_, i) => (
                <span key={i} className="tc-lineno" style={{ lineHeight: 1.8, opacity: 0 }}>{i + 1}</span>
              ))}
            </div>
            <div className="flex-1">
              {terminalLines.map((content, i) => (
                <div key={i} className="tc-line" style={{ lineHeight: 1.8, opacity: 0 }}>
                  {content}
                </div>
              ))}
            </div>
          </div>

          <div className="tc-output mt-4 flex items-center gap-2" style={{ opacity: 0 }}>
            <span style={{ color: "var(--color-success-strong)" }}>❯</span>
            <span style={{ color: "var(--color-brand-400)" }}>node</span>
            <span style={{ color: "var(--color-ink-muted)" }}> developer.config.ts</span>
          </div>
          <div className="tc-output" style={{ color: "var(--color-success)", marginLeft: "18px", opacity: 0 }}>
            ✓ Ready to build something awesome!
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ color: "var(--color-success-strong)" }}>❯</span>
            <span
              className="cursor-blink inline-block w-2 h-4 bg-blue-400"
              style={{ marginTop: "2px" }}
            />
          </div>
        </div>

        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: "var(--color-surface-code-head)", borderTop: "1px solid var(--tint-white-05)" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span style={{ fontSize: "0.65rem", color: "var(--color-ink-dim)", fontFamily: "'JetBrains Mono'" }}>TypeScript</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "var(--color-ink-dim)", fontFamily: "'JetBrains Mono'" }}>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
