import { useEffect, useRef, useState } from "react";
import { inView } from "motion";
import { animateEl } from "@/lib/utils";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TrafficLights } from "@/components/common/tsx/TerminalShell";

const fieldClass =
  "bg-[var(--tint-white-03)] border-[var(--tint-white-08)] text-slate-200 " +
  "placeholder:text-slate-600 rounded-[10px] " +
  "focus-visible:border-[var(--tint-brand-50)] focus-visible:bg-[var(--tint-brand-05)] " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 " +
  "[font-family:'Space_Grotesk',sans-serif] text-[0.88rem]";

export function ContactForm() {
  const ref = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    inView(el, () => {
      animateEl(el as Element, { opacity: [0, 1], x: [40, 0] }, { delay: 0.15, type: "spring", visualDuration: 0.6, bounce: 0.2 });
    }, { margin: "-60px" });
  }, []);

  useEffect(() => {
    if (submitted && successRef.current) {
      animateEl(successRef.current as Element, { opacity: [0, 1], scale: [0.85, 1] }, { type: "spring", visualDuration: 0.5, bounce: 0.05 });
    }
  }, [submitted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {submitted ? (
        <div
          ref={successRef}
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-25)", boxShadow: "0 0 40px var(--tint-brand-10)", opacity: 0 }}
        >
          <div className="text-4xl mb-4">🚀</div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk'", marginBottom: "8px" }}>
            Message Sent!
          </h3>
          <p style={{ color: "var(--color-ink-dim)", fontFamily: "'Space Grotesk'", fontSize: "0.9rem" }}>
            Thanks for reaching out. I'll get back to you within 24 hours.
          </p>
          <div
            className="mt-6 font-mono rounded-lg px-4 py-3 inline-block"
            style={{ background: "var(--tint-success-08)", border: "1px solid var(--tint-success-20)", fontSize: "0.75rem", color: "var(--color-success)" }}
          >
            ✓ status: 200 OK — message delivered
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 space-y-5"
          style={{ background: "var(--tint-white-02)", border: "1px solid var(--tint-white-07)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrafficLights />
            <span className="font-mono ml-2" style={{ fontSize: "0.68rem", color: "var(--color-ink-faint)" }}>
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
            className="btn-lift w-full text-white rounded-xl border-0 gap-2"
            style={{
              background: "linear-gradient(135deg, var(--color-brand-900), var(--color-brand))",
              boxShadow: "0 4px 20px var(--tint-brand-30)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
            }}
          >
            <Send size={15} />
            Send Message
          </Button>
        </form>
      )}
    </div>
  );
}
