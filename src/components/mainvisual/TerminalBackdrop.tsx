import { TerminalShell } from "@/components/common/tsx/TerminalShell";

interface TerminalBackdropProps {
  name: string;
  stackLabels: string[];
}

/**
 * The hero's config card as a mobile backdrop.
 *
 * The full TerminalCard is hidden below lg, which removed the strongest "this
 * is a developer" signal from the devices most visitors arrive on. Placing it
 * back in the flow cost ~155px of the little height a phone has and pushed the
 * copy down; behind the copy it keeps the signal and costs nothing -- the same
 * trade the About panel makes with its code block.
 *
 * It lives here rather than inside TerminalCard because it has to render as a
 * sibling of the hero's other decorative layers. Inside the content column it
 * sat within `div.relative z-10`, a stacking context it could never render
 * behind no matter what z-index it took.
 *
 * Deliberately not a motion component: the entrance animation writes opacity
 * inline, and an inline style outranks the stylesheet rule that fades this to a
 * backdrop. A decorative layer at 20% does not need an entrance.
 */
export function TerminalBackdrop({ name, stackLabels }: TerminalBackdropProps) {
  const stackContent = stackLabels.flatMap((label, i) => {
    const items = [<span key={`s${i}`} style={{ color: "var(--color-syn-tag)" }}>"{label}"</span>];
    if (i < stackLabels.length - 1) items.push(<span key={`c${i}`} style={{ color: "var(--color-code-ink-dim)" }}>, </span>);
    return items;
  });

  // Name, stack and the availability flag: what a visitor actually reads off
  // the card. The full seven lines plus run output need ~300px.
  const lines = [
    <><span style={{ color: "var(--color-syn-keyword)" }}>const</span> <span style={{ color: "var(--color-syn-ident)" }}>dev</span> <span style={{ color: "var(--color-code-ink)" }}>=</span> <span style={{ color: "var(--color-syn-string)" }}>{`{`}</span> <span style={{ color: "var(--color-syn-fn)" }}>name</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-tag)" }}>"{name}"</span><span style={{ color: "var(--color-code-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>stack</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-string)" }}>[</span>{stackContent}<span style={{ color: "var(--color-syn-string)" }}>]</span><span style={{ color: "var(--color-code-ink-dim)" }}>,</span></>,
    <>&nbsp;&nbsp;<span style={{ color: "var(--color-syn-fn)" }}>available</span><span style={{ color: "var(--color-code-ink)" }}>:</span> <span style={{ color: "var(--color-syn-string)" }}>true</span> <span style={{ color: "var(--color-syn-string)" }}>{`}`}</span><span style={{ color: "var(--color-code-ink-dim)" }}>;</span></>,
  ];

  return (
    <div className="hero-terminal-compact lg:hidden" aria-hidden="true">
      <TerminalShell
        filename="developer.config.ts"
        style={{ border: "1px solid var(--tint-brand-20)" }}
        bodyClassName="font-mono hero-terminal-compact-body"
        footer={
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
            <span style={{ fontSize: "0.58rem", color: "var(--color-code-ink-dim)", fontFamily: "'JetBrains Mono'" }}>TypeScript</span>
          </div>
        }
      >
        <div>
          {lines.map((content, i) => (
            <div key={i} className="hero-terminal-compact-line">{content}</div>
          ))}
        </div>
      </TerminalShell>
    </div>
  );
}
