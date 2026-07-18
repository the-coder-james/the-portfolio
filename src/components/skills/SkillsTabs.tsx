import { useEffect, useRef } from "react";
import { stagger, inView, spring } from "motion";
import { animateEl } from "@/lib/utils";
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
    <div className="skill-tab-badge" style={{ opacity: 0, display: "inline-block" }}>
      <Badge
        variant="outline"
        className="cursor-default select-none rounded-xl font-mono transition-transform hover:scale-105"
        style={{ padding: "9px 16px", fontSize: "0.82rem", color: "#93c5fd", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.16)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.16)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.42)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.16)"; }}
      >
        {skill}
      </Badge>
    </div>
  );
}

function animateBadgesIn(container: HTMLElement | null) {
  if (!container) return;
  animateEl(
    container.querySelectorAll<Element>(".skill-tab-badge"),
    { opacity: [0, 1], scale: [0.6, 1], y: [10, 0] },
    { delay: stagger(0.04), type: spring(0.4, 0.05) }
  );
}

export function SkillsTabs({ techstack, extraSkills }: SkillsTabsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categories = buildCategories(techstack, extraSkills);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    inView(root, () => {
      animateEl(root as Element, { opacity: [0, 1], y: [20, 0] }, { delay: 0.1, type: spring(0.5, 0.25) });
    }, { margin: "-60px" });
    // Animate the default-active tab badges on mount
    setTimeout(() => animateBadgesIn(tabRefs.current["frontend"]), 400);
  }, []);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      <Tabs
        defaultValue="frontend"
        className="gap-0"
        onValueChange={(val) => animateBadgesIn(tabRefs.current[val])}
      >
        <TabsList
          className="h-auto p-1 mb-8 flex-wrap justify-start gap-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}
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
              ref={(el) => { tabRefs.current[cat.id] = el; }}
              className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">{cat.icon}</span>
                <span style={{ fontSize: "1rem", color: "#e2e8f0", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {cat.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {cat.skills.map((skill) => <SkillBadge key={skill} skill={skill} />)}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
