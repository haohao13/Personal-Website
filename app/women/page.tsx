"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  Sparkles,
  Venus,
} from "lucide-react";

type WomanEntry = {
  id: string;
  name: string;
  month: number;
  day: number;
  birthDate: string;
  deathDate?: string;
  bio: string;
  image: string;
  imageAlt: string;
  nationality?: string;
  field?: string;
};

const WOMEN_DATA: WomanEntry[] = [];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
] as const;

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const;

const WOMEN_BY_DATE = new Map<string, WomanEntry[]>();
for (const e of WOMEN_DATA) {
  const k = `${e.month}-${e.day}`;
  const arr = WOMEN_BY_DATE.get(k) ?? [];
  arr.push(e);
  WOMEN_BY_DATE.set(k, arr);
}

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
const getEntriesForDate = (m: number, d: number) => WOMEN_BY_DATE.get(`${m}-${d}`) ?? [];
const seededIndex = (m: number, d: number, n: number) => (n <= 1 ? 0 : (m * 31 + d * 17) % n);
const getFeaturedEntry = (m: number, d: number) => {
  const es = getEntriesForDate(m, d);
  return es.length ? es[seededIndex(m, d, es.length)] : null;
};
const formatSelectedLabel = (mi: number, d: number) => `${MONTHS[mi]} ${d}`;
const truncateText = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, n).trimEnd()}…`);

const MONTH_NUMS: Record<string,number> = {
  january:1,february:2,march:3,april:4,may:5,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12
};
function formatDateRange(entry: WomanEntry): string {
  const bm = entry.birthDate.match(/\d{3,4}/);
  const birthYear = bm ? bm[0] : "?";
  const mo = entry.month > 0 ? String(entry.month) : "?";
  const dy = entry.day > 0 ? String(entry.day) : "?";
  const birth = mo === "?" && dy === "?" ? birthYear : `${birthYear}.${mo}.${dy}`;
  if (!entry.deathDate) return birth;
  // Try "Month D, YYYY"
  const full = entry.deathDate.match(/^([A-Za-z]+)\s+(\d+),\s*(\d{4})$/);
  if (full) {
    const mn = MONTH_NUMS[full[1].toLowerCase()];
    if (mn) return `${birth} – ${full[3]}.${mn}.${full[2]}`;
  }
  // Fall back: extract year
  const dm = entry.deathDate.match(/\d{3,4}/);
  return `${birth} – ${dm ? dm[0] : entry.deathDate}`;
}

function runDataTests() {
  const ids = new Set<string>();
  for (const e of WOMEN_DATA) {
    console.assert(!ids.has(e.id)); ids.add(e.id);
    console.assert(e.month >= 0 && e.month <= 12);
    console.assert(e.day >= 0 && e.day <= 31);
    console.assert(!!e.name.trim());
    console.assert(!!e.birthDate.trim());
    console.assert(!!e.bio.trim());
    console.assert(!!e.image.trim());
  }
  console.assert(daysInMonth(2024,1)===29);
  console.assert(daysInMonth(2025,1)===28);
  console.assert(getFirstDayOfMonth(2026,3)===3);
  console.assert(getFeaturedEntry(2,30)===null);
  console.assert(formatSelectedLabel(0,1)==="January 1");
  console.assert(truncateText("abcdef",3)==="abc…");
  console.assert(truncateText("abc",3)==="abc");
}

const GlassCard: React.FC<React.PropsWithChildren<{className?:string}>> = ({children,className}) => (
  <div className={cn(
    "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
    "shadow-[0_10px_40px_rgba(0,0,0,0.4)]",
    className
  )}>{children}</div>
);

const Pill: React.FC<React.PropsWithChildren> = ({children}) => (
  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] text-violet-200">{children}</span>
);

function PortraitImage({src,alt}:{src:string;alt:string}){
  const [imgError,setImgError]=useState(false);
  if(!src||imgError){
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-violet-900/50 to-purple-950/80 flex items-center justify-center">
        <Venus className="w-16 h-16 text-violet-400/30"/>
      </div>
    );
  }
  return <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-contain" style={{background:"#0d0a1a"}} onError={()=>setImgError(true)}/>;
}

async function fetchWomenFromAPI(month:number,day:number):Promise<{entries:WomanEntry[];matchLabel:string}> {
  const res = await fetch(`/api/women?month=${month}&day=${day}`);
  if(!res.ok) throw new Error("fetch failed");
  const data = await res.json();
  return {
    entries: Array.isArray(data?.entries)?data.entries:[],
    matchLabel: data?.matchLabel ?? "Featured from history",
  };
}

function getWikiUrl(name: string): string {
  const parenMatch = name.match(/\(([^)]+)\)/);
  const englishName = parenMatch ? parenMatch[1] : name;
  return `https://en.wikipedia.org/wiki/${englishName.replace(/ /g, '_')}`;
}

export default function WomenPage(){
  const today=new Date();
  const cardRef=useRef<HTMLDivElement>(null);
  const [displayYear,setDisplayYear]=useState(today.getFullYear());
  const [displayMonth,setDisplayMonth]=useState(today.getMonth());
  const [selectedDay,setSelectedDay]=useState(today.getDate());
  const [apiEntries,setApiEntries]=useState<WomanEntry[]>([]);
  const [poolIndex,setPoolIndex]=useState(0);
  const [matchLabel,setMatchLabel]=useState<string>("");
  const [isLoading,setIsLoading]=useState(false);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{runDataTests();},[]);

  useEffect(()=>{
    const total=daysInMonth(displayYear,displayMonth);
    if(selectedDay>total) setSelectedDay(total);
  },[displayYear,displayMonth,selectedDay]);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      setIsLoading(true); setLoadError(null);
      try{
        const {entries:e, matchLabel:ml}=await fetchWomenFromAPI(displayMonth+1,selectedDay);
        if(!cancelled){ setApiEntries(e); setMatchLabel(ml); setPoolIndex(0); }
      }catch(err){
        if(!cancelled){setApiEntries([]);setLoadError("load error");}
      }finally{if(!cancelled) setIsLoading(false);} 
    })();
    return ()=>{cancelled=true};
  },[displayMonth,selectedDay]);

  const monthDays=useMemo(()=>{
    const total=daysInMonth(displayYear,displayMonth);
    const start=getFirstDayOfMonth(displayYear,displayMonth);
    const cells:any[]=[];
    for(let i=0;i<start;i++)cells.push({type:"empty"});
    for(let d=1;d<=total;d++)cells.push({type:"day",value:d});
    while(cells.length%7!==0)cells.push({type:"empty"});
    return cells;
  },[displayYear,displayMonth]);

  const selectedEntry=useMemo(()=>{
    if(apiEntries.length>0)return apiEntries[poolIndex]??apiEntries[0];
    return getFeaturedEntry(displayMonth+1,selectedDay);
  },[apiEntries,displayMonth,selectedDay,poolIndex]);

  function shuffleEntry(){
    if(apiEntries.length<=1)return;
    setPoolIndex(i=>(i+1)%apiEntries.length);
  }

  const dateLabel=formatSelectedLabel(displayMonth,selectedDay);
  const deathLabel=selectedEntry?.deathDate??"Still living";

  const shareText=useMemo(()=>{
    if(!selectedEntry)return "";
    return `A woman born on ${dateLabel}\n${selectedEntry.name}\n${selectedEntry.birthDate} — ${deathLabel}\n${truncateText(selectedEntry.bio,120)}`;
  },[selectedEntry,dateLabel,deathLabel]);

  return (
    <main className="min-h-screen bg-[#0b0616] text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        <GlassCard className="p-6">
          <div className="flex justify-between items-start gap-8">
            <div className="min-w-0">
              <div className="text-xs text-violet-400 mb-2">hao about women</div>
              <h1 className="text-4xl font-semibold">A woman born on this day</h1>
              <p className="mt-3 text-violet-300 text-sm leading-relaxed">
                Every day, thousands of women are born. A few of them reshape history — quietly or loudly. This page is a small attempt to notice them.
              </p>
            </div>
            <a href="/" className="shrink-0 text-sm text-violet-300 mt-1">Back</a>
          </div>
        </GlassCard>

        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">

          <GlassCard className="p-6">
            <div className="mb-2 text-violet-400 text-xs uppercase tracking-widest">Selected date</div>
            <div className="mb-4 text-violet-200 text-sm">{dateLabel}</div>
            <p className="text-violet-400 text-sm mb-6 max-w-md">
              Someone born on this day once lived a life worth remembering.
            </p>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="text-violet-400 text-sm">Loading</div>
                <div className="text-xl text-white font-medium">Looking for a woman born on this day</div>
                <p className="text-violet-300 max-w-md text-sm leading-relaxed">
                  Pulling candidates from Wikipedia and asking the model to keep only the most notable women.
                </p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="text-violet-400 text-sm">API error</div>
                <div className="text-xl text-white font-medium">No story found for this day</div>
                <p className="text-violet-300 max-w-md text-sm leading-relaxed">
                  Not every day in history has been surfaced yet. But somewhere, someone was born who quietly changed the world.
                </p>
                <p className="text-violet-400 text-xs">
                  Try another date, or come back later.
                </p>
              </div>
            ) : selectedEntry ? (
              <div className="space-y-4" ref={cardRef}>
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <PortraitImage src={selectedEntry.image} alt={selectedEntry.imageAlt}/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
                </div>

                <h2 className="text-2xl font-semibold">{selectedEntry.name}</h2>

                <div className="space-y-1.5">
                  <div className="flex gap-2 flex-wrap items-center justify-between">
                    <div className="flex gap-2 flex-wrap items-center">
                      {matchLabel ? (
                        <span className={cn(
                          "rounded-full px-3 py-0.5 text-[11px] font-medium border",
                          matchLabel==="Born on this day"
                            ? "bg-violet-500/20 border-violet-500/30 text-violet-300"
                            : matchLabel==="Born around this time"
                            ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                            : "bg-white/10 border-white/15 text-white/60"
                        )}>{matchLabel}</span>
                      ) : null}
                      {selectedEntry.field
                        ? selectedEntry.field.split(" / ").map(f => <Pill key={f}>{f}</Pill>)
                        : null}
                    </div>
                    {apiEntries.length>1 && (
                      <button
                        onClick={shuffleEntry}
                        title={`Shuffle (${poolIndex+1}/${apiEntries.length})`}
                        className="text-sm border border-white/10 rounded-full px-2.5 py-0.5 hover:bg-white/10 text-violet-300 hover:text-white transition-colors"
                      >
                        🎲 {poolIndex+1}/{apiEntries.length}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-violet-300">{formatDateRange(selectedEntry)}</p>
                </div>

                <p className="text-violet-300 leading-relaxed">{selectedEntry.bio}</p>

                <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={async ()=>{
                        try{
                          await navigator.clipboard.writeText(shareText);
                          setCopied(true);
                          setTimeout(()=>setCopied(false),1500);
                        }catch{}
                      }}
                      className="text-xs text-violet-300 border border-white/10 rounded px-3 py-1 hover:bg-white/10"
                    >
                      {copied?"Copied":"Copy"}
                    </button>

                    <button
                      onClick={async ()=>{
                        if(!cardRef.current||!selectedEntry) return;
                        try{
                          const clone = cardRef.current.cloneNode(true) as HTMLDivElement;
                          const wrapper = document.createElement("div");
                          Object.assign(wrapper.style, {
                            position:"fixed", top:"-9999px", left:"-9999px",
                            borderRadius:"16px",
                            border:"1px solid rgba(255,255,255,0.10)",
                            background:"linear-gradient(to bottom,#1a1333,#0b0616)",
                            padding:"24px",
                            color:"white",
                            width: cardRef.current.offsetWidth+"px",
                          });
                          wrapper.appendChild(clone);
                          document.body.appendChild(wrapper);
                          const dataUrl = await toPng(wrapper, {cacheBust:true, backgroundColor:'#0b0616'});
                          document.body.removeChild(wrapper);
                          const link = document.createElement("a");
                          link.download = `${selectedEntry.name}.png`;
                          link.href = dataUrl;
                          link.click();
                        }catch{}
                      }}
                      className="text-xs text-violet-300 border border-white/10 rounded px-3 py-1 hover:bg-white/10"
                    >
                      Download
                    </button>

                    <a
                      href={getWikiUrl(selectedEntry.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-300 border border-white/10 rounded px-3 py-1 hover:bg-white/10 inline-flex items-center"
                    >
                      Wikipedia
                    </a>
                  </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
                <div className="text-violet-400 text-sm">No result</div>
                <div className="text-xl text-white font-medium">No story found for this day</div>
                <p className="text-violet-300 max-w-md text-sm leading-relaxed">
                  Not every day in history has been surfaced yet. But somewhere, someone was born who quietly changed the world.
                </p>
                <p className="text-violet-400 text-xs">
                  Try another date, or come back later.
                </p>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="text-center text-violet-400 text-lg font-semibold mb-1">{displayYear}</div>
            <div className="flex justify-between items-center mb-4">
              <button onClick={()=>{setDisplayMonth(m=> m===0?11:m-1); if(displayMonth===0) setDisplayYear(y=>y-1);}}><ChevronLeft/></button>
              <div className="text-white font-medium">{MONTHS[displayMonth]}</div>
              <button onClick={()=>{setDisplayMonth(m=> m===11?0:m+1); if(displayMonth===11) setDisplayYear(y=>y+1);}}><ChevronRight/></button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-xs text-violet-400">
              {WEEKDAYS.map(d=><div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2 mt-2">
              {monthDays.map((c,i)=>{
                if(c.type==="empty")return <div key={`empty-${i}`}/>;
                const d=c.value;
                const selected=d===selectedDay;
                return (
                  <button
                    key={`day-${displayYear}-${displayMonth}-${d}-${i}`}
                    onClick={()=>setSelectedDay(d)}
                    className={cn(
                      "p-2 rounded",
                      selected?"bg-violet-600":"bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </GlassCard>

        </div>
      </div>

    </main>
  );
}
