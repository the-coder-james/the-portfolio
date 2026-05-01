import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

interface TechTool {
  icon: string;
  color: string;
  title: string;
}

interface TechStack {
  name: string;
  icon: string;
  description: string;
  tools: TechTool[];
  badge: { label: string; icon: string; color: string };
}

interface ExtraSkills {
  frontend: string[];
  backend: string[];
  tools: string[];
}

interface SkillsStripProps {
  techstack: TechStack[];
  extraSkills: ExtraSkills;
}

function buildAllSkills(techstack: TechStack[], extra: ExtraSkills) {
  const lamp = techstack.find(t => t.name.toLowerCase().includes("lamp"));
  const mern = techstack.find(t => t.name.toLowerCase().includes("mern"));
  const ai   = techstack.find(t => t.name.toLowerCase().includes("ai") || t.name.toLowerCase().includes("generative"));

  return [...new Set([
    ...(lamp ? lamp.tools.map(t => t.title) : []),
    ...(mern ? mern.tools.filter(t => ["React", "MongoDB"].includes(t.title)).map(t => t.title) : []),
    ...extra.frontend,
    ...(mern ? mern.tools.filter(t => ["Express", "Node.js"].includes(t.title)).map(t => t.title) : []),
    ...extra.backend,
    ...(ai ? ai.tools.map(t => t.title) : []),
    ...extra.tools,
  ])];
}

export function SkillsStrip({ techstack, extraSkills }: SkillsStripProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const allSkills = buildAllSkills(techstack, extraSkills);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.8 }}
      className="overflow-hidden rounded-xl py-5 px-6"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <p className="font-mono mb-4" style={{ fontSize: "0.65rem", color: "#1e3a5f", textAlign: "center" }}>
        // technologies I work with
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {allSkills.map((tech, i) => (
          <motion.div
            key={tech}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.9 + i * 0.04 }}
          >
            <Badge
              variant="outline"
              className="font-mono rounded-xl cursor-default"
              style={{ padding: "5px 11px", fontSize: "0.7rem", color: "#93c5fd", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.16)" }}
            >
              {tech}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
