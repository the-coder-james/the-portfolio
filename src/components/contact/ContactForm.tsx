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
import { trackEvent } from "@/components/common/tsx/ConsentStore";

// Sourced from the same list the contact cards render, so the address cannot
// drift between the two.
const CONTACT_EMAIL =
  contactJson.find((c) => c.url.startsWith("mailto:"))?.url.replace("mailto:", "") ?? "";

// Fields print as ink-line boxes (a 3:1 boundary). Focus has to stand out from
// that resting line, so it takes the solid spot ink plus a 3px halo: a border
// tint alone changed only the hue and nearly vanished on Blueprint, where the
// line and the spot ink are both pale.
const fieldClass =
  "bg-[var(--tint-white-03)] border-[var(--color-card-border)] text-[var(--color-ink-muted)] " +
  "placeholder:text-[var(--color-ink-faint)] rounded-[10px] " +
  "focus-visible:border-[var(--color-brand)] focus-visible:bg-[var(--tint-brand-05)] " +
  "focus-visible:ring-[3px] focus-visible:ring-[var(--tint-brand-25)] focus-visible:ring-offset-0 " +
  "text-[0.88rem]";

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

    // The one event worth having: pageviews cannot tell you whether anyone
    // actually tried to make contact. No-ops without consent, and the field
    // values are deliberately not sent -- only that a submit happened.
    trackEvent("contact_submit", { has_email: Boolean(email) });

    setSubmitted(true);
  };

  return (
    <Reveal x={40} delay={0.15}>
      {submitted ? (
        /* Announced so screen-reader users learn the message was sent — the
           panel previously appeared with no live region at all. */
        <motion.div
          role="status"
          // Pinned to its end state in CSS under reduced motion.
          data-reveal=""
          className="rounded-2xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", visualDuration: 0.5, bounce: 0.05 }}
          style={{ background: "var(--sheet-brand-07)", border: "1px solid var(--color-card-border)" }}
        >
          <div className="text-4xl mb-4" aria-hidden="true">🚀</div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-ink)", marginBottom: "8px" }}>
            Your draft is ready
          </h3>
          <p style={{ color: "var(--color-ink-dim)", fontSize: "0.9rem" }}>
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
              className="btn-sheet px-5 py-2.5 text-[0.85rem]"
            >
              Write another
            </button>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="btn-sheet px-5 py-2.5 text-[0.85rem]"
            >
              Email directly
            </a>
          </div>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="contact-form rounded-2xl p-5 space-y-3.5"
          style={{ background: "var(--color-card-surface)", border: "1px solid var(--color-card-border)" }}
        >
          <div className="contact-form-titlebar flex items-center gap-2 mb-1">
            <TrafficLights />
            <span className="font-mono ml-2" style={{ fontSize: "0.68rem", color: "var(--color-ink-faint)" }}>
              send_message.ts
            </span>
          </div>
          {/* Side by side at every width: stacked, the pair cost a phone
              ~70px of a section that has to fit one screen. */}
          <div className="contact-name-email grid grid-cols-2 gap-3 md:gap-5">
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
              className={`${fieldClass} contact-textarea resize-vertical`}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            // The primary plate (.btn-ink, global.css). It is unlayered CSS,
            // so it outranks the shadcn variant utilities on the same element.
            className="btn-ink w-full gap-2"
          >
            <Send size={15} />
            Send Message
          </Button>
        </form>
      )}
    </Reveal>
  );
}
