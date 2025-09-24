import { Card, CardFooter, CardTitle, CardContent } from "@/components/ui/card"
import * as LucideReact from "lucide-react"
import * as Si from "react-icons/si"


const GetIconComponent = (icon:any) => {
  const li = LucideReact as Record<string, React.ComponentType<{ className?: string }>>;
  const si = Si as Record<string, React.ComponentType<{ className?: string }>>;
  let Icon = li[icon.icon]

  if (!Icon) {
    Icon = si[icon.icon]
  }

  return(<Icon className={ icon.className } />);
}

export default function TechstackComponent (data:any, idx:any) {
  const item = data.data;
  
  return(
    <Card
      key={idx}
      className="
        justify-between
        w-[44%]
        transition-transform
        hover:scale-[1.03]
        hover:shadow-lg 
        dark:hover:shadow-black/30
        max-lg:w-full
      ">
      <CardContent className="text-center">
        <GetIconComponent icon={item.icon} className="mx-auto mb-4 h-6 w-6 text-muted-foreground" />
        <CardTitle className="text-center">
           <h3 className="text-xl font-semibold">{item.name}</h3>
        </CardTitle>
        <p className="mt-2 text-muted-foreground text-base">{item.description}</p>
        <div className="mt-4 flex justify-center gap-2">
          {item.tools.map((tool:any, idx2:number) => (
            <GetIconComponent
              icon={tool.icon}
              key={idx2}
              className={`w-6 h-6 ${tool.color}`}
              title={tool.title}
              aria-label={tool.title}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className={`flex items- justify-center gap-1 rounded-full mx-3 px-3 py-1 text-sm font-medium ${item.badge.color}`} >
        <GetIconComponent icon={item.badge.icon} className="w-4 h-4" />
        {item.badge.label}
      </CardFooter>
    </Card>
  );
}
