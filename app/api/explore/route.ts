import { NextRequest, NextResponse } from "next/server";
import { places } from "@/data/places";
import { searchGooglePlaces } from "@/lib/google";
import { parseIntentWithOpenAI, rankPlacesWithOpenAI } from "@/lib/openai";
import { getCandidatePlaces, parseIntent, rankPlaces } from "@/lib/localflow";

export async function POST(request: NextRequest) {
  const { query, location, radiusMeters, minRadiusMeters } = await request.json();
  const safeQuery = typeof query === "string" && query.trim() ? query.trim() : "quiet cafe";
  const safeLocation =
    typeof location === "string" && location.trim() ? location.trim() : "San Francisco, CA";
  const safeRadiusMeters =
    typeof radiusMeters === "number" && Number.isFinite(radiusMeters)
      ? Math.min(160934, Math.max(1000, Math.round(radiusMeters)))
      : 9000;
  const safeMinRadiusMeters =
    typeof minRadiusMeters === "number" && Number.isFinite(minRadiusMeters)
      ? Math.min(safeRadiusMeters - 1, Math.max(0, Math.round(minRadiusMeters)))
      : 0;
  const warnings: string[] = [];
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!googleKey) {
    warnings.push("GOOGLE_MAPS_API_KEY is missing, using local mock places.");
  }

  if (!openaiKey) {
    warnings.push("OPENAI_API_KEY is missing, using local intent/ranking heuristics.");
  }

  try {
    const parsedIntent = openaiKey
      ? await parseIntentWithOpenAI(safeQuery, openaiKey)
      : parseIntent(safeQuery);

    const retrievedPlaces = googleKey
      ? await searchGooglePlaces({
          query: safeQuery,
          location: safeLocation,
          intent: parsedIntent,
          apiKey: googleKey,
          radiusMeters: safeRadiusMeters,
          minRadiusMeters: safeMinRadiusMeters,
        })
      : places;

    const rankedPlaces = dedupePlaces(openaiKey
      ? await rankPlacesWithOpenAI({
          query: safeQuery,
          intent: parsedIntent,
          places: retrievedPlaces,
          apiKey: openaiKey,
        })
      : googleKey
        ? retrievedPlaces
            .map((place) => ({
              ...place,
              fitScore: Math.max(50, Math.min(96, Math.round(place.rating * 16))),
              reason: `${place.name} is a real nearby place returned by Google Places for this intent.`,
            }))
            .sort((a, b) => b.fitScore - a.fitScore)
        : rankPlaces(safeQuery));

    return NextResponse.json({
      parsedIntent,
      rankedPlaces,
      provider: googleKey ? "google" : "mock",
      warnings,
    });
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Unknown API error.");

    if (googleKey) {
      warnings.push("Real place search failed, so no mock San Francisco places were shown.");

      return NextResponse.json({
        parsedIntent: parseIntent(safeQuery),
        rankedPlaces: [],
        provider: "google",
        warnings,
      });
    }

    const fallback = getCandidatePlaces(safeQuery);
    warnings.push("Fell back to local mock data so the product remains previewable.");

    return NextResponse.json({
      ...fallback,
      provider: "mock",
      warnings,
    });
  }
}

function dedupePlaces<T extends { id: string }>(places: T[]) {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }

    seen.add(place.id);
    return true;
  });
}
