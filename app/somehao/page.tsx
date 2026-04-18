'use client';

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Shuffle,
  CheckCircle2,
  Flame,
  BatteryLow,
  Wand2,
  ChevronRight,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TEXT = {
  en: {
    title: "Somehao",
    subtitle: "A small random idea to make today feel slightly different.",
    modeLabel: "modes",
    taskLabel: "today's prompt",
    countLabel: "completed",
    try: "Try another",
    done: "Done",
    did: "Did it",
    entryDesc: "Get a small random idea to make your day slightly different.",
    entryCTA: "Try this",
    modes: {
      mild: { label: "Light", desc: "A gentle shift, nothing too dramatic." },
      medium: { label: "Different", desc: "A little off your usual track." },
      wild: { label: "Further", desc: "Do something you normally wouldn't." },
    },
    tags: {
      explore: "explore",
      city: "city",
      connection: "connection",
      social: "social",
      identity: "identity",
    },
  },
  zh: {
    title: "Somehao",
    subtitle: "随机给你一个小灵感，让今天稍微有点不一样。",
    modeLabel: "模式",
    taskLabel: "今日灵感",
    countLabel: "已完成",
    try: "再来一个",
    done: "完成",
    did: "做到了",
    entryDesc: "随机给你一件小事，让今天稍微不同一点。",
    entryCTA: "试试看",
    modes: {
      mild: { label: "轻一点", desc: "轻轻推一下，不用太用力。" },
      medium: { label: "来点变化", desc: "稍微偏离一下平常的轨道。" },
      wild: { label: "走远一点", desc: "做点平时不会做的事。" },
    },
    tags: {
      explore: "探索",
      city: "城市",
      connection: "连接",
      social: "社交",
      identity: "身份松动",
    },
  },
};

const TASKS = {
  mild: [
    {
      en: "Walk into a store you would normally never enter and stay for 5 minutes.",
      zh: "去一家你平时不会进去的店里待 5 分钟。",
      tag: "explore",
    },
    {
      en: "Take a route you've never taken and walk for 10 minutes.",
      zh: "走一条你从没走过的路 10 分钟。",
      tag: "city",
    },
  ],
  medium: [
    {
      en: "Go to a random neighborhood and enter the first place that feels right.",
      zh: "去一个陌生街区，走进第一家顺眼的地方。",
      tag: "explore",
    },
    {
      en: "Text someone you haven't talked to in a while.",
      zh: "给一个很久没联系的人发条消息。",
      tag: "connection",
    },
  ],
  wild: [
    {
      en: "Start a 30-second conversation with a stranger.",
      zh: "和一个陌生人聊 30 秒。",
      tag: "social",
    },
    {
      en: "Do something that feels 'not like you.'",
      zh: "做一件'有点不像你'的事。",
      tag: "identity",
    },
  ],
};

function getRandomTask(mode: keyof typeof TASKS) {
  const list = TASKS[mode];
  return list[Math.floor(Math.random() * list.length)];
}

function SomehaoEntryCard({ href = "/somehao", lang = "en" }: { href?: string; lang?: "en" | "zh" }) {
  const t = TEXT[lang];

  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white/90 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-500">
            <Sparkles className="h-3.5 w-3.5" />
            Somehao
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
            {lang === "en" ? "something different" : "来点不一样"}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{t.entryDesc}</p>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3 text-orange-600 transition duration-300 group-hover:scale-105 group-hover:rotate-3">
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

export default function SomehaoPage() {
  const [mode, setMode] = useState<keyof typeof TASKS>("medium");
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [task, setTask] = useState(() => TASKS.medium[0]);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setTask(getRandomTask(mode));
  }, [mode]);

  const t = TEXT[lang];
  const currentMode = useMemo(() => t.modes[mode], [t, mode]);

  const modeIcons = {
    mild: BatteryLow,
    medium: Sparkles,
    wild: Flame,
  };

  const generateTask = () => {
    setTask(getRandomTask(mode));
    setDone(false);
  };

  const changeMode = (nextMode: keyof typeof TASKS) => {
    setMode(nextMode);
    setTask(getRandomTask(nextMode));
    setDone(false);
  };

  const completeTask = () => {
    if (!done) {
      setDone(true);
      setCount((c) => c + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,237,213,0.55),_transparent_35%),linear-gradient(to_bottom,_#fafaf9,_#ffffff_38%,_#fff7ed)] px-4 py-12 text-zinc-900 lg:px-12">
      <div className="mx-auto max-w-md lg:max-w-6xl space-y-8">

        {/* ── Top: Header (full width) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs text-zinc-500 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Somehao
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 lg:text-5xl">Somehao</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500 lg:text-base lg:leading-7">{t.subtitle}</p>
          </div>

          <div className="shrink-0 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 p-1 backdrop-blur">
            <button
              className={`rounded-full px-3 py-1.5 text-sm transition ${lang === "en" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600"}`}
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <button
              className={`rounded-full px-3 py-1.5 text-sm transition ${lang === "zh" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-600"}`}
              onClick={() => setLang("zh")}
            >
              中
            </button>
          </div>
        </motion.div>

        {/* ── Bottom: Modes (left) + Prompt (right) ── */}
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-10 lg:items-start space-y-6 lg:space-y-0">

          {/* Left: Modes card */}
          <Card className="overflow-hidden rounded-[28px] border-zinc-200/80 bg-white/85 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur">
            <CardContent className="p-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{t.modeLabel}</p>
                  <h2 className="mt-2 text-xl font-semibold text-zinc-950">{currentMode.label}</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{currentMode.desc}</p>
                </div>
                <Badge className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-700 shadow-none">
                  {t.countLabel} {count}
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {Object.keys(TASKS).map((m) => {
                  const key = m as keyof typeof modeIcons;
                  const Icon = modeIcons[key];
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => changeMode(m as keyof typeof TASKS)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className="mb-2 h-4 w-4" />
                      <div className="text-sm font-medium">{t.modes[m as keyof typeof t.modes].label}</div>
                    </button>
                  );
                })}
              </div>

              <a
                href="/"
                className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-600 transition"
              >
                <Home className="h-4 w-4" />
                {lang === "en" ? "Back Home" : "回到主页"}
              </a>
            </CardContent>
          </Card>

          {/* Right: Prompt card + actions */}
          <div className="space-y-4 lg:sticky lg:top-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${lang}-${mode}-${task.en}`}
                initial={{ opacity: 0, y: 14, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.12 }}
              >
                <Card className="overflow-hidden rounded-[32px] border-0 bg-zinc-950 text-white shadow-[0_20px_60px_rgba(24,24,27,0.28)]">
                  <CardContent className="p-6 pt-6 lg:p-10 lg:pt-10">
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                        {t.tags[task.tag as keyof typeof t.tags]}
                      </Badge>
                      <div className="rounded-full bg-white/10 p-2 text-white/80">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="mt-6 lg:mt-10">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{t.taskLabel}</p>
                      <p className="mt-4 text-2xl font-semibold leading-9 tracking-tight text-white lg:text-3xl lg:leading-[1.4]">
                        {task[lang]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                onClick={generateTask}
                className="h-12 rounded-2xl bg-zinc-900 text-white shadow-sm hover:bg-zinc-800"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                {t.try}
              </Button>
              <Button
                onClick={completeTask}
                variant={done ? "secondary" : "outline"}
                className={`h-12 rounded-2xl border-zinc-200 ${done ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-white hover:bg-zinc-50"}`}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {done ? t.done : t.did}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
