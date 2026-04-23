import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";

interface ContactLink {
  url: string;
  name: string;
  icon: string;
  hoverColor: string;
}

interface HeroProps {
  name: string;
  role: string;
  contacts: ContactLink[];
  baseUrl: string;
}

const TYPING_SEQUENCES = [
  "Full Stack Developer",
  "LAMP Stack Engineer",
  "Web Application Builder",
  "Problem Solver",
];

function useTypingEffect(sequences: string[]) {
  const [text, setText] = useState("");
  const [seqIndex, setSeqIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const current = sequences[seqIndex];
    if (!deleting && charIndex < current.length) {
      const t = setTimeout(() => { setText(current.slice(0, charIndex + 1)); setCharIndex((c) => c + 1); }, 65);
      return () => clearTimeout(t);
    } else if (!deleting && charIndex === current.length) {
      setPaused(true);
      const t = setTimeout(() => { setPaused(false); setDeleting(true); }, 2000);
      return () => clearTimeout(t);
    } else if (deleting && charIndex > 0) {
      const t = setTimeout(() => { setText(current.slice(0, charIndex - 1)); setCharIndex((c) => c - 1); }, 35);
      return () => clearTimeout(t);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setSeqIndex((s) => (s + 1) % sequences.length);
    }
  }, [charIndex, deleting, paused, sequences, seqIndex]);

  return text;
}

const FLOATERS = [
  { text: "const x = () => {}", x: "8%", y: "20%", delay: 0 },
  { text: "npm run dev", x: "82%", y: "18%", delay: 0.5 },
  { text: "<Component />", x: "5%", y: "75%", delay: 1 },
  { text: "git commit -m '✨'", x: "78%", y: "72%", delay: 1.5 },
  { text: "// TODO: ship it", x: "70%", y: "40%", delay: 0.8 },
];

const ICON_MAP: Record<string, string> = {
  Github: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
  Linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  Mail: "M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z",
  Globe: "M12 0C5.374 0 0 5.373 0 12c0 6.628 5.374 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm0 2c1.678 0 3.275.42 4.68 1.157L14.5 5H9.5L7.32 3.157A9.96 9.96 0 0112 2zm-7.5 3.5l1.96 1.97A9.96 9.96 0 002 12c0 .34.017.678.05 1.01L4.5 11.5V9l-1.5-1.5 1.5-2zm15 0l-1.5 2L21.5 9v2.5l2.45 1.51c.033-.332.05-.67.05-1.01a9.96 9.96 0 00-4.5-8.5zM9.5 7h5l1.5 5-3 3-3-3 1.5-5zm-5.45 7.5L6.5 16l-1 4.5A9.968 9.968 0 012 12c0-.17.006-.338.017-.506L4.05 14.5zm14.9 0l2.033-2.006C21.994 11.662 22 11.83 22 12a9.968 9.968 0 01-3.5 7.5L17.5 15l2-1-1-2.5z",
};

export function HeroComponent({ name, contacts, baseUrl }: HeroProps) {
  const typedText = useTypingEffect(TYPING_SEQUENCES);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, size: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.4 + 0.1 });
    }
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.alpha})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist / 120)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const terminalLines = [
    { delay: 0.3, content: <><span style={{ color: "#60a5fa" }}>const</span> <span style={{ color: "#93c5fd" }}>developer</span> <span style={{ color: "#e2e8f0" }}>=</span> <span style={{ color: "#86efac" }}>{`{`}</span></> },
    { delay: 0.7, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>name</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#f9a8d4" }}>"{name}"</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 1.1, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>since</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#a5b4fc" }}>2015</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 1.5, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>professional</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#a5b4fc" }}>2019</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 1.9, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>stack</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#86efac" }}>[</span><span style={{ color: "#f9a8d4" }}>"LAMP"</span><span style={{ color: "#94a3b8" }}>, </span><span style={{ color: "#f9a8d4" }}>"MERN"</span><span style={{ color: "#94a3b8" }}>, </span><span style={{ color: "#f9a8d4" }}>"AI"</span><span style={{ color: "#86efac" }}>]</span><span style={{ color: "#94a3b8" }}>,</span></> },
    { delay: 2.3, content: <>&nbsp;&nbsp;<span style={{ color: "#fcd34d" }}>available</span><span style={{ color: "#e2e8f0" }}>:</span> <span style={{ color: "#86efac" }}>true</span></> },
    { delay: 2.7, content: <><span style={{ color: "#86efac" }}>{`}`}</span><span style={{ color: "#94a3b8" }}>;</span></> },
  ];

  const githubContact = contacts.find(c => c.name === "Github");
  const linkedinContact = contacts.find(c => c.name === "LinkedIn");
  const mailContact = contacts.find(c => c.name === "Mail");
  const websiteContact = contacts.find(c => c.name === "Website");

  const socials = [
    { label: "GitHub", href: githubContact?.url || "#", iconKey: "Github" },
    { label: "LinkedIn", href: linkedinContact?.url || "#", iconKey: "Linkedin" },
    { label: "Email", href: mailContact?.url || "#", iconKey: "Mail" },
  ];

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#030712" }}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 dot-grid opacity-30" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.07) 0%, transparent 70%)", zIndex: 0 }} />

      {FLOATERS.map((f, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:block select-none pointer-events-none font-mono"
          style={{ left: f.x, top: f.y, fontSize: "0.7rem", color: "rgba(59,130,246,0.25)", zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ delay: f.delay + 1, duration: 4, repeat: Infinity, repeatDelay: 3 }}
        >
          {f.text}
        </motion.div>
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 cursor-blink" />
              <span className="font-mono" style={{ fontSize: "0.7rem", color: "#60a5fa" }}>Available for hire</span>
            </motion.div>

            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="font-mono mb-2" style={{ fontSize: "1rem", color: "#60a5fa" }}
            >
              // Hello, World! 👋
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="mb-2">
              <h1 className="glitch" data-text={"Hi! I'm"+name} style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, lineHeight: 1.1, color: "#ffffff", letterSpacing: "-0.02em", fontFamily: "'Space Grotesk', sans-serif" }}>
                Hi! I'm {name}
              </h1>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="flex items-center gap-2 mb-6" style={{ height: "2.5rem" }}
            >
              <span style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", color: "#94a3b8", fontFamily: "'Space Grotesk', sans-serif" }}>I'm a </span>
              <span className="gradient-text" style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>{typedText}</span>
              <span className="cursor-blink inline-block w-0.5 h-7 bg-blue-400" style={{ marginLeft: "2px" }} />
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              style={{ fontSize: "1rem", color: "#64748b", lineHeight: 1.7, maxWidth: "480px", fontFamily: "'Space Grotesk', sans-serif" }}
              className="mb-8"
            >
              Building everything from small business sites to full-scale e-commerce platforms — bridging the gap between design and functionality since 2015.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <button
                onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 rounded-lg text-white transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", boxShadow: "0 4px 20px rgba(59,130,246,0.35)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.9rem", fontWeight: 500 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(59,130,246,0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,130,246,0.35)"; }}
              >
                View My Work
              </button>
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 rounded-lg text-white transition-all duration-200"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.9rem", fontWeight: 500 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Get In Touch
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="flex items-center gap-3">
              {socials.map((s) => {
                const pathD = ICON_MAP[s.iconKey];
                return (
                  <a key={s.label} href={s.href} aria-label={s.label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#60a5fa"; el.style.borderColor = "rgba(59,130,246,0.4)"; el.style.background = "rgba(59,130,246,0.1)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "#64748b"; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.background = "rgba(255,255,255,0.04)"; }}
                  >
                    {pathD && <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path d={pathD} /></svg>}
                  </a>
                );
              })}
              <span style={{ color: "#334155", fontSize: "0.75rem", marginLeft: "4px", fontFamily: "'Space Grotesk'" }}>Let's connect</span>
            </motion.div>
          </div>

          {/* Right: Terminal */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="hidden lg:block float-anim">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(59,130,246,0.2)", boxShadow: "0 0 50px rgba(59,130,246,0.1), 0 30px 60px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                <span className="ml-2 font-mono" style={{ fontSize: "0.72rem", color: "#4b5563" }}>developer.config.ts</span>
              </div>
              <div className="px-6 py-6 font-mono" style={{ fontSize: "0.82rem", lineHeight: 1.8 }}>
                <div className="flex gap-4">
                  <div className="flex flex-col" style={{ color: "#374151", userSelect: "none", minWidth: "20px", textAlign: "right" }}>
                    {terminalLines.map((_, i) => <span key={i} style={{ lineHeight: 1.8 }}>{i + 1}</span>)}
                  </div>
                  <div className="flex-1">
                    {terminalLines.map((line, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: line.delay, duration: 0.3 }} style={{ lineHeight: 1.8 }}>
                        {line.content}
                      </motion.div>
                    ))}
                  </div>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="mt-4 flex items-center gap-2">
                  <span style={{ color: "#22c55e" }}>❯</span>
                  <span style={{ color: "#60a5fa" }}>node</span>
                  <span style={{ color: "#e2e8f0" }}> developer.config.ts</span>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.6 }} style={{ color: "#4ade80", marginLeft: "18px" }}>
                  ✓ Ready to build something awesome!
                </motion.div>
                <div className="flex items-center gap-2 mt-1">
                  <span style={{ color: "#22c55e" }}>❯</span>
                  <span className="cursor-blink inline-block w-2 h-4 bg-blue-400" style={{ marginTop: "2px" }} />
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2" style={{ background: "#161b22", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span style={{ fontSize: "0.65rem", color: "#4b5563", fontFamily: "'JetBrains Mono'" }}>TypeScript</span>
                </div>
                <span style={{ fontSize: "0.65rem", color: "#4b5563", fontFamily: "'JetBrains Mono'" }}>UTF-8</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.button
          onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          style={{ color: "#334155" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#60a5fa")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#334155")}
        >
          <span style={{ fontSize: "0.65rem", fontFamily: "'JetBrains Mono'" }}>scroll</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ArrowDown size={14} />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
