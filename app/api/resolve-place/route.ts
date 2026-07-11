import { NextRequest, NextResponse } from "next/server";
import { resolveGooglePlace, resolveGooglePlaceById } from "@/lib/google";

export async function POST(request: NextRequest) {
  const { query, location, placeId, stableId } = await request.json();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is missing." },
      { status: 500 },
    );
  }

  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 });
  }

  try {
    const place =
      typeof placeId === "string" && placeId
        ? await resolveGooglePlaceById({ placeId, apiKey })
        : await resolveGooglePlace({
            query: query.trim(),
            location: typeof location === "string" ? location : "",
            apiKey,
          });

    return NextResponse.json({
      place: {
        ...place,
        id: typeof stableId === "string" && stableId ? stableId : place.id,
        fitScore: 90,
        reason: `${place.name} was matched from your custom location override.`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not resolve place." },
      { status: 500 },
    );
  }
}
