"use client";
import { useState, useEffect, useRef } from "react";
import { animateEl } from "@/lib/utils";
import { Menu, Code2 } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import dataJson from "@/assets/data.json";

const navLinks = dataJson.nav;

export function HeaderComponent() {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    if (!navRef.current) return;
    animateEl(
      navRef.current as Element,
      { y: [-80, 0], opacity: [0, 1] },
      { type: "spring", visualDuration: 0.55, bounce: 0.2 }
    );
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      for (let i = navLinks.length - 1; i >= 0; i--) {
        const el = document.getElementById(navLinks[i].href.slice(1));
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(navLinks[i].href.slice(1));
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const indicator = indicatorRef.current;
    const activeBtn = linkRefs.current[activeSection];
    if (!indicator || !activeBtn) return;
    const parent = indicator.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    animateEl(
      indicator as Element,
      { left: btnRect.left - parentRect.left, width: btnRect.width, opacity: 1 },
      { type: "spring", visualDuration: 0.3, bounce: 0.1 }
    );
  }, [activeSection]);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-[60] transition-all duration-300"
      style={{
        background: scrolled ? "var(--scrim-base-90)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--tint-brand-12)" : "none",
        opacity: 0,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
            <Code2 size={16} className="text-white" />
          </div>
          <span className="font-mono text-white" style={{ fontSize: "0.9rem" }}>
            <span className="text-blue-400">&lt;</span>james<span className="text-blue-400">/&gt;</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1 relative">
          <div
            ref={indicatorRef}
            className="absolute bottom-0 h-0.5 bg-blue-500 rounded-full pointer-events-none"
            style={{ left: 0, width: 0, opacity: 0 }}
          />
          {navLinks.map((link) => {
            const id = link.href.slice(1);
            const isActive = activeSection === id;
            return (
              <button
                key={link.label}
                ref={(el) => { linkRefs.current[id] = el; }}
                onClick={() => scrollTo(link.href)}
                className="relative px-4 py-2 text-sm transition-colors duration-200"
                style={{
                  color: isActive ? "var(--color-brand-400)" : "var(--color-ink-dim)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--color-ink-muted)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--color-ink-dim)"; }}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger className="md:hidden inline-flex w-9 h-9 items-center justify-center rounded-md text-white hover:bg-[var(--tint-white-06)] transition-colors">
              <Menu size={22} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] border-l-[var(--tint-brand-15)] flex flex-col gap-0 pt-16"
              style={{ background: "var(--scrim-base-98)", backdropFilter: "blur(20px)" }}
            >
              <div className="flex items-center gap-2 mb-8 px-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Code2 size={14} className="text-white" />
                </div>
                <span className="font-mono text-white" style={{ fontSize: "0.85rem" }}>
                  <span className="text-blue-400">&lt;</span>james<span className="text-blue-400">/&gt;</span>
                </span>
              </div>
              <nav className="flex flex-col gap-1 flex-1">
                {navLinks.map((link) => {
                  const isActive = activeSection === link.href.slice(1);
                  return (
                    <SheetClose
                      key={link.label}
                      onClick={() => scrollTo(link.href)}
                      className="text-left px-4 py-3 rounded-lg text-sm transition-colors"
                      style={{
                        color: isActive ? "var(--color-brand-400)" : "var(--color-ink-dim)",
                        background: isActive ? "var(--tint-brand-10)" : "transparent",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      <span className="text-blue-500 font-mono mr-2">//</span>
                      {link.label}
                    </SheetClose>
                  );
                })}
              </nav>
              <SheetClose
                onClick={() => scrollTo("#contact")}
                className="m-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm text-white border border-[var(--tint-brand-40)] bg-[var(--tint-brand-20)] hover:bg-[var(--tint-brand-35)] transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Hire Me
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
