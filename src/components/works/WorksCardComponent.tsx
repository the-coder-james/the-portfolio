import roles from "../../assets/roles.json";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Img } from 'react-image';

import TaglistComponent from "@/components/common/tsx/TaglistComponent";
import WorksDialogComponent from "./WorksDialogComponent";
import "@/components/works/WorksTypings";

const WorksCardComponent = ({ data }: { data: ProjectData }) => {
  return (
    <Card className="w-full justify-between">
      <CardContent className="grid gap-3">
        <span className="text-sm max-md:text-xs">{data.date}</span>
        <h3 className="scroll-m-20 text-xl font-semibold tracking-tight max-md:text-base">{data.title}</h3>
        
        <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
           <Img
              src={data.image.url}
              loader={<span>Loading...</span>}
              unloader={<span>Failed to load</span>}
              alt={data.image.alt}
              className="rounded-lg object-cover dark:brightness-[0.2] dark:grayscale h-full"
            />
        </AspectRatio>

        <div className="grid gap-2">
          <span className="text-sm max-md:text-xs">{ (roles as roles)[data.role].name }</span>
          <TaglistComponent datatags={data.tags}/>
        </div>
      </CardContent>

      <CardFooter className="flex gap-5 max-md:flex-col">
        <Button className="w-[45%] max-md:w-full" variant={"secondary"} asChild>
          <a href={data.siteurl} className="text-wrap max-md:text-xs" target="_blank">Preview</a>
        </Button>
        <WorksDialogComponent data={data} />
      </CardFooter>
    </Card>
  );
};

export default WorksCardComponent;