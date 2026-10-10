import { RevealGroup } from "@/components/common/tsx/RevealGroup";
import { WindowCard } from "@/components/common/tsx/WindowCard";

interface MindsetCard {
  icon: string;
  title: string;
  desc: string;
}

interface SkillsMindsetProps {
  cards: MindsetCard[];
}

export function SkillsMindset({ cards }: SkillsMindsetProps) {
  // One row of four on a wide screen, pairs on a tablet, a stack on the
  // narrowest phones -- where a pair left each card's file name truncated.
  return (
    <RevealGroup className="skills-mindset" preset="slide">
      {cards.map((card) => (
        <WindowCard
          key={card.title}
          title={`${card.title.toLowerCase().replace(/\s+/g, "-")}.md`}
          bodyClassName="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3.5"
        >
          <div
            className="mindset-icon rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--tint-brand-12)" }}
            aria-hidden="true"
          >
            {card.icon}
          </div>
          <div>
            <div className="mindset-title" style={{ fontWeight: 600, color: "var(--color-ink-muted)" }}>
              {card.title}
            </div>
            <div className="mindset-desc" style={{ color: "var(--color-ink-dim)", marginTop: "2px" }}>
              {card.desc}
            </div>
          </div>
        </WindowCard>
      ))}
    </RevealGroup>
  );
}
