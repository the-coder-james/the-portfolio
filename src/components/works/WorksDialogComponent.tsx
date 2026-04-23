import techs from "../../assets/techs.json"
import roles from "../../assets/roles.json";
import projectprovider from "../../assets/projectprovider.json";
import '@/components/works/WorksTypings';

import { Img } from 'react-image';
import { AspectRatio } from '../ui/aspect-ratio';
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import TaglistComponent from "@/components/common/tsx/TaglistComponent";

const WorksDialogComponent = ( {data} : {data:ProjectData} ) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex-1">Details</Button>
      </DialogTrigger>
      <DialogContent
        className="
          flex flex-col gap-0 overflow-hidden p-0
          max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:translate-x-0 max-md:translate-y-0 max-md:w-full max-md:max-w-full max-md:h-[88vh] max-md:rounded-t-2xl max-md:rounded-b-none
          md:top-0 md:bottom-0 md:right-0 md:left-auto md:translate-x-0 md:translate-y-0 md:h-full md:w-[min(560px,90vw)] md:max-w-[560px] md:rounded-none md:border-y-0 md:border-r-0
          max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom
          md:data-[state=open]:slide-in-from-right md:data-[state=closed]:slide-out-to-right
        "
      >
        <DialogHeader className="shrink-0 gap-0 space-y-0 p-0 text-left">
          <AspectRatio ratio={16 / 9} className="bg-muted border-b border-border/40">
            <Img
              src={data.image.url}
              loader={<span className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</span>}
              unloader={<span className="flex h-full items-center justify-center text-sm text-muted-foreground">Failed to load</span>}
              alt={data.image.alt}
              className="h-full w-full object-cover"
            />
          </AspectRatio>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6 max-md:p-5">
          <div className="grid gap-3">
            <DialogTitle className="text-2xl font-semibold tracking-tight max-md:text-xl">
              {data.title}
            </DialogTitle>
            <div className="flex flex-wrap gap-1.5">
              <TaglistComponent datatags={data.tags}/>
            </div>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-y border-border/40 py-4 text-sm">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</dt>
            <dd>{data.date}</dd>

            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider</dt>
            <dd>{(projectprovider as projectprovider)[data.provider].name}</dd>

            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</dt>
            <dd>{(roles as roles)[data.role].name}</dd>

            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stack</dt>
            <dd>{(techs as techs)[data.tech].name}</dd>
          </dl>

          <DialogDescription asChild>
            <p className="text-sm leading-relaxed text-foreground/80">
              {data.description}
            </p>
          </DialogDescription>

          <Button className="mt-auto w-full gap-2" asChild>
            <a href={data.siteurl} target="_blank" rel="noreferrer">
              Visit Site <ArrowUpRight className="size-4" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorksDialogComponent;
