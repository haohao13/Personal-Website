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

export default function Page() {
  const [cursor, setCursor] = useState<CursorPoint>(initialPoint);
  const [trail, setTrail] = useState<CursorPoint>(initialPoint);
  const [isReady, setIsReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  const trailFrameRef = useRef<number | null>(null);

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

  return (
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

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-neutral-500">Selected Moments</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">A visual diary</h2>
          </div>
          <p className="hidden max-w-sm text-sm leading-6 text-neutral-500 md:block">
            Not every moment needs equal weight. This collage is arranged more like memory than archive.
          </p>
        </div>

        <div className="grid auto-rows-[120px] grid-cols-2 gap-4 md:auto-rows-[150px] md:grid-cols-6">
          {galleryImages.map((src, index) => {
            const layouts = [
              'col-span-2 row-span-3 md:col-span-3 md:row-span-4',
              'col-span-1 row-span-2 md:col-span-2 md:row-span-2 md:mt-10',
              'col-span-1 row-span-2 md:col-span-1 md:row-span-3',
              'col-span-2 row-span-2 md:col-span-2 md:row-span-3',
              'col-span-1 row-span-2 md:col-span-1 md:row-span-2 md:-mt-6',
              'col-span-1 row-span-2 md:col-span-2 md:row-span-2',
              'col-span-2 row-span-3 md:col-span-3 md:row-span-3',
              'col-span-1 row-span-2 md:col-span-1 md:row-span-2 md:mt-8',
              'col-span-1 row-span-2 md:col-span-2 md:row-span-3',
              'col-span-2 row-span-2 md:col-span-3 md:row-span-2',
              'col-span-1 row-span-2 md:col-span-1 md:row-span-2',
              'col-span-1 row-span-2 md:col-span-2 md:row-span-2 md:-mt-8',
              'col-span-2 row-span-3 md:col-span-3 md:row-span-4',
              'col-span-1 row-span-2 md:col-span-2 md:row-span-2',
            ] as const;

            const rotations = [
              'md:-rotate-[1.2deg]',
              'md:rotate-[1deg]',
              'md:-rotate-[0.8deg]',
              'md:rotate-[0.6deg]',
              'md:-rotate-[1deg]',
              'md:rotate-[0.8deg]',
              'md:-rotate-[0.6deg]',
              'md:rotate-[1deg]',
              'md:-rotate-[0.8deg]',
              'md:rotate-[0.5deg]',
              'md:-rotate-[0.7deg]',
              'md:rotate-[0.9deg]',
              'md:-rotate-[0.5deg]',
              'md:rotate-[0.7deg]',
            ] as const;

            return (
              <article
                key={`${src}-${index}`}
                className={`group relative overflow-hidden rounded-[1.6rem] bg-white/70 shadow-[0_12px_30px_rgba(0,0,0,0.05)] ring-1 ring-black/5 transition duration-500 hover:z-20 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] ${layouts[index % layouts.length]} ${rotations[index % rotations.length]}`}
              >
                <img
                  src={src}
                  alt={`Gallery moment ${index + 1}`}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 opacity-70" />
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold md:text-4xl">Things I’m into</h2>
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
            Somewhere between flying planes, surfing waves, making ceramics, arranging flowers, and getting lost in ideas, I’ve realized I’m not chasing one thing — I’m building a life that feels alive.
          </p>
        </div>
      </section>
    </main>
  );
}