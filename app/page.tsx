'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CursorPoint = {
  x: number;
  y: number;
};

type InterestGroup = {
  title: string;
  emoji: string;
  accent: string;
  glow: string;
  items: string[];
};

const initialPoint: CursorPoint = { x: -9999, y: -9999 };

const galleryImages = [
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Bay%20Tour.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Bouquet.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Comet.JPG',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Drums.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Flower.JPG',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Fly%20to%20Tahoe.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Hand%20Building.JPG',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Lisbon.jpg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/OW.JPG',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Painting.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Skydiving.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Solo%20Bay%20Tour.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Surfing.jpeg',
  'https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/Wheel.jpeg',
] as const;

export default function PersonalWebsiteStarter() {
  const [scrollY, setScrollY] = useState(0);
  const [views, setViews] = useState<string>('...');
    const [cursor, setCursor] = useState<CursorPoint>(initialPoint);
  const [trail, setTrail] = useState<CursorPoint>(initialPoint);
  const [isReady, setIsReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  const trailFrameRef = useRef<number | null>(null);

    useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setCursor({ x: event.clientX, y: event.clientY });
      });
    };

    setIsReady(true);
    window.addEventListener('mousemove', handleMove);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setTrail((prev) => ({
        x: prev.x + (cursor.x - prev.x) * 0.08,
        y: prev.y + (cursor.y - prev.y) * 0.08,
      }));

      trailFrameRef.current = requestAnimationFrame(animate);
    };

    trailFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (trailFrameRef.current !== null) {
        cancelAnimationFrame(trailFrameRef.current);
      }
    };
  }, [cursor.x, cursor.y]);

  const interestGroups = useMemo<InterestGroup[]>(
    () => [
      {
        title: 'Adventure & Certifications',
        emoji: '✈️',
        accent: 'from-rose-100/70 via-amber-100/60 to-sky-100/60',
        glow: 'rgba(255, 170, 210, 0.14)',
        items: ['🛩️ Private Pilot License (PPL)', '🚤 Boater Card', '🤿 Open Water Diver'],
      },
      {
        title: 'Sports',
        emoji: '🏃',
        accent: 'from-sky-100/70 via-emerald-100/60 to-rose-100/60',
        glow: 'rgba(150, 205, 255, 0.14)',
        items: ['🏊 Swimming', '🏄‍♀️ Surfing', '🩰 Ballet', '🥊 Boxing'],
      },
      {
        title: 'Creative Practices',
        emoji: '👩‍🎨',
        accent: 'from-amber-100/70 via-rose-100/60 to-violet-100/60',
        glow: 'rgba(255, 200, 140, 0.14)',
        items: ['📸 Photography', '💐 Flower Arranging', '🎨 Painting', '🏺 Ceramics', '🥁 Drums'],
      },
      {
        title: 'Inner World',
        emoji: '📚',
        accent: 'from-violet-100/70 via-indigo-100/60 to-sky-100/60',
        glow: 'rgba(180, 160, 255, 0.12)',
        items: ['📖 Reading', '🧠 Psychology', '🌀 Philosophy', '🔮 Metaphysics', '🕵️ Mystery & Crime', '🪑 Interior Design'],
      },
    ],
    []
  );

  const cardGlowPosition = `${cursor.x}px ${cursor.y}px`;

  useEffect(() => {
    // Use local API backed by Upstash Redis and format number
    fetch('/api/views', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        const n = typeof data?.value === 'number' ? data.value : Number(data?.value ?? 0)
        setViews(n ? n.toLocaleString() : '—')
      })
      .catch(() => setViews('—'));
  }, []);

  return (
    <>
      {/* Logo (top-left) */}
      <img
        src="https://raw.githubusercontent.com/haohao13/Personal-Website/main/Photos/hh-logo.png"
        alt="Hao Hao logo"
        style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
        className="absolute left-6 top-6 z-20 h-10 w-10 object-contain transition duration-300 hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(255,180,220,0.6)]"
      />

            {/* Top-right visitor counter */}
      <div className="fixed right-6 top-6 z-20 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-sm text-neutral-600 backdrop-blur-sm shadow-sm">
        👀 {views}
      </div>

      <main className="relative min-h-screen overflow-hidden bg-[#f4f1ea] text-neutral-900">
        {isReady && (
          <>
            <div
              className="pointer-events-none fixed z-0 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-transform duration-150 ease-out"
              style={{
                left: cursor.x,
                top: cursor.y,
                background:
                  'radial-gradient(circle at center, rgba(255, 170, 210, 0.28) 0%, rgba(255, 210, 140, 0.20) 38%, rgba(255, 255, 255, 0) 72%)',
              }}
            />
            <div
              className="pointer-events-none fixed z-0 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-transform duration-300 ease-out"
              style={{
                left: trail.x,
                top: trail.y,
                background:
                  'radial-gradient(circle at center, rgba(150, 205, 255, 0.24) 0%, rgba(190, 240, 220, 0.16) 42%, rgba(255, 255, 255, 0) 72%)',
              }}
            />
            <div
              className="pointer-events-none fixed z-0 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-transform duration-200 ease-out"
              style={{
                left: cursor.x,
                top: cursor.y,
                background:
                  'radial-gradient(circle at center, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0) 68%)',
              }}
            />
          </>
        )}

        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-28">
          <div className="space-y-10">
            <h1 className="text-[5rem] font-semibold leading-[0.85] tracking-[-0.05em] md:text-[7rem] lg:text-[8rem]">
              Hao Hao
            </h1>

            <p className="max-w-2xl text-xl italic leading-relaxed text-neutral-500 md:text-2xl">
              where curiosity meets beauty and soul meets structure
            </p>

            <p className="max-w-xl text-lg leading-8 text-neutral-600">
              Not a portfolio — just a collection of things I keep returning to.
            </p>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-6 pt-8">
          <div className="columns-2 gap-4 space-y-4 md:columns-3">
            {galleryImages.map((src, index) => (
              <div key={src + index.toString()} className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl">
                <img
                  src={src}
                  alt={`Gallery moment ${index + 1}`}
                  className="w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
          <div className="mb-12">
            <h2 className="text-3xl font-semibold md:text-4xl">Things I&apos;m into</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {interestGroups.map((group) => (
              <div
                key={group.title}
                className="group relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white/80 p-6 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/70 hover:shadow-lg"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${group.accent} opacity-30 transition duration-500 group-hover:opacity-55`}
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at ${cardGlowPosition}, ${group.glow} 0%, transparent 28%)`,
                  }}
                />

                <div className="relative mb-5 flex items-center gap-3">
                  <span className="text-2xl">{group.emoji}</span>
                  <h3 className="text-xl font-medium">{group.title}</h3>
                </div>

                <div className="relative flex flex-wrap gap-2.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-neutral-200 bg-[#faf8f3] px-4 py-2 text-sm text-neutral-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <div className="max-w-2xl">
            <h2 className="mb-6 text-3xl font-semibold md:text-4xl">About</h2>
            <p className="leading-8 text-neutral-600">
              Somewhere between flying planes, surfing waves, making ceramics, arranging flowers, and getting lost in ideas, I&apos;ve realized I&apos;m not chasing one thing — I&apos;m building a life that feels alive.
            </p>
          </div>
        </section>
        
      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-10 text-sm text-neutral-500">
        <div className="border-t border-neutral-200 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <p>© {new Date().getFullYear()} Hao Hao</p>

          <div className="flex flex-wrap gap-5">
            <a
              href="https://github.com/haohao13"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-neutral-800"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/haohao1996"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-neutral-800"
            >
              LinkedIn
            </a>
            <a
              href="https://www.xiaohongshu.com/user/profile/116217107"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-neutral-800"
            >
              Xiaohongshu
            </a>
          </div>

        </div>
      </footer>

    </main>
    </>
  );
}
