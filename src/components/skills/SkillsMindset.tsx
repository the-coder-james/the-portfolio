import { useEffect, useRef } from "react";
import { stagger, inView, spring } from "motion";
import { animateEl } from "@/lib/utils";

interface MindsetCard {
  icon: string;
  title: string;
  desc: string;
}

interface SkillsMindsetProps {
  cards: MindsetCard[];
}

export function SkillsMindset({ cards }: SkillsMindsetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    inView(root, () => {
      animateEl(
        root.querySelectorAll<Element>(".mindset-card"),
        { opacity: [0, 1], x: [40, 0] },
        { delay: stagger(0.1, { startDelay: 0.1 }), type: spring(0.5, 0.2) }
      );
    }, { margin: "-60px" });
  }, []);

  return (
    <div ref={ref} className="flex flex-col gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="mindset-card card-glow flex items-start gap-4 p-5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", opacity: 0 }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(59,130,246,0.12)", fontSize: "1.1rem" }}
          >
            {card.icon}
          </div>
          <div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>
              {card.title}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "2px", fontFamily: "'Space Grotesk', sans-serif" }}>
              {card.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
