import { useEffect, useRef } from "react";
import { stagger, inView } from "motion";
import { animateEl } from "@/lib/utils";

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
  if (line.type === "comment")       return <div style={{ color: "var(--color-ink-dim)" }}>{line.content}</div>;
  if (line.type === "keyword")       return (
    <div>
      <span style={{ color: "var(--color-syn-keyword)" }}>{line.content}</span>
      <span style={{ color: "var(--color-brand-400)" }}> Developer</span>
      <span style={{ color: "var(--color-ink-dim)" }}> extends </span>
      <span style={{ color: "var(--color-brand-400)" }}>Human</span>
      <span style={{ color: "var(--color-ink-muted)" }}> {"{"}</span>
    </div>
  );
  if (line.type === "indent")        return (
    <div style={{ paddingLeft: "1.5rem" }}>
      <span style={{ color: "var(--color-syn-fn)" }}>{line.label}</span>
      <span style={{ color: "var(--color-ink-dim)" }}> = </span>
      <span style={{ color: line.label === "started" || line.label === "professional" ? "var(--color-syn-number)" : "var(--color-syn-string)" }}>
        {line.value}
      </span>
      <span style={{ color: "var(--color-ink-dim)" }}>;</span>
    </div>
  );
  if (line.type === "method")        return <div style={{ color: "var(--color-ink-muted)" }}>{line.content}</div>;
  if (line.type === "method-body")   return <div style={{ color: "var(--color-ink-dim)" }}>{line.content}</div>;
  if (line.type === "keyword-close") return <div style={{ color: "var(--color-ink-muted)" }}>{line.content}</div>;
  return null;
}

export function AboutCodeBlock({ since, professional }: AboutCodeBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const CODE_BIO = buildCodeBio(since, professional);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    inView(root, () => {
      animateEl(root as Element, { opacity: [0, 1], x: [40, 0] }, { delay: 0.2, type: "spring", visualDuration: 0.6, bounce: 0.25 });
      animateEl(
        root.querySelectorAll(".code-line"),
        { opacity: [0, 1], x: [-8, 0] },
        { delay: stagger(0.04, { startDelay: 0.4 }), type: "spring", visualDuration: 0.35, bounce: 0.3 }
      );
      animateEl(
        root.querySelectorAll(".code-lineno"),
        { opacity: [0, 1] },
        { delay: stagger(0.04, { startDelay: 0.4 }), duration: 0.25 }
      );
    }, { margin: "-80px" });
  }, []);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-surface-code)", border: "1px solid var(--tint-brand-15)", boxShadow: "0 20px 50px var(--shadow-black-40)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: "var(--color-surface-code-head)", borderBottom: "1px solid var(--tint-white-05)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-chrome-red)" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-chrome-yellow)" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-chrome-green)" }} />
            </div>
            <span className="font-mono ml-2" style={{ fontSize: "0.7rem", color: "var(--color-ink-dim)" }}>about.ts</span>
          </div>
          <span
            className="px-2 py-0.5 rounded font-mono"
            style={{ background: "var(--tint-brand-15)", fontSize: "0.6rem", color: "var(--color-brand-400)" }}
          >
            TypeScript
          </span>
        </div>

        <div className="p-6 flex gap-4">
          <div
            className="flex flex-col select-none font-mono"
            style={{ color: "var(--color-chrome-line)", fontSize: "0.75rem", minWidth: "24px", textAlign: "right", lineHeight: 1.6 }}
          >
            {CODE_BIO.map((line, i) =>
              line.type === "blank"
                ? <div key={i} style={{ height: "0.9rem" }} />
                : <span key={i} className="code-lineno" style={{ lineHeight: 1.6, opacity: 0 }}>{i + 1}</span>
            )}
          </div>
          <div className="font-mono flex-1" style={{ fontSize: "0.78rem", lineHeight: 1.6, overflow: "hidden" }}>
            {CODE_BIO.map((line, i) => (
              <div key={i} className="code-line" style={{ opacity: 0 }}>
                <CodeLine line={line} />
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{ background: "var(--color-surface-code-head)", borderTop: "1px solid var(--tint-white-04)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-brand)" }} />
          <span style={{ fontSize: "0.62rem", color: "var(--color-ink-faint)", fontFamily: "'JetBrains Mono'" }}>
            Ln 21, Col 1 · TypeScript · No errors
          </span>
        </div>
      </div>
    </div>
  );
}
