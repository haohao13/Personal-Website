import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const day = searchParams.get("day");

  if (!month || !day) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  try {
    // 1️⃣ Wikipedia API
    const wikiRes = await fetch(
      `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/births/${month}/${day}`
    );

    const wikiData = await wikiRes.json();
    console.log("wikiData", JSON.stringify(wikiData).slice(0, 500));

    // 抽前 15 个候选
    const candidates = wikiData.births.slice(0, 15).map((b: any) => ({
      name: b.text,
      description: b.pages?.[0]?.description || "",
      extract: b.pages?.[0]?.extract || "",
      thumbnail: b.pages?.[0]?.thumbnail?.source || "",
    }));
    console.log("candidates", candidates);

    // 2️⃣ OpenAI筛选
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `From the following list of historical figures born on a given date, select ONLY notable WOMEN.

Return 1-3 of the most impactful ones.

Return ONLY a valid JSON array (no markdown, no explanation):
[
 {
  "name": "...",
  "bio": "1-2 sentence bio",
  "field": "...",
  "nationality": "..."
 }
]

Candidates:
${JSON.stringify(candidates)}`,
          },
        ],
      }),
    });

    const openaiData = await openaiRes.json();
    console.log("openaiData", JSON.stringify(openaiData).slice(0, 1000));

    let parsed;
    try {
      const text = openaiData.choices[0].message.content;
      const clean = text.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = [];
    }

    // 3️⃣ 转换成前端格式
    const entries = parsed.map((p: any, i: number) => ({
      id: `${p.name}-${month}-${day}-${i}`,
      name: p.name,
      month: Number(month),
      day: Number(day),
      birthDate: `${month}/${day}`,
      deathDate: "",
      bio: p.bio,
      image: candidates[i]?.thumbnail || "",
      imageAlt: p.name,
      field: p.field,
      nationality: p.nationality,
    }));

    return NextResponse.json({ entries });

  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "failed to fetch women" },
      { status: 500 }
    );
  }
}
