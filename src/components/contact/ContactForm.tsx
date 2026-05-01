import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const fieldClass =
  "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-slate-200 " +
  "placeholder:text-slate-600 rounded-[10px] " +
  "focus-visible:border-[rgba(59,130,246,0.5)] focus-visible:bg-[rgba(59,130,246,0.05)] " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 " +
  "[font-family:'Space_Grotesk',sans-serif] text-[0.88rem]";

export function ContactForm() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.3 }}
    >
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.25)", boxShadow: "0 0 40px rgba(59,130,246,0.1)" }}
        >
          <div className="text-4xl mb-4">🚀</div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f1f5f9", fontFamily: "'Space Grotesk'", marginBottom: "8px" }}>
            Message Sent!
          </h3>
          <p style={{ color: "#64748b", fontFamily: "'Space Grotesk'", fontSize: "0.9rem" }}>
            Thanks for reaching out. I'll get back to you within 24 hours.
          </p>
          <div
            className="mt-6 font-mono rounded-lg px-4 py-3 inline-block"
            style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", fontSize: "0.75rem", color: "#4ade80" }}
          >
            ✓ status: 200 OK — message delivered
          </div>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 space-y-5"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
            </div>
            <span className="font-mono ml-2" style={{ fontSize: "0.68rem", color: "#374151" }}>
              send_message.ts
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="font-mono text-[0.75rem] text-blue-400">name:</Label>
              <Input
                required
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[0.75rem] text-blue-400">email:</Label>
              <Input
                required
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-mono text-[0.75rem] text-blue-400">message:</Label>
            <Textarea
              required
              rows={6}
              placeholder="Tell me about your project..."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className={`${fieldClass} resize-vertical min-h-[144px]`}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full text-white rounded-xl border-0 gap-2 transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
              boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(59,130,246,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,130,246,0.3)";
            }}
          >
            <Send size={15} />
            Send Message
          </Button>
        </form>
      )}
    </motion.div>
  );
}
