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

interface ProjectCardProps {
  project: Project;
  index: number;
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

export function ProjectCard({ project, index, taglist, baseUrl }: ProjectCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-80px" });
  const [hovered, setHovered] = useState(false);
  const accent = ACCENTS[index % ACCENTS.length];
  const lines = CODE_PREVIEWS[index % CODE_PREVIEWS.length];
  const tagNames = project.tags.map(t => taglist[t]?.name || t).join(", ");
  const imageSrc = `${baseUrl}${project.image.url}`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "#0d1117",
        border: `1px solid ${hovered ? accent + "50" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? `0 0 30px ${accent}15` : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div
        className="p-5 relative overflow-hidden"
        style={{ background: "#0a0f1a", borderBottom: "1px solid rgba(255,255,255,0.05)", minHeight: "180px" }}
      >
        <motion.div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${accent}40, transparent)`,
            zIndex: 2,
          }}
          animate={inView ? { top: ["-10%", "110%"] } : { top: "-10%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={false}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ zIndex: 1 }}
        >
          <img
            src={imageSrc}
            alt={project.image.alt}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, rgba(10,15,26,0.35) 0%, rgba(10,15,26,0.7) 100%)` }}
          />
        </motion.div>
        <div className="relative flex items-center gap-1.5 mb-4" style={{ zIndex: 3 }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "#ff5f57" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "#febc2e" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "#28c840" }} />
          <span className="ml-2 font-mono" style={{ fontSize: "0.62rem", color: "#374151" }}>
            {project.title.toLowerCase().replace(/ /g, "-")}.ts
          </span>
        </div>
        <div className="font-mono flex gap-3" style={{ fontSize: "0.72rem" }}>
          <div className="flex flex-col" style={{ color: "#2d3748", minWidth: "16px", textAlign: "right" }}>
            {lines.map((l) => <span key={l.num} style={{ lineHeight: 1.7 }}>{l.num}</span>)}
          </div>
          <div className="flex-1 overflow-hidden">
            {lines.map((l, i) => <div key={i} style={{ lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "nowrap" }}>{l.code}</div>)}
          </div>
        </div>
        <Badge
          variant="outline"
          className="absolute top-4 right-4 font-mono rounded-md"
          style={{ fontSize: "0.6rem", color: accent, background: accent + "18", border: `1px solid ${accent}30`, zIndex: 3 }}
        >
          {tagNames}
        </Badge>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "8px" }}>
          {project.title}
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b", lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "16px", flex: 1 }}>
          {project.description.length > 180 ? project.description.slice(0, 180) + "…" : project.description}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="font-mono rounded"
              style={{ fontSize: "0.62rem", color: "#60a5fa", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.14)" }}
            >
              {taglist[t]?.name || t}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={project.siteurl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors"
            style={{ fontSize: "0.8rem", color: "#475569", fontFamily: "'Space Grotesk'" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#60a5fa")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#475569")}
          >
            <ExternalLink size={14} />
            Live Site
          </a>
          <div
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: hovered ? accent + "20" : "rgba(255,255,255,0.04)",
              border: `1px solid ${hovered ? accent + "40" : "rgba(255,255,255,0.07)"}`,
              color: hovered ? accent : "#475569",
              transition: "all 0.3s",
              cursor: "pointer",
            }}
          >
            <ArrowUpRight size={14} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
