import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { Reveal } from "@/components/common/tsx/Reveal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

interface SkillsTabsProps {
  techstack: TechStack[];
  extraSkills: ExtraSkills;
}

function buildCategories(techstack: TechStack[], extra: ExtraSkills) {
  const lamp = techstack.find(t => t.name.toLowerCase().includes("lamp"));
  const mern = techstack.find(t => t.name.toLowerCase().includes("mern"));
  const ai   = techstack.find(t => t.name.toLowerCase().includes("ai") || t.name.toLowerCase().includes("generative"));

  const frontend = [
    ...(mern ? mern.tools.filter(t => ["React", "MongoDB"].includes(t.title)).map(t => t.title) : []),
    ...extra.frontend,
  ];
  const backend = [
    ...(lamp ? lamp.tools.map(t => t.title) : []),
    ...(mern ? mern.tools.filter(t => ["Express", "Node.js"].includes(t.title)).map(t => t.title) : []),
    ...extra.backend,
  ];
  const tools = [
    ...(ai ? ai.tools.map(t => t.title) : []),
    ...extra.tools,
  ];

  return [
    { id: "frontend", label: "Frontend", icon: "⚛️", skills: [...new Set(frontend)] },
    { id: "backend",  label: "Backend",  icon: "⚙️", skills: [...new Set(backend)]  },
    { id: "tools",    label: "Tools & AI", icon: "🛠️", skills: [...new Set(tools)]  },
  ];
}

function SkillBadge({ skill }: { skill: string }) {
  return (
    <div style={{ display: "inline-block" }}>
      <Badge
        variant="outline"
        className="skill-badge-interactive cursor-default select-none rounded-xl font-mono transition-transform hover:scale-105"
        style={{ padding: "9px 16px", fontSize: "0.82rem", color: "var(--color-brand-300)" }}
      >
        {skill}
      </Badge>
    </div>
  );
}

export function SkillsTabs({ techstack, extraSkills }: SkillsTabsProps) {
  const categories = buildCategories(techstack, extraSkills);


  return (
    <Reveal y={20} delay={0.1}>
      <Tabs
        defaultValue="frontend"
        className="gap-0"
      >
        <TabsList
          className="h-auto p-1 mb-8 flex-wrap justify-start gap-1"
          style={{ background: "var(--tint-white-03)", border: "1px solid var(--tint-white-07)", borderRadius: "12px" }}
        >
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="gap-1.5 rounded-lg transition-all duration-200 data-[state=active]:shadow-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem" }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id}>
            <div
              className="rounded-2xl p-6"
              style={{ background: "var(--tint-white-02)", border: "1px solid var(--tint-white-06)" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl" aria-hidden="true">{cat.icon}</span>
                <span style={{ fontSize: "1rem", color: "var(--color-ink-muted)", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {cat.label}
                </span>
              </div>
              <AnimatedGroup className="flex flex-wrap gap-3" preset="scale">
                {cat.skills.map((skill) => <SkillBadge key={skill} skill={skill} />)}
              </AnimatedGroup>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Reveal>
  );
}
