import { NextResponse } from "next/server";
import { WOMEN_DATA } from "@/data/women-data";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const day = searchParams.get("day");

  if (!month || !day) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const entries = WOMEN_DATA.filter(
    (e) => e.month === Number(month) && e.day === Number(day)
  );

  return NextResponse.json({ entries });
}
