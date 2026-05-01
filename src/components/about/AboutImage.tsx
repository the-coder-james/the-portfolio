import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

interface AboutImageProps {
  name: string;
  imageUrl: string;
  hoverImageUrl?: string;
}

export function AboutImage({ name, imageUrl, hoverImageUrl }: AboutImageProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: 0.25 }}
      className="flex justify-center lg:justify-start mb-10"
    >
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8, #0f172a)",
            padding: "3px",
            borderRadius: "9999px",
            boxShadow: "0 0 40px rgba(59,130,246,0.45), 0 0 80px rgba(59,130,246,0.15)",
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-2 rounded-full pointer-events-none"
          style={{ border: "1.5px dashed rgba(59,130,246,0.3)", borderRadius: "9999px" }}
        />
        <div
          className="relative rounded-full overflow-hidden"
          style={{ width: "170px", height: "170px", border: "3px solid rgba(59,130,246,0.6)", boxShadow: "0 0 30px rgba(59,130,246,0.35)" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={imageUrl}
            alt={`${name} photo`}
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
            style={{ opacity: hovered && hoverImageUrl ? 0 : 1 }}
          />
          {hoverImageUrl && (
            <img
              src={hoverImageUrl}
              alt={`${name} hover photo`}
              className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
              style={{ opacity: hovered ? 1 : 0 }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(3,7,18,0.35) 100%)" }} />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.8, type: "spring", stiffness: 260 }}
          className="absolute -bottom-1 -right-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "#0d1117", border: "1px solid rgba(59,130,246,0.35)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cursor-blink" />
          <span className="font-mono" style={{ fontSize: "0.6rem", color: "#6ee7b7", whiteSpace: "nowrap" }}>available</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 1.0 }}
          className="absolute -top-2 -left-4 px-2.5 py-1 rounded-lg font-mono"
          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", fontSize: "0.6rem", color: "#93c5fd", whiteSpace: "nowrap" }}
        >
          10+ yrs coding
        </motion.div>
      </div>
    </motion.div>
  );
}
