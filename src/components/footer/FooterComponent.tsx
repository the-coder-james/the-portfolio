import { Code2, Heart } from "lucide-react";

export function FooterComponent() {
  return (
    <footer className="relative py-10" style={{ background: "#020509", borderTop: "1px solid rgba(59,130,246,0.1)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Code2 size={14} className="text-white" />
            </div>
            <span className="font-mono" style={{ fontSize: "0.82rem", color: "#374151" }}>
              <span style={{ color: "#3b82f6" }}>&lt;</span>james<span style={{ color: "#3b82f6" }}>/&gt;</span>
            </span>
          </div>

          <p className="flex items-center gap-1.5" style={{ fontSize: "0.78rem", color: "#1e293b", fontFamily: "'Space Grotesk', sans-serif" }}>
            Built with <Heart size={11} style={{ color: "#3b82f6", fill: "#3b82f6" }} /> and way too much coffee
          </p>

          <p className="font-mono" style={{ fontSize: "0.7rem", color: "#1e293b" }}>
            © {new Date().getFullYear()} — All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
