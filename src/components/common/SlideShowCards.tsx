"use client";

import { FaLinux, FaPhp, FaDocker, FaWordpress, FaReact, FaGulp, FaSymfony } from "react-icons/fa"
import { SiApache, SiMysql, SiTypescript, SiOpenai,SiJavascript, SiMongodb, SiExpress, SiNodedotjs, SiTailwindcss, SiAstro } from "react-icons/si";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from 'react';

const tiles = [
  FaLinux,
  SiApache,
  SiMysql,
  FaPhp,
  FaDocker,
  SiTypescript,
  FaWordpress,
  SiOpenai,
  SiJavascript,
  SiMongodb,
  SiExpress,
  FaReact,
  SiNodedotjs,
  FaGulp,
  FaSymfony,
  SiTailwindcss,
  SiAstro
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomColor(): string {
  const colors = [
    'text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500',
    'text-purple-500', 'text-pink-500', 'text-indigo-500', 'text-orange-500',
    'text-teal-500', 'text-cyan-500', 'text-lime-500', 'text-emerald-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default function SlideShowCards() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(()=> {
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
      dark:from-black/30 dark:via-black/20 dark:to-black/10
        max-md: opacity-70
      ">
        <div className="
          absolute
          right-0
          bottom-0
          inset-0
          z-0
          flex
          justify-end
          items-center
        ">
          <div className="rotate-6 scale-110">
            <div className="flex flex-col animate-vertical-loop gap-5">
              { Array.from({ length: numColumns }).map((_, colIndex) => (
                <div key={colIndex} className="flex gap-2">
                  {shuffleArray(tiles).map((IconComponent, idx) => (
                    <Card
                      key={idx}
                      ref={cardRef}
                      className="overflow-hidden rounded-2xl shadow-lg p-5 flex items-center justify-center"
                    >
                      <CardContent className="p-0">
                        <IconComponent className={getRandomColor()} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
