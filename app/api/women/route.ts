import { NextResponse } from "next/server";
import { WOMEN_DATA, WomanEntry } from "@/data/women-data";
import dailyIndex from "@/data/daily-index.json";

type DailyEntry = {
  primary: string;
  secondary: string[];
  label: string;
  fallback_level: number;
};

// Strip trailing "-month-day" to get base id, e.g. "virginia-woolf-1-25" → "virginia-woolf"
function getBaseId(id: string): string {
  return id.replace(/-\d+-\d+$/, "");
}

// Map: base-id → first WOMEN_DATA entry with that base
const BASE_MAP = new Map<string, WomanEntry>();
for (const e of WOMEN_DATA) {
  const base = getBaseId(e.id);
  if (!BASE_MAP.has(base)) BASE_MAP.set(base, e);
}

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

  // ── Level 1: nearest entry within ±3 days ──
  const nearby = WOMEN_DATA
    .map(e => ({ e, diff: dayDiff(e.month, e.day, month, day) }))
    .filter(({ diff }) => diff > 0 && diff <= 3)
    .sort((a, b) => a.diff - b.diff);

  if (nearby.length > 0) {
    const birthDay = nearby[0].e.day;
    const birthMonth = nearby[0].e.month;
    const direction = (new Date(2000, birthMonth - 1, birthDay) > new Date(2000, month - 1, day))
      ? "after"
      : "before";
    const label = direction === "after"
      ? `Born ${Math.round(nearby[0].diff)} day${nearby[0].diff > 1 ? "s" : ""} from now`
      : `Born ${Math.round(nearby[0].diff)} day${nearby[0].diff > 1 ? "s" : ""} ago`;
    return NextResponse.json({ entries: [nearby[0].e], matchLabel: "Born around this time", matchLevel: 1 });
  }

  // ── Level 2: daily-index guided featured pick ──
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const key = `${mm}-${dd}`;
  const idx = (dailyIndex.daily_index as Record<string, DailyEntry>)[key];

  if (idx) {
    const candidates = [idx.primary, ...idx.secondary];
    for (const personId of candidates) {
      const entry = BASE_MAP.get(personId);
      if (entry) {
        return NextResponse.json({ entries: [entry], matchLabel: "Featured from history", matchLevel: 2 });
      }
    }
  }

  // Last resort: deterministic pick from full dataset
  const seed = (month * 31 + day) % WOMEN_DATA.length;
  return NextResponse.json({ entries: [WOMEN_DATA[seed]], matchLabel: "Featured from history", matchLevel: 2 });
}
