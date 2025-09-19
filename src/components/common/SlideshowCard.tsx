"use client";

import { Camera, Cloud, Sun, Moon, Layers, Globe, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from 'react';

const tiles = [
  Camera,
  Cloud,
  Sun,
  Moon,
  Layers,
  Globe,
  ImageIcon,
  Cloud,
  Camera,
  Sun,
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SlideShowCard() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 1200,
    height: 800,
  });

  useEffect(()=> {
    if (typeof window !== "undefined") {
      const windowsResized = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
      window.addEventListener('resize', windowsResized);

      windowsResized();

      return () => {
        window.removeEventListener('resize', windowsResized);
      };
    }
  }, []);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const cardSize = cardRef.current?.getBoundingClientRect();

  let numRows = 20 as number;
  let numColumns = 20 as number;
  
  if (cardSize) {
    numRows = Math.floor(windowDimensions.width / cardSize?.width) * Math.floor(windowDimensions.height / cardSize?.height);
    numColumns = Math.floor(numRows / tiles.length) * Math.floor(windowDimensions.height / cardSize?.height);
  }

  return (
      <>
        <div className="
          absolute
          bottom-0
          left-0
          inset-0
          z-1
          bg-gradient-to-b from-white/60 via-white/40 to-white/20
        dark:from-black/30 dark:via-black/20 dark:to-black/10"
        />
        <div className="
          absolute
          right-0
          bottom-0
          inset-0
          z-0
          flex
          justify-center
        ">
          <div className="rotate-6 scale-110">
            <div className="flex flex-col animate-true-vertical-loop gap-5">
              {Array.from({ length: numColumns }).map((_, colIndex) => (
                <div key={colIndex} className="flex gap-2">
                  {shuffleArray(tiles).map((IconComponent, idx) => (
                    <Card
                      key={idx}
                      ref={cardRef}
                      className="overflow-hidden rounded-2xl shadow-lg w-30 h-30 flex items-center justify-center"
                    >
                      <CardContent className="p-0">
                        <IconComponent className="text-black dark:text-gray-300" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
    </>
  );
}
