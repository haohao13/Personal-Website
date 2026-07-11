import { NextRequest, NextResponse } from "next/server";
import { searchRestaurantsNearRoute } from "@/lib/google";
import { RankedPlace } from "@/lib/localflow";

export async function POST(request: NextRequest) {
  const { places, routePath } = (await request.json()) as {
    places?: RankedPlace[];
    routePath?: Array<{ lat: number; lng: number }>;
  };
  const routePlaces = Array.isArray(places) ? places : [];
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is missing.", restaurants: [] },
      { status: 500 },
    );
  }

  if (routePlaces.length < 2) {
    return NextResponse.json(
      { error: "Select at least two route stops first.", restaurants: [] },
      { status: 400 },
    );
  }

  try {
    const restaurants = await searchRestaurantsNearRoute({
      places: routePlaces,
      routePath: Array.isArray(routePath) ? routePath : undefined,
      apiKey,
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not find restaurants near route.",
        restaurants: [],
      },
      { status: 500 },
    );
  }
}
