import { Card, CardContent } from "@/components/ui/card";
import { Github, Globe, Linkedin, Mail } from "lucide-react";
import { useState } from "react";

interface ContactItem {
  name: string;
  url: string;
  icon: string;
  hoverClass?: string;      // Tailwind class for icon & text
  textHoverClass?: string;  // Tailwind class for card background
}

export default function ContactCard({ name, url, icon, hoverClass, textHoverClass }: ContactItem) {
  const iconMap = { Github, Linkedin, Mail, Globe };
  const Icon = iconMap[icon as keyof typeof iconMap] ?? Mail;

  const [hovered, setHovered] = useState(false);

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Card
        className={`transition-all hover:-translate-y-2 hover:shadow-xl`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardContent className="flex flex-col items-center justify-center text-center gap-6 py-5 px-6">
          
          <Icon
            className={`
              w-15 h-15 sm:w-20 sm:h-20 md:w-36 md:h-36 lg:w-[120px] lg:h-[120px]
              transition-colors duration-300
              ${hovered ? hoverClass || "" : ""}
            `}
            strokeWidth={1.5}
          />

          <span
            className={`
              font-semibold text-lg sm:text-xl md:text-2xl text-center
              transition-colors duration-300
              ${hovered ? textHoverClass || "" : ""}
            `}
          >
            {name}
          </span>

        </CardContent>
      </Card>
    </a>
  );
}