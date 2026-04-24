"use client";

import Link from "next/link";
import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Compass, ScrollText, Sparkles } from "lucide-react";

type Mode =
  | "firstDate"
  | "closeFriends"
  | "lovers"
  | "strangers"
  | "soloJournal";

type QASet = Record<Mode, string[]>;

type ModeMeta = Record<
  Mode,
  {
    label: string;
    subtitle: string;
    badge: string;
    tint: string;
    storyTint: string;
    surfaceTint: string;
    surfaceGlow: string;
    ritual: [string, string, string];
  }
>;

type ExportFormat = "card" | "story";

const FORTUNE_LINES = [
  "When the gate grows quiet, the true word arrives.",
  "A soft road appears for the one who does not rush.",
  "The heart speaks first where language is still shy.",
  "Good timing hides inside an honest pause.",
  "A brave question often opens a gentler door.",
  "What is meant to meet you has already begun walking.",
  "A clear thread reveals itself to the patient hand.",
  "Small courage invites a brighter kind of luck.",
  "Still water keeps the clearest answer at the bottom.",
  "The next opening belongs to the one who listens well."
] as const;

const QUESTIONS: QASet = {
  firstDate: [
    "What made you smile recently?",
    "What kind of people make you feel at ease?",
    "What’s your idea of a really good weekend?",
    "What’s something small you’re looking forward to?",
    "What’s your comfort food?",
    "What kind of places make you feel most alive?",
    "What’s something you’ve been enjoying lately?",
    "What kind of music fits your life right now?",
    "What’s a tiny thing that instantly improves your day?",
    "What’s your ideal lazy morning like?",
    "What’s something you could talk about for hours?",
    "What’s your favorite way to spend time alone?",
    "What’s something beautiful you noticed recently?",
    "What kind of energy do you naturally gravitate toward?",
    "What’s one thing your friends would say about you?",
    "What’s a place you’d love to return to?",
    "What kind of conversation do you actually enjoy?",
    "What’s something random you’re oddly passionate about?",
    "What usually makes you laugh?",
    "What’s your favorite season and why?",
    "What’s something you’ve changed your mind about recently?",
    "What feels good in your life right now?",
    "What kind of life are you slowly building?",
    "What do you value more now than you used to?",
    "What’s something people often misunderstand about you?",
    "When do you feel the most like yourself?",
    "What’s something you’d like more of in your life?",
    "What kind of connection are you looking for these days?",
    "What helps you trust someone a little more?",
    "What makes a conversation memorable to you?",
    "What’s one green flag you really notice in people?",
    "What do you think makes someone easy to be around?",
    "What question do you wish people asked you more often?"
  ],
  closeFriends: [
    "What’s been on your mind a lot lately?",
    "What drains you the most these days?",
    "What gives you a sense of meaning lately?",
    "What are you currently working through internally?",
    "What do people misunderstand about you?",
    "When was the last time you felt truly understood?",
    "What do you wish people saw more clearly about you?",
    "What’s something you’ve outgrown?",
    "What are you slowly realizing about yourself?",
    "What kind of support feels best to you?",
    "What do you need more of in your life?",
    "What do you need less of?",
    "What kind of conversations make you feel close to someone?",
    "What are you protecting right now?",
    "What do you tolerate that you probably shouldn’t?",
    "What does feeling safe mean to you?",
    "What are you holding onto?",
    "What’s something you wish you could say more easily?",
    "What pattern keeps showing up in your relationships?",
    "What are you trying not to feel?",
    "What kind of life are you trying to build?",
    "What makes you feel seen?",
    "What kind of love feels right to you?",
    "What do you wish you had more courage for?",
    "What’s something unresolved in your life right now?",
    "What are you still healing from?",
    "What’s something you’re pretending not to know?",
    "What do you fear losing?",
    "What part of adulthood has surprised you the most?",
    "What’s one thing you’re proud of that people don’t really see?",
    "What do you wish someone close to you understood better?",
    "What helps you come back to yourself when you feel off?",
    "What’s a truth about your current season of life?"
  ],
  lovers: [
    "What makes you feel deeply loved?",
    "What kind of love feels right to you?",
    "What does emotional safety look like in a relationship?",
    "What are you afraid to ask for in love?",
    "What do you need when you’re hurt?",
    "What part of yourself are you afraid people will see?",
    "Have you ever loved someone who wasn’t right for you?",
    "Have you ever lost yourself in a relationship?",
    "What are you holding back in relationships?",
    "What does being chosen mean to you?",
    "What do you fear most in intimacy?",
    "What makes you shut down emotionally?",
    "What kind of reassurance actually works for you?",
    "What does commitment mean to you now?",
    "What does love feel like when it’s real?",
    "What does love feel like when it’s unhealthy?",
    "What kind of closeness do you crave most?",
    "What are your unspoken expectations in relationships?",
    "What makes trust easier for you?",
    "What makes trust harder for you?",
    "What wound do you think shows up most in love?",
    "What do you need to feel desired, not just liked?",
    "What truth would change your love life if you accepted it?",
    "What would you want a partner to understand about your softer side?",
    "What scares you about being fully known?",
    "What do you want to build with someone, beyond chemistry?",
    "What does a healthy conflict look like to you?",
    "What do you need more honesty about in love?",
    "What kind of loneliness do you experience inside relationships?",
    "What would make you feel more secure with someone?",
    "What does tenderness mean to you?",
    "What do you want to stop repeating in future relationships?",
    "What kind of partnership would feel like home to you?"
  ],
  strangers: [
    "What’s a question you wish people asked more often?",
    "What kind of conversation feels rare these days?",
    "What made you the person you are more than people realize?",
    "What are people often too quick to assume about you?",
    "What has shaped your worldview the most?",
    "What kind of connection do you think people are starving for?",
    "What’s something you believe that many people don’t?",
    "What makes someone feel instantly human to you?",
    "What do you think people hide most often?",
    "What does feeling seen mean to you?",
    "What’s a truth about adulthood no one prepared you for?",
    "What kind of loneliness do you think is most common now?",
    "What scares you about modern relationships?",
    "What do people pretend not to care about, but actually do?",
    "What helps you trust a stranger a little more?",
    "What do you think people misunderstand about vulnerability?",
    "What do you think most people are carrying quietly?",
    "What do you wish the world made more room for?",
    "What kind of person do you become when you feel safe?",
    "What’s something you’ve learned the hard way about people?",
    "What’s a conversation that changed you?",
    "What do you think people are really looking for in each other?",
    "What does emotional maturity look like to you?",
    "What part of yourself took you the longest to understand?",
    "What’s something unresolved that still teaches you?",
    "What do you think makes someone brave emotionally?",
    "What truth about life feels heavier as you grow older?",
    "What part of being human feels universal to you?",
    "What do you wish people were more honest about?",
    "What do you think we owe each other in conversation?",
    "What makes a stranger feel familiar?",
    "What does genuine curiosity look like to you?",
    "What kind of honesty feels generous rather than harsh?"
  ],
  soloJournal: [
    "What am I avoiding right now?",
    "What has been quietly taking up space in my mind?",
    "What do I need more of in this season of life?",
    "What do I need less of?",
    "What am I pretending not to know?",
    "What am I still healing from?",
    "What drains me most lately?",
    "What gives me a sense of meaning right now?",
    "When do I feel most like myself?",
    "What am I slowly realizing?",
    "What truth about myself is hardest to accept?",
    "What part of me needs compassion?",
    "What am I trying to prove, and to whom?",
    "What do I fear people will eventually realize about me?",
    "What do I secretly long for?",
    "What would it mean to fully accept myself?",
    "What am I tired of pretending?",
    "What am I holding onto that no longer serves me?",
    "What does feeling safe mean to me now?",
    "What version of me am I outgrowing?",
    "What truth would change my life if I accepted it?",
    "What do I wish someone understood about me?",
    "What do I criticize myself for the most?",
    "What do I feel undeserving of?",
    "What part of my past is still affecting my present?",
    "What am I afraid will never happen for me?",
    "What does happiness actually look like for me right now?",
    "What would I do differently if I trusted myself more?",
    "What is unresolved in my life?",
    "What am I protecting?",
    "What is one brave thing I can be honest about today?",
    "What kind of life am I truly trying to build?",
    "What do I need to let go of to move forward?"
  ]
};

const MODE_META: ModeMeta = {
  firstDate: {
    label: "First Date",
    subtitle: "For skipping the resume talk and getting to the good part faster.",
    badge: "Playful + revealing",
    tint: "from-rose-400/20 via-pink-300/10 to-amber-200/10",
    storyTint: "from-rose-500/25 via-pink-400/14 to-orange-300/14",
    surfaceTint: "from-rose-100/88 via-amber-50/86 to-orange-100/84",
    surfaceGlow: "bg-[radial-gradient(circle_at_86%_18%,rgba(255,209,182,0.28),transparent_30%),radial-gradient(circle_at_12%_100%,rgba(255,192,203,0.18),transparent_34%)]",
    ritual: ["soft start", "slow smile", "stay curious"]
  },
  closeFriends: {
    label: "Close Friends",
    subtitle: "For the conversations that make you leave feeling closer than before.",
    badge: "Honest + grounding",
    tint: "from-sky-400/18 via-cyan-300/10 to-indigo-300/12",
    storyTint: "from-sky-500/24 via-cyan-400/14 to-indigo-400/16",
    surfaceTint: "from-sky-100/88 via-cyan-50/86 to-indigo-100/82",
    surfaceGlow: "bg-[radial-gradient(circle_at_84%_20%,rgba(176,224,255,0.28),transparent_30%),radial-gradient(circle_at_0%_100%,rgba(182,214,255,0.2),transparent_34%)]",
    ritual: ["real check-in", "inside jokes", "one honest thing"]
  },
  lovers: {
    label: "Lovers",
    subtitle: "For softness, spark, honesty, and the kind of closeness that lingers.",
    badge: "Soft + intense",
    tint: "from-fuchsia-400/20 via-rose-400/12 to-red-300/10",
    storyTint: "from-fuchsia-500/25 via-rose-500/16 to-red-400/14",
    surfaceTint: "from-rose-100/88 via-pink-50/84 to-red-100/80",
    surfaceGlow: "bg-[radial-gradient(circle_at_86%_18%,rgba(255,196,210,0.3),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(255,217,224,0.16),transparent_34%)]",
    ritual: ["lean in", "say it softer", "leave a spark"]
  },
  strangers: {
    label: "Strangers who want to talk",
    subtitle: "For turning strangers into real people in under ten minutes.",
    badge: "Curious + human",
    tint: "from-violet-400/18 via-slate-300/10 to-blue-300/10",
    storyTint: "from-violet-500/24 via-slate-300/14 to-blue-400/14",
    surfaceTint: "from-violet-100/86 via-slate-50/88 to-blue-100/82",
    surfaceGlow: "bg-[radial-gradient(circle_at_84%_20%,rgba(200,197,255,0.28),transparent_30%),radial-gradient(circle_at_8%_100%,rgba(185,215,255,0.18),transparent_34%)]",
    ritual: ["open gently", "ask better", "make room"]
  },
  soloJournal: {
    label: "Solo Journal",
    subtitle: "For the nights when you want less noise and more truth.",
    badge: "Reflective + brave",
    tint: "from-emerald-400/16 via-teal-300/10 to-cyan-300/10",
    storyTint: "from-emerald-500/22 via-teal-400/14 to-cyan-400/14",
    surfaceTint: "from-emerald-100/86 via-teal-50/86 to-cyan-100/82",
    surfaceGlow: "bg-[radial-gradient(circle_at_84%_20%,rgba(180,235,221,0.3),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(164,220,255,0.16),transparent_34%)]",
    ritual: ["breathe first", "be kind", "write the true thing"]
  }
};

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createInitialDeck(): Record<Mode, string[]> {
  return {
    firstDate: [...QUESTIONS.firstDate],
    closeFriends: [...QUESTIONS.closeFriends],
    lovers: [...QUESTIONS.lovers],
    strangers: [...QUESTIONS.strangers],
    soloJournal: [...QUESTIONS.soloJournal]
  };
}

function createInitialIndexMap(): Record<Mode, number> {
  return {
    firstDate: 0,
    closeFriends: 0,
    lovers: 0,
    strangers: 0,
    soloJournal: 0
  };
}

function validateConfig(): void {
  const modes = Object.keys(MODE_META) as Mode[];

  console.assert(modes.length === 5, "Mirror should expose exactly 5 modes.");

  for (const mode of modes) {
    console.assert(Array.isArray(QUESTIONS[mode]), `Questions for ${mode} must be an array.`);
    console.assert(QUESTIONS[mode].length === 33, `${mode} should have exactly 33 questions.`);
    console.assert(Boolean(MODE_META[mode].label), `${mode} should have a label.`);
    console.assert(Boolean(MODE_META[mode].subtitle), `${mode} should have a subtitle.`);
    console.assert(Boolean(MODE_META[mode].badge), `${mode} should have a badge.`);
    console.assert(Boolean(MODE_META[mode].tint), `${mode} should have a tint.`);
    console.assert(Boolean(MODE_META[mode].storyTint), `${mode} should have a story tint.`);
    console.assert(Boolean(MODE_META[mode].surfaceTint), `${mode} should have a surface tint.`);
    console.assert(Boolean(MODE_META[mode].surfaceGlow), `${mode} should have a surface glow.`);
    console.assert(MODE_META[mode].ritual.length === 3, `${mode} should have exactly 3 ritual tags.`);
  }
}

export default function MirrorPage() {
  const [mode, setMode] = useState<Mode>("firstDate");
  const [deck, setDeck] = useState<Record<Mode, string[]>>(createInitialDeck);
  const [indexMap, setIndexMap] = useState<Record<Mode, number>>(createInitialIndexMap);
  const [isMounted, setIsMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [drawStick, setDrawStick] = useState(4);
  const [pendingQuestionIndex, setPendingQuestionIndex] = useState<number | null>(null);
  const [fortuneLine, setFortuneLine] = useState<(typeof FORTUNE_LINES)[number]>(FORTUNE_LINES[0]);
  const [fortuneSlipPhase, setFortuneSlipPhase] = useState<"hidden" | "launch" | "settle" | "fade">("hidden");
  const [toast, setToast] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const storyCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);

    if (process.env.NODE_ENV !== "production") {
      validateConfig();
    }

    setDeck({
      firstDate: shuffle(QUESTIONS.firstDate),
      closeFriends: shuffle(QUESTIONS.closeFriends),
      lovers: shuffle(QUESTIONS.lovers),
      strangers: shuffle(QUESTIONS.strangers),
      soloJournal: shuffle(QUESTIONS.soloJournal)
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (fortuneSlipPhase === "hidden" || fortuneSlipPhase === "fade") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (fortuneSlipPhase === "launch") {
        setFortuneSlipPhase("settle");
        return;
      }

      if (fortuneSlipPhase === "settle") {
        if (pendingQuestionIndex !== null) {
          setIndexMap((prev) => ({
            ...prev,
            [mode]: pendingQuestionIndex
          }));
          setPendingQuestionIndex(null);
        }
        setFortuneSlipPhase("fade");
      }
    }, fortuneSlipPhase === "launch" ? 180 : 2480);

    return () => window.clearTimeout(timeoutId);
  }, [fortuneSlipPhase, mode, pendingQuestionIndex]);

  useEffect(() => {
    if (fortuneSlipPhase !== "fade") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setFortuneSlipPhase("hidden"), 520);
    return () => window.clearTimeout(timeoutId);
  }, [fortuneSlipPhase]);

  const currentIndex = indexMap[mode];
  const currentQuestion = deck[mode]?.[currentIndex] ?? QUESTIONS[mode][0];
  const total = QUESTIONS[mode].length;
  const meta = MODE_META[mode];

  const progressText = useMemo(() => `${currentIndex + 1} / ${total}`, [currentIndex, total]);

  useEffect(() => {
    if (!isMounted) {
      return undefined;
    }

    setIsSettling(true);
    const timeoutId = window.setTimeout(() => setIsSettling(false), 320);
    return () => window.clearTimeout(timeoutId);
  }, [currentQuestion, isMounted]);

  useEffect(() => {
    if (isRolling || pendingQuestionIndex !== null) {
      return;
    }

    setDrawStick(currentIndex + 1);
  }, [currentIndex, isRolling, pendingQuestionIndex]);

  useEffect(() => {
    if (!isRolling) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      updateDrawStickPreview();
    }, 85);

    return () => window.clearInterval(intervalId);
  }, [isRolling]);

  function showToast(message: string): void {
    setToast(message);
  }

  function nextQuestion(): void {
    setIndexMap((prev) => {
      const nextIndex = prev[mode] + 1;

      if (nextIndex < deck[mode].length) {
        return { ...prev, [mode]: nextIndex };
      }

      setDeck((prevDeck) => ({
        ...prevDeck,
        [mode]: shuffle(QUESTIONS[mode])
      }));

      return { ...prev, [mode]: 0 };
    });
  }

  function switchMode(nextMode: Mode): void {
    setMode(nextMode);
  }

  function rollQuestion(): void {
    if (isRolling) {
      return;
    }

    setIsRolling(true);
    setFortuneSlipPhase("hidden");

    window.setTimeout(() => {
      const nextQuestionIndex = Math.floor(Math.random() * QUESTIONS[mode].length);
      setPendingQuestionIndex(nextQuestionIndex);
      setDrawStick(nextQuestionIndex + 1);
      setFortuneLine(FORTUNE_LINES[Math.floor(Math.random() * FORTUNE_LINES.length)]);
      setIsRolling(false);
      setFortuneSlipPhase("launch");
      showToast("Rolled a random question");
    }, 520);
  }

  async function copyQuestion(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`Mirror\n${meta.label}\n\n${currentQuestion}`);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  }

  async function shareQuestion(): Promise<void> {
    const text = `${meta.label} — ${currentQuestion}`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: "Mirror",
      text,
      url
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share(shareData);
        showToast("Shared");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      showToast("Link copied");
    } catch {
      try {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        showToast("Link copied");
      } catch {
        showToast("Share failed");
      }
    }
  }

  async function exportCardAsImage(format: ExportFormat = "card"): Promise<void> {
    const targetRef = format === "story" ? storyCardRef.current : cardRef.current;

    if (!targetRef) {
      return;
    }

    try {
      setIsExporting(true);

      const dataUrl = await toPng(targetRef, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f7f5ef"
      });

      const link = document.createElement("a");
      link.download =
        format === "story"
          ? `mirror-story-${mode}-${currentIndex + 1}.png`
          : `mirror-${mode}-${currentIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
      showToast(format === "story" ? "Story image downloaded" : "Card downloaded");
    } catch {
      showToast("Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  const onAdvanceByKeyboard = useEffectEvent(() => {
    nextQuestion();
  });

  const updateDrawStickPreview = useEffectEvent(() => {
    setDrawStick(Math.floor(Math.random() * QUESTIONS[mode].length) + 1);
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        onAdvanceByKeyboard();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f2e8] text-zinc-950">
      <div className="relative isolate min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,186,146,0.72),transparent_26%),radial-gradient(circle_at_84%_8%,rgba(134,199,255,0.52),transparent_26%),radial-gradient(circle_at_52%_102%,rgba(255,226,158,0.72),transparent_32%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.72),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,243,0.84)_0%,rgba(244,247,255,0.8)_44%,rgba(248,241,229,0.92)_100%)]" />
        <div className="absolute left-1/2 top-[24%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.14)_52%,transparent_76%)] blur-3xl" />

        <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10 md:py-10">
          <div
            className={[
              "pointer-events-none absolute left-[8.8%] top-[7.95rem] z-20 hidden h-[21rem] w-[3.2rem] origin-bottom rounded-[10px] border border-[#c79a61]/34 bg-[linear-gradient(180deg,rgba(244,219,170,0.98)_0%,rgba(225,188,125,0.96)_20%,rgba(193,145,82,0.98)_100%)] px-1.5 py-3 shadow-[0_30px_60px_rgba(175,149,116,0.18),inset_0_1px_0_rgba(255,244,221,0.42)] transition-all duration-700 lg:block",
              fortuneSlipPhase === "hidden" ? "translate-x-[61rem] translate-y-[11rem] rotate-[16deg] scale-[0.38] opacity-0" : "",
              fortuneSlipPhase === "launch" ? "translate-x-[47rem] translate-y-[3.8rem] rotate-[11deg] scale-[0.72] opacity-100" : "",
              fortuneSlipPhase === "settle" ? "translate-x-[31.4rem] translate-y-0 rotate-[2deg] scale-100 opacity-100" : "",
              fortuneSlipPhase === "fade" ? "translate-x-[31.4rem] translate-y-0 rotate-[2deg] scale-[1.04] opacity-0" : ""
            ].join(" ")}
          >
            <div className="absolute inset-x-[0.35rem] top-[0.55rem] h-[0.28rem] rounded-[3px] bg-[rgba(255,240,214,0.62)]" />
            <div className="absolute left-1/2 top-[1.45rem] h-[14.2rem] w-px -translate-x-1/2 bg-[rgba(120,86,44,0.16)]" />
            <div className="absolute inset-x-[0.35rem] top-[1.55rem] text-center text-[9px] font-medium uppercase tracking-[0.22em] text-[#8e6a3f]">
              omen
            </div>
            <div className="absolute left-1/2 top-[2.45rem] -translate-x-1/2 text-[1.45rem] font-bold text-[#7c5b36]">
              {drawStick}
            </div>
            <div className="absolute inset-x-[0.35rem] top-[4.7rem] text-center text-[10px] leading-[1.62] text-[#7e6342]">
              {fortuneLine}
            </div>
          </div>

          <header className="mb-8 flex flex-col gap-8 md:mb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-4xl">
                <div className="mb-3 inline-flex items-center rounded-full border border-white/70 bg-white/72 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-500 shadow-[0_10px_30px_rgba(186,166,140,0.12)] backdrop-blur">
                  mirror
                </div>
                <h1 className="max-w-5xl text-4xl font-semibold tracking-[-0.065em] text-zinc-950 md:text-6xl">
                  Better questions. Better chemistry.
                </h1>
                <p className="mt-4 max-w-none whitespace-nowrap text-[13px] leading-6 text-zinc-600 md:text-[15px] lg:text-base">
                  For dates that skip the dead air, friends who want to go deeper, lovers who want to feel closer, and nights when you want to be honest with yourself.
                </p>
              </div>

              <Link
                href="/"
                className="shrink-0 inline-flex items-center justify-center rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-[0_14px_35px_rgba(186,166,140,0.12)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Back to main page
              </Link>
            </div>
          </header>

          <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Mode selection buttons above the card */}
            <div className="mb-6 flex flex-wrap gap-3 lg:col-span-2">
              {(Object.keys(MODE_META) as Mode[]).map((itemMode) => {
                const active = mode === itemMode;

                return (
                  <button
                    key={itemMode}
                    onClick={() => switchMode(itemMode)}
                    className={[
                      "rounded-full border px-4 py-2 text-sm transition-all duration-200",
                      active
                        ? "border-white bg-white text-zinc-950 shadow-[0_16px_40px_rgba(191,173,146,0.18)]"
                        : "border-white/70 bg-white/55 text-zinc-600 hover:border-white hover:bg-white/80 hover:text-zinc-900"
                    ].join(" ")}
                  >
                    {MODE_META[itemMode].label}
                  </button>
                );
              })}
            </div>

            <div
              ref={cardRef}
              className={[
                "relative overflow-hidden rounded-[38px] border border-white/95 bg-[rgba(255,250,244,0.88)] p-6 shadow-[0_34px_90px_rgba(193,170,140,0.2),0_18px_36px_rgba(255,255,255,0.52)_inset,0_-18px_36px_rgba(234,214,191,0.24)_inset] backdrop-blur-2xl transition-all duration-300 md:p-8 lg:p-10",
                isSettling ? "translate-x-[4px] translate-y-[6px] rotate-[0.2deg] shadow-[0_40px_110px_rgba(193,170,140,0.24),0_18px_36px_rgba(255,255,255,0.52)_inset,0_-18px_36px_rgba(234,214,191,0.24)_inset]" : ""
              ].join(" ")}
            >
              <div className="absolute inset-[1px] rounded-[37px] bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.18)_18%,rgba(255,255,255,0.08)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-6%,rgba(255,255,255,0.98),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(255,225,195,0.28),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(190,221,255,0.16),transparent_34%)]" />
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.tint}`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.surfaceTint}`} />
              <div className={`absolute inset-0 ${meta.surfaceGlow}`} />
              <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,253,249,0.88)_0%,rgba(255,247,239,0.74)_44%,rgba(250,241,232,0.64)_100%)]" />
              <div className="absolute inset-0 opacity-[0.16] mix-blend-multiply bg-[linear-gradient(135deg,rgba(214,182,142,0.08)_0%,transparent_22%,rgba(214,182,142,0.03)_42%,transparent_62%,rgba(214,182,142,0.06)_82%,transparent_100%)]" />
              <div className="absolute inset-0 opacity-[0.44] bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.98),transparent_20%),radial-gradient(circle_at_72%_20%,rgba(255,255,255,0.34),transparent_18%),radial-gradient(circle_at_50%_120%,rgba(255,236,214,0.18),transparent_32%)]" />
              <div
                className={[
                  "absolute inset-y-0 left-[-28%] w-[26%] rotate-[16deg] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.42)_50%,rgba(255,255,255,0.08)_72%,transparent_100%)] opacity-0 transition-all duration-500",
                  isSettling ? "translate-x-[520%] opacity-100" : "translate-x-0 opacity-0"
                ].join(" ")}
              />
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
              <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.2)_56%,transparent_76%)] blur-2xl" />

              <div className="relative flex h-full min-h-[560px] flex-col justify-between">
                <div>
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/80 bg-white/68 px-3 py-1 text-xs text-zinc-600">
                      {meta.badge}
                    </span>
                    <span className="rounded-full border border-white/75 bg-white/60 px-3 py-1 text-xs text-zinc-500">
                      {meta.label}
                    </span>
                    <span className="text-xs text-zinc-400">{progressText}</span>
                  </div>

                  <p className="max-w-2xl text-sm text-zinc-600 md:text-base">{meta.subtitle}</p>

                  <div className="mt-10 flex h-[11.5rem] max-w-4xl items-start overflow-hidden text-[2rem] font-semibold leading-[1.08] tracking-[-0.06em] text-zinc-950 md:h-[14.5rem] md:text-[3.2rem] lg:h-[17.5rem] lg:text-[4.1rem]">
                    {isMounted ? currentQuestion : "Loading a question worth asking..."}
                  </div>
                </div>

                <div className="relative mt-10 space-y-8">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Ask better. Feel more. Share the good ones.</span>
                    <span>mirror by haoabouts</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={nextQuestion}
                      className="rounded-full border border-amber-200/70 bg-[linear-gradient(135deg,#ff9966_0%,#ffb347_45%,#ffd86b_100%)] px-5 py-3 text-sm font-semibold text-zinc-950 shadow-[0_18px_45px_rgba(255,165,89,0.32)] transition hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(255,165,89,0.38)]"
                    >
                      Next question
                    </button>
                    <button
                      onClick={copyQuestion}
                      className="rounded-full border border-white/75 bg-white/58 px-5 py-3 text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white/78 hover:text-zinc-950"
                    >
                      Copy
                    </button>
                    <button
                      onClick={shareQuestion}
                      className="rounded-full border border-white/75 bg-white/58 px-5 py-3 text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white/78 hover:text-zinc-950"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => exportCardAsImage("card")}
                      disabled={isExporting}
                      className="rounded-full border border-white/75 bg-white/58 px-5 py-3 text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white/78 hover:text-zinc-950 disabled:opacity-60"
                    >
                      {isExporting ? "Exporting..." : "Download card"}
                    </button>
                    <button
                      onClick={() => exportCardAsImage("story")}
                      disabled={isExporting}
                      className="rounded-full border border-white/75 bg-white/58 px-5 py-3 text-sm text-zinc-700 transition hover:-translate-y-0.5 hover:border-white hover:bg-white/78 hover:text-zinc-950 disabled:opacity-60"
                    >
                      {isExporting ? "Exporting..." : "Download story"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-6">
              <button
                type="button"
                onClick={rollQuestion}
                className="group relative overflow-hidden rounded-[32px] border border-white/75 bg-white/36 p-6 text-left shadow-[0_20px_55px_rgba(187,166,135,0.08)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/50"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${meta.surfaceTint} opacity-42`} />
                <div className={`absolute inset-0 ${meta.surfaceGlow} opacity-45`} />
                <div
                  className={[
                    "absolute right-6 top-5 h-20 w-20 rounded-full bg-white/45 blur-2xl transition duration-500",
                    isRolling ? "scale-125 opacity-95" : "opacity-80"
                  ].join(" ")}
                />
                <div
                  className={[
                    "absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 transition-all duration-500",
                    isRolling ? "scale-125 opacity-100" : "scale-75 opacity-0"
                  ].join(" ")}
                />
                <div
                  className={[
                    "absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 transition-all duration-700",
                    isRolling ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  ].join(" ")}
                />
                <div className={["absolute right-10 top-10 h-2.5 w-2.5 rounded-full bg-white/80 transition-all duration-500", isRolling ? "animate-bounce" : ""].join(" ")} />
                <div className={["absolute right-20 top-16 h-1.5 w-1.5 rounded-full bg-white/70 transition-all duration-500", isRolling ? "animate-ping" : ""].join(" ")} />
                <div className={["absolute right-16 top-24 h-2 w-2 rounded-full bg-white/65 transition-all duration-500", isRolling ? "animate-pulse" : ""].join(" ")} />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ScrollText className={["h-4 w-4 text-zinc-400 transition-transform duration-500", isRolling ? "-rotate-6" : ""].join(" ")} />
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Fortune Draw</p>
                    </div>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-700">
                      Shake the bamboo cup once and let one question slip out like a small temple fortune.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/66 px-4 py-2 text-sm font-medium text-zinc-800 shadow-[0_12px_30px_rgba(255,255,255,0.18)]">
                        <ScrollText className={["h-4 w-4 transition-transform duration-500", isRolling ? "-rotate-12 translate-y-0.5" : ""].join(" ")} />
                        {isRolling ? "Drawing..." : "Shake the cup"}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-2 pt-1 text-zinc-500">
                    <div className="relative h-[13.2rem] w-[7.6rem]">
                      <div
                        className={[
                          "absolute left-[1.15rem] top-[1.85rem] h-[9.7rem] w-[3.3rem] overflow-visible rounded-t-[14px] rounded-b-[14px] border border-[#b78243]/45 bg-[linear-gradient(180deg,#cc9652_0%,#c08748_34%,#ab6d36_100%)] shadow-[0_16px_28px_rgba(123,82,37,0.22),inset_0_1px_0_rgba(255,230,188,0.26)] transition duration-500",
                          isRolling ? "translate-y-[-7px] rotate-[8deg]" : "rotate-0"
                        ].join(" ")}
                      >
                      <div className="absolute inset-x-[0.05rem] top-[-0.22rem] h-[0.72rem] rounded-full border border-[#e2b06e]/55 bg-[linear-gradient(180deg,#efc98d_0%,#c78b47_100%)] shadow-[0_2px_5px_rgba(113,74,31,0.16)]" />
                      <div className="absolute inset-x-[0.22rem] top-[0.08rem] h-[0.28rem] rounded-full bg-[linear-gradient(180deg,rgba(110,70,30,0.22)_0%,rgba(87,54,22,0.1)_100%)]" />
                      <div className="absolute inset-x-[0.18rem] top-[0.92rem] h-[0.22rem] bg-[rgba(111,73,31,0.18)]" />
                      <div className="absolute inset-x-[0.18rem] bottom-[0.9rem] h-[0.22rem] bg-[rgba(111,73,31,0.18)]" />
                      <div className="absolute inset-x-[0.18rem] bottom-[0.18rem] h-[0.42rem] rounded-[3px] bg-[rgba(89,55,23,0.16)]" />
                      <div className="absolute left-[0.56rem] top-[0.3rem] h-[8.5rem] w-px bg-[rgba(116,76,33,0.18)]" />
                      <div className="absolute left-[1.18rem] top-[0.12rem] h-[8.9rem] w-px bg-[rgba(116,76,33,0.12)]" />
                      <div className="absolute left-[1.82rem] top-[0.22rem] h-[8.75rem] w-px bg-[rgba(116,76,33,0.16)]" />
                      <div className="absolute left-[2.46rem] top-[0.1rem] h-[8.95rem] w-px bg-[rgba(116,76,33,0.12)]" />

                      {[0, 1, 2, 3, 4, 5, 6].map((stick) => {
                        const offsets = ["left-[0.56rem]", "left-[0.92rem]", "left-[1.28rem]", "left-[1.64rem]", "left-[2rem]", "left-[2.36rem]", "left-[2.72rem]"];
                        const heights = ["h-[7.9rem]", "h-[7.4rem]", "h-[8.2rem]", "h-[7.55rem]", "h-[8.05rem]", "h-[7.6rem]", "h-[8.15rem]"];
                        const stickBase = Math.max(0, drawStick - 1);
                        const isDrawnStick = stick === stickBase;

                        return (
                          <span
                            key={`stick-${stick}`}
                            className={[
                              "absolute top-[-2.6rem] w-[0.19rem] rounded-[2px] bg-[linear-gradient(180deg,#f5dca8_0%,#e2b56f_34%,#c98642_100%)] shadow-[0_1px_2px_rgba(110,78,37,0.22)] transition-all duration-300",
                              offsets[stick],
                              heights[stick],
                              isRolling
                                ? isDrawnStick
                                  ? "translate-y-[-1rem] rotate-[6deg]"
                                  : stick % 2 === 0
                                    ? "translate-y-[-0.16rem] rotate-[3deg]"
                                    : "-rotate-[2deg]"
                                : isDrawnStick
                                  ? "translate-y-[-0.45rem] rotate-[1deg]"
                                  : "rotate-0"
                            ].join(" ")}
                          />
                        );
                      })}

                      <div className="absolute left-1/2 top-[-0.45rem] h-7 w-7 -translate-x-1/2 rounded-full bg-white/10 blur-md" />
                      {isRolling ? (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,245,224,0.35),transparent_52%)] opacity-100" />
                      ) : null}
                      </div>
                    </div>
                    <div className="rounded-full border border-white/55 bg-white/34 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                      draw luck
                    </div>
                  </div>
                </div>
              </button>

              <div className="rounded-[32px] border border-white/75 bg-white/52 p-6 shadow-[0_20px_55px_rgba(187,166,135,0.12)] backdrop-blur-2xl">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-zinc-400" />
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">How to use</p>
                </div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
                  <p>Use arrow right or space when you want to keep the momentum going.</p>
                  <p>Stay with the good ones a little longer. The best questions get better after a pause.</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/75 bg-white/52 p-6 shadow-[0_20px_55px_rgba(187,166,135,0.12)] backdrop-blur-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-zinc-400" />
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Why It Clicks</p>
                </div>
                <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
                  <p>It makes conversations feel less scripted and more alive.</p>
                  <p>It gives people something better than “so, what do you do?”</p>
                </div>
              </div>
            </aside>
          </div>

          <div className="pointer-events-none absolute -left-[9999px] top-0">
            <div
              ref={storyCardRef}
              className="relative h-[1920px] w-[1080px] overflow-hidden bg-[#06070a] text-white"
            >
              <div className={`absolute inset-0 bg-gradient-to-b ${meta.storyTint}`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.14),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_20%),linear-gradient(180deg,#0b1018_0%,#06070a_100%)]" />
              <div className="relative flex h-full flex-col justify-between p-20">
                <div>
                  <div className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-5 py-2 text-[28px] uppercase tracking-[0.26em] text-white/66">
                    mirror
                  </div>
                  <div className="mt-10 flex items-center gap-4 text-[28px] text-white/65">
                    <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2">
                      {meta.label}
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/6 px-4 py-2">
                      {progressText}
                    </span>
                  </div>
                  <p className="mt-8 max-w-[760px] text-[34px] leading-[1.45] text-white/56">
                    {meta.subtitle}
                  </p>
                </div>

                <div className="max-w-[880px] text-[96px] font-semibold leading-[1.02] tracking-[-0.07em] text-white">
                  {currentQuestion}
                </div>

                <div className="flex items-end justify-between text-[28px] text-white/52">
                  <span>{meta.badge}</span>
                  <span>mirror by haoabouts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className={[
            "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/85 bg-white/82 px-4 py-2 text-sm text-zinc-800 shadow-[0_18px_40px_rgba(187,166,135,0.16)] backdrop-blur-xl transition-all duration-200",
            toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          ].join(" ")}
        >
          {toast || "_"}
        </div>
      </div>
    </main>
  );
}
