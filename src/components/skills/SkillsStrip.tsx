import { useEffect, useRef } from "react";
import { animate, stagger, onScroll } from "animejs";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const allSkills = buildAllSkills(techstack, extraSkills);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    animate(container, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 700,
      ease: "out(3)",
      autoplay: onScroll({ target: container, enter: "bottom-=80 top" }),
    });

    animate(container.querySelectorAll(".skill-badge"), {
      opacity: [0, 1],
      scale: [0.5, 1],
      translateY: [12, 0],
      rotate: [-8, 0],
      duration: 600,
      delay: stagger(40, { from: "center" }),
      ease: "outElastic(1, 0.7)",
      autoplay: onScroll({ target: container, enter: "bottom-=80 top" }),
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-xl py-5 px-6"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: 0 }}
    >
      <p className="font-mono mb-4" style={{ fontSize: "0.65rem", color: "#1e3a5f", textAlign: "center" }}>
        // technologies I work with
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {allSkills.map((tech) => (
          <div key={tech} className="skill-badge" style={{ opacity: 0 }}>
            <Badge
              variant="outline"
              className="font-mono rounded-xl cursor-default"
              style={{ padding: "5px 11px", fontSize: "0.7rem", color: "#93c5fd", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.16)" }}
            >
              {tech}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
