'use client';

import { ChevronRight, Sparkles } from "lucide-react";

function WomenEntryCard({ href = "/women", lang = "en" }) {
  const isEn = lang === "en";
  const title = isEn ? "a woman born on this day" : "今天出生的她";
  const desc = isEn
    ? "Every day, a woman was born who quietly or loudly reshaped the world. This page is a small attempt to notice them."
    : "每一天都有一位女性出生，她悄悄地或响亮地改变了世界。这是一个小小的尝试，去记录她们。";

  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-rose-50/90 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-500">
            <Sparkles className="h-3.5 w-3.5" />
            Women
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{desc}</p>
        </div>

        <div className="shrink-0 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-violet-600 transition duration-300 group-hover:scale-105 group-hover:rotate-3">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
        {isEn ? "Go to Women" : "前往女性页"}
        <ChevronRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
      </div>
    </a>
  );
}

export { WomenEntryCard };
