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
  // 2x2 at every width. Stacking these one-up on phones made the four cards
  // ~500px of a ~600px pane -- the single biggest reason the Arsenal view
  // overflowed. The cards are short enough to pair.
  return (
    <RevealGroup className="skills-mindset grid grid-cols-2 gap-2 sm:gap-3" preset="slide">
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
