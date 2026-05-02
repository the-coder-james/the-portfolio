import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";

interface ContactLink {
  url: string;
  name: string;
  icon: string;
  hoverColor: string;
}

interface ContactCardProps {
  contact: ContactLink;
  index: number;
}

const ICON_PATHS: Record<string, string> = {
  Github: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
  Linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  Mail: "M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z",
  Globe: "M12 0C5.374 0 0 5.373 0 12c0 6.628 5.374 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm-.354 2.007c.76.054 1.517.195 2.246.422L11.5 5H9l-.734-1.47A10.03 10.03 0 0111.646 2.007zM8.5 5l1-2h5l1 2H8.5z",
};

const ICON_COLORS: Record<string, string> = {
  Github: "#e2e8f0",
  Linkedin: "#60a5fa",
  Mail: "#818cf8",
  Website: "#34d399",
  Globe: "#34d399",
};

export function ContactCard({ contact, index }: ContactCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const iconPath = ICON_PATHS[contact.icon] || ICON_PATHS["Globe"];
  const iconColor = ICON_COLORS[contact.icon] || ICON_COLORS["Globe"];
  const displayUrl = contact.url.replace("mailto:", "").replace("https://", "");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    animate(el, {
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: 500,
      delay: 500 + index * 100,
      ease: "out(3)",
      autoplay: onScroll({ target: el, enter: "bottom-=80 top" }),
    });
  }, [index]);

  return (
    <a
      ref={ref}
      href={contact.url}
      target={contact.icon !== "Mail" ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", opacity: 0 }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(59,130,246,0.07)";
        el.style.borderColor = "rgba(59,130,246,0.3)";
        el.style.transform = "translateX(4px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "rgba(255,255,255,0.02)";
        el.style.borderColor = "rgba(255,255,255,0.06)";
        el.style.transform = "translateX(0)";
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.04)", color: iconColor }}
      >
        {iconPath && (
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
            <path d={iconPath} />
          </svg>
        )}
      </div>
      <div>
        <div style={{ fontSize: "0.82rem", color: "#e2e8f0", fontFamily: "'Space Grotesk'", fontWeight: 500 }}>
          {contact.name}
        </div>
        <div style={{ fontSize: "0.72rem", color: "#475569", fontFamily: "'JetBrains Mono'" }}>
          {displayUrl}
        </div>
      </div>
    </a>
  );
}
