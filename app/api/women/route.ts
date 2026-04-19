import { NextResponse } from "next/server";
import { WOMEN_DATA } from "@/data/women-data";

function dayDiff(m1: number, d1: number, m2: number, d2: number): number {
  const a = new Date(2000, m1 - 1, d1).getTime();
  const b = new Date(2000, m2 - 1, d2).getTime();
  return Math.abs((a - b) / 86400000);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const day = Number(searchParams.get("day"));

  if (!month || !day) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  // ── Level 0: exact birth date match ──
  const exact = WOMEN_DATA.filter(e => e.month === month && e.day === day);
  if (exact.length > 0) {
    return NextResponse.json({ entries: exact, matchLabel: "Born on this day", matchLevel: 0 });
  }

  // ── Level 1: nearest entry within ±3 days (only entries with known month/day) ──
  const nearby = WOMEN_DATA
    .filter(e => e.day > 0)
    .map(e => ({ e, diff: dayDiff(e.month, e.day, month, day) }))
    .filter(({ diff }) => diff > 0 && diff <= 3)
    .sort((a, b) => a.diff - b.diff);

  if (nearby.length > 0) {
    return NextResponse.json({ entries: nearby.map(x => x.e), matchLabel: "Born around this time", matchLevel: 1 });
  }

  // ── Level 2: figures with no specific birth month/day ──
  // Pool: entries where day === 0 (birth date approximate or unknown)
  const noDatePool = WOMEN_DATA.filter(e => e.day === 0);

  if (noDatePool.length > 0) {
    // Priority: same birth month if the entry's birthDate mentions it
    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const currentMonthName = MONTH_NAMES[month - 1];
    const sameMonthPool = noDatePool.filter(e => e.birthDate.includes(currentMonthName));
    const pool = sameMonthPool.length > 0 ? sameMonthPool : noDatePool;
    return NextResponse.json({ entries: pool, matchLabel: "Featured from history", matchLevel: 2 });
  }

  // Absolute fallback (should not be reached in practice)
  const fallbackSeed = (month * 31 + day) % WOMEN_DATA.length;
  return NextResponse.json({ entries: [WOMEN_DATA[fallbackSeed]], matchLabel: "Featured from history", matchLevel: 2 });
}
