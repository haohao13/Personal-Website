import { NextRequest, NextResponse } from "next/server";
import { buildFallbackLegs, optimizeGoogleRoute } from "@/lib/google";
import { buildRouteNarrative, RankedPlace } from "@/lib/localflow";

export async function POST(request: NextRequest) {
  const { places, optimize, lockEndpoints } = (await request.json()) as {
    places?: RankedPlace[];
    optimize?: boolean;
    lockEndpoints?: boolean;
  };
  const selectedPlaces = Array.isArray(places) ? places : [];
  const warnings: string[] = [];
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!googleKey) {
    warnings.push("GOOGLE_MAPS_API_KEY is missing, using local route ordering.");
  }

  try {
    if (!googleKey || selectedPlaces.length < 2) {
      const fallback = buildOrderedRoutePlan(selectedPlaces);
      return NextResponse.json({
        ...fallback,
        routePath: selectedPlaces.map((place) => ({ lat: place.lat, lng: place.lng })),
        legs: buildFallbackLegs(fallback.orderedPlaces),
        provider: "mock",
        warnings,
      });
    }

    const routePlan = await optimizeGoogleRoute({
      places: selectedPlaces,
      apiKey: googleKey,
      optimizeWaypointOrder: Boolean(optimize),
      lockEndpoints: Boolean(lockEndpoints),
    });

    return NextResponse.json({
      ...routePlan,
      provider: "google",
      warnings,
    });
  } catch (error) {
    const fallback = buildOrderedRoutePlan(selectedPlaces);
    warnings.push(error instanceof Error ? error.message : "Unknown route API error.");
    warnings.push("Fell back to local route ordering.");

    return NextResponse.json({
      ...fallback,
      routePath: selectedPlaces.map((place) => ({ lat: place.lat, lng: place.lng })),
      legs: buildFallbackLegs(fallback.orderedPlaces),
      provider: "mock",
      warnings,
    });
  }
}

function buildOrderedRoutePlan(selectedPlaces: RankedPlace[]) {
  const legs = buildFallbackLegs(selectedPlaces);
  const estimatedDuration =
    selectedPlaces.reduce((total, place) => total + (place.durationMinutes ?? 0), 0) +
    legs.reduce((total, leg) => total + leg.durationMinutes, 0);

  return {
    orderedPlaces: selectedPlaces,
    estimatedDuration,
    narrative: buildRouteNarrative(selectedPlaces),
  };
}
