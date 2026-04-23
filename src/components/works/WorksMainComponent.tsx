import React, { useState, useMemo } from "react";

import taglist from "../../assets/taglist.json"

import { Badge } from "@/components/ui/badge";
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

  const hasActiveFilters = query.length > 0 || activeTags.length > 0;

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
      <div className="grid gap-5 w-full max-md:mb-6">
        <div className="flex items-center flex-wrap gap-3">
          <div className="bg-black max-md:w-full">
            <Select defaultValue="date-desc" onValueChange={(e)=> setSort(e)}>
              <SelectTrigger className="w-40 py-5 max-md:w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest</SelectItem>
                <SelectItem value="date-asc">Oldest</SelectItem>
                <SelectItem value="name-asc">A to Z</SelectItem>
                <SelectItem value="name-desc">Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          { Object.entries(taglist).map(([key, item]) => (
              <Badge key={key} onClick={()=> {toggleTag(key)}}
                className={`
                  border-transparent
                  px-3
                  text-sm
                  transition-all
                  hover:cursor-pointer
                  hover:border-white
                  hover:bg-slate-900
                  hover:text-white
                  hover:scale-95
                  ${ activeTags.includes(key) ? 'border-white bg-slate-900 text-white scale-95': '' }
              `}>
                #{item.name.toLowerCase()}
              </Badge>
          ))}
        </div>

        <div className="flex w-full items-center gap-3">
          <Input onChange={(e) => setQuery(e.target.value)} className="text-2xl h-12 !bg-black w-full max-md:text-base" type="text" id="filter" placeholder="Search by title" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredData.length} {filteredData.length === 1 ? 'project' : 'projects'}
            {hasActiveFilters && ' matching filters'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => { setQuery(""); setActiveTags([]); }}
              className="underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Mobile: horizontal snap slider with vertical cards */}
      <div className="w-full max-w-full overflow-hidden sm:hidden">
        { filteredData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No projects match your filters.
          </div>
        ) : (
          <>
            <div
              className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden scroll-smooth pb-4 [-ms-overflow-style:none] [overscroll-behavior-x:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              { filteredData.map((item: ProjectData) => (
                <div
                  key={`${item.title}-${item.date}`}
                  className="shrink-0 basis-[85%] snap-start first:ml-0 max-w-[340px]"
                >
                  <WorksCardComponent data={item} />
                </div>
              ))}
            </div>
            <p className="pb-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground/70">
              Swipe to explore →
            </p>
          </>
        )}
      </div>

      {/* Tablet & desktop: bento grid */}
      <ScrollArea className="hidden h-[calc(100vh-18rem)] py-6 sm:block">
        { filteredData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No projects match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-3 max-md:grid-cols-2 max-md:gap-4">
            { filteredData.map((item: ProjectData, index: number) => (
              <WorksCardComponent
                key={`${item.title}-${item.date}`}
                data={item}
                featured={index === 0 && !hasActiveFilters}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
};

export default WorksMainComponent;
