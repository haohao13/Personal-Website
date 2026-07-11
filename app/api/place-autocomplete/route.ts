import { NextRequest, NextResponse } from "next/server";
import { autocompleteGooglePlaces } from "@/lib/google";

export async function POST(request: NextRequest) {
  const { input, location, sessionToken } = await request.json();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is missing." },
      { status: 500 },
    );
  }

  if (typeof input !== "string" || input.trim().length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await autocompleteGooglePlaces({
      input,
      location: typeof location === "string" ? location : "",
      sessionToken: typeof sessionToken === "string" ? sessionToken : undefined,
      apiKey,
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load place suggestions.",
        suggestions: [],
      },
      { status: 500 },
    );
  }
}
