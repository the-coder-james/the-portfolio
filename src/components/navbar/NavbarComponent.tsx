"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Menu, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";

const navLinks = [
  { label: "About",      href: "#about" },
  { label: "Skills",     href: "#skills" },
  { label: "Projects",   href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact",    href: "#contact" },
];

export function NavbarComponent() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = navLinks.map((l) => l.href.slice(1));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(3,7,18,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(59,130,246,0.12)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="relative px-4 py-2 text-sm transition-colors duration-200"
                style={{
                  color: isActive ? "#60a5fa" : "#94a3b8",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#94a3b8"; }}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* CTA + mobile trigger */}
        <div className="flex items-center gap-3">
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => scrollTo("#contact")}
            className="hidden md:flex text-white border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.15)] hover:bg-[rgba(59,130,246,0.3)] hover:border-[rgba(59,130,246,0.8)] hover:text-white rounded-lg"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Hire Me
          </Button> */}

          <Sheet>
            <SheetTrigger className="md:hidden inline-flex w-9 h-9 items-center justify-center rounded-md text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
              <Menu size={22} />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] border-l-[rgba(59,130,246,0.15)] flex flex-col gap-0 pt-16"
              style={{ background: "rgba(3,7,18,0.98)", backdropFilter: "blur(20px)" }}
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
                        color: isActive ? "#60a5fa" : "#94a3b8",
                        background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
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
                className="m-4 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm text-white border border-[rgba(59,130,246,0.4)] bg-[rgba(59,130,246,0.2)] hover:bg-[rgba(59,130,246,0.35)] transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Hire Me
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
