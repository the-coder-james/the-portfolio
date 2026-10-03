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
        className="skill-badge-lg skill-badge-interactive cursor-default select-none rounded-xl font-mono transition-transform hover:scale-105"
        style={{ color: "var(--color-brand-text)" }}
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
          aria-label="Skill category"
          className="h-auto p-1 mb-2.5 sm:mb-3.5 flex-wrap justify-start gap-1"
          style={{ background: "var(--color-card-surface)", border: "1px solid var(--color-card-border)", borderRadius: "12px" }}
        >
          {categories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              // .skills-tab (global.css) sets the inks: unlayered CSS outranks the
              // shadcn state utilities, dark: variants included.
              className="skills-tab gap-1.5 rounded-lg transition-colors duration-200 data-[state=active]:shadow-none"
              style={{ fontSize: "0.85rem" }}
            >
              <span aria-hidden="true">{cat.icon}</span>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="skills-panel">
            {/* No category heading here: the active pill directly above already
                names the category, icon and all. Repeating it cost a line of
                vertical space to say nothing new. */}
            <div
              className="skills-badge-box rounded-2xl p-2.5 sm:p-4"
              style={{ background: "var(--color-card-surface)", border: "1px solid var(--color-card-border)" }}
            >
              <AnimatedGroup className="flex flex-wrap gap-2 sm:gap-3" preset="scale">
                {cat.skills.map((skill) => <SkillBadge key={skill} skill={skill} />)}
              </AnimatedGroup>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Reveal>
  );
}
