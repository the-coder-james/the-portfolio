import { Mail, Globe, Github, Linkedin } from "lucide-react"
import contacts from "@/assets/contact.json"

const iconMap: Record<string, React.ComponentType> = { Github, Linkedin, Mail, Globe }

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-5">
      {contacts.map(({ url, name, icon, textHoverClass }) => {
        const Icon = iconMap[icon]
        return (
          <a key={name} className={`w-50 hover:${textHoverClass} transition-all hover:scale-125`} href={url} aria-label={name} target="_blank">
            <Icon />
          </a>
        )
      })}
    </div>
  )
}
