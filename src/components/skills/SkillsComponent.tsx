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

interface SkillsProps {
  techstack: TechStack[];
}

const MINDSET_CARDS = [
  { icon: "🎯", title: "Clean Code", desc: "Scalable, maintainable, and readable — always." },
  { icon: "🤝", title: "Collaboration", desc: "Love working with teams to ship great products." },
  { icon: "📐", title: "Design Sense", desc: "Bridging the gap between devs and designers." },
  { icon: "🔬", title: "Always Learning", desc: "Exploring new technologies every single day." },
];

// Maps techstack names to skill categories for tabs
function buildCategories(techstack: TechStack[]) {
  const lamp = techstack.find(t => t.name.toLowerCase().includes("lamp"));
  const mern = techstack.find(t => t.name.toLowerCase().includes("mern"));
  const ai = techstack.find(t => t.name.toLowerCase().includes("ai") || t.name.toLowerCase().includes("generative"));

  const frontend = [
    ...(mern ? mern.tools.filter(t => ["React", "MongoDB"].includes(t.title)).map(t => t.title) : []),
    "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind CSS",
  ];

  const backend = [
    ...(lamp ? lamp.tools.map(t => t.title) : []),
    ...(mern ? mern.tools.filter(t => ["Express", "Node.js"].includes(t.title)).map(t => t.title) : []),
    "REST APIs",
  ];

  const tools = [
    ...(ai ? ai.tools.map(t => t.title) : []),
    "Git", "GitHub", "Docker", "VS Code", "Figma",
  ];

  return [
    { id: "frontend", label: "Frontend", icon: "⚛️", skills: [...new Set(frontend)] },
    { id: "backend", label: "Backend", icon: "⚙️", skills: [...new Set(backend)] },
    { id: "tools", label: "Tools & AI", icon: "🛠️", skills: [...new Set(tools)] },
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
        className="cursor-default select-none gap-1.5 rounded-xl font-mono transition-colors"
        style={{ padding: "9px 16px", fontSize: "0.82rem", color: "#93c5fd", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.16)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.16)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.42)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.16)"; }}
      >
        {skill}
      </Badge>
    </motion.div>
  );
}

export function SkillsComponent({ techstack }: SkillsProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const categories = buildCategories(techstack);
  const allSkills = [...new Set(categories.flatMap(c => c.skills))];

  return (
    <section id="skills" ref={ref} className="relative py-28" style={{ background: "#040b1a" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-16">
          <p className="font-mono mb-2" style={{ fontSize: "0.75rem", color: "#3b82f6" }}>02. skills.config.ts</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>
            My Tech <span className="gradient-text">Arsenal</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          {/* Left: tabs */}
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}>
              <Tabs defaultValue="frontend" className="gap-0">
                <TabsList className="h-auto p-1 mb-8 flex-wrap justify-start gap-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px" }}>
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.id} value={cat.id} className="gap-1.5 rounded-lg transition-all duration-200 data-[state=active]:shadow-none" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem" }}>
                      <span>{cat.icon}</span>
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {categories.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id}>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                      className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-xl">{cat.icon}</span>
                        <span style={{ fontSize: "1rem", color: "#e2e8f0", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{cat.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {cat.skills.map((skill, i) => <SkillBadge key={skill} skill={skill} index={i} />)}
                      </div>
                    </motion.div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          </div>

          {/* Right: mindset */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {MINDSET_CARDS.map((card, i) => (
              <motion.div key={card.title} initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 + i * 0.12 }}
                className="card-glow flex items-start gap-4 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.12)", fontSize: "1.1rem" }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>{card.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "2px", fontFamily: "'Space Grotesk', sans-serif" }}>{card.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech strip */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8 }}
          className="overflow-hidden rounded-xl py-5 px-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="font-mono mb-4" style={{ fontSize: "0.65rem", color: "#1e3a5f", textAlign: "center" }}>// technologies I work with</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {allSkills.map((tech, i) => (
              <motion.div key={tech} initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.9 + i * 0.04 }}>
                <Badge variant="outline" className="font-mono rounded-xl cursor-default"
                  style={{ padding: "5px 11px", fontSize: "0.7rem", color: "#93c5fd", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.16)" }}
                >
                  {tech}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
