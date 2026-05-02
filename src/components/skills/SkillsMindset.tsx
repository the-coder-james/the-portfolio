import { useEffect, useRef } from "react";
import { animate, stagger, onScroll } from "animejs";

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
    animate(root.querySelectorAll(".mindset-card"), {
      opacity: [0, 1],
      translateX: [40, 0],
      duration: 550,
      delay: stagger(120, { start: 400 }),
      ease: "out(3)",
      autoplay: onScroll({ target: root, enter: "bottom-=80 top" }),
    });
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
