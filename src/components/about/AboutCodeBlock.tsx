import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface AboutCodeBlockProps {
  since: number;
  professional: number;
}

const buildCodeBio = (since: number, professional: number) => [
  { type: "comment",      content: "/**" },
  { type: "comment",      content: " * About Me — A human who writes code" },
  { type: "comment",      content: " */" },
  { type: "blank",        content: "" },
  { type: "keyword",      content: "class", rest: " Developer extends Human {" },
  { type: "blank",        content: "" },
  { type: "indent",       label: "mission",      value: '"Bridge design & functionality"' },
  { type: "indent",       label: "started",      value: String(since) },
  { type: "indent",       label: "professional", value: String(professional) },
  { type: "blank",        content: "" },
  { type: "method",       content: "  buildAnything() {" },
  { type: "method-body",  content: '    return ["e-commerce", "landing pages",' },
  { type: "method-body",  content: '            "business sites", "more..."];' },
  { type: "method",       content: "  }" },
  { type: "blank",        content: "" },
  { type: "method",       content: "  growEveryDay() {" },
  { type: "method-body",  content: "    this.skills.push(latestTech);" },
  { type: "method-body",  content: "    this.designEye.sharpen();" },
  { type: "method",       content: "  }" },
  { type: "blank",        content: "" },
  { type: "keyword-close", content: "}" },
];

type CodeLineType = ReturnType<typeof buildCodeBio>[number];

function CodeLine({ line }: { line: CodeLineType }) {
  if (line.type === "blank")         return <div style={{ height: "0.9rem" }} />;
  if (line.type === "comment")       return <div style={{ color: "#4b5563" }}>{line.content}</div>;
  if (line.type === "keyword")       return (
    <div>
      <span style={{ color: "#c084fc" }}>{line.content}</span>
      <span style={{ color: "#60a5fa" }}> Developer</span>
      <span style={{ color: "#94a3b8" }}> extends </span>
      <span style={{ color: "#60a5fa" }}>Human</span>
      <span style={{ color: "#e2e8f0" }}> {"{"}</span>
    </div>
  );
  if (line.type === "indent")        return (
    <div style={{ paddingLeft: "1.5rem" }}>
      <span style={{ color: "#fcd34d" }}>{line.label}</span>
      <span style={{ color: "#94a3b8" }}> = </span>
      <span style={{ color: line.label === "started" || line.label === "professional" ? "#a5b4fc" : "#86efac" }}>
        {line.value}
      </span>
      <span style={{ color: "#94a3b8" }}>;</span>
    </div>
  );
  if (line.type === "method")        return <div style={{ color: "#e2e8f0" }}>{line.content}</div>;
  if (line.type === "method-body")   return <div style={{ color: "#94a3b8" }}>{line.content}</div>;
  if (line.type === "keyword-close") return <div style={{ color: "#e2e8f0" }}>{line.content}</div>;
  return null;
}

export function AboutCodeBlock({ since, professional }: AboutCodeBlockProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const CODE_BIO = buildCodeBio(since, professional);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.4 }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#0d1117", border: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
            </div>
            <span className="font-mono ml-2" style={{ fontSize: "0.7rem", color: "#4b5563" }}>about.ts</span>
          </div>
          <span
            className="px-2 py-0.5 rounded font-mono"
            style={{ background: "rgba(59,130,246,0.15)", fontSize: "0.6rem", color: "#60a5fa" }}
          >
            TypeScript
          </span>
        </div>

        <div className="p-6 flex gap-4">
          <div
            className="flex flex-col select-none font-mono"
            style={{ color: "#2d3748", fontSize: "0.75rem", minWidth: "24px", textAlign: "right", lineHeight: 1.6 }}
          >
            {CODE_BIO.map((line, i) =>
              line.type === "blank"
                ? <div key={i} style={{ height: "0.9rem" }} />
                : <span key={i} style={{ lineHeight: 1.6 }}>{i + 1}</span>
            )}
          </div>
          <div className="font-mono flex-1" style={{ fontSize: "0.78rem", lineHeight: 1.6, overflow: "hidden" }}>
            {CODE_BIO.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.04 }}
              >
                <CodeLine line={line} />
              </motion.div>
            ))}
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{ background: "#161b22", borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3b82f6" }} />
          <span style={{ fontSize: "0.62rem", color: "#374151", fontFamily: "'JetBrains Mono'" }}>
            Ln 21, Col 1 · TypeScript · No errors
          </span>
        </div>
      </div>
    </motion.div>
  );
}
