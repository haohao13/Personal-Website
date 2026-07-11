import { Place } from "@/data/places";
import { ParsedIntent, RankedPlace, parseIntent } from "@/lib/localflow";

const intentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    categories: { type: "array", items: { type: "string" } },
    vibe: { type: "array", items: { type: "string" } },
    avoid: { type: "array", items: { type: "string" } },
    mobility: {
      type: "string",
      enum: ["walkable", "driveable", "transit-friendly"],
    },
    socialEnergy: {
      type: "string",
      enum: ["solo", "date", "group", "open"],
    },
  },
  required: ["categories", "vibe", "avoid", "mobility", "socialEnergy"],
};

const rankingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ranked: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          fitScore: { type: "number" },
          reason: { type: "string" },
          vibe: { type: "array", items: { type: "string" } },
          bestFor: { type: "string" },
        },
        required: ["id", "fitScore", "reason", "vibe", "bestFor"],
      },
    },
  },
  required: ["ranked"],
};

export async function parseIntentWithOpenAI(query: string, apiKey: string) {
  const fallback = parseIntent(query);
  const parsed = await callOpenAI({
    apiKey,
    schemaName: "localflow_intent",
    schema: intentSchema,
    input: [
      {
        role: "system",
        content:
          "You are an intent-aware local exploration engine. Extract only the user's emotional and practical intent. Do not invent places.",
      },
      {
        role: "user",
        content: query,
      },
    ],
  });

  return {
    ...fallback,
    ...parsed,
  } as ParsedIntent;
}

export async function rankPlacesWithOpenAI({
  query,
  intent,
  places,
  apiKey,
}: {
  query: string;
  intent: ParsedIntent;
  places: Place[];
  apiKey: string;
}) {
  if (!places.length) {
    return [];
  }

  const parsed = await callOpenAI({
    apiKey,
    schemaName: "localflow_ranking",
    schema: rankingSchema,
    input: [
      {
        role: "system",
        content:
          "You rank only real places supplied by the app. Never invent places, addresses, ratings, coordinates, hours, or route times. Optimize for emotional fit, atmosphere, pacing, aesthetics, local authenticity, and coherence.",
      },
      {
        role: "user",
        content: JSON.stringify({
          userQuery: query,
          parsedIntent: intent,
          places: places.map((place) => ({
            id: place.id,
            name: place.name,
            category: place.category,
            address: place.address,
            rating: place.rating,
            tags: place.tags,
            primaryVibe: place.vibe,
          })),
        }),
      },
    ],
  });

  const byId = new Map(places.map((place) => [place.id, place]));
  const rawRanked = (parsed.ranked ?? []) as Array<{
    id: string;
    fitScore: number;
    reason: string;
    vibe: string[];
    bestFor: string;
  }>;
  const usesTenPointScale = rawRanked.length > 0 && Math.max(...rawRanked.map((item) => item.fitScore)) <= 10;
  const ranked = rawRanked
    .map((item, index) => {
      const place = byId.get(item.id);
      if (!place) {
        return null;
      }

      return {
        ...place,
        fitScore: normalizeFitScore(item.fitScore, index, usesTenPointScale),
        reason: item.reason,
        vibe: item.vibe.length ? item.vibe : place.vibe,
        bestFor: item.bestFor || place.bestFor,
      };
    })
    .filter(Boolean) as RankedPlace[];

  const missing = places.filter((place) => !ranked.some((rankedPlace) => rankedPlace.id === place.id));

  return dedupeRankedPlaces([
    ...ranked,
    ...missing.map((place) => ({
      ...place,
      fitScore: Math.round(place.rating * 10),
      reason: `${place.name} is a real nearby result that may fit the route.`,
    })),
  ]).sort((a, b) => b.fitScore - a.fitScore);
}

function dedupeRankedPlaces(places: RankedPlace[]) {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }

    seen.add(place.id);
    return true;
  });
}

function normalizeFitScore(score: number, index: number, usesTenPointScale: boolean) {
  if (usesTenPointScale) {
    return Math.max(70, 96 - index * 4);
  }

  return Math.max(1, Math.min(100, Math.round(score)));
}

async function callOpenAI({
  apiKey,
  schemaName,
  schema,
  input,
}: {
  apiKey: string;
  schemaName: string;
  schema: Record<string, unknown>;
  input: Array<{ role: string; content: string }>;
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI Responses API failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const outputText =
    data.output_text ??
    data.output
      ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
      .map((content: { text?: string }) => content.text)
      .filter(Boolean)
      .join("");

  if (!outputText) {
    throw new Error("OpenAI response did not include structured text output.");
  }

  return JSON.parse(outputText);
}
