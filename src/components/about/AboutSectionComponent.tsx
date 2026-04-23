import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface AboutProps {
  name: string;
  imageUrl: string;
}

const STATS = [
  { label: "Years Coding", value: "10+", icon: "💻" },
  { label: "Professional Since", value: "2019", icon: "🚀" },
  { label: "Projects Shipped", value: "45+", icon: "📦" },
  { label: "Cups of Coffee", value: "∞", icon: "☕" },
];

const CODE_BIO = [
  { type: "comment", content: "/**" },
  { type: "comment", content: " * About Me — A human who writes code" },
  { type: "comment", content: " */" },
  { type: "blank", content: "" },
  { type: "keyword", content: "class", rest: " Developer extends Human {" },
  { type: "blank", content: "" },
  { type: "indent", label: "mission", value: '"Bridge design & functionality"' },
  { type: "indent", label: "started", value: "2015" },
  { type: "indent", label: "professional", value: "2019" },
  { type: "blank", content: "" },
  { type: "method", content: "  buildAnything() {" },
  { type: "method-body", content: '    return ["e-commerce", "landing pages",' },
  { type: "method-body", content: '            "business sites", "more..."];' },
  { type: "method", content: "  }" },
  { type: "blank", content: "" },
  { type: "method", content: "  growEveryDay() {" },
  { type: "method-body", content: "    this.skills.push(latestTech);" },
  { type: "method-body", content: "    this.designEye.sharpen();" },
  { type: "method", content: "  }" },
  { type: "blank", content: "" },
  { type: "keyword-close", content: "}" },
];

function CodeLine({ line }: { line: typeof CODE_BIO[number] }) {
  if (line.type === "blank") return <div style={{ height: "0.9rem" }} />;
  if (line.type === "comment") return <div style={{ color: "#4b5563" }}>{line.content}</div>;
  if (line.type === "keyword") return (
    <div>
      <span style={{ color: "#c084fc" }}>{line.content}</span>
      <span style={{ color: "#60a5fa" }}> Developer</span>
      <span style={{ color: "#94a3b8" }}> extends </span>
      <span style={{ color: "#60a5fa" }}>Human</span>
      <span style={{ color: "#e2e8f0" }}> {"{"}</span>
    </div>
  );
  if (line.type === "indent") return (
    <div style={{ paddingLeft: "1.5rem" }}>
      <span style={{ color: "#fcd34d" }}>{line.label}</span>
      <span style={{ color: "#94a3b8" }}> = </span>
      <span style={{ color: line.label === "started" || line.label === "professional" ? "#a5b4fc" : "#86efac" }}>{line.value}</span>
      <span style={{ color: "#94a3b8" }}>;</span>
    </div>
  );
  if (line.type === "method") return <div style={{ color: "#e2e8f0" }}>{line.content}</div>;
  if (line.type === "method-body") return <div style={{ color: "#94a3b8" }}>{line.content}</div>;
  if (line.type === "keyword-close") return <div style={{ color: "#e2e8f0" }}>{line.content}</div>;
  return null;
}

export function AboutSectionComponent({ name, imageUrl }: AboutProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" ref={ref} className="relative py-28 overflow-hidden" style={{ background: "#030712" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-16">
          <p className="font-mono mb-2" style={{ fontSize: "0.75rem", color: "#3b82f6" }}>01. about_me.tsx</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>
            The Human Behind <span className="gradient-text">the Code</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }}>
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6, delay: 0.25 }} className="flex justify-center lg:justify-start mb-10">
              <div className="relative">
                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8, #0f172a)", padding: "3px", borderRadius: "9999px", boxShadow: "0 0 40px rgba(59,130,246,0.45), 0 0 80px rgba(59,130,246,0.15)" }} />
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute -inset-2 rounded-full pointer-events-none" style={{ border: "1.5px dashed rgba(59,130,246,0.3)", borderRadius: "9999px" }} />
                <div className="relative rounded-full overflow-hidden" style={{ width: "170px", height: "170px", border: "3px solid rgba(59,130,246,0.6)", boxShadow: "0 0 30px rgba(59,130,246,0.35)" }}>
                  <img src={imageUrl} alt={`${name} photo`} className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(3,7,18,0.35) 100%)" }} />
                </div>
                <motion.div initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.8, type: "spring", stiffness: 260 }}
                  className="absolute -bottom-1 -right-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: "#0d1117", border: "1px solid rgba(59,130,246,0.35)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cursor-blink" />
                  <span className="font-mono" style={{ fontSize: "0.6rem", color: "#6ee7b7", whiteSpace: "nowrap" }}>available</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.0 }}
                  className="absolute -top-2 -left-4 px-2.5 py-1 rounded-lg font-mono"
                  style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", fontSize: "0.6rem", color: "#93c5fd", whiteSpace: "nowrap" }}
                >
                  10+ yrs coding
                </motion.div>
              </div>
            </motion.div>

            <div className="space-y-5 mb-12">
              <p style={{ fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.8, fontFamily: "'Space Grotesk', sans-serif" }}>
                I've been coding since <span style={{ color: "#60a5fa", fontWeight: 600 }}>2015</span>, and began working professionally in <span style={{ color: "#60a5fa", fontWeight: 600 }}>2019</span>, building everything from small business sites to full-scale e-commerce platforms and high-performing landing pages.
              </p>
              <p style={{ fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.8, fontFamily: "'Space Grotesk', sans-serif" }}>
                I enjoy bridging the gap between <span style={{ color: "#e2e8f0" }}>design and functionality</span> — bringing ideas to life through code that's scalable, maintainable, and user-focused.
              </p>
              <p style={{ fontSize: "1.05rem", color: "#94a3b8", lineHeight: 1.8, fontFamily: "'Space Grotesk', sans-serif" }}>
                Beyond coding, I'm constantly exploring new technologies — from LAMP and MERN stacks to <span style={{ color: "#e2e8f0" }}>Generative AI</span> — always finding ways to grow as a developer.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {STATS.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 + i * 0.1 }}
                  className="card-glow rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="gradient-text" style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "4px", fontFamily: "'Space Grotesk', sans-serif" }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Code block */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.4 }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                  </div>
                  <span className="font-mono ml-2" style={{ fontSize: "0.7rem", color: "#4b5563" }}>about.ts</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono" style={{ background: "rgba(59,130,246,0.15)", fontSize: "0.6rem", color: "#60a5fa" }}>TypeScript</span>
              </div>
              <div className="p-6 flex gap-4">
                <div className="flex flex-col select-none font-mono" style={{ color: "#2d3748", fontSize: "0.75rem", minWidth: "24px", textAlign: "right", lineHeight: 1.6 }}>
                  {CODE_BIO.map((line, i) =>
                    line.type === "blank" ? <div key={i} style={{ height: "0.9rem" }} /> : <span key={i} style={{ lineHeight: 1.6 }}>{i + 1}</span>
                  )}
                </div>
                <div className="font-mono flex-1" style={{ fontSize: "0.78rem", lineHeight: 1.6, overflow: "hidden" }}>
                  {CODE_BIO.map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.6 + i * 0.04 }}>
                      <CodeLine line={line} />
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2" style={{ background: "#161b22", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3b82f6" }} />
                <span style={{ fontSize: "0.62rem", color: "#374151", fontFamily: "'JetBrains Mono'" }}>Ln 21, Col 1 · TypeScript · No errors</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
