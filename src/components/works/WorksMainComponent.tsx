import React, { useState, useMemo } from "react";

import taglist from "../../assets/taglist.json"
import roles from "../../assets/roles.json";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ScrollArea } from "@/components/ui/scroll-area";

import WorksCardComponent from "@/components/works/WorksCardComponent";
import "@/components/works/WorksTypings";

const WorksMainComponent = ({data}: {data: ProjectData[]}) => {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState("date-desc");

  const toggleTag = (id:string) => {
    setActiveTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const filteredData = useMemo(()=> {
    return data.filter((item: ProjectData) => {
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
      const matchesTags = activeTags.length === 0 || activeTags.every((tag) => item.tags.includes(tag));

      return matchesQuery && matchesTags;
    })
    .sort((a: ProjectData, b: ProjectData) => {
      switch(sort) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [data, query, activeTags, sort]);

  return (
    <>
      <div className="flex flex-col w-1/4 gap-5 max-md:w-full">
        <Label className="text-lg">filters</Label>
        <div className="flex items-center flex-wrap gap-5">
          { Object.entries(taglist).map(([key, item]) => (
            <Badge key={key} onClick={()=> {toggleTag(key)}}
              className={`
                border-transparent
                px-3
                text-sm
                hover:cursor-pointer
                hover:border-white
                hover:bg-slate-900
                hover:text-white
                hover:scale-90
                ${ activeTags.includes(key) ? 'border-white bg-slate-900 text-white scale-85': '' }
            `}>
              #{item.name.toLowerCase()}
            </Badge>
          ))}
        </div>
        <Select defaultValue="date-desc" onValueChange={(e)=> {setSort(e); console.log(e);}}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest</SelectItem>
            <SelectItem value="date-asc">Oldest</SelectItem>
            <SelectItem value="name-asc">A to Z</SelectItem>
            <SelectItem value="name-desc">Z to A</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex w-full items-center gap-3">
          <Input onChange={(e) => setQuery(e.target.value)} className="text-2xl h-12 !bg-black w-full max-md:text-base" type="text" id="filter" placeholder="e.g #CSS #JS examplename" />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-15rem)] w-3/4 p-8 max-md:p-0 max-md:w-full max-md:h-full">
        <div className="grid grid-cols-3 gap-8 max-lg:grid-cols-3  max-md:grid-cols-2 max-sm:grid-cols-1">
          { filteredData.map((item: ProjectData) => (
            <WorksCardComponent data={item} />
          ))}
        </div>
      </ScrollArea>
    </>
  );
};

export default WorksMainComponent;
