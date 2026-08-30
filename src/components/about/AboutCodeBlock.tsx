import { TerminalShell } from "@/components/common/tsx/TerminalShell";
import { Reveal } from "@/components/common/tsx/Reveal";

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
  const CODE_BIO = buildCodeBio(since, professional);


  return (
    <Reveal x={40} delay={0.2}>
      <TerminalShell
        filename="about.ts"
        headerRight={
          <span
            className="px-2 py-0.5 rounded font-mono"
            style={{ background: "var(--tint-brand-15)", fontSize: "0.6rem", color: "var(--color-brand-400)" }}
          >
            TypeScript
          </span>
        }
        footer={
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-brand)" }} aria-hidden="true" />
            <span style={{ fontSize: "0.62rem", color: "var(--color-ink-faint)", fontFamily: "'JetBrains Mono'" }}>
              Ln 21, Col 1 · TypeScript · No errors
            </span>
          </div>
        }
        bodyClassName="p-6 flex gap-4"
      >
        {/* Decorative code sample: hidden from assistive tech so screen
            readers don't read a fake source file aloud. */}
        <div
          className="flex flex-col select-none font-mono"
          aria-hidden="true"
          style={{ color: "var(--color-chrome-line)", fontSize: "0.75rem", minWidth: "24px", textAlign: "right", lineHeight: 1.6 }}
        >
          {CODE_BIO.map((line, i) =>
            line.type === "blank"
              ? <div key={i} style={{ height: "0.9rem" }} />
              : <span key={i} className="code-lineno" style={{ lineHeight: 1.6 }}>{i + 1}</span>
          )}
        </div>
        <div className="font-mono flex-1" aria-hidden="true" style={{ fontSize: "0.78rem", lineHeight: 1.6, overflow: "hidden" }}>
          {CODE_BIO.map((line, i) => (
            <div key={i} className="code-line">
              <CodeLine line={line} />
            </div>
          ))}
        </div>
      </TerminalShell>
    </Reveal>
  );
}
