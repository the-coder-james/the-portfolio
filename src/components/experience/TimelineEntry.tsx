import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

interface TimelineItem {
  year: string;
  hash: string;
  title: string;
  company: string;
  type: string;
  description: string;
  tags: string[];
}

interface TimelineEntryProps {
  item: TimelineItem;
  index: number;
}

export function TimelineEntry({ item, index }: TimelineEntryProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isEven ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.5 + index * 0.12 }}
      className={`relative flex items-start gap-6 md:gap-0 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
    >
      <div className={`md:w-[45%] pl-14 md:pl-0 ${isEven ? "md:pr-10 md:text-right" : "md:pl-10 md:text-left"}`}>
        <div
          className="card-glow rounded-2xl p-5 text-left"
          style={{
            background: item.type === "present" ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.02)",
            border: item.type === "present" ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge
              variant="outline"
              className="font-mono rounded"
              style={{ fontSize: "0.6rem", color: "#60a5fa", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              {item.hash}
            </Badge>
            <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>
              {item.year}
            </span>
            {item.type === "present" && (
              <Badge
                className="gap-1 rounded-full"
                style={{ fontSize: "0.6rem", color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}
              >
                <span className="w-1 h-1 rounded-full bg-green-400 cursor-blink" />
                Live
              </Badge>
            )}
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "2px" }}>
            {item.title}
          </h3>
          <p style={{ fontSize: "0.78rem", color: "#3b82f6", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}>
            {item.company}
          </p>
          <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px" }}>
            {item.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="font-mono rounded"
                style={{ fontSize: "0.6rem", color: "#60a5fa", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.12)" }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 top-6">
        <div
          className="w-3 h-3 rounded-full relative"
          style={{
            background: item.type === "present" ? "#4ade80" : "#3b82f6",
            boxShadow: item.type === "present" ? "0 0 12px rgba(74,222,128,0.6)" : "0 0 12px rgba(59,130,246,0.5)",
          }}
        >
          {item.type === "present" && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "rgba(74,222,128,0.3)" }}
              animate={{ scale: [1, 2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      <div className="hidden md:block md:w-[45%]" />
    </motion.div>
  );
}
