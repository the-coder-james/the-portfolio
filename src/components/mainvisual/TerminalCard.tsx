import { motion } from "motion/react";
import { TerminalShell } from "@/components/common/tsx/TerminalShell";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TerminalCardProps {
  name: string;
  since: number;
  professional: number;
  stackLabels: string[];
}

export function TerminalCard({ name, since, professional, stackLabels }: TerminalCardProps) {
  const reduced = useReducedMotion();

  const stackContent = stackLabels.flatMap((label, i) => {
    const items = [<span key={`s${i}`} style={{ color: "var(--color-syn-tag)" }}>"{label}"</span>];
    if (i < stackLabels.length - 1) items.push(<span key={`c${i}`} style={{ color: "var(--color-code-ink-dim)" }}>, </span>);
    return items;
  });

  const terminalLines = [
    <><span style={{ color: "var(--color-syn-keyword)" }}>const</span> <span style={{ color: "var(--color-syn-ident)" }}>developer</span> <span style={{ color: "var(--color-code-ink)" }}>=</span> <span style={{ color: "var(--color-syn-string)" }}>{`{`}</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>name</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-tag)" }}>"{name}"</span><span style={{ color: "var(--color-code-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>since</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-number)" }}>{since}</span><span style={{ color: "var(--color-code-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>professional</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-number)" }}>{professional}</span><span style={{ color: "var(--color-code-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>stack</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-string)" }}>[</span>{stackContent}<span style={{ color: "var(--color-syn-string)" }}>]</span><span style={{ color: "var(--color-code-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>available</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-string)" }}>true</span></>,
    <><span style={{ color: "var(--color-syn-string)" }}>{`}`}</span><span style={{ color: "var(--color-code-ink-dim)" }}>;</span></>,
  ];


  // One declarative timeline replaces five hand-tuned animateEl calls with
  // manually-offset startDelays.
  //
  // These animate on mount, before the reduced-motion hook has reported, so
  // a reduced-motion visitor used to see the whole entrance. The duration
  // drops once the hook reports, and `data-reveal` lets the CSS pin the end
  // state from the first frame.
  const settle = { duration: 0 };
  const line = (i: number) => ({
    "data-reveal": "",
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
    transition: reduced ? settle : { delay: 0.7 + i * 0.1, type: "spring" as const, visualDuration: 0.35, bounce: 0.3 },
  });

  return (
    <motion.div
      data-reveal=""
      className={`hidden lg:block ${reduced ? "" : "terminal-float"}`}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduced ? settle : { type: "spring", visualDuration: 0.55, bounce: 0.2 }}
    >
      <TerminalShell
        filename="developer.config.ts"
        style={{
          // The hero's one floating sheet, so it takes the deepest print shadow.
          boxShadow: "var(--shadow-print-lg)",
        }}
        bodyClassName="px-6 py-6 font-mono"
        bodyStyle={{ fontSize: "0.82rem", lineHeight: 1.8 }}
        footer={
          <>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
              <span style={{ fontSize: "0.65rem", color: "var(--color-code-ink-dim)", fontFamily: "var(--font-mono)" }}>TypeScript</span>
            </div>
            <span style={{ fontSize: "0.65rem", color: "var(--color-code-ink-dim)", fontFamily: "var(--font-mono)" }}>UTF-8</span>
          </>
        }
      >
        {/* Decorative sample config: hidden so screen readers don't read it out. */}
        <div aria-hidden="true">
          <div className="flex gap-4">
            <div
              className="flex flex-col"
              style={{ color: "var(--color-code-ink-faint)", userSelect: "none", minWidth: "20px", textAlign: "right" }}
            >
              {terminalLines.map((_, i) => (
                <motion.span key={i} style={{ lineHeight: 1.8 }} {...line(i)}>{i + 1}</motion.span>
              ))}
            </div>
            <div className="flex-1">
              {terminalLines.map((content, i) => (
                <motion.div key={i} style={{ lineHeight: 1.8 }} {...line(i)}>
                  {content}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            data-reveal=""
            className="mt-4 flex items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? settle : { delay: 1.4, type: "spring", visualDuration: 0.5, bounce: 0.2 }}
          >
            <span style={{ color: "var(--color-code-success)" }}>❯</span>
            <span style={{ color: "var(--color-syn-ident)" }}>node</span>
            <span style={{ color: "var(--color-code-ink)" }}> developer.config.ts</span>
          </motion.div>
          <motion.div
            data-reveal=""
            style={{ color: "var(--color-code-success)", marginLeft: "18px" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? settle : { delay: 1.52, type: "spring", visualDuration: 0.5, bounce: 0.2 }}
          >
            ✓ Ready to build something awesome!
          </motion.div>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ color: "var(--color-code-success)" }}>❯</span>
            <span
              className="cursor-blink inline-block w-2 h-4 bg-brand-400"
              style={{ marginTop: "2px" }}
            />
          </div>
        </div>
      </TerminalShell>
    </motion.div>
  );
}
