import { useEffect, useRef, useState } from "react";
import { animate, createTimeline, onScroll } from "animejs";

interface AboutImageProps {
  name: string;
  imageUrl: string;
  hoverImageUrl?: string;
}

export function AboutImage({ name, imageUrl, hoverImageUrl }: AboutImageProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const availableRef = useRef<HTMLDivElement>(null);
  const yearsRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const tl = createTimeline({
      defaults: { ease: "out(3)" },
      autoplay: onScroll({ target: wrapper, enter: "bottom-=100 top" }),
    });

    tl.add(wrapper, {
      opacity: [0, 1],
      scale: [0.85, 1],
      duration: 600,
      delay: 250,
    })
      .add(
        portraitRef.current!,
        {
          rotate: [-12, 0],
          duration: 700,
          ease: "outElastic(1, 0.6)",
        },
        "-=400"
      )
      .add(
        availableRef.current!,
        {
          opacity: [0, 1],
          scale: [0, 1],
          duration: 600,
          ease: "outElastic(1, 0.5)",
        },
        "-=200"
      )
      .add(
        yearsRef.current!,
        {
          opacity: [0, 1],
          translateX: [-12, 0],
          duration: 500,
        },
        "-=400"
      );

    if (ringRef.current) {
      animate(ringRef.current, {
        rotate: 360,
        duration: 12000,
        ease: "linear",
        loop: true,
      });
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="flex justify-center lg:justify-start mb-10"
      style={{ opacity: 0 }}
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
        <div
          ref={ringRef}
          className="absolute -inset-2 rounded-full pointer-events-none"
          style={{ border: "1.5px dashed rgba(59,130,246,0.3)", borderRadius: "9999px" }}
        />
        <div
          ref={portraitRef}
          className="relative rounded-full overflow-hidden"
          style={{ width: "170px", height: "170px", border: "3px solid rgba(59,130,246,0.6)", boxShadow: "0 0 30px rgba(59,130,246,0.35)" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <img
            src={imageUrl}
            alt={`${name} photo`}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
            style={{ opacity: hovered && hoverImageUrl ? 0 : 1 }}
          />
          {hoverImageUrl && (
            <img
              src={hoverImageUrl}
              alt={`${name} hover photo`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
              style={{ opacity: hovered ? 1 : 0 }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(3,7,18,0.35) 100%)" }} />
        </div>
        <div
          ref={availableRef}
          className="absolute -bottom-1 -right-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: "#0d1117", border: "1px solid rgba(59,130,246,0.35)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", opacity: 0 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 cursor-blink" />
          <span className="font-mono" style={{ fontSize: "0.6rem", color: "#6ee7b7", whiteSpace: "nowrap" }}>available</span>
        </div>
        <div
          ref={yearsRef}
          className="absolute -top-2 -left-4 px-2.5 py-1 rounded-lg font-mono"
          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", fontSize: "0.6rem", color: "#93c5fd", whiteSpace: "nowrap", opacity: 0 }}
        >
          10+ yrs coding
        </div>
      </div>
    </div>
  );
}
