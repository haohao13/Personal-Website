"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

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
  }
>;

type ExportFormat = "card" | "story";

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
    storyTint: "from-rose-500/25 via-pink-400/14 to-orange-300/14"
  },
  closeFriends: {
    label: "Close Friends",
    subtitle: "For the conversations that make you leave feeling closer than before.",
    badge: "Honest + grounding",
    tint: "from-sky-400/18 via-cyan-300/10 to-indigo-300/12",
    storyTint: "from-sky-500/24 via-cyan-400/14 to-indigo-400/16"
  },
  lovers: {
    label: "Lovers",
    subtitle: "For softness, spark, honesty, and the kind of closeness that lingers.",
    badge: "Soft + intense",
    tint: "from-fuchsia-400/20 via-rose-400/12 to-red-300/10",
    storyTint: "from-fuchsia-500/25 via-rose-500/16 to-red-400/14"
  },
  strangers: {
    label: "Strangers who want to talk",
    subtitle: "For turning strangers into real people in under ten minutes.",
    badge: "Curious + human",
    tint: "from-violet-400/18 via-slate-300/10 to-blue-300/10",
    storyTint: "from-violet-500/24 via-slate-300/14 to-blue-400/14"
  },
  soloJournal: {
    label: "Solo Journal",
    subtitle: "For the nights when you want less noise and more truth.",
    badge: "Reflective + brave",
    tint: "from-emerald-400/16 via-teal-300/10 to-cyan-300/10",
    storyTint: "from-emerald-500/22 via-teal-400/14 to-cyan-400/14"
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
  }
}

export default function MirrorPage() {
  const [mode, setMode] = useState<Mode>("firstDate");
  const [deck, setDeck] = useState<Record<Mode, string[]>>(createInitialDeck);
  const [indexMap, setIndexMap] = useState<Record<Mode, number>>(createInitialIndexMap);
  const [isMounted, setIsMounted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const currentIndex = indexMap[mode];
  const currentQuestion = deck[mode]?.[currentIndex] ?? QUESTIONS[mode][0];
  const total = QUESTIONS[mode].length;
  const meta = MODE_META[mode];

  const progressText = useMemo(() => `${currentIndex + 1} / ${total}`, [currentIndex, total]);

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
        backgroundColor: "#06070a"
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        nextQuestion();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, deck]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#06070a] text-white">
      <div className="relative isolate min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(160,160,255,0.16),transparent_24%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(95,120,255,0.12),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0c1018_0%,#06070a_52%,#050608_100%)] opacity-95" />

        <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10 md:py-10">
          <header className="mb-8 flex flex-col gap-8 md:mb-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/60 backdrop-blur">
                  mirror
                </div>
                <h1 className="text-4xl font-semibold tracking-[-0.06em] text-white md:text-6xl">
                  Better questions. Better chemistry.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58 md:text-base">
                  For dates that skip the dead air, friends who want to go deeper, lovers who want to feel closer, and nights when you want to be honest with yourself.
                </p>
              </div>

              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Back to main page
              </a>
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
                        ? "border-white/90 bg-white text-[#0a0a0c] shadow-[0_8px_30px_rgba(255,255,255,0.18)]"
                        : "border-white/10 bg-white/5 text-white/68 hover:border-white/20 hover:bg-white/8 hover:text-white"
                    ].join(" ")}
                  >
                    {MODE_META[itemMode].label}
                  </button>
                );
              })}
            </div>

            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-8 lg:p-10"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${meta.tint}`} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="relative flex h-full min-h-[560px] flex-col justify-between">
                <div>
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-white/58">
                      {meta.badge}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/52">
                      {meta.label}
                    </span>
                    <span className="text-xs text-white/40">{progressText}</span>
                  </div>

                  <p className="text-sm text-white/46 md:text-base">{meta.subtitle}</p>

                  <div className="mt-10 max-w-4xl text-4xl font-semibold leading-[1.06] tracking-[-0.06em] text-white md:text-6xl lg:text-7xl">
                    {isMounted ? currentQuestion : "Loading a question worth asking..."}
                  </div>
                </div>

                <div className="relative mt-10 space-y-8">
                  <div className="flex items-center justify-between text-xs text-white/42">
                    <span>Ask better. Feel more. Share the good ones.</span>
                    <span>mirror by haoabouts</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={nextQuestion}
                      className="rounded-full border border-white/90 bg-white px-5 py-3 text-sm font-medium text-[#0a0a0c] transition hover:-translate-y-0.5"
                    >
                      Next question
                    </button>
                    <button
                      onClick={copyQuestion}
                      className="rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.1]"
                    >
                      Copy
                    </button>
                    <button
                      onClick={shareQuestion}
                      className="rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.1]"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => exportCardAsImage("card")}
                      disabled={isExporting}
                      className="rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.1] disabled:opacity-60"
                    >
                      {isExporting ? "Exporting..." : "Download card"}
                    </button>
                    <button
                      onClick={() => exportCardAsImage("story")}
                      disabled={isExporting}
                      className="rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm text-white transition hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.1] disabled:opacity-60"
                    >
                      {isExporting ? "Exporting..." : "Download story"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-6">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
                <p className="text-xs uppercase tracking-[0.18em] text-white/42">How to use</p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-white/62">
                  <p>Use arrow right or space when you want to keep the momentum going.</p>
                  <p>Stay with the good ones a little longer. The best questions get better after a pause.</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
                <p className="text-xs uppercase tracking-[0.18em] text-white/42">Why people send this around</p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-white/62">
                  <p>It makes conversations feel less scripted and more alive.</p>
                  <p>It gives people something better than “so, what do you do?”</p>
                  <p>And some questions are simply too good not to share.</p>
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
            "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/88 backdrop-blur-xl transition-all duration-200",
            toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          ].join(" ")}
        >
          {toast || "_"}
        </div>
      </div>
    </main>
  );
}
