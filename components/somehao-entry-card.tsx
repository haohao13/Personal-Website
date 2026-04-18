'use client';

import { Sparkles, Wand2, ChevronRight } from "lucide-react";

const TEXT = {
  en: {
    entryDesc: "Get a small random idea to make your day slightly different.",
    entryCTA: "Try this",
  },
  zh: {
    entryDesc: "随机给你一件小事，让今天稍微不同一点。",
    entryCTA: "试试看",
  },
};

function SomehaoEntryCard({ href = "/somehao", lang = "en" }) {
  const t = TEXT[lang as keyof typeof TEXT];

  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-amber-50/90 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-500">
            <Sparkles className="h-3.5 w-3.5" />
            Somehao
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            {lang === "en" ? "something different" : "来点不一样"}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{t.entryDesc}</p>
        </div>

        <div className="shrink-0 rounded-2xl border border-orange-200 bg-orange-50 p-3 text-orange-600 transition duration-300 group-hover:scale-105 group-hover:rotate-3">
          <Wand2 className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
        {t.entryCTA}
        <ChevronRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
      </div>
    </a>
  );
}

export { SomehaoEntryCard };
