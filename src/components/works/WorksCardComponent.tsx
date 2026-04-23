import roles from "../../assets/roles.json";
import techs from "../../assets/techs.json";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card"
import { Img } from 'react-image';
import { ArrowUpRight } from "lucide-react";

import TaglistComponent from "@/components/common/tsx/TaglistComponent";
import WorksDialogComponent from "./WorksDialogComponent";
import "@/components/works/WorksTypings";

const WorksCardComponent = ({ data, featured = false }: { data: ProjectData; featured?: boolean }) => {
  return (
    <Card
      className={`
        group relative flex flex-col justify-between gap-4 overflow-hidden
        border-border/60 bg-card/40 py-0 pb-5
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:border-white/60 hover:bg-card/70 hover:shadow-xl hover:shadow-white/5
        ${featured ? 'sm:col-span-2 md:col-span-2 md:row-span-2' : ''}
      `}
    >
      <CardContent className="grid gap-4 p-0">
        <div className="relative overflow-hidden">
          <AspectRatio ratio={featured ? 16 / 9 : 16 / 10} className="bg-muted">
            <Img
              src={data.image.url}
              loader={<span className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</span>}
              unloader={<span className="flex h-full items-center justify-center text-sm text-muted-foreground">Failed to load</span>}
              alt={data.image.alt}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </AspectRatio>

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 max-md:hidden">
            <div className="grid gap-1 text-xs text-white">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wider text-white/50">Role</span>
                <span>{(roles as roles)[data.role].name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wider text-white/50">Stack</span>
                <span>{(techs as techs)[data.tech].name}</span>
              </div>
            </div>
          </div>

          <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {data.date}
          </span>
        </div>

        <div className="grid gap-2.5 px-5">
          <h3 className={`scroll-m-20 font-semibold tracking-tight ${featured ? 'text-2xl max-md:text-lg' : 'text-lg max-md:text-base'}`}>
            {data.title}
          </h3>

          {featured && (
            <p className="line-clamp-2 text-sm text-muted-foreground max-md:hidden">
              {data.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground md:hidden">
            <span>{(roles as roles)[data.role].name}</span>
            <span aria-hidden>·</span>
            <span>{(techs as techs)[data.tech].name}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <TaglistComponent datatags={data.tags}/>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 px-5">
        <Button className="flex-1 gap-2" variant="secondary" asChild>
          <a href={data.siteurl} target="_blank" rel="noreferrer">
            Preview <ArrowUpRight className="size-4" />
          </a>
        </Button>
        <WorksDialogComponent data={data} />
      </CardFooter>
    </Card>
  );
};

export default WorksCardComponent;
