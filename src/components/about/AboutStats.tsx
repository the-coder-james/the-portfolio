import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface Stat {
  label: string;
  value: string;
  icon: string;
}

interface AboutStatsProps {
  stats: Stat[];
}

export function AboutStats({ stats }: AboutStatsProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 + i * 0.1 }}
          className="card-glow rounded-xl p-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div className="gradient-text" style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>
            {stat.value}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "4px", fontFamily: "'Space Grotesk', sans-serif" }}>
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
