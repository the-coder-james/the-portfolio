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
  return (
    <RevealGroup className="flex flex-col gap-4" preset="slide">
      {cards.map((card) => (
        <WindowCard
          key={card.title}
          title={`${card.title.toLowerCase().replace(/\s+/g, "-")}.md`}
          bodyClassName="flex items-start gap-4 p-5"
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--tint-brand-12)", fontSize: "1.1rem" }}
            aria-hidden="true"
          >
            {card.icon}
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-ink-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
              {card.title}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-ink-dim)", marginTop: "2px", fontFamily: "'Space Grotesk', sans-serif" }}>
              {card.desc}
            </div>
          </div>
        </WindowCard>
      ))}
    </RevealGroup>
  );
}
