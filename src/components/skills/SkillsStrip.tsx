import { Badge } from "@/components/ui/badge";
import { InfiniteSlider } from "@/components/motion-primitives/infinite-slider";
import { useReducedMotion } from "@/hooks/useReducedMotion";

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
  const allSkills = buildAllSkills(techstack, extraSkills);
  const reduced = useReducedMotion();

  const badges = allSkills.map((tech) => (
    <Badge
      key={tech}
      variant="outline"
      className="skill-badge-interactive font-mono rounded-xl cursor-default whitespace-nowrap"
      style={{ padding: "5px 11px", fontSize: "0.7rem", color: "var(--color-brand-300)" }}
    >
      {tech}
    </Badge>
  ));

  return (
    <div
      className="overflow-hidden rounded-xl py-5 px-6"
      style={{ background: "var(--tint-white-02)", border: "1px solid var(--tint-white-05)" }}
    >
      <p className="font-mono mb-4" style={{ fontSize: "0.65rem", color: "var(--color-brand-300)", textAlign: "center" }}>
        // technologies I work with
      </p>

      {/*
        Reduced motion gets the plain wrapped row this used to be; everyone
        else gets a marquee that slows on hover so labels stay readable.
      */}
      {reduced ? (
        <div className="flex flex-wrap gap-2 justify-center">{badges}</div>
      ) : (
        <InfiniteSlider gap={8} speed={30} speedOnHover={8}>
          {badges}
        </InfiniteSlider>
      )}
    </div>
  );
}
