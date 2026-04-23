import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";

const TIMELINE = [
  {
    year: "2015",
    hash: "a3f9c1e",
    title: "The Spark",
    company: "Self-Taught",
    type: "milestone",
    description: "Wrote my first line of HTML and immediately got hooked. Started with basic websites, moved to JavaScript and PHP, and never looked back. Every bug became a puzzle worth solving.",
    tags: ["HTML", "CSS", "JavaScript", "PHP", "Self-Learning"],
  },
  {
    year: "2017",
    hash: "b72e4d8",
    title: "Going Deeper",
    company: "Personal Projects",
    type: "milestone",
    description: "Dove into the LAMP stack and build tools. Learned Apache, MySQL, and started building real projects for friends and local businesses as a freelancer.",
    tags: ["PHP", "MySQL", "Apache", "WordPress", "Freelancing"],
  },
  {
    year: "2019",
    hash: "c1892af",
    title: "Going Professional",
    company: "Upward Next",
    type: "job",
    description: "Landed my first professional developer position. Started contributing to production codebases, shipping corporate and e-commerce sites for Japanese clients.",
    tags: ["LAMP Stack", "WordPress", "Eccube", "Welcart", "Agile"],
  },
  {
    year: "2021",
    hash: "d4560be",
    title: "Full-Stack Growth",
    company: "Lead Developer",
    type: "job",
    description: "Took on full-stack responsibilities — architecting databases, building APIs, and leading feature development. Shipped multiple e-commerce platforms and business tools.",
    tags: ["PHP", "MySQL", "JavaScript", "E-Commerce", "Lead Dev"],
  },
  {
    year: "2024",
    hash: "e9021dc",
    title: "Expanding the Stack",
    company: "Upward Next",
    type: "job",
    description: "Began exploring MERN stack and Generative AI — adding React, Node.js, and LLM tooling to my skill set alongside continued professional LAMP development.",
    tags: ["React", "Node.js", "OpenAI", "MongoDB", "Full-Stack"],
  },
  {
    year: "Now",
    hash: "HEAD",
    title: "Present & Beyond",
    company: "Available for Hire",
    type: "present",
    description: "Continuing to build, learn, and grow. Excited about new challenges, collaborations, and the next great project. Always exploring what's next in web development.",
    tags: ["Open to Opportunities", "Freelance", "Full-Time"],
  },
];

export function ExperienceComponent() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="experience" ref={ref} className="relative py-28" style={{ background: "#040b1a" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />

      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-16">
          <p className="font-mono mb-2" style={{ fontSize: "0.75rem", color: "#3b82f6" }}>04. git log --oneline</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>
            My Dev <span className="gradient-text">Journey</span>
          </h2>
        </motion.div>

        <div className="relative">
          <motion.div
            className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px"
            initial={{ scaleY: 0, originY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            style={{ background: "linear-gradient(180deg, #1d4ed8, #3b82f6, #60a5fa, transparent)", transformOrigin: "top" }}
          />

          <div className="space-y-10">
            {TIMELINE.map((item, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={item.hash}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.12 }}
                  className={`relative flex items-start gap-6 md:gap-0 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className={`md:w-[45%] pl-14 md:pl-0 ${isEven ? "md:pr-10 md:text-right" : "md:pl-10 md:text-left"}`}>
                    <div className="card-glow rounded-2xl p-5 text-left"
                      style={{
                        background: item.type === "present" ? "rgba(59,130,246,0.07)" : "rgba(255,255,255,0.02)",
                        border: item.type === "present" ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="outline" className="font-mono rounded" style={{ fontSize: "0.6rem", color: "#60a5fa", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                          {item.hash}
                        </Badge>
                        <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{item.year}</span>
                        {item.type === "present" && (
                          <Badge className="gap-1 rounded-full" style={{ fontSize: "0.6rem", color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}>
                            <span className="w-1 h-1 rounded-full bg-green-400 cursor-blink" />
                            Live
                          </Badge>
                        )}
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "2px" }}>{item.title}</h3>
                      <p style={{ fontSize: "0.78rem", color: "#3b82f6", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "10px" }}>{item.company}</p>
                      <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.7, fontFamily: "'Space Grotesk', sans-serif", marginBottom: "12px" }}>{item.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="font-mono rounded" style={{ fontSize: "0.6rem", color: "#60a5fa", background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.12)" }}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="absolute left-6 md:left-1/2 md:-translate-x-1/2 top-6">
                    <div className="w-3 h-3 rounded-full relative"
                      style={{ background: item.type === "present" ? "#4ade80" : "#3b82f6", boxShadow: item.type === "present" ? "0 0 12px rgba(74,222,128,0.6)" : "0 0 12px rgba(59,130,246,0.5)" }}
                    >
                      {item.type === "present" && (
                        <motion.div className="absolute inset-0 rounded-full" style={{ background: "rgba(74,222,128,0.3)" }} animate={{ scale: [1, 2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                      )}
                    </div>
                  </div>

                  <div className="hidden md:block md:w-[45%]" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
