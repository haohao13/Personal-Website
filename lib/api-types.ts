import type { ParsedIntent, RankedPlace, RoutePlan } from "@/lib/localflow";

export type ExploreResponse = {
  parsedIntent: ParsedIntent;
  rankedPlaces: RankedPlace[];
  provider: "mock" | "google";
  warnings: string[];
};

export type ApiRoutePlan = RoutePlan & {
  routePath: Array<{ lat: number; lng: number }>;
  legs: Array<{
    fromId: string;
    toId: string;
    distanceMeters: number;
    durationMinutes: number;
    walkingDurationMinutes?: number;
    transitDurationMinutes?: number;
  }>;
  provider: "mock" | "google";
  warnings: string[];
};
