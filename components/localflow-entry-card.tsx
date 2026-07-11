'use client';

import { ChevronRight, Route } from "lucide-react";

function LocalFlowEntryCard({ href = "/localflow", lang = "en" }) {
  const isEn = lang === "en";
  const title = isEn ? "turn vibes into routes" : "把感觉变成路线";
  const desc = isEn
    ? "Turn a mood, a city, and a little curiosity into a route worth leaving home for."
    : "把心情、城市和一点好奇心，变成一条值得出门的路线。";

  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-lime-100 bg-gradient-to-br from-lime-50/55 via-stone-50/70 to-zinc-100/60 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs text-lime-700">
            <Route className="h-3.5 w-3.5" />
            LocalFlow
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{desc}</p>
        </div>

        <div className="shrink-0 rounded-2xl border border-lime-300 bg-lime-100 p-3 text-lime-700 transition duration-300 group-hover:scale-105 group-hover:-rotate-3">
          <Route className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
        {isEn ? "Generate" : "生成路线"}
        <ChevronRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
      </div>
    </a>
  );
}

export { LocalFlowEntryCard };
