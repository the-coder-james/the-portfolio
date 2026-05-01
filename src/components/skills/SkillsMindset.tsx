import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface MindsetCard {
  icon: string;
  title: string;
  desc: string;
}

interface SkillsMindsetProps {
  cards: MindsetCard[];
}

export function SkillsMindset({ cards }: SkillsMindsetProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="flex flex-col gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.4 + i * 0.12 }}
          className="card-glow flex items-start gap-4 p-5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
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
        </motion.div>
      ))}
    </div>
  );
}
