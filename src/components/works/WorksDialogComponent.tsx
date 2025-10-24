import techs from "../../assets/techs.json"
import roles from "../../assets/roles.json";
import '@/components/works/WorksTypings';

import { Img } from 'react-image';
import { AspectRatio } from '../ui/aspect-ratio';

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
        <Button className="w-[45%] max-md:w-full max-md:text-xs">Details</Button>
      </DialogTrigger>
      <DialogContent className="p-8 min-w-[45vw] w-full max-md:w-[90%]">
        <DialogHeader>
          <div className="flex items-center">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg">
              <Img
                src={data.image.url}
                loader={<span>Loading...</span>}
                unloader={<span>Failed to load</span>}
                alt={data.image.alt}
                className="rounded-lg object-contain dark:brightness-[0.2] dark:grayscale w-full h-full"
              />
            </AspectRatio>
          </div>

          <DialogTitle className="mt-4 mb-2">{ data.title }</DialogTitle>
          <div className="flex gap-2">
            <TaglistComponent datatags={data.tags}/>
          </div>
        </DialogHeader>
          
        <DialogDescription className="max-md:max-h-[200px] max-md:overflow-y-scroll">
          <dl className="grid grid-cols-[auto_auto] mb-3 text-sm text-white max-md:grid-cols-1">
            <dt className="font-bold">Project Provider : </dt>
            <dd className="w-fit max-md:mb-2">UPWARD NEXT</dd>

            <dt className="font-bold">Role : </dt>
            <dd className="w-fit max-md:mb-2">{ (roles as roles)[data.role].name }</dd>

            <dt className="font-bold">Tech Stack Used : </dt>
            <dd className="w-fit max-md:mb-2">{ (techs as techs)[data.tech].name }</dd>
          </dl>
          
          <p className="text-base  max-md:text-sm">{ data.description }</p>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default WorksDialogComponent;