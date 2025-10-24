import taglist from "../../../assets/taglist.json";

import { Badge } from "@/components/ui/badge";

import '@/components/works/WorksTypings';

type taglist = {
  [key: string]: {
    name: string;
  };
};

const TaglistComponent = ({datatags} : {datatags:string[]}) => {
  return (
    <>
      {
        datatags.map((tag: string) => (
          <Badge className="border-transparent text-xs" key={tag}>
            #{(taglist as taglist)[tag]?.name}
          </Badge>
        ))
      }
    </>
  );
};

export default TaglistComponent;
