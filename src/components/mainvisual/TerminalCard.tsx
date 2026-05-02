import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger } from "animejs";

interface TerminalCardProps {
  name: string;
  since: number;
  professional: number;
  stackLabels: string[];
}

export function TerminalCard({ name, since, professional, stackLabels }: TerminalCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const stackContent = stackLabels.flatMap((label, i) => {
    const items = [<span key={`s${i}`} style={{ color: "#f9a8d4" }}>"{label}"</span>];
    if (i < stackLabels.length - 1) items.push(<span key={`c${i}`} style={{ color: "#94a3b8" }}>, </span>);
    return items;
  });

  const terminalLines = [
    <><span style={{ color: "#60a5fa" }}>const</span> <span style={{ color: "#93c5fd" }}>developer</span> <span style={{ color: "#e2e8f0" }}>=</span> <span style={{ color: "#86efac" }}>{`{`}</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>name</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#f9a8d4" }}>"{name}"</span><span style={{ color: "#94a3b8" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>since</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#a5b4fc" }}>{since}</span><span style={{ color: "#94a3b8" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>professional</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#a5b4fc" }}>{professional}</span><span style={{ color: "#94a3b8" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>stack</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#86efac" }}>[</span>{stackContent}<span style={{ color: "#86efac" }}>]</span><span style={{ color: "#94a3b8" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>available</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#86efac" }}>true</span></>,
    <><span style={{ color: "#86efac" }}>{`}`}</span><span style={{ color: "#94a3b8" }}>;</span></>,
  ];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tl = createTimeline({ defaults: { ease: "out(3)" } });

    tl.add(root, {
      opacity: [0, 1],
      translateX: [60, 0],
      scale: [0.96, 1],
      duration: 800,
      delay: 400,
    })
      .add(
        root.querySelectorAll(".tc-dot"),
        {
          scale: [0, 1],
          opacity: [0, 0.8],
          duration: 400,
          delay: stagger(80),
          ease: "out(4)",
        },
        "-=500"
      )
      .add(
        root.querySelectorAll(".tc-line"),
        {
          opacity: [0, 1],
          translateX: [-12, 0],
          filter: ["blur(4px)", "blur(0px)"],
          duration: 400,
          delay: stagger(180),
        },
        "-=200"
      )
      .add(
        root.querySelectorAll(".tc-lineno"),
        {
          opacity: [0, 1],
          duration: 250,
          delay: stagger(180),
        },
        "<<"
      )
      .add(
        root.querySelectorAll(".tc-output"),
        {
          opacity: [0, 1],
          translateY: [6, 0],
          duration: 400,
          delay: stagger(220),
        }
      );

    // gentle floating idle loop
    animate(root, {
      translateY: [0, -10, 0],
      duration: 4000,
      ease: "inOut(2)",
      loop: true,
    });
  }, []);

  return (
    <div ref={rootRef} className="hidden lg:block" style={{ opacity: 0 }}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#0d1117",
          border: "1px solid rgba(59,130,246,0.2)",
          boxShadow: "0 0 50px rgba(59,130,246,0.1), 0 30px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="tc-dot w-3 h-3 rounded-full bg-red-500 opacity-80" />
          <div className="tc-dot w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
          <div className="tc-dot w-3 h-3 rounded-full bg-green-500 opacity-80" />
          <span className="ml-2 font-mono" style={{ fontSize: "0.72rem", color: "#4b5563" }}>
            developer.config.ts
          </span>
        </div>

        <div className="px-6 py-6 font-mono" style={{ fontSize: "0.82rem", lineHeight: 1.8 }}>
          <div className="flex gap-4">
            <div
              className="flex flex-col"
              style={{ color: "#374151", userSelect: "none", minWidth: "20px", textAlign: "right" }}
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
            <span style={{ color: "#22c55e" }}>❯</span>
            <span style={{ color: "#60a5fa" }}>node</span>
            <span style={{ color: "#e2e8f0" }}> developer.config.ts</span>
          </div>
          <div className="tc-output" style={{ color: "#4ade80", marginLeft: "18px", opacity: 0 }}>
            ✓ Ready to build something awesome!
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ color: "#22c55e" }}>❯</span>
            <span
              className="cursor-blink inline-block w-2 h-4 bg-blue-400"
              style={{ marginTop: "2px" }}
            />
          </div>
        </div>

        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ background: "#161b22", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span style={{ fontSize: "0.65rem", color: "#4b5563", fontFamily: "'JetBrains Mono'" }}>TypeScript</span>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#4b5563", fontFamily: "'JetBrains Mono'" }}>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
