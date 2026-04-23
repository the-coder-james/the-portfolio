import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { ExternalLink, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectImage {
  url: string;
  alt: string;
}

interface Project {
  title: string;
  date: string;
  tags: string[];
  role: number;
  tech: number;
  provider: number;
  image: ProjectImage;
  description: string;
  siteurl: string;
}

interface ProjectsProps {
  projects: Project[];
  taglist: Record<string, { name: string }>;
  baseUrl: string;
}

const ACCENTS = ["#3b82f6", "#818cf8", "#34d399", "#f59e0b", "#ec4899", "#60a5fa"];

const CODE_PREVIEWS = [
  [
    { num: 1, code: <><span style={{color:"#c084fc"}}>export</span> <span style={{color:"#60a5fa"}}>function</span> <span style={{color:"#fcd34d"}}>Page</span>() {"{"}</> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"#c084fc"}}>return</span> &lt;<span style={{color:"#60a5fa"}}>main</span>&gt;</> },
    { num: 3, code: <>&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span style={{color:"#86efac"}}>Hero</span> /&gt;</> },
    { num: 4, code: <>&nbsp;&nbsp;&nbsp;&nbsp;&lt;<span style={{color:"#86efac"}}>Content</span> /&gt;</> },
    { num: 5, code: <>&nbsp;&nbsp;&lt;/<span style={{color:"#60a5fa"}}>main</span>&gt;</> },
  ],
  [
    { num: 1, code: <><span style={{color:"#c084fc"}}>const</span> query = <span style={{color:"#86efac"}}>`</span></> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"#fcd34d"}}>SELECT</span> * <span style={{color:"#fcd34d"}}>FROM</span> products</> },
    { num: 3, code: <>&nbsp;&nbsp;<span style={{color:"#fcd34d"}}>WHERE</span> active = <span style={{color:"#a5b4fc"}}>true</span></> },
    { num: 4, code: <>&nbsp;&nbsp;<span style={{color:"#fcd34d"}}>ORDER BY</span> date <span style={{color:"#fcd34d"}}>DESC</span></> },
    { num: 5, code: <><span style={{color:"#86efac"}}>`</span>;</> },
  ],
  [
    { num: 1, code: <><span style={{color:"#c084fc"}}>function</span> <span style={{color:"#fcd34d"}}>init</span>() {"{"}</> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"#94a3b8"}}>// Bootstrap app</span></> },
    { num: 3, code: <>&nbsp;&nbsp;<span style={{color:"#60a5fa"}}>app</span>.<span style={{color:"#fcd34d"}}>use</span>(middleware);</> },
    { num: 4, code: <>&nbsp;&nbsp;<span style={{color:"#60a5fa"}}>app</span>.<span style={{color:"#fcd34d"}}>listen</span>(<span style={{color:"#a5b4fc"}}>3000</span>);</> },
    { num: 5, code: <>{"}"}</> },
  ],
  [
    { num: 1, code: <><span style={{color:"#c084fc"}}>class</span> <span style={{color:"#60a5fa"}}>Controller</span> {"{"}</> },
    { num: 2, code: <>&nbsp;&nbsp;<span style={{color:"#fcd34d"}}>index</span>() {"{"}</> },
    { num: 3, code: <>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color:"#c084fc"}}>return</span> view(<span style={{color:"#86efac"}}>'home'</span>);</> },
    { num: 4, code: <>&nbsp;&nbsp;{"}"}</> },
    { num: 5, code: <>{"}"}</> },
  ],
  [
    { num: 1, code: <><span style={{color:"#c084fc"}}>import</span> <span style={{color:"#e2e8f0"}}>WordPress</span> <span style={{color:"#c084fc"}}>from</span> <span style={{color:"#86efac"}}>'@/cms'</span>;</> },
    { num: 2, code: <></> },
    { num: 3, code: <><span style={{color:"#c084fc"}}>const</span> posts = <span style={{color:"#c084fc"}}>await</span></> },
    { num: 4, code: <>&nbsp;&nbsp;WordPress.<span style={{color:"#fcd34d"}}>getPosts</span>();</> },
    { num: 5, code: <><span style={{color:"#c084fc"}}>return</span> {"{"} posts {"}"};</> },
  ],
  [
    { num: 1, code: <><span style={{color:"#c084fc"}}>const</span> router = <span style={{color:"#fcd34d"}}>createRouter</span>();</> },
    { num: 2, code: <></> },
    { num: 3, code: <><span style={{color:"#60a5fa"}}>router</span>.<span style={{color:"#fcd34d"}}>get</span>(<span style={{color:"#86efac"}}>'/api'</span>,</> },
    { num: 4, code: <>&nbsp;&nbsp;<span style={{color:"#c084fc"}}>async</span> (req, res) =&gt; {"{"}</> },
    { num: 5, code: <>&nbsp;&nbsp;&nbsp;&nbsp;res.<span style={{color:"#fcd34d"}}>json</span>(data);</> },
  ],
];

function ProjectCard({ project, index, inView, taglist, baseUrl }: { project: Project; index: number; inView: boolean; taglist: Record<string, { name: string }>; baseUrl: string }) {
  const [hovered, setHovered] = useState(false);
  const accent = ACCENTS[index % ACCENTS.length];
  const lines = CODE_PREVIEWS[index % CODE_PREVIEWS.length];
  const tagNames = project.tags.map(t => taglist[t]?.name || t).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: "#0d1117", border: `1px solid ${hovered ? accent + "50" : "rgba(255,255,255,0.07)"}`, boxShadow: hovered ? `0 0 30px ${accent}15` : "none", transition: "all 0.3s ease" }}
    >
      {/* Code preview */}
      <div className="p-5 relative overflow-hidden" style={{ background: "#0a0f1a", borderBottom: "1px solid rgba(255,255,255,0.05)", minHeight: "180px" }}>
        <motion.div className="absolute left-0 right-0 pointer-events-none"
          style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${accent}40, transparent)`, opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }}
          animate={hovered ? { top: ["-10%", "110%"] } : { top: "50%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <div className="flex items-center gap-1.5 mb-4">
          <div className="w-2 h-2 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "#28c840" }} />
          <span className="ml-2 font-mono" style={{ fontSize: "0.62rem", color: "#374151" }}>{project.title.toLowerCase().replace(/ /g, "-")}.ts</span>
        </div>
        <div className="font-mono flex gap-3" style={{ fontSize: "0.72rem" }}>
          <div className="flex flex-col" style={{ color: "#2d3748", minWidth: "16px", textAlign: "right" }}>
            {lines.map((l) => <span key={l.num} style={{ lineHeight: 1.7 }}>{l.num}</span>)}
          </div>
          <div className="flex-1 overflow-hidden">
            {lines.map((l, i) => <div key={i} style={{ lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "nowrap" }}>{l.code}</div>)}
          </div>
        </div>
        <Badge variant="outline" className="absolute top-4 right-4 font-mono rounded-md"
          style={{ fontSize: "0.6rem", color: accent, background: accent + "18", border: `1px solid ${accent}30` }}
        >
          {tagNames}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "8px" }}>{project.title}</h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px", flex: 1 }}>
          {project.description.length > 180 ? project.description.slice(0, 180) + "…" : project.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((t) => (
            <Badge key={t} variant="outline" className="font-mono rounded"
              style={{ fontSize: "0.62rem", color: "#60a5fa", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.14)" }}
            >
              {taglist[t]?.name || t}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href={project.siteurl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors"
            style={{ fontSize: "0.8rem", color: "#475569", fontFamily: "'Space Grotesk'" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#60a5fa")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#475569")}
          >
            <ExternalLink size={14} />
            Live Site
          </a>
          <div className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: hovered ? accent + "20" : "rgba(255,255,255,0.04)", border: `1px solid ${hovered ? accent + "40" : "rgba(255,255,255,0.07)"}`, color: hovered ? accent : "#475569", transition: "all 0.3s", cursor: "pointer" }}
          >
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectsComponent({ projects, taglist, baseUrl }: ProjectsProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const displayed = projects.slice(0, 6);

  return (
    <section id="projects" ref={ref} className="relative py-28" style={{ background: "#030712" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 40% at 50% 60%, rgba(59,130,246,0.04) 0%, transparent 70%)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-6"
        >
          <div>
            <p className="font-mono mb-2" style={{ fontSize: "0.75rem", color: "#3b82f6" }}>03. featured_work.tsx</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>
              Things I've <span className="gradient-text">Built</span>
            </h2>
          </div>
          <span style={{ fontSize: "0.85rem", color: "#475569", fontFamily: "'Space Grotesk', sans-serif" }}>
            {projects.length}+ projects shipped
          </span>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} inView={inView} taglist={taglist} baseUrl={baseUrl} />
          ))}
        </div>
      </div>
    </section>
  );
}
