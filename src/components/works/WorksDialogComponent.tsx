import techs from "../../assets/techs.json"
import roles from "../../assets/roles.json";
import projectprovider from "../../assets/projectprovider.json";
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
      <DialogContent className="grid grid-cols-2 p-8 min-w-[80%] max-md:grid-cols-1 max-md:w-[90%]">
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

          <DialogTitle className="my-2">{ data.title }</DialogTitle>
          <dl className="grid grid-cols-2 gap-y-2 justify-between mb-3 text-sm text-left text-white">
            <dt className="font-bold">Project Provider: </dt>
            <dd>{ (projectprovider as projectprovider)[data.provider].name }</dd>

            <dt className="font-bold">Role: </dt>
            <dd>{ (roles as roles)[data.role].name }</dd>

            <dt className="font-bold">Tech Stack Used: </dt>
            <dd>{ (techs as techs)[data.tech].name }</dd>
          </dl>
        </DialogHeader>
          
        <DialogDescription className="max-h-96 overflow-y-auto max-md:max-h-48">
          <div className="flex mb-4 gap-2">
            <TaglistComponent datatags={data.tags}/>
          </div>
          <p className="text-base max-md:text-sm">{ data.description }</p>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

export default WorksDialogComponent;