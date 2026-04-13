'use client';

import { MessageCircle, ChevronRight } from "lucide-react";

function MirrorEntryCard({ href = "/mirror", lang = "en" }) {
  const isEn = lang === "en";
  const title = isEn ? "mirror" : "镜子";
  const desc = isEn
    ? "A question deck for better conversations, softer touch points, and a quick way back to the main page."
    : "一个问题卡片组，用于更好的对话、更柔和的接触点，以及快速返回主页的方式。";

  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white/90 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-500">
            <MessageCircle className="h-3.5 w-3.5" />
            Mirror
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{desc}</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-600 transition duration-300 group-hover:scale-105 group-hover:rotate-3">
          <MessageCircle className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
        {isEn ? "Go to Mirror" : "前往镜子"}
        <ChevronRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
      </div>
    </a>
  );
}

export { MirrorEntryCard };