'use client';

import { MapPin, ChevronRight } from "lucide-react";

function TravelEntryCard({ href = "/travel", lang = "en" }) {
  const isEn = lang === "en";
  const title = isEn ? "explore anywhere" : "去任何地方";
  const desc = isEn 
    ? "Pick destinations across seven continents. Watch the map zoom to your choices."
    : "从七大洲选择目的地，看地图缩放到你的选择。";

  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-600">
            <MapPin className="h-3.5 w-3.5" />
            Travel
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{desc}</p>
        </div>

        <div className="shrink-0 rounded-2xl border border-emerald-300 bg-emerald-100 p-3 text-emerald-600 transition duration-300 group-hover:scale-105 group-hover:rotate-3">
          <MapPin className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
        {isEn ? "Explore" : "探索"}
        <ChevronRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
      </div>
    </a>
  );
}

export { TravelEntryCard };
