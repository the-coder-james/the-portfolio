import { motion } from "motion/react";

interface TerminalCardProps {
  name: string;
  since: number;
  professional: number;
  stackLabels: string[];
}

export function TerminalCard({ name, since, professional, stackLabels }: TerminalCardProps) {
  const stackContent = stackLabels.flatMap((label, i) => {
    const items = [<span key={`s${i}`} style={{ color: "#f9a8d4" }}>"{label}"</span>];
    if (i < stackLabels.length - 1) items.push(<span key={`c${i}`} style={{ color: "#94a3b8" }}>, </span>);
    return items;
  });

  const terminalLines = [
    { delay: 0.3, content: <><span style={{ color: "#60a5fa" }}>const</span> <span style={{ color: "#93c5fd" }}>developer</span> <span style={{ color: "#e2e8f0" }}>=</span> <span style={{ color: "#86efac" }}>{`{`}</span></> },
    { delay: 0.7, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>name</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#f9a8d4" }}>"{name}"</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 1.1, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>since</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#a5b4fc" }}>{since}</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 1.5, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>professional</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#a5b4fc" }}>{professional}</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 1.9, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>stack</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#86efac" }}>[</span>{stackContent}<span style={{ color: "#86efac" }}>]</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 2.3, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>available</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#86efac" }}>true</span></> },
    { delay: 2.7, content: <><span style={{ color: "#86efac" }}>{`}`}</span><span style={{ color: "#94a3b8" }}>;</span></> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.8 }}
      className="hidden lg:block float-anim"
    >
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
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
          <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
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
                <span key={i} style={{ lineHeight: 1.8 }}>{i + 1}</span>
              ))}
            </div>
            <div className="flex-1">
              {terminalLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: line.delay, duration: 0.3 }}
                  style={{ lineHeight: 1.8 }}
                >
                  {line.content}
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.2 }}
            className="mt-4 flex items-center gap-2"
          >
            <span style={{ color: "#22c55e" }}>❯</span>
            <span style={{ color: "#60a5fa" }}>node</span>
            <span style={{ color: "#e2e8f0" }}> developer.config.ts</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.6 }}
            style={{ color: "#4ade80", marginLeft: "18px" }}
          >
            ✓ Ready to build something awesome!
          </motion.div>
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
    </motion.div>
  );
}
