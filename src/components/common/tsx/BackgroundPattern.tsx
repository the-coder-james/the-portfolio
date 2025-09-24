"use client";

import DotPattern from "@/components/ui/dot-pattern";
import Particles from "@/components/ui/particles";
import { cn } from "@/lib/utils";

export const BackgroundPattern = () => {
  return (
    <>
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "fill-slate-300 dark:fill-slate-700"
        )}
      />
      <Particles
        className="absolute inset-0"
        quantity={100}
        ease={80}
        color="#ffffff"
        refresh
      />
    </>
  );
};