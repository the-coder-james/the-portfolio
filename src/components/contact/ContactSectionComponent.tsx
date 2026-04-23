import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Send, Terminal, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ContactLink {
  url: string;
  name: string;
  icon: string;
  hoverColor: string;
}

interface ContactProps {
  contacts: ContactLink[];
}

const ICON_PATHS: Record<string, string> = {
  Github: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
  Linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  Mail: "M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z",
  Globe: "M12 0C5.374 0 0 5.373 0 12c0 6.628 5.374 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm-.354 2.007c.76.054 1.517.195 2.246.422L11.5 5H9l-.734-1.47A10.03 10.03 0 0111.646 2.007zM8.5 5l1-2h5l1 2H8.5zM2.07 9h3.43l-.75-3H3.4A10.05 10.05 0 002.07 9zm-.055 3c0-.34.018-.676.052-1.008L4.5 11.5V14l-2.433-.965A9.97 9.97 0 012.015 12zM12 22C6.477 22 2 17.523 2 12c0-.17.006-.338.017-.505L4.5 12.5v2l2 4.5c.86.55 1.8.97 2.8 1.26L12 22zm.5-2.07V18l2-1 1 2.5A9.968 9.968 0 0112.5 19.93zm5.07-2.43l-1.07-2.5h2.07a9.97 9.97 0 01-1 2.5z",
};

const ICON_COLORS: Record<string, string> = {
  Github: "#e2e8f0",
  Linkedin: "#60a5fa",
  Mail: "#818cf8",
  Website: "#34d399",
  Globe: "#34d399",
};

const fieldClass =
  "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-slate-200 " +
  "placeholder:text-slate-600 rounded-[10px] " +
  "focus-visible:border-[rgba(59,130,246,0.5)] focus-visible:bg-[rgba(59,130,246,0.05)] " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 " +
  "[font-family:'Space_Grotesk',sans-serif] text-[0.88rem]";

export function ContactSectionComponent({ contacts }: ContactProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" ref={ref} className="relative py-28" style={{ background: "#030712" }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 100%, rgba(59,130,246,0.06) 0%, transparent 70%)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="mb-16 text-center">
          <p className="font-mono mb-2" style={{ fontSize: "0.75rem", color: "#3b82f6" }}>05. contact.send()</p>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2 }}>
            Let's Build Something <span className="gradient-text">Together</span>
          </h2>
          <p style={{ fontSize: "1rem", color: "#475569", marginTop: "12px", fontFamily: "'Space Grotesk', sans-serif" }}>
            Whether you have a project in mind, want to collaborate, or just want to say hi
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-2 flex flex-col gap-6">
            <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(59,130,246,0.15)" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Terminal size={12} style={{ color: "#3b82f6" }} />
                <span className="font-mono" style={{ fontSize: "0.68rem", color: "#4b5563" }}>contact.sh</span>
              </div>
              <div className="p-5 font-mono space-y-3" style={{ fontSize: "0.78rem" }}>
                <div className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>❯</span>
                  <div>
                    <span style={{ color: "#60a5fa" }}>echo</span>
                    <span style={{ color: "#94a3b8" }}> $STATUS</span>
                    <div style={{ color: "#4ade80", marginTop: "2px" }}>→ Open to opportunities</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>❯</span>
                  <div className="flex items-center gap-2">
                    <MapPin size={10} style={{ color: "#60a5fa" }} />
                    <span style={{ color: "#94a3b8" }}>Location:</span>
                    <span style={{ color: "#e2e8f0" }}>Manila, Philippines</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span style={{ color: "#22c55e" }}>❯</span>
                  <div className="flex items-center gap-2">
                    <Clock size={10} style={{ color: "#60a5fa" }} />
                    <span style={{ color: "#94a3b8" }}>Response:</span>
                    <span style={{ color: "#e2e8f0" }}>Within 24 hours</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#22c55e" }}>❯</span>
                  <span className="cursor-blink inline-block w-2 h-3.5 bg-blue-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {contacts.map((c, i) => {
                const iconPath = ICON_PATHS[c.icon] || ICON_PATHS["Globe"];
                const iconColor = ICON_COLORS[c.icon] || ICON_COLORS["Globe"];
                return (
                  <motion.a key={c.name} href={c.url} target={c.icon !== "Mail" ? "_blank" : undefined} rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -15 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none" }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(59,130,246,0.07)"; el.style.borderColor = "rgba(59,130,246,0.3)"; el.style.transform = "translateX(4px)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.02)"; el.style.borderColor = "rgba(255,255,255,0.06)"; el.style.transform = "translateX(0)"; }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", color: iconColor }}>
                      {iconPath && <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}><path d={iconPath} /></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.82rem", color: "#e2e8f0", fontFamily: "'Space Grotesk'", fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#475569", fontFamily: "'JetBrains Mono'" }}>{c.url.replace("mailto:", "").replace("https://", "")}</div>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.3 }} className="lg:col-span-3">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-12 text-center"
                style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.25)", boxShadow: "0 0 40px rgba(59,130,246,0.1)" }}
              >
                <div className="text-4xl mb-4">🚀</div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk'", marginBottom: "8px" }}>Message Sent!</h3>
                <p style={{ color: "#64748b", fontFamily: "'Space Grotesk'", fontSize: "0.9rem" }}>Thanks for reaching out. I'll get back to you within 24 hours.</p>
                <div className="mt-6 font-mono rounded-lg px-4 py-3 inline-block" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", fontSize: "0.75rem", color: "#4ade80" }}>
                  ✓ status: 200 OK — message delivered
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                  </div>
                  <span className="font-mono ml-2" style={{ fontSize: "0.68rem", color: "#374151" }}>send_message.ts</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[0.75rem] text-blue-400">name:</Label>
                    <Input required type="text" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono text-[0.75rem] text-blue-400">email:</Label>
                    <Input required type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={fieldClass} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[0.75rem] text-blue-400">message:</Label>
                  <Textarea required rows={6} placeholder="Tell me about your project..." value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className={`${fieldClass} resize-vertical min-h-[144px]`} />
                </div>
                <Button type="submit" size="lg" className="w-full text-white rounded-xl border-0 gap-2 transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)", boxShadow: "0 4px 20px rgba(59,130,246,0.3)", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(59,130,246,0.45)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,130,246,0.3)"; }}
                >
                  <Send size={15} />
                  Send Message
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
