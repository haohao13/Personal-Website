import { Place } from "@/data/places";
import { buildRouteNarrative, ParsedIntent, RankedPlace, optimizeRoute } from "@/lib/localflow";

type GoogleLatLng = {
  latitude: number;
  longitude: number;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: GoogleLatLng;
  rating?: number;
  primaryType?: string;
  types?: string[];
  priceLevel?: string;
  googleMapsUri?: string;
  photos?: Array<{ name?: string }>;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
    nextCloseTime?: string;
  };
};

export type GooglePlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
};

const categoryImages: Record<string, string> = {
  cafe:
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
  bookstore:
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
  museum:
    "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=900&q=80",
  garden:
    "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
  walk:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  food:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  view:
    "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=900&q=80",
  shop:
    "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80",
};

export async function geocodeLocation(location: string, apiKey: string) {
  const params = new URLSearchParams({
    address: location,
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Google Geocoding failed: ${response.status}`);
  }

  const data = await response.json();
  const first = data.results?.[0]?.geometry?.location;

  if (!first) {
    throw new Error("Google Geocoding returned no results.");
  }

  return {
    lat: Number(first.lat),
    lng: Number(first.lng),
  };
}

export async function searchGooglePlaces({
  query,
  location,
  intent,
  apiKey,
  radiusMeters = 9000,
  minRadiusMeters = 0,
}: {
  query: string;
  location: string;
  intent: ParsedIntent;
  apiKey: string;
  radiusMeters?: number;
  minRadiusMeters?: number;
}) {
  const center = await geocodeLocation(location, apiKey);
  const searchQueries = buildSearchQueries(query, location, intent);
  const googleRadiusMeters = Math.min(50000, Math.max(0, radiusMeters));
  const results = await Promise.all(
    searchQueries.map((textQuery) =>
      fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.primaryType",
            "places.types",
            "places.priceLevel",
            "places.googleMapsUri",
            "places.photos.name",
            "places.currentOpeningHours.openNow",
            "places.currentOpeningHours.weekdayDescriptions",
            "places.currentOpeningHours.nextCloseTime",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery,
          maxResultCount: 8,
          locationBias: {
            circle: {
              center: {
                latitude: center.lat,
                longitude: center.lng,
              },
              radius: googleRadiusMeters,
            },
          },
        }),
      }).then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Google Places failed: ${response.status} ${text}`);
        }

        return response.json();
      }),
    ),
  );

  const deduped = new Map<string, GooglePlace>();

  for (const result of results) {
    for (const place of result.places ?? []) {
      if (place.id && !deduped.has(place.id)) {
        deduped.set(place.id, place);
      }
    }
  }

  return Array.from(deduped.values())
    .map((place) => normalizeGooglePlace(place, center))
    .filter((place) => (place.distanceFromSearchMeters ?? 0) >= minRadiusMeters)
    .slice(0, 18);
}

export async function resolveGooglePlace({
  query,
  location,
  apiKey,
}: {
  query: string;
  location: string;
  apiKey: string;
}) {
  const center = location ? await geocodeLocation(location, apiKey) : undefined;
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.primaryType",
        "places.types",
        "places.priceLevel",
        "places.googleMapsUri",
        "places.photos.name",
        "places.currentOpeningHours.openNow",
        "places.currentOpeningHours.weekdayDescriptions",
        "places.currentOpeningHours.nextCloseTime",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: location ? `${query} near ${location}` : query,
      maxResultCount: 1,
      ...(center
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: center.lat,
                  longitude: center.lng,
                },
                radius: 50000,
              },
            },
          }
        : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places resolve failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const place = data.places?.[0] as GooglePlace | undefined;

  if (!place) {
    throw new Error("Google Places returned no matching place.");
  }

  return normalizeGooglePlace(place, center);
}

export async function resolveGooglePlaceById({
  placeId,
  apiKey,
}: {
  placeId: string;
  apiKey: string;
}) {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "rating",
          "primaryType",
          "types",
          "priceLevel",
          "googleMapsUri",
          "photos.name",
          "currentOpeningHours.openNow",
          "currentOpeningHours.weekdayDescriptions",
          "currentOpeningHours.nextCloseTime",
        ].join(","),
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Place Details failed: ${response.status} ${text}`);
  }

  const place = (await response.json()) as GooglePlace;

  if (!place.id || !place.location) {
    throw new Error("Google Place Details returned no usable place.");
  }

  return normalizeGooglePlace(place);
}

export async function searchRestaurantsNearRoute({
  places,
  routePath,
  apiKey,
}: {
  places: RankedPlace[];
  routePath?: Array<{ lat: number; lng: number }>;
  apiKey: string;
}) {
  const pathPoints = routePath?.length
    ? routePath
    : places.map((place) => ({ lat: place.lat, lng: place.lng }));
  const searchPoints = sampleRouteSearchPoints(pathPoints).slice(0, 8);
  const searches = searchPoints.map((point) =>
    fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.formattedAddress",
          "places.location",
          "places.rating",
          "places.primaryType",
          "places.types",
          "places.priceLevel",
          "places.googleMapsUri",
          "places.photos.name",
          "places.currentOpeningHours.openNow",
          "places.currentOpeningHours.weekdayDescriptions",
          "places.currentOpeningHours.nextCloseTime",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: "restaurants worth a stop",
        maxResultCount: 3,
        locationBias: {
          circle: {
            center: {
              latitude: point.lat,
              longitude: point.lng,
            },
            radius: 650,
          },
        },
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Google restaurant search failed: ${response.status} ${text}`);
      }

      return response.json();
    }),
  );
  const results = await Promise.all(searches);
  const deduped = new Map<string, GooglePlace>();

  for (const result of results) {
    for (const place of result.places ?? []) {
      if (place.id && !deduped.has(place.id)) {
        deduped.set(place.id, place);
      }
    }
  }

  return Array.from(deduped.values())
    .map((place) => normalizeGooglePlace(place))
    .filter((place) => place.category === "food" || place.tags.some((tag) => tag.includes("restaurant")))
    .map((place) => ({
      place,
      routeDistanceMeters: getMinDistanceToPathMeters(place, pathPoints),
    }))
    .filter(({ routeDistanceMeters }) => routeDistanceMeters <= 900)
    .sort((a, b) => a.routeDistanceMeters - b.routeDistanceMeters || b.place.rating - a.place.rating)
    .slice(0, 6)
    .map(({ place }, index): RankedPlace => ({
      ...place,
      fitScore: Math.max(82, 94 - index * 2),
      reason: `${place.name} is a restaurant close to the current route, useful as a food stop without derailing the day.`,
    }));
}

function sampleRouteSearchPoints(pathPoints: Array<{ lat: number; lng: number }>) {
  if (pathPoints.length <= 8) {
    return pathPoints;
  }

  const sampled: Array<{ lat: number; lng: number }> = [];
  const lastIndex = pathPoints.length - 1;

  for (let index = 0; index < 8; index += 1) {
    sampled.push(pathPoints[Math.round((lastIndex * index) / 7)]);
  }

  return sampled;
}

function getMinDistanceToPathMeters(
  place: { lat: number; lng: number },
  pathPoints: Array<{ lat: number; lng: number }>,
) {
  if (!pathPoints.length) {
    return Number.POSITIVE_INFINITY;
  }

  return pathPoints.reduce(
    (nearest, point) => Math.min(nearest, estimateCoordinateDistanceMeters(place, point)),
    Number.POSITIVE_INFINITY,
  );
}

export async function autocompleteGooglePlaces({
  input,
  location,
  apiKey,
  sessionToken,
}: {
  input: string;
  location: string;
  apiKey: string;
  sessionToken?: string;
}) {
  const trimmedInput = input.trim();

  if (trimmedInput.length < 3) {
    return [];
  }

  const center = location ? await geocodeLocation(location, apiKey).catch(() => undefined) : undefined;
  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "suggestions.placePrediction.placeId",
        "suggestions.placePrediction.text.text",
        "suggestions.placePrediction.structuredFormat.mainText.text",
        "suggestions.placePrediction.structuredFormat.secondaryText.text",
        "suggestions.placePrediction.types",
      ].join(","),
    },
    body: JSON.stringify({
      input: trimmedInput,
      ...(sessionToken ? { sessionToken } : {}),
      ...(center
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: center.lat,
                  longitude: center.lng,
                },
                radius: 50000,
              },
            },
          }
        : {}),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places autocomplete failed: ${response.status} ${text}`);
  }

  const data = await response.json();

  return ((data.suggestions ?? []) as Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      types?: string[];
    };
  }>)
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => Boolean(prediction?.placeId))
    .map((prediction): GooglePlaceSuggestion => ({
      placeId: prediction.placeId ?? "",
      description: prediction.text?.text ?? prediction.structuredFormat?.mainText?.text ?? "",
      mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "",
      secondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
      types: prediction.types ?? [],
    }))
    .filter((suggestion) => suggestion.description);
}

export async function optimizeGoogleRoute({
  places,
  apiKey,
  optimizeWaypointOrder = false,
  lockEndpoints = false,
}: {
  places: RankedPlace[];
  apiKey: string;
  optimizeWaypointOrder?: boolean;
  lockEndpoints?: boolean;
}) {
  if (places.length < 2) {
    const fallback = optimizeRoute(places);
    return {
      ...fallback,
      routePath: places.map((place) => ({ lat: place.lat, lng: place.lng })),
      legs: buildFallbackLegs(fallback.orderedPlaces),
    };
  }

  const routeResult =
    optimizeWaypointOrder && lockEndpoints && places.length > 2
      ? await computeGoogleRoute({
          origin: places[0],
          destination: places[places.length - 1],
          intermediates: places.slice(1, -1),
          apiKey,
          optimizeWaypointOrder: true,
        })
      : optimizeWaypointOrder && places.length > 2
      ? await findShortestGoogleRoute(places, apiKey)
      : await computeGoogleRoute({
          origin: places[0],
          destination: places[places.length - 1],
          intermediates: places.slice(1, -1),
          apiKey,
          optimizeWaypointOrder: false,
        });
  const { orderedPlaces, route } = routeResult;
  const estimatedDuration = route?.duration
    ? Math.round(Number(String(route.duration).replace("s", "")) / 60)
    : optimizeRoute(orderedPlaces).estimatedDuration;
  const legs = buildGoogleLegs(orderedPlaces, route?.legs ?? []);
  const enrichedLegs = await enrichLegsWithAlternateModes({
    orderedPlaces,
    legs,
    apiKey,
  });

  return {
    orderedPlaces,
    estimatedDuration,
    narrative: buildRouteNarrative(orderedPlaces),
    routePath: route?.polyline?.encodedPolyline
      ? decodePolyline(route.polyline.encodedPolyline)
      : orderedPlaces.map((place) => ({ lat: place.lat, lng: place.lng })),
    legs: enrichedLegs,
  };
}

async function findShortestGoogleRoute(places: RankedPlace[], apiKey: string) {
  const candidates = places.length > 7 ? nearestNeighborEndpointPairs(places) : endpointPairs(places);
  const results = await Promise.allSettled(
    candidates.map(([origin, destination]) =>
      computeGoogleRoute({
        origin,
        destination,
        intermediates: places.filter((place) => place.id !== origin.id && place.id !== destination.id),
        apiKey,
        optimizeWaypointOrder: true,
      }),
    ),
  );
  const fulfilled = results
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof computeGoogleRoute>>> =>
      result.status === "fulfilled",
    )
    .map((result) => result.value);

  if (!fulfilled.length) {
    throw new Error("Google Routes could not optimize this itinerary.");
  }

  return fulfilled.reduce((best, candidate) =>
    getRouteDistance(candidate.route) < getRouteDistance(best.route) ? candidate : best,
  );
}

async function computeGoogleRoute({
  origin,
  destination,
  intermediates,
  apiKey,
  optimizeWaypointOrder,
}: {
  origin: RankedPlace;
  destination: RankedPlace;
  intermediates: RankedPlace[];
  apiKey: string;
  optimizeWaypointOrder: boolean;
}) {

  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "routes.duration",
        "routes.distanceMeters",
        "routes.legs.duration",
        "routes.legs.distanceMeters",
        "routes.polyline.encodedPolyline",
        "routes.optimizedIntermediateWaypointIndex",
      ].join(","),
    },
    body: JSON.stringify({
      origin: toWaypoint(origin),
      destination: toWaypoint(destination),
      intermediates: intermediates.map(toWaypoint),
      travelMode: "DRIVE",
      optimizeWaypointOrder: optimizeWaypointOrder && intermediates.length > 1,
      polylineEncoding: "ENCODED_POLYLINE",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Routes failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];
  const optimizedIndexes: number[] = route?.optimizedIntermediateWaypointIndex ?? [];
  const optimizedIntermediates = optimizeWaypointOrder && optimizedIndexes.length
    ? optimizedIndexes.map((index) => intermediates[index]).filter(Boolean)
    : intermediates;
  const orderedPlaces = [origin, ...optimizedIntermediates, destination];

  return {
    orderedPlaces,
    route,
  };
}

function endpointPairs(places: RankedPlace[]) {
  const pairs: Array<[RankedPlace, RankedPlace]> = [];

  for (const origin of places) {
    for (const destination of places) {
      if (origin.id !== destination.id) {
        pairs.push([origin, destination]);
      }
    }
  }

  return pairs;
}

function nearestNeighborEndpointPairs(places: RankedPlace[]) {
  const first = places[0];
  const farthest = [...places]
    .sort((a, b) => estimateDistanceMeters(first, b) - estimateDistanceMeters(first, a))
    .slice(0, 3);

  return Array.from(new Set([first, ...farthest])).flatMap((origin) =>
    farthest
      .filter((destination) => destination.id !== origin.id)
      .map((destination): [RankedPlace, RankedPlace] => [origin, destination]),
  );
}

function getRouteDistance(route?: { distanceMeters?: number }) {
  return Number(route?.distanceMeters ?? Number.POSITIVE_INFINITY);
}

function buildSearchQueries(query: string, location: string, intent: ParsedIntent) {
  const categoryQueries = intent.categories.slice(0, 3).map((category) => `${category} ${query}`);
  return Array.from(new Set([query, ...categoryQueries])).map(
    (searchQuery) => `${searchQuery} near ${location}`,
  );
}

function normalizeGooglePlace(place: GooglePlace, center?: { lat: number; lng: number }): Place {
  const category = inferCategory(place.primaryType, place.types ?? []);
  const lat = Number(place.location?.latitude ?? 0);
  const lng = Number(place.location?.longitude ?? 0);

  return {
    id: place.id ?? crypto.randomUUID(),
    name: place.displayName?.text ?? "Unnamed place",
    category,
    neighborhood: extractNeighborhood(place.formattedAddress),
    address: place.formattedAddress ?? "Address unavailable",
    lat,
    lng,
    rating: Number(place.rating ?? 4.2),
    durationMinutes: category === "museum" ? 75 : category === "walk" || category === "food" ? 60 : 45,
    price: normalizePrice(place.priceLevel),
    tags: [category, ...(place.types ?? []).slice(0, 5)],
    vibe: [],
    energy: category === "food" || category === "shop" ? "medium" : "low",
    bestFor: formatGooglePlaceType(place.primaryType, place.types ?? []),
    image: categoryImages[category] ?? categoryImages.cafe,
    photoName: place.photos?.[0]?.name,
    googleMapsUri: place.googleMapsUri,
    openingHoursText: formatOpeningHoursText(place.currentOpeningHours),
    openNow: place.currentOpeningHours?.openNow,
    source: "google",
    distanceFromSearchMeters: center ? estimateCoordinateDistanceMeters(center, { lat, lng }) : undefined,
  };
}

function formatOpeningHoursText(openingHours?: GooglePlace["currentOpeningHours"]) {
  if (!openingHours) {
    return undefined;
  }

  if (openingHours.openNow === false) {
    return "Closed now";
  }

  if (openingHours.nextCloseTime) {
    const closeTime = new Date(openingHours.nextCloseTime);

    if (!Number.isNaN(closeTime.getTime())) {
      return `Open until ${closeTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayDescription = openingHours.weekdayDescriptions?.find((description) =>
    description.startsWith(`${today}:`),
  );
  const closeMatch = todayDescription?.match(/(?:–|-)\s*([^,]+)$/);

  if (openingHours.openNow && closeMatch?.[1]) {
    return `Open until ${closeMatch[1].trim()}`;
  }

  return openingHours.openNow ? "Open now" : undefined;
}

function formatGooglePlaceType(primaryType?: string, types: string[] = []) {
  const rawType =
    primaryType ??
    types.find((type) => !["point_of_interest", "establishment"].includes(type)) ??
    "place";

  return rawType
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function inferCategory(primaryType?: string, types: string[] = []): Place["category"] {
  const allTypes = [primaryType, ...types].filter(Boolean).join(" ");

  if (allTypes.includes("book_store") || allTypes.includes("book")) return "bookstore";
  if (allTypes.includes("cafe") || allTypes.includes("coffee")) return "cafe";
  if (allTypes.includes("museum") || allTypes.includes("art_gallery")) return "museum";
  if (allTypes.includes("park") || allTypes.includes("garden")) return "garden";
  if (allTypes.includes("restaurant") || allTypes.includes("bakery")) return "food";
  if (allTypes.includes("store") || allTypes.includes("shopping")) return "shop";
  if (allTypes.includes("tourist_attraction")) return "view";

  return "walk";
}

function normalizePrice(priceLevel?: string): "$" | "$$" | "$$$" {
  if (!priceLevel || priceLevel === "PRICE_LEVEL_FREE" || priceLevel === "PRICE_LEVEL_INEXPENSIVE") {
    return "$";
  }

  if (priceLevel === "PRICE_LEVEL_EXPENSIVE" || priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE") {
    return "$$$";
  }

  return "$$";
}

function extractNeighborhood(address?: string) {
  if (!address) {
    return "Nearby";
  }

  const parts = address.split(",").map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 3] ?? parts[0] : parts[0];
}

function toWaypoint(place: RankedPlace) {
  return {
    location: {
      latLng: {
        latitude: place.lat,
        longitude: place.lng,
      },
    },
  };
}

function buildGoogleLegs(
  orderedPlaces: RankedPlace[],
  legs: Array<{ duration?: string; distanceMeters?: number }>,
) {
  return orderedPlaces.slice(0, -1).map((place, index) => ({
    fromId: place.id,
    toId: orderedPlaces[index + 1].id,
    distanceMeters: Number(legs[index]?.distanceMeters ?? estimateDistanceMeters(place, orderedPlaces[index + 1])),
    durationMinutes: Math.max(
      1,
      Math.round(Number(String(legs[index]?.duration ?? "0s").replace("s", "")) / 60) ||
        estimateDriveMinutes(place, orderedPlaces[index + 1]),
    ),
    walkingDurationMinutes: estimateWalkMinutes(place, orderedPlaces[index + 1]),
    transitDurationMinutes: estimateTransitMinutes(place, orderedPlaces[index + 1]),
  }));
}

export function buildFallbackLegs(orderedPlaces: RankedPlace[]) {
  return enrichFallbackLegs(orderedPlaces);
}

function enrichFallbackLegs(orderedPlaces: RankedPlace[]) {
  return orderedPlaces.slice(0, -1).map((place, index) => ({
    fromId: place.id,
    toId: orderedPlaces[index + 1].id,
    distanceMeters: estimateDistanceMeters(place, orderedPlaces[index + 1]),
    durationMinutes: estimateDriveMinutes(place, orderedPlaces[index + 1]),
    walkingDurationMinutes: estimateWalkMinutes(place, orderedPlaces[index + 1]),
    transitDurationMinutes: estimateTransitMinutes(place, orderedPlaces[index + 1]),
  }));
}

async function enrichLegsWithAlternateModes({
  orderedPlaces,
  legs,
  apiKey,
}: {
  orderedPlaces: RankedPlace[];
  legs: ReturnType<typeof buildGoogleLegs>;
  apiKey: string;
}) {
  const enriched = await Promise.all(
    legs.map(async (leg, index) => {
      const from = orderedPlaces[index];
      const to = orderedPlaces[index + 1];
      const [walkingDurationMinutes, transitDurationMinutes] = await Promise.all([
        computeSingleLegDuration({ from, to, travelMode: "WALK", apiKey }).catch(() =>
          estimateWalkMinutes(from, to),
        ),
        computeSingleLegDuration({ from, to, travelMode: "TRANSIT", apiKey }).catch(() =>
          estimateTransitMinutes(from, to),
        ),
      ]);

      return {
        ...leg,
        walkingDurationMinutes,
        transitDurationMinutes,
      };
    }),
  );

  return enriched;
}

async function computeSingleLegDuration({
  from,
  to,
  travelMode,
  apiKey,
}: {
  from: RankedPlace;
  to: RankedPlace;
  travelMode: "WALK" | "TRANSIT";
  apiKey: string;
}) {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "routes.duration",
    },
    body: JSON.stringify({
      origin: toWaypoint(from),
      destination: toWaypoint(to),
      travelMode,
    }),
  });

  if (!response.ok) {
    throw new Error(`${travelMode} route failed: ${response.status}`);
  }

  const data = await response.json();
  const duration = data.routes?.[0]?.duration;
  const seconds = Number(String(duration ?? "0s").replace("s", ""));

  if (!seconds) {
    throw new Error(`${travelMode} route returned no duration.`);
  }

  return Math.max(1, Math.round(seconds / 60));
}

function estimateDriveMinutes(from: RankedPlace, to: RankedPlace) {
  const miles = estimateDistanceMeters(from, to) / 1609.344;
  return Math.max(4, Math.round((miles / 18) * 60 + 5));
}

function estimateWalkMinutes(from: RankedPlace, to: RankedPlace) {
  const miles = estimateDistanceMeters(from, to) / 1609.344;
  return Math.max(3, Math.round((miles / 3) * 60));
}

function estimateTransitMinutes(from: RankedPlace, to: RankedPlace) {
  const miles = estimateDistanceMeters(from, to) / 1609.344;
  return Math.max(8, Math.round((miles / 13) * 60 + 9));
}

function estimateDistanceMeters(from: RankedPlace, to: RankedPlace) {
  const earthRadius = 6371000;
  const fromLat = degreesToRadians(from.lat);
  const toLat = degreesToRadians(to.lat);
  const deltaLat = degreesToRadians(to.lat - from.lat);
  const deltaLng = degreesToRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c * 1.22);
}

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

function estimateCoordinateDistanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const earthRadius = 6371000;
  const fromLat = degreesToRadians(from.lat);
  const toLat = degreesToRadians(to.lat);
  const deltaLat = degreesToRadians(to.lat - from.lat);
  const deltaLng = degreesToRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
}

function decodePolyline(encoded: string) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const path: Array<{ lat: number; lng: number }> = [];

  while (index < encoded.length) {
    const latResult = decodeChunk(encoded, index);
    index = latResult.index;
    lat += latResult.value;

    const lngResult = decodeChunk(encoded, index);
    index = lngResult.index;
    lng += lngResult.value;

    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return path;
}

function decodeChunk(encoded: string, startIndex: number) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = 0;

  do {
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return {
    value: result & 1 ? ~(result >> 1) : result >> 1,
    index,
  };
}
