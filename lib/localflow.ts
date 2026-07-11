import { Place, places } from "@/data/places";

export type ParsedIntent = {
  categories: string[];
  vibe: string[];
  avoid: string[];
  mobility: "walkable" | "driveable" | "transit-friendly";
  socialEnergy: "solo" | "date" | "group" | "open";
};

export type RankedPlace = Place & {
  fitScore: number;
  reason: string;
};

export type RoutePlan = {
  orderedPlaces: RankedPlace[];
  estimatedDuration: number;
  narrative: string;
};

const categoryKeywords: Record<string, string[]> = {
  cafe: ["cafe", "coffee", "latte", "tea"],
  bookstore: ["book", "bookstore", "read", "reading"],
  museum: ["museum", "gallery", "art", "exhibit"],
  garden: ["garden", "plants", "flowers", "green"],
  walk: ["walk", "walking", "stroll", "wander"],
  food: ["food", "lunch", "bakery", "snack", "dinner"],
  view: ["view", "sunset", "ocean", "scenic"],
  shop: ["market", "browse", "shopping"],
};

const vibeKeywords: Record<string, string[]> = {
  quiet: ["quiet", "think", "calm", "solo", "reset"],
  aesthetic: ["aesthetic", "beautiful", "cute", "romanticize"],
  inspiring: ["inspiring", "creative", "art", "memorable"],
  romantic: ["date", "romantic", "soft"],
  local: ["local", "not touristy", "hidden", "neighborhood"],
  rainy: ["rainy", "rain"],
  social: ["friends", "group", "fun"],
};

function includesAny(input: string, words: string[]) {
  return words.some((word) => input.includes(word));
}

export function parseIntent(query: string): ParsedIntent {
  const normalized = query.toLowerCase();
  const categories = Object.entries(categoryKeywords)
    .filter(([, words]) => includesAny(normalized, words))
    .map(([category]) => category);

  const vibe = Object.entries(vibeKeywords)
    .filter(([, words]) => includesAny(normalized, words))
    .map(([tag]) => tag);

  const avoid = normalized.includes("not touristy")
    ? ["touristy"]
    : normalized.includes("quiet")
      ? ["crowded"]
      : [];

  const socialEnergy = normalized.includes("date")
    ? "date"
    : normalized.includes("solo")
      ? "solo"
      : normalized.includes("friends") || normalized.includes("group")
        ? "group"
        : "open";

  return {
    categories: categories.length ? categories : ["cafe", "museum", "walk"],
    vibe: vibe.length ? vibe : ["aesthetic", "local", "coherent"],
    avoid,
    mobility: normalized.includes("30 mins") ? "driveable" : "walkable",
    socialEnergy,
  };
}

export function rankPlaces(query: string): RankedPlace[] {
  const intent = parseIntent(query);

  return places
    .map((place) => {
      const categoryFit = intent.categories.includes(place.category) ? 28 : 0;
      const vibeFit = place.vibe.filter((tag) => intent.vibe.includes(tag)).length * 12;
      const tagFit = place.tags.filter((tag) =>
        intent.vibe.some((vibe) => tag.includes(vibe) || vibe.includes(tag)),
      ).length * 8;
      const socialFit =
        intent.socialEnergy === "open" || place.tags.includes(intent.socialEnergy) ? 12 : 0;
      const localFit =
        intent.avoid.includes("touristy") && place.vibe.includes("not-touristy") ? 14 : 0;
      const ratingFit = Math.round((place.rating - 4) * 10);
      const pacingFit = place.energy === "low" ? 8 : place.energy === "medium" ? 6 : 3;

      const fitScore = Math.min(
        98,
        34 + categoryFit + vibeFit + tagFit + socialFit + localFit + ratingFit + pacingFit,
      );

      const matchedVibe = place.vibe.find((tag) => intent.vibe.includes(tag)) ?? place.vibe[0];
      const reason = `${place.name} fits the ${matchedVibe} thread: ${place.bestFor}.`;

      return {
        ...place,
        fitScore,
        reason,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

export function optimizeRoute(selectedPlaces: RankedPlace[]): RoutePlan {
  const orderedPlaces = [...selectedPlaces].sort((a, b) => {
    const energyOrder = { medium: 0, high: 1, low: 2 };
    return energyOrder[a.energy] - energyOrder[b.energy];
  });

  const estimatedDuration =
    orderedPlaces.reduce((total, place) => total + place.durationMinutes, 0) +
    Math.max(0, orderedPlaces.length - 1) * 18;

  const narrative = buildRouteNarrative(orderedPlaces);

  return {
    orderedPlaces,
    estimatedDuration,
    narrative,
  };
}

export function buildRouteNarrative(orderedPlaces: RankedPlace[]) {
  const narrativePlaces = orderedPlaces.filter((place) => !isUserHomePlace(place));

  if (!narrativePlaces.length) {
    return "Choose a few stops to generate a coherent day.";
  }

  if (narrativePlaces.length === 1) {
    return `${narrativePlaces[0].name} becomes the anchor: one focused stop that gives the route a clear reason to exist.`;
  }

  const [firstPlace, ...restPlaces] = narrativePlaces;
  const finalPlace = restPlaces[restPlaces.length - 1];
  const middlePlaces = restPlaces.slice(0, -1);
  const opening = `Begin at ${firstPlace.name}, where the day gets its first shape.`;
  const middleText = middlePlaces.length
    ? ` Let ${formatPlaceList(middlePlaces.map((place) => place.name))} carry the middle with a little movement and discovery.`
    : "";
  const closing = ` End at ${finalPlace.name}, so the route lands somewhere that feels earned.`;

  return `${opening}${middleText}${closing}`;
}

function isUserHomePlace(place: RankedPlace) {
  return (
    place.id === "home" ||
    place.id === "home-start" ||
    (place.id === "final-destination" && place.name === "Final destination")
  );
}

function formatPlaceList(names: string[]) {
  if (names.length <= 1) {
    return names[0] ?? "";
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function getCandidatePlaces(query: string) {
  const parsedIntent = parseIntent(query);
  const rankedPlaces = rankPlaces(query);

  return {
    parsedIntent,
    rankedPlaces,
  };
}
