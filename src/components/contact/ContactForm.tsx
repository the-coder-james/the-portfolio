import { useState } from "react";
import { motion } from "motion/react";
import { Reveal } from "@/components/common/tsx/Reveal";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TrafficLights } from "@/components/common/tsx/TerminalShell";
import contactJson from "@/assets/contact.json";

// Sourced from the same list the contact cards render, so the address cannot
// drift between the two.
const CONTACT_EMAIL =
  contactJson.find((c) => c.url.startsWith("mailto:"))?.url.replace("mailto:", "") ?? "";

const fieldClass =
  "bg-[var(--tint-white-03)] border-[var(--tint-white-08)] text-[var(--color-ink-muted)] " +
  "placeholder:text-[var(--color-ink-faint)] rounded-[10px] " +
  "focus-visible:border-[var(--tint-brand-50)] focus-visible:bg-[var(--tint-brand-05)] " +
  "focus-visible:ring-0 focus-visible:ring-offset-0 " +
  "[font-family:'Space_Grotesk',sans-serif] text-[0.88rem]";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    // No backend exists, so the honest thing is to hand the draft to the
    // visitor's mail client rather than claim a delivery that never happened.
    const subject = encodeURIComponent(`Portfolio enquiry from ${name || "someone"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ""}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <Reveal x={40} delay={0.15}>
      {submitted ? (
        /* Announced so screen-reader users learn the message was sent — the
           panel previously appeared with no live region at all. */
        <motion.div
          role="status"
          className="rounded-2xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", visualDuration: 0.5, bounce: 0.05 }}
          style={{ background: "var(--tint-brand-07)", border: "1px solid var(--tint-brand-25)", boxShadow: "0 0 40px var(--tint-brand-10)" }}
        >
          <div className="text-4xl mb-4" aria-hidden="true">🚀</div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-ink)", fontFamily: "'Space Grotesk'", marginBottom: "8px" }}>
            Your draft is ready
          </h3>
          <p style={{ color: "var(--color-ink-dim)", fontFamily: "'Space Grotesk'", fontSize: "0.9rem" }}>
            I've opened your mail app with the message filled in — press send there and
            I'll reply within 24 hours. Nothing left this page on its own.
          </p>
          <div
            className="mt-6 font-mono rounded-lg px-4 py-3 inline-block"
            style={{ background: "var(--tint-success-08)", border: "1px solid var(--tint-success-20)", fontSize: "0.75rem", color: "var(--color-success)" }}
          >
            <span aria-hidden="true">✓</span> handoff: mailto composed
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="btn-soft inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200"
              style={{ color: "var(--color-brand-text)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem", fontWeight: 500 }}
            >
              Write another
            </button>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="btn-soft inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200"
              style={{ color: "var(--color-brand-text)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.85rem", fontWeight: 500, textDecoration: "none" }}
            >
              Email directly
            </a>
          </div>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-8 space-y-5"
          style={{ background: "var(--color-card-surface)", border: "1px solid var(--color-card-border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrafficLights />
            <span className="font-mono ml-2" style={{ fontSize: "0.68rem", color: "var(--color-ink-faint)" }}>
              send_message.ts
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name" className="font-mono text-[0.75rem] text-brand">name:</Label>
              <Input
                id="contact-name" name="name"
                required
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email" className="font-mono text-[0.75rem] text-brand">email:</Label>
              <Input
                id="contact-email" name="email"
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
            <Label htmlFor="contact-message" className="font-mono text-[0.75rem] text-brand">message:</Label>
            <Textarea
              id="contact-message" name="message"
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
            className="btn-lift w-full text-on-brand rounded-xl border-0 gap-2"
            style={{
              background: "linear-gradient(135deg, var(--color-brand-900), var(--color-brand-700))",
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
    </Reveal>
  );
}
