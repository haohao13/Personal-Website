export type PlaceCategory =
  | "cafe"
  | "bookstore"
  | "museum"
  | "garden"
  | "walk"
  | "food"
  | "view"
  | "shop";

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  durationMinutes: number;
  price: "$" | "$$" | "$$$";
  tags: string[];
  vibe: string[];
  energy: "low" | "medium" | "high";
  bestFor: string;
  image: string;
  photoName?: string;
  googleMapsUri?: string;
  openingHoursText?: string;
  openNow?: boolean;
  source?: "mock" | "google";
  distanceFromSearchMeters?: number;
};

export const places: Place[] = [
  {
    id: "moma",
    name: "SFMOMA",
    category: "museum",
    neighborhood: "SoMa",
    address: "151 3rd St, San Francisco, CA",
    lat: 37.7857,
    lng: -122.4011,
    rating: 4.6,
    durationMinutes: 95,
    price: "$$",
    tags: ["art", "rainy-day", "inspiring", "date", "solo"],
    vibe: ["aesthetic", "quiet", "creative", "polished"],
    energy: "medium",
    bestFor: "starting with a focused, visually rich anchor stop",
    image:
      "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "green-apple",
    name: "Green Apple Books",
    category: "bookstore",
    neighborhood: "Inner Richmond",
    address: "506 Clement St, San Francisco, CA",
    lat: 37.7833,
    lng: -122.4648,
    rating: 4.8,
    durationMinutes: 45,
    price: "$$",
    tags: ["books", "local", "quiet", "solo", "aesthetic"],
    vibe: ["curious", "warm", "lived-in", "not-touristy"],
    energy: "low",
    bestFor: "a slow browse that feels local rather than performative",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "jane",
    name: "Jane on Larkin",
    category: "cafe",
    neighborhood: "Civic Center",
    address: "925 Larkin St, San Francisco, CA",
    lat: 37.7872,
    lng: -122.4182,
    rating: 4.5,
    durationMinutes: 40,
    price: "$$",
    tags: ["cafe", "reset", "solo", "date", "rainy-day"],
    vibe: ["bright", "calm", "fresh", "easy"],
    energy: "medium",
    bestFor: "a coffee reset between slower cultural stops",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "lands-end",
    name: "Lands End Trail",
    category: "walk",
    neighborhood: "Outer Richmond",
    address: "680 Point Lobos Ave, San Francisco, CA",
    lat: 37.7799,
    lng: -122.5116,
    rating: 4.8,
    durationMinutes: 80,
    price: "$",
    tags: ["walk", "view", "inspiring", "solo", "date"],
    vibe: ["expansive", "cinematic", "reflective", "windy"],
    energy: "medium",
    bestFor: "ending with air, scale, and a little perspective",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "conservatory",
    name: "Conservatory of Flowers",
    category: "garden",
    neighborhood: "Golden Gate Park",
    address: "100 John F Kennedy Dr, San Francisco, CA",
    lat: 37.7726,
    lng: -122.4602,
    rating: 4.7,
    durationMinutes: 55,
    price: "$$",
    tags: ["plants", "date", "aesthetic", "rainy-day", "reset"],
    vibe: ["lush", "romantic", "soft", "restorative"],
    energy: "low",
    bestFor: "a gentle sensory stop when the day needs softness",
    image:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "tartine",
    name: "Tartine Manufactory",
    category: "food",
    neighborhood: "Mission",
    address: "595 Alabama St, San Francisco, CA",
    lat: 37.7614,
    lng: -122.4116,
    rating: 4.5,
    durationMinutes: 60,
    price: "$$",
    tags: ["food", "bakery", "date", "inspiring", "not-too-touristy"],
    vibe: ["craft", "warm", "social", "delicious"],
    energy: "high",
    bestFor: "a satisfying food stop with enough energy to lift the route",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "fraenkel",
    name: "Fraenkel Gallery",
    category: "museum",
    neighborhood: "Union Square",
    address: "49 Geary St, San Francisco, CA",
    lat: 37.7876,
    lng: -122.4045,
    rating: 4.7,
    durationMinutes: 35,
    price: "$",
    tags: ["gallery", "quiet", "aesthetic", "solo", "not-touristy"],
    vibe: ["precise", "minimal", "thoughtful", "hidden"],
    energy: "low",
    bestFor: "a compact art stop that will not overwhelm the afternoon",
    image:
      "https://images.unsplash.com/photo-1572947650440-e8a97ef053b2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "spark",
    name: "SPARK Social",
    category: "food",
    neighborhood: "Mission Bay",
    address: "601 Mission Bay Blvd N, San Francisco, CA",
    lat: 37.7706,
    lng: -122.3916,
    rating: 4.4,
    durationMinutes: 70,
    price: "$$",
    tags: ["food", "group", "outdoor", "casual", "date"],
    vibe: ["playful", "social", "sunny", "easygoing"],
    energy: "high",
    bestFor: "a flexible food stop when the plan needs momentum",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "ferry",
    name: "Ferry Building Marketplace",
    category: "shop",
    neighborhood: "Embarcadero",
    address: "1 Ferry Building, San Francisco, CA",
    lat: 37.7955,
    lng: -122.3937,
    rating: 4.6,
    durationMinutes: 55,
    price: "$$",
    tags: ["food", "market", "walk", "date", "view"],
    vibe: ["bright", "classic", "scenic", "browsable"],
    energy: "medium",
    bestFor: "a browsable stop with snacks, water views, and options",
    image:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "sutro",
    name: "Sutro Baths Overlook",
    category: "view",
    neighborhood: "Outer Richmond",
    address: "1004 Point Lobos Ave, San Francisco, CA",
    lat: 37.7804,
    lng: -122.5139,
    rating: 4.8,
    durationMinutes: 40,
    price: "$",
    tags: ["view", "sunset", "romantic", "walk", "inspiring"],
    vibe: ["moody", "cinematic", "reflective", "ocean"],
    energy: "low",
    bestFor: "a memorable final beat near sunset",
    image:
      "https://images.unsplash.com/photo-1518655048521-f130df041f66?auto=format&fit=crop&w=900&q=80",
  },
];
