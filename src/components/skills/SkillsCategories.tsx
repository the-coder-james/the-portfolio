import { RevealGroup } from "@/components/common/tsx/RevealGroup";
import { WindowCard } from "@/components/common/tsx/WindowCard";
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

interface SkillsCategoriesProps {
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

/**
 * The three skill categories side by side, each a card with its badges.
 *
 * They were tabs while About had to fit one screen, which hid two thirds of
 * the list behind a control. With the section free to run on, every category
 * shows at once: the whole arsenal reads in one pass, and comparing the
 * frontend and backend lists no longer means switching back and forth.
 */
export function SkillsCategories({ techstack, extraSkills }: SkillsCategoriesProps) {
  const categories = buildCategories(techstack, extraSkills);

  return (
    <RevealGroup className="skills-categories" preset="slide">
      {categories.map((cat) => (
        <WindowCard
          key={cat.id}
          title={`${cat.id}.json`}
          className="skills-category h-full"
          bodyClassName="skills-category-body"
        >
          <h4 className="skills-category-title">
            <span aria-hidden="true">{cat.icon}</span>
            {cat.label}
            {/* A list announces its own length; this is the printed one. */}
            <span className="skills-category-count" aria-hidden="true">{cat.skills.length}</span>
          </h4>
          <ul className="skills-badges" aria-label={`${cat.label} skills`}>
            {cat.skills.map((skill) => (
              <li key={skill}>
                <Badge
                  variant="outline"
                  className="skill-badge-lg skill-badge-interactive cursor-default select-none rounded-xl font-mono"
                  style={{ color: "var(--color-brand-text)" }}
                >
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        </WindowCard>
      ))}
    </RevealGroup>
  );
}
