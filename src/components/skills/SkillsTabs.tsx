import { motion, useInView } from "motion/react";
import { useRef } from "react";
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

function SkillBadge({ skill, index }: { skill: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, delay: index * 0.065 }}
      whileHover={{ scale: 1.07 }}
    >
      <Badge
        variant="outline"
        className="cursor-default select-none rounded-xl font-mono transition-colors"
        style={{ padding: "9px 16px", fontSize: "0.82rem", color: "#93c5fd", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.16)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.16)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.42)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.16)"; }}
      >
        {skill}
      </Badge>
    </motion.div>
  );
}

export function SkillsTabs({ techstack, extraSkills }: SkillsTabsProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const categories = buildCategories(techstack, extraSkills);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.2 }}
    >
      <Tabs defaultValue="frontend" className="gap-0">
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
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
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
                {cat.skills.map((skill, i) => <SkillBadge key={skill} skill={skill} index={i} />)}
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
