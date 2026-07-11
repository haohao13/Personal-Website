"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";
import mapboxgl, { ExpressionSpecification, LngLatBounds } from "mapbox-gl";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  ArrowUpDown,
  BusFront,
  CarFront,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  CopyPlus,
  Eye,
  EyeOff,
  GripVertical,
  House,
  Info,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  X,
  Route,
  Save,
  Search,
  Share2,
  Sparkles,
  Utensils,
  Wand2,
} from "lucide-react";
import { getCandidatePlaces, optimizeRoute, RankedPlace } from "@/lib/localflow";
import type { ApiRoutePlan, ExploreResponse } from "@/lib/api-types";

const examples = [
  {
    label: "Rainy Date",
    query: "rainy day date with cozy stops",
  },
  {
    label: "Museum + Cafe",
    query: "small museums and cute cafes",
  },
  {
    label: "Good Eats",
    query: "restaurants worth planning a route around",
  },
  {
    label: "Weekend Reset",
    query: "weekend getaway close by",
  },
  {
    label: "Solo Quiet",
    query: "quiet places to think",
  },
  {
    label: "Scenic Wander",
    query: "beautiful views and places to romanticize life",
  },
  {
    label: "Indie Shops",
    query: "interesting small shops and local makers",
  },
  {
    label: "Tourist Icons",
    query: "classic must-see tourist spots",
  },
  {
    label: "Hidden Gems",
    query: "unexpected hidden gems that feel special",
  },
];

const surpriseQueries = [
  "surprise me with delightful unexpected places and playful hidden gems",
  "weird charming local spots, tiny museums, secret shops, and memorable detours",
  "an offbeat afternoon with places I would not think to search for",
  "unexpected neighborhood gems with character, color, and a little story",
  "small surprising places that make the day feel cinematic and unplanned",
];

const mapBounds = {
  minLat: 37.758,
  maxLat: 37.801,
  minLng: -122.52,
  maxLng: -122.385,
};

const initialExplore: ExploreResponse = {
  ...getCandidatePlaces("small museums and cute cafes"),
  provider: "mock",
  warnings: [],
};

const initialRoute: ApiRoutePlan = {
  ...optimizeRoute(initialExplore.rankedPlaces.filter((place) => ["moma", "jane", "fraenkel"].includes(place.id))),
  routePath: initialExplore.rankedPlaces
    .filter((place) => ["moma", "jane", "fraenkel"].includes(place.id))
    .map((place) => ({ lat: place.lat, lng: place.lng })),
  legs: [],
  provider: "mock",
  warnings: [],
};

const emptyRoute: ApiRoutePlan = {
  orderedPlaces: [],
  estimatedDuration: 0,
  narrative: "",
  routePath: [],
  legs: [],
  provider: "mock",
  warnings: [],
};

type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
};

type TravelMode = "drive" | "walk" | "transit";

function toMapPosition(place: RankedPlace) {
  const x =
    ((place.lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
  const y =
    100 - ((place.lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;

  return {
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(88, Math.max(10, y)),
  };
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) {
    return `${mins} min`;
  }

  return `${hours} hr ${mins ? `${mins} min` : ""}`.trim();
}

function formatCompactDuration(minutes?: number) {
  if (minutes === undefined || Number.isNaN(minutes)) {
    return "--";
  }

  const safeMinutes = Math.max(0, Math.round(minutes));
  const days = Math.floor(safeMinutes / 1440);
  const hours = Math.floor((safeMinutes % 1440) / 60);
  const mins = safeMinutes % 60;

  if (days) {
    return `${days}d${hours ? `${hours}h` : ""}${mins ? `${mins}m` : ""}`;
  }

  if (hours) {
    return `${hours}h${mins ? `${mins}m` : ""}`;
  }

  return `${mins}m`;
}

function parseClockInput(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatClockTime(totalMinutes: number) {
  const normalizedMinutes = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

const tripStartHourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
const tripStartMinuteOptions = ["00", "15", "30", "45"];
const tripStartPeriodOptions = ["AM", "PM"] as const;

function getClockSelectParts(value: string) {
  const totalMinutes = parseClockInput(value);

  if (totalMinutes === null) {
    return { hour: "", minute: "", period: "" };
  }

  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hour: String(hours24 % 12 || 12),
    minute: String(minutes).padStart(2, "0"),
    period: hours24 >= 12 ? "PM" : "AM",
  };
}

function toClockInputFromSelectParts(hour: string, minute: string, period: string) {
  const hour12 = Number(hour);

  if (!hour12 || !minute || !period) {
    return "";
  }

  const hours24 = period === "PM" ? (hour12 % 12) + 12 : hour12 % 12;

  return `${String(hours24).padStart(2, "0")}:${minute}`;
}

function getPlaceImageUrl(place: RankedPlace) {
  if (place.photoName) {
    return `/api/place-photo?name=${encodeURIComponent(place.photoName)}`;
  }

  const params = new URLSearchParams({
    name: place.name,
    address: place.address,
    fallback: place.image,
  });

  return `/api/place-image?${params.toString()}`;
}

function dedupePlacesById<T extends { id: string }>(places: T[]) {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (seen.has(place.id)) {
      return false;
    }

    seen.add(place.id);
    return true;
  });
}

function isHomeStop(placeId: string) {
  return placeId === "home" || placeId === "home-start";
}

function isFinalDestination(placeId: string) {
  return placeId === "final-destination";
}

function isSamePlaceByAddress(a?: RankedPlace | null, b?: RankedPlace | null) {
  if (!a || !b) {
    return false;
  }

  const sameAddress =
    a.address.trim().toLowerCase() === b.address.trim().toLowerCase();
  const sameCoordinates =
    Math.abs(a.lat - b.lat) < 0.0001 && Math.abs(a.lng - b.lng) < 0.0001;

  return sameAddress || sameCoordinates;
}

function isRestaurantCandidate(place: RankedPlace) {
  return (
    place.bestFor === "a food stop close to the selected route" ||
    place.reason.includes("restaurant stop near your current route") ||
    place.reason.includes("restaurant close to the current route")
  );
}

function insertAfterId(ids: string[], afterId: string, newId: string) {
  const index = ids.indexOf(afterId);

  if (index === -1) {
    return [...ids, newId];
  }

  return [...ids.slice(0, index + 1), newId, ...ids.slice(index + 1)];
}

function getLegKey(leg: ApiRoutePlan["legs"][number]) {
  return `${leg.fromId}->${leg.toId}`;
}

function getLegDurationForMode(leg: ApiRoutePlan["legs"][number], mode: TravelMode) {
  if (mode === "walk") {
    return leg.walkingDurationMinutes ?? leg.durationMinutes;
  }

  if (mode === "transit") {
    return leg.transitDurationMinutes ?? leg.durationMinutes;
  }

  return leg.durationMinutes;
}

function getMapTravelModeIconMarkup(mode: TravelMode) {
  if (mode === "walk") {
    return '<svg viewBox="-3 -3 30 30" aria-hidden="true"><circle cx="13" cy="4.5" r="2.1" /><path d="M10.5 9.2 13 7.8l2.6 2.8" /><path d="M12.8 8.2 11.3 14l-3.4 4.8" /><path d="M12 14.2 16 18.8" /><path d="M9.6 10.2 6.4 12" /><path d="M15.4 10.8 18.2 10" /></svg>';
  }

  if (mode === "transit") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M8 21h.01" /><path d="M16 21h.01" /><path d="M4 9h16" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11 7 6h10l2 5" /><path d="M5 11h14v7H5z" /><path d="M7 18v2" /><path d="M17 18v2" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>';
}

function formatDistance(meters: number) {
  const miles = meters / 1609.344;

  if (miles < 0.1) {
    return `${Math.round(meters)} m`;
  }

  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
}

function getRouteProgressColor(index: number, total: number) {
  if (total <= 1) {
    return "#2f8f63";
  }

  const progress = Math.min(1, Math.max(0, index / (total - 1)));

  if (progress <= 0.5) {
    return interpolateHexColor("#2f8f63", "#e3b43f", progress / 0.5);
  }

  return interpolateHexColor("#e3b43f", "#c44d3c", (progress - 0.5) / 0.5);
}

function interpolateHexColor(from: string, to: string, amount: number) {
  const fromValue = Number.parseInt(from.slice(1), 16);
  const toValue = Number.parseInt(to.slice(1), 16);
  const fromRgb = [(fromValue >> 16) & 255, (fromValue >> 8) & 255, fromValue & 255];
  const toRgb = [(toValue >> 16) & 255, (toValue >> 8) & 255, toValue & 255];
  const nextRgb = fromRgb.map((channel, index) =>
    Math.round(channel + (toRgb[index] - channel) * amount),
  );

  return `#${nextRgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function buildClientFallbackLegs(orderedPlaces: RankedPlace[]) {
  return orderedPlaces.slice(0, -1).map((place, index) => {
    const nextPlace = orderedPlaces[index + 1];
    const distanceMeters = estimateDistanceMeters(place, nextPlace);

    return {
      fromId: place.id,
      toId: nextPlace.id,
      distanceMeters,
      durationMinutes: Math.max(4, Math.round((distanceMeters / 1609.344 / 18) * 60 + 5)),
      walkingDurationMinutes: Math.max(3, Math.round((distanceMeters / 1609.344 / 3) * 60)),
      transitDurationMinutes: Math.max(8, Math.round((distanceMeters / 1609.344 / 13) * 60 + 9)),
    };
  });
}

type ExportRouteLeg = {
  distance: string;
  mode: TravelMode;
  duration: string;
  distanceMeters: number;
};

type StaticMapCamera = {
  centerLat: number;
  centerLng: number;
  zoom: number;
};

type ExportRouteStop = {
  place: RankedPlace;
  arrivalTime?: string;
  stayMinutes: number;
  color: string;
};

async function downloadRouteJpeg({
  duration,
  transit,
  stops,
  orderedPlaces,
  routePath,
  legs,
  showLegTimes,
}: {
  duration: string;
  transit: string;
  stops: string;
  orderedPlaces: ExportRouteStop[];
  routePath: Array<{ lat: number; lng: number }>;
  legs: ExportRouteLeg[];
  showLegTimes: boolean;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create export image.");
  }

  ctx.fillStyle = "#f5f2ed";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await drawExportMap(ctx, {
    x: 40,
    y: 40,
    width: 920,
    height: 820,
    orderedPlaces,
    routePath,
    legs,
    showLegTimes,
  });
  drawExportPreview(ctx, {
    x: 1000,
    y: 40,
    width: 560,
    height: 820,
    duration,
    transit,
    stops,
    orderedPlaces,
    legs,
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (nextBlob) {
          resolve(nextBlob);
        } else {
          reject(new Error("Could not export JPG."));
        }
      },
      "image/jpeg",
      0.92,
    );
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `localflow-route-${new Date().toISOString().slice(0, 10)}.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function drawExportMap(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    width,
    height,
    orderedPlaces,
    routePath,
    legs,
    showLegTimes,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    orderedPlaces: ExportRouteStop[];
    routePath: Array<{ lat: number; lng: number }>;
    legs: ExportRouteLeg[];
    showLegTimes: boolean;
  },
) {
  drawRoundedRect(ctx, x, y, width, height, 28, "#eef4ef");
  ctx.save();
  roundedClip(ctx, x, y, width, height, 28);

  const points = routePath.length
    ? routePath
    : orderedPlaces.map(({ place }) => ({ lat: place.lat, lng: place.lng }));

  const staticMap = await loadMapboxStaticMap(points, width, height);
  const project = staticMap
    ? createMercatorProjector(staticMap.camera, x, y, width, height)
    : createRouteProjector(points, x + 70, y + 86, width - 140, height - 156);

  if (staticMap) {
    ctx.drawImage(staticMap.image, x, y, width, height);
  } else {
    drawExportMapFallbackBackground(ctx, x, y, width, height);
  }

  const projectedPath = points.map(project);

  if (projectedPath.length > 1) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let index = 0; index < projectedPath.length - 1; index += 1) {
      const from = projectedPath[index];
      const to = projectedPath[index + 1];
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, getRouteProgressColor(index, projectedPath.length));
      gradient.addColorStop(1, getRouteProgressColor(index + 1, projectedPath.length));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    }
  }

  const routeLabelPoints = splitProjectedPathIntoLegs(projectedPath, Math.max(legs.length, 1));
  legs.forEach((leg, index) => {
    const point = getProjectedPathMidpoint(routeLabelPoints[index] ?? []);

    if (!point) {
      return;
    }

    drawMapPill(
      ctx,
      point.x,
      point.y - 20,
      showLegTimes ? leg.duration : leg.distance,
      showLegTimes ? leg.mode : undefined,
    );
  });

  orderedPlaces.forEach(({ place, color }, index) => {
    const point = project({ lat: place.lat, lng: place.lng });
    ctx.fillStyle = "rgba(32, 33, 29, 0.18)";
    ctx.beginPath();
    ctx.arc(point.x + 2, point.y + 4, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#fffefd";
    ctx.stroke();
    ctx.fillStyle = "#fffefd";
    ctx.font = "700 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1), point.x, point.y + 1);
  });

  ctx.restore();
}

function drawExportMapFallbackBackground(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.fillStyle = "#dff0f7";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#f3f0e8";
  ctx.fillRect(x, y, width * 0.72, height);
  ctx.strokeStyle = "rgba(188, 181, 166, 0.35)";
  ctx.lineWidth = 2;
  for (let offset = -height; offset < width; offset += 58) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y);
    ctx.lineTo(x + offset + height, y + height);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
  ctx.lineWidth = 5;
  for (let offset = 40; offset < height; offset += 82) {
    ctx.beginPath();
    ctx.moveTo(x, y + offset);
    ctx.lineTo(x + width, y + offset - 120);
    ctx.stroke();
  }
}

async function loadMapboxStaticMap(
  points: Array<{ lat: number; lng: number }>,
  width: number,
  height: number,
) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token?.startsWith("pk.") || !points.length) {
    return null;
  }

  const camera = getStaticMapCamera(points, width, height);
  const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${camera.centerLng.toFixed(5)},${camera.centerLat.toFixed(5)},${camera.zoom.toFixed(2)},0/${width}x${height}@2x?access_token=${encodeURIComponent(token)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    if ("createImageBitmap" in window) {
      return { image: await createImageBitmap(blob), camera };
    }

    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    URL.revokeObjectURL(objectUrl);
    return { image, camera };
  } catch {
    return null;
  }
}

function getStaticMapCamera(points: Array<{ lat: number; lng: number }>, width: number, height: number): StaticMapCamera {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const lngSpan = Math.max(0.002, maxLng - minLng) * 1.45;
  const latSpan = Math.max(0.002, maxLat - minLat) * 1.45;
  const zoomLng = Math.log2((360 * width) / (512 * lngSpan));
  const zoomLat = Math.log2((180 * height) / (512 * latSpan));

  return {
    centerLat,
    centerLng,
    zoom: Math.min(16, Math.max(3, Math.min(zoomLng, zoomLat))),
  };
}

function createMercatorProjector(
  camera: StaticMapCamera,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const center = lngLatToWorld(camera.centerLng, camera.centerLat, camera.zoom);

  return (point: { lat: number; lng: number }) => {
    const world = lngLatToWorld(point.lng, point.lat, camera.zoom);

    return {
      x: x + width / 2 + (world.x - center.x),
      y: y + height / 2 + (world.y - center.y),
    };
  };
}

function lngLatToWorld(lng: number, lat: number, zoom: number) {
  const scale = 512 * 2 ** zoom;
  const constrainedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sinLat = Math.sin((constrainedLat * Math.PI) / 180);

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function drawMapPill(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  label: string,
  mode?: TravelMode,
) {
  ctx.font = "700 15px Inter, sans-serif";
  const paddingX = 14;
  const iconWidth = mode ? 22 : 0;
  const width = Math.max(54, ctx.measureText(label).width + paddingX * 2 + iconWidth);
  const height = 34;

  drawRoundedRect(ctx, centerX - width / 2 + 2, centerY - height / 2 + 3, width, height, 17, "rgba(32, 33, 29, 0.12)");
  drawRoundedRect(ctx, centerX - width / 2, centerY - height / 2, width, height, 17, "rgba(255, 254, 253, 0.95)");
  ctx.strokeStyle = "#e4ded3";
  ctx.lineWidth = 1.5;
  strokeRoundedRect(ctx, centerX - width / 2, centerY - height / 2, width, height, 17);
  ctx.fillStyle = "#4b4a43";
  ctx.textBaseline = "middle";
  if (mode) {
    const contentWidth = iconWidth + ctx.measureText(label).width;
    const startX = centerX - contentWidth / 2;
    drawExportTravelModeIcon(ctx, mode, startX - 1, centerY - 11, "#4b4a43", 18);
    ctx.textAlign = "left";
    ctx.fillText(label, startX + iconWidth, centerY + 1);
  } else {
    ctx.textAlign = "center";
    ctx.fillText(label, centerX, centerY + 1);
  }
}

function drawExportPreview(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    width,
    height,
    duration,
    transit,
    stops,
    orderedPlaces,
    legs,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    duration: string;
    transit: string;
    stops: string;
    orderedPlaces: ExportRouteStop[];
    legs: ExportRouteLeg[];
  },
) {
  drawRoundedRect(ctx, x, y, width, height, 28, "#fffefd");
  ctx.strokeStyle = "#e4ded3";
  ctx.lineWidth = 2;
  strokeRoundedRect(ctx, x, y, width, height, 28);

  drawSummaryStrip(ctx, x + 28, y + 28, width - 56, 104, [
    ["Duration", duration],
    ["Transit", transit],
    ["Stops", stops],
  ]);

  const baseCursorY = y + 178;
  const timelineX = x + 50;
  const rowHeights = orderedPlaces.map((_, index) => (legs[index] ? 88 : 56));
  const stopCenters = orderedPlaces.map((_, index) =>
    baseCursorY + rowHeights.slice(0, index).reduce((total, rowHeight) => total + rowHeight, 0) - 7,
  );

  if (stopCenters.length > 1) {
    ctx.strokeStyle = "#d8d1c1";
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(timelineX, stopCenters[0] + 22);
    ctx.lineTo(timelineX, stopCenters[stopCenters.length - 1] - 22);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  orderedPlaces.forEach((stop, index) => {
    const { place, arrivalTime, stayMinutes, color } = stop;
    const cursorY = baseCursorY + rowHeights.slice(0, index).reduce((total, rowHeight) => total + rowHeight, 0);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(timelineX, cursorY - 7, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fffefd";
    ctx.font = "700 17px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1), timelineX, cursorY - 6);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#20211d";
    ctx.font = "700 22px Inter, sans-serif";
    drawWrappedText(ctx, place.name, x + 86, cursorY, width - 210, 26, 1);

    ctx.fillStyle = "#6f6b60";
    ctx.font = "600 15px Inter, sans-serif";
    const meta = [
      arrivalTime,
      !isHomeStop(place.id) ? `${stayMinutes}m` : undefined,
    ].filter(Boolean).join(" · ");
    if (meta) {
      ctx.textAlign = "right";
      ctx.fillText(meta, x + width - 42, cursorY);
    }
    ctx.textAlign = "left";

    const leg = legs[index];
    if (leg) {
      ctx.fillStyle = "#6f6b60";
      ctx.font = "700 17px Inter, sans-serif";
      ctx.fillText(leg.distance, x + 86, cursorY + 44);
      drawExportTravelModeIcon(ctx, leg.mode, x + 170, cursorY + 27, "#20211d", 20);
      ctx.fillStyle = "#20211d";
      ctx.font = "700 17px Inter, sans-serif";
      ctx.fillText(leg.duration, x + 194, cursorY + 44);
    }
  });
}

function drawSummaryStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  metrics: Array<[string, string]>,
) {
  drawRoundedRect(ctx, x, y, width, height, 16, "#fffefd");
  ctx.strokeStyle = "#e4ded3";
  ctx.lineWidth = 2;
  strokeRoundedRect(ctx, x, y, width, height, 16);
  const columnWidth = width / metrics.length;

  metrics.forEach(([label, value], index) => {
    if (index > 0) {
      ctx.strokeStyle = "#e4ded3";
      ctx.beginPath();
      ctx.moveTo(x + columnWidth * index, y + 20);
      ctx.lineTo(x + columnWidth * index, y + height - 20);
      ctx.stroke();
    }

    ctx.fillStyle = "#6f6b60";
    ctx.font = "600 15px Inter, sans-serif";
    ctx.fillText(label, x + columnWidth * index + 24, y + 36);
    ctx.fillStyle = "#20211d";
    ctx.font = "800 25px Inter, sans-serif";
    ctx.fillText(value, x + columnWidth * index + 24, y + 74);
  });
}

function drawExportTravelModeIcon(
  ctx: CanvasRenderingContext2D,
  mode: TravelMode,
  x: number,
  y: number,
  color: string,
  size = 22,
) {
  ctx.save();
  const scale = size / 22;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (mode === "walk") {
    ctx.beginPath();
    ctx.arc(8, 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, 7);
    ctx.lineTo(5, 15);
    ctx.lineTo(2, 22);
    ctx.moveTo(8, 8);
    ctx.lineTo(16, 12);
    ctx.moveTo(5, 15);
    ctx.lineTo(14, 22);
    ctx.stroke();
  } else if (mode === "transit") {
    ctx.strokeRect(2, 2, 18, 18);
    ctx.beginPath();
    ctx.moveTo(2, 8);
    ctx.lineTo(20, 8);
    ctx.moveTo(6, 15);
    ctx.lineTo(6.1, 15);
    ctx.moveTo(16, 15);
    ctx.lineTo(16.1, 15);
    ctx.moveTo(6, 22);
    ctx.lineTo(6.1, 22);
    ctx.moveTo(16, 22);
    ctx.lineTo(16.1, 22);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(3, 11);
    ctx.lineTo(5, 6);
    ctx.lineTo(17, 6);
    ctx.lineTo(20, 11);
    ctx.lineTo(20, 18);
    ctx.lineTo(3, 18);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, 14);
    ctx.lineTo(7.1, 14);
    ctx.moveTo(16, 14);
    ctx.lineTo(16.1, 14);
    ctx.stroke();
  }

  ctx.restore();
}

function createRouteProjector(
  points: Array<{ lat: number; lng: number }>,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(0.002, maxLat - minLat);
  const lngSpan = Math.max(0.002, maxLng - minLng);

  return (point: { lat: number; lng: number }) => ({
    x: x + ((point.lng - minLng) / lngSpan) * width,
    y: y + (1 - (point.lat - minLat) / latSpan) * height,
  });
}

function splitProjectedPathIntoLegs(points: Array<{ x: number; y: number }>, legCount: number) {
  if (!points.length || legCount <= 0) {
    return [];
  }

  if (points.length <= legCount + 1) {
    return Array.from({ length: legCount }, (_, index) =>
      points.slice(index, Math.min(points.length, index + 2)),
    );
  }

  const lastIndex = points.length - 1;

  return Array.from({ length: legCount }, (_, index) => {
    const start = Math.round((lastIndex * index) / legCount);
    const end = Math.round((lastIndex * (index + 1)) / legCount);
    return points.slice(start, Math.max(start + 2, end + 1));
  });
}

function getProjectedPathMidpoint(points: Array<{ x: number; y: number }>) {
  if (!points.length) {
    return null;
  }

  if (points.length === 1) {
    return points[0];
  }

  const lengths = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  const totalLength = lengths.reduce((total, length) => total + length, 0);
  let traveled = 0;

  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index];

    if (traveled + length >= totalLength / 2) {
      const from = points[index];
      const to = points[index + 1];
      const ratio = length ? (totalLength / 2 - traveled) / length : 0;

      return {
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio,
      };
    }

    traveled += length;
  }

  return points[Math.floor(points.length / 2)];
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(" ");
  let line = "";
  let lineCount = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;

    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = word;
      lineCount += 1;

      if (lineCount >= maxLines) {
        return;
      }
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
) {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function roundedClip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.clip();
}

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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

function findShortestOrder(places: RankedPlace[]) {
  if (places.length <= 2) {
    return places;
  }

  if (places.length > 8) {
    return nearestNeighborOrder(places);
  }

  let bestOrder = places;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const order of permutations(places)) {
    const distance = totalRouteDistance(order);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestOrder = order;
    }
  }

  return bestOrder;
}

function nearestNeighborOrder(places: RankedPlace[]) {
  const remaining = [...places];
  const ordered = [remaining.shift() as RankedPlace];

  while (remaining.length) {
    const current = ordered[ordered.length - 1];
    let nextIndex = 0;
    let nextDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((place, index) => {
      const distance = estimateDistanceMeters(current, place);
      if (distance < nextDistance) {
        nextDistance = distance;
        nextIndex = index;
      }
    });

    ordered.push(remaining.splice(nextIndex, 1)[0]);
  }

  return ordered;
}

function totalRouteDistance(places: RankedPlace[]) {
  return places
    .slice(0, -1)
    .reduce((total, place, index) => total + estimateDistanceMeters(place, places[index + 1]), 0);
}

function* permutations<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield items;
    return;
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const rest = [...items.slice(0, index), ...items.slice(index + 1)];

    for (const permutation of permutations(rest)) {
      yield [item, ...permutation];
    }
  }
}

export function LocalFlowApp() {
  const [query, setQuery] = useState("small museums and cute cafes");
  const [location, setLocation] = useState("San Francisco, CA");
  const [homeAddress, setHomeAddress] = useState("");
  const [tripStartTime, setTripStartTime] = useState("");
  const [homePlace, setHomePlace] = useState<RankedPlace | null>(null);
  const [finalDestination, setFinalDestination] = useState<RankedPlace | null>(null);
  const [minRadiusMiles, setMinRadiusMiles] = useState(0);
  const [maxRadiusMiles, setMaxRadiusMiles] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>(["moma", "jane", "fraenkel"]);
  const [placeOverrides, setPlaceOverrides] = useState<Record<string, RankedPlace>>({});
  const [overrideInputs, setOverrideInputs] = useState<Record<string, string>>({});
  const [stopDurationOverrides, setStopDurationOverrides] = useState<Record<string, number>>({});
  const [legTravelModes, setLegTravelModes] = useState<Record<string, TravelMode>>({});
  const [expandedReplaceId, setExpandedReplaceId] = useState<string | null>(null);
  const [expandedAddAfterId, setExpandedAddAfterId] = useState<string | null>(null);
  const [routeReversed, setRouteReversed] = useState(false);
  const [newStopInputs, setNewStopInputs] = useState<Record<string, string>>({});
  const [exploreData, setExploreData] = useState<ExploreResponse>(initialExplore);
  const [routePlan, setRoutePlan] = useState<ApiRoutePlan>(initialRoute);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [resolvingHome, setResolvingHome] = useState(false);
  const [resolvingStopId, setResolvingStopId] = useState<string | null>(null);
  const [restaurantCandidates, setRestaurantCandidates] = useState<RankedPlace[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [foodNearbyCollapsed, setFoodNearbyCollapsed] = useState(false);
  const [showUnselectedMapPlaces, setShowUnselectedMapPlaces] = useState(true);
  const [showMapPlaceNames, setShowMapPlaceNames] = useState(false);
  const [showMapLegTimes, setShowMapLegTimes] = useState(true);
  const [focusRouteOnMap, setFocusRouteOnMap] = useState(false);
  const [showIntentModel, setShowIntentModel] = useState(false);
  const [isRoutePreview, setIsRoutePreview] = useState(false);
  const [keepCurrentRoute, setKeepCurrentRoute] = useState(false);
  const [routeActionMessage, setRouteActionMessage] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchControlsCollapsed, setSearchControlsCollapsed] = useState(false);

  const { parsedIntent, rankedPlaces, warnings } = exploreData;
  const uniqueRankedPlaces = useMemo(() => dedupePlacesById(rankedPlaces), [rankedPlaces]);
  const tripStartTimeParts = useMemo(() => getClockSelectParts(tripStartTime), [tripStartTime]);

  const resetRestaurantSuggestions = useCallback(() => {
    setRestaurantCandidates([]);
    setRestaurantError(null);
  }, []);

  const selectedStops = useMemo(
    () =>
      selectedIds
        .map((id) => placeOverrides[id] ?? uniqueRankedPlaces.find((place) => place.id === id))
        .filter((place): place is RankedPlace => Boolean(place)),
    [placeOverrides, uniqueRankedPlaces, selectedIds],
  );
  const routeInputPlaces = useMemo(
    () => {
      const homeStop = homePlace ? { ...homePlace, id: "home-start", name: "Home" } : null;
      const finalStop = finalDestination
        ? {
            ...finalDestination,
            name: isSamePlaceByAddress(finalDestination, homePlace) ? "Home" : finalDestination.name,
          }
        : null;

      if (!homeStop) {
        return selectedStops;
      }

      return routeReversed
        ? [...(finalStop ? [finalStop] : []), ...selectedStops, homeStop]
        : [homeStop, ...selectedStops, ...(finalStop ? [finalStop] : [])];
    },
    [finalDestination, homePlace, routeReversed, selectedStops],
  );
  const mapPlaces = useMemo(
    () =>
      showUnselectedMapPlaces
        ? dedupePlacesById([
            ...routePlan.orderedPlaces,
            ...restaurantCandidates,
            ...uniqueRankedPlaces.slice(0, 10),
          ])
        : dedupePlacesById([...routePlan.orderedPlaces, ...restaurantCandidates]),
    [restaurantCandidates, routePlan.orderedPlaces, showUnselectedMapPlaces, uniqueRankedPlaces],
  );
  const routeTravelMinutes = useMemo(
    () =>
      routePlan.legs.reduce((total, leg) => {
        const mode = legTravelModes[getLegKey(leg)] ?? "drive";
        return total + getLegDurationForMode(leg, mode);
      }, 0),
    [legTravelModes, routePlan.legs],
  );
  const routeStayMinutes = useMemo(
    () =>
      routePlan.orderedPlaces
        .filter((place) => !isHomeStop(place.id))
        .reduce(
          (total, place) =>
            total + Math.max(0, stopDurationOverrides[place.id] ?? place.durationMinutes),
          0,
        ),
    [routePlan.orderedPlaces, stopDurationOverrides],
  );
  const routeStopCount = routePlan.orderedPlaces.filter((place) => !isHomeStop(place.id)).length;
  const totalItineraryMinutes = routeTravelMinutes + routeStayMinutes;
  const stopArrivalTimes = useMemo(() => {
    const startMinutes = parseClockInput(tripStartTime);

    if (startMinutes === null) {
      return [];
    }

    let elapsedMinutes = 0;

    return routePlan.orderedPlaces.map((place, index) => {
      const arrivalTime = formatClockTime(startMinutes + elapsedMinutes);
      const stayMinutes = isHomeStop(place.id)
        ? 0
        : Math.max(0, stopDurationOverrides[place.id] ?? place.durationMinutes);
      const leg = routePlan.legs[index];
      const selectedMode = leg ? legTravelModes[getLegKey(leg)] ?? "drive" : "drive";

      elapsedMinutes += stayMinutes + (leg ? getLegDurationForMode(leg, selectedMode) : 0);

      return arrivalTime;
    });
  }, [legTravelModes, routePlan.legs, routePlan.orderedPlaces, stopDurationOverrides, tripStartTime]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRoute() {
      setLoadingRoute(true);
      try {
        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ places: routeInputPlaces, optimize: false, lockEndpoints: Boolean(homePlace) }),
          signal: controller.signal,
        });
        const data = (await response.json()) as ApiRoutePlan;
        setRoutePlan(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setRoutePlan({
            ...optimizeRoute(routeInputPlaces),
            routePath: routeInputPlaces.map((place) => ({ lat: place.lat, lng: place.lng })),
            legs: buildClientFallbackLegs(routeInputPlaces),
            provider: "mock",
            warnings: [error instanceof Error ? error.message : "Route request failed."],
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingRoute(false);
        }
      }
    }

    loadRoute();
    return () => controller.abort();
  }, [homePlace, routeInputPlaces]);

  async function runExplore(nextQuery = query) {
    resetRestaurantSuggestions();
    setFocusRouteOnMap(false);
    setLoadingExplore(true);
    if (!keepCurrentRoute) {
      setSelectedIds([]);
      setPlaceOverrides({});
      setRoutePlan(emptyRoute);
    } else {
      setPlaceOverrides((current) => ({
        ...current,
        ...Object.fromEntries(
          routePlan.orderedPlaces
            .filter((place) => !isHomeStop(place.id))
            .map((place) => [place.id, place]),
        ),
      }));
    }
    setOverrideInputs({});
    setExploreData((current) => ({ ...current, rankedPlaces: [], warnings: [] }));
    try {
      const response = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: nextQuery,
          location,
          minRadiusMeters: Math.round(minRadiusMiles * 1609.344),
          radiusMeters: Math.round(maxRadiusMiles * 1609.344),
        }),
      });
      const data = (await response.json()) as ExploreResponse;
      const uniquePlaces = dedupePlacesById(data.rankedPlaces);
      setExploreData({ ...data, rankedPlaces: uniquePlaces });
      if (!keepCurrentRoute) {
        setPlaceOverrides({});
      }
      setOverrideInputs({});
      setRouteReversed(false);
      if (!keepCurrentRoute) {
        setSelectedIds(uniquePlaces.slice(0, 3).map((place) => place.id));
      }
      setSearchControlsCollapsed(true);
    } finally {
      setLoadingExplore(false);
    }
  }

  function randomizeIntent() {
    const nextQuery = surpriseQueries[Math.floor(Math.random() * surpriseQueries.length)];

    setQuery(nextQuery);
  }

  function togglePlace(placeId: string) {
    resetRestaurantSuggestions();
    setSelectedIds((current) =>
      current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId],
    );
  }

  function removeStop(placeId: string) {
    resetRestaurantSuggestions();
    if (isHomeStop(placeId)) {
      return;
    }

    if (isFinalDestination(placeId)) {
      setFinalDestination(null);
      return;
    }

    setSelectedIds((current) => current.filter((id) => id !== placeId));
    setPlaceOverrides((current) => {
      const next = { ...current };
      delete next[placeId];
      return next;
    });
  }

  function moveSelectedPlace(fromIndex: number, toIndex: number) {
    setSelectedIds((current) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function reverseRouteSequence() {
    if (routeInputPlaces.length < 2) {
      return;
    }

    resetRestaurantSuggestions();
    setFocusRouteOnMap(false);
    setRouteReversed((current) => !current);
    setSelectedIds((current) => [...current].reverse());
  }

  function buildRouteSummary() {
    const lines = routePlan.orderedPlaces.flatMap((place, index) => {
      const stayMinutes = Math.max(0, stopDurationOverrides[place.id] ?? place.durationMinutes);
      const stopLine = isHomeStop(place.id)
        ? `${index + 1}. ${place.name}`
        : `${index + 1}. ${place.name} - stay ${stayMinutes} min`;
      const leg = routePlan.legs[index];

      if (!leg) {
        return [stopLine];
      }

      const selectedMode = legTravelModes[getLegKey(leg)] ?? "drive";
      const modeLabel =
        selectedMode === "walk" ? "walk" : selectedMode === "transit" ? "transit" : "drive";
      const legLine = `   ${formatDistance(leg.distanceMeters)} - ${modeLabel} ${formatCompactDuration(getLegDurationForMode(leg, selectedMode))}`;

      return [stopLine, legLine];
    });

    return [`${location} route`, ...lines, routePlan.narrative].join("\n");
  }

  async function saveRoutePlan() {
    setRouteActionMessage("Preparing JPG");

    try {
      const orderedStops = routePlan.orderedPlaces.map((place, index): ExportRouteStop => ({
        place,
        arrivalTime: stopArrivalTimes[index],
        stayMinutes: Math.max(0, stopDurationOverrides[place.id] ?? place.durationMinutes),
        color: getRouteProgressColor(index, routePlan.orderedPlaces.length),
      }));
      const exportLegs = routePlan.legs.map((leg): ExportRouteLeg => {
        const mode = legTravelModes[getLegKey(leg)] ?? "drive";

        return {
          distance: formatDistance(leg.distanceMeters),
          mode,
          duration: formatCompactDuration(getLegDurationForMode(leg, mode)),
          distanceMeters: leg.distanceMeters,
        };
      });

      await downloadRouteJpeg({
        duration: formatDuration(totalItineraryMinutes),
        transit: formatDuration(routeTravelMinutes),
        stops: `${routeStopCount} ${routeStopCount === 1 ? "stop" : "stops"}`,
        orderedPlaces: orderedStops,
        routePath: routePlan.routePath.length
          ? routePlan.routePath
          : routePlan.orderedPlaces.map((place) => ({ lat: place.lat, lng: place.lng })),
        legs: exportLegs,
        showLegTimes: showMapLegTimes,
      });

      setRouteActionMessage("JPG saved");
    } catch (error) {
      setRouteActionMessage(error instanceof Error ? error.message : "Could not save JPG");
    }
  }

  function getGoogleMapsStopValue(place: RankedPlace) {
    const address = place.address?.trim();

    if (address) {
      return address;
    }

    return `${place.lat},${place.lng}`;
  }

  function getGoogleMapsTravelMode() {
    const selectedModes = routePlan.legs.map((leg) => legTravelModes[getLegKey(leg)] ?? "drive");

    if (selectedModes.length && selectedModes.every((mode) => mode === "walk")) {
      return "walking";
    }

    if (selectedModes.length && selectedModes.every((mode) => mode === "transit")) {
      return "transit";
    }

    return "driving";
  }

  function buildGoogleMapsDirectionsUrl() {
    const stops = routePlan.orderedPlaces;

    if (stops.length < 2) {
      return null;
    }

    const params = new URLSearchParams({
      api: "1",
      origin: getGoogleMapsStopValue(stops[0]),
      destination: getGoogleMapsStopValue(stops[stops.length - 1]),
      travelmode: getGoogleMapsTravelMode(),
    });
    const waypoints = stops.slice(1, -1).map(getGoogleMapsStopValue);

    if (waypoints.length) {
      params.set("waypoints", waypoints.join("|"));
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  async function shareRoutePlan() {
    const googleMapsUrl = buildGoogleMapsDirectionsUrl();

    if (!googleMapsUrl) {
      await navigator.clipboard.writeText(buildRouteSummary());
      setRouteActionMessage("Copied");
      return;
    }

    const openedWindow = window.open(googleMapsUrl, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      setRouteActionMessage("Pop-up blocked");
      return;
    }

    setRouteActionMessage("Opened Google Maps");
  }

  async function optimizeShortestItinerary() {
    if (routeInputPlaces.length < 3) {
      return;
    }

    setLoadingRoute(true);
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          places: routeInputPlaces,
          optimize: true,
          lockEndpoints: Boolean(homePlace),
        }),
      });
      const data = (await response.json()) as ApiRoutePlan;
      setFocusRouteOnMap(true);
      setRoutePlan(data);
      setSelectedIds(
        data.orderedPlaces
          .filter((place) => !isHomeStop(place.id) && !isFinalDestination(place.id))
          .map((place) => place.id),
      );
    } catch {
      setFocusRouteOnMap(true);
      setSelectedIds(findShortestOrder(selectedStops).map((place) => place.id));
    } finally {
      setLoadingRoute(false);
    }
  }

  async function findRestaurantsNearRoute() {
    if (routeInputPlaces.length < 2) {
      return;
    }

    setLoadingRestaurants(true);
    setRestaurantError(null);
    setFoodNearbyCollapsed(false);
    try {
      const response = await fetch("/api/route-restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ places: routePlan.orderedPlaces, routePath: routePlan.routePath }),
      });
      const data = (await response.json()) as {
        restaurants?: RankedPlace[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not find restaurants near route.");
      }

      setRestaurantCandidates(data.restaurants ?? []);
    } catch (error) {
      setRestaurantError(error instanceof Error ? error.message : "Could not find restaurants near route.");
      setRestaurantCandidates([]);
    } finally {
      setLoadingRestaurants(false);
    }
  }

  function addRestaurantToRoute(place: RankedPlace) {
    const routeInsertAfterId = getRouteInsertAfterId(place, routePlan);

    setExploreData((current) => ({
      ...current,
      rankedPlaces: dedupePlacesById([
        ...current.rankedPlaces,
        {
          ...place,
          fitScore: place.fitScore ?? 90,
          reason: `${place.name} was added as a restaurant stop near your current route.`,
        },
      ]),
    }));
    setSelectedIds((current) => {
      if (current.includes(place.id)) {
        return current;
      }

      if (!routeInsertAfterId || isHomeStop(routeInsertAfterId)) {
        return [place.id, ...current];
      }

      if (current.includes(routeInsertAfterId)) {
        return insertAfterId(current, routeInsertAfterId, place.id);
      }

      const nextRouteStop = routePlan.orderedPlaces.find((routePlace) =>
        current.includes(routePlace.id) &&
        routePlan.orderedPlaces.findIndex((candidate) => candidate.id === routePlace.id) >
          routePlan.orderedPlaces.findIndex((candidate) => candidate.id === routeInsertAfterId),
      );

      if (nextRouteStop) {
        const nextIndex = current.indexOf(nextRouteStop.id);
        return [...current.slice(0, nextIndex), place.id, ...current.slice(nextIndex)];
      }

      return [...current, place.id];
    });
  }

  async function resolveHomeAddress(suggestion?: PlaceSuggestion, nextAddress = homeAddress) {
    resetRestaurantSuggestions();
    const query = suggestion?.description ?? nextAddress;

    if (!query.trim()) {
      setHomePlace(null);
      return;
    }

    setResolvingHome(true);
    try {
      const place = await resolvePlace(query, "home", suggestion?.placeId);
      const resolvedHome = {
        ...place,
        id: "home",
        name: "Home",
        bestFor: place.address,
        reason: "Home address selected as the route start and end.",
      };
      setHomePlace(resolvedHome);
      setFinalDestination({
        ...resolvedHome,
        id: "final-destination",
        name: "Home",
        bestFor: resolvedHome.address,
        reason: "Defaults to your home address, and can be changed or removed.",
      });
    } finally {
      setResolvingHome(false);
    }
  }

  function useLocationAsHomeAddress() {
    const nextHomeAddress = location.trim();

    if (!nextHomeAddress) {
      return;
    }

    setHomeAddress(nextHomeAddress);
    resolveHomeAddress(undefined, nextHomeAddress);
  }

  async function resolveStopOverride(placeId: string, suggestion?: PlaceSuggestion) {
    resetRestaurantSuggestions();
    const query = suggestion?.description ?? overrideInputs[placeId]?.trim();

    if (!query) {
      return;
    }

    setResolvingStopId(placeId);
    try {
      const place = await resolvePlace(query, placeId, suggestion?.placeId);
      if (placeId === "final-destination") {
        setFinalDestination({
          ...place,
          id: "final-destination",
          name: place.name,
        });
        setExpandedReplaceId(null);
        return;
      }

      setPlaceOverrides((current) => ({
        ...current,
        [placeId]: {
          ...place,
          id: placeId,
        },
      }));
      setExpandedReplaceId(null);
    } finally {
      setResolvingStopId(null);
    }
  }

  async function addCustomStopAfter(afterId: string, suggestion?: PlaceSuggestion) {
    resetRestaurantSuggestions();
    const query = suggestion?.description ?? newStopInputs[afterId]?.trim();

    if (!query) {
      return;
    }

    const stableId = `custom-${Date.now()}`;
    setResolvingStopId(stableId);
    try {
      const place = await resolvePlace(query, stableId, suggestion?.placeId);
      setExploreData((current) => ({
        ...current,
        rankedPlaces: dedupePlacesById([
          ...current.rankedPlaces,
          {
            ...place,
            id: stableId,
            fitScore: place.fitScore ?? 90,
            reason: `${place.name} was added as a custom stop.`,
          },
        ]),
      }));
      if (isFinalDestination(afterId) && finalDestination) {
        const promotedFinalId = `previous-final-${Date.now()}`;
        setPlaceOverrides((current) => ({
          ...current,
          [promotedFinalId]: {
            ...finalDestination,
            id: promotedFinalId,
          },
        }));
        setSelectedIds((current) => [...current, promotedFinalId]);
        setFinalDestination({
          ...place,
          id: "final-destination",
          name: place.name,
          reason: `${place.name} was added as the new final destination.`,
        });
      } else {
        setSelectedIds((current) =>
          isHomeStop(afterId)
            ? [stableId, ...current.filter((id) => id !== stableId)]
            : insertAfterId(current, afterId, stableId),
        );
      }
      setNewStopInputs((current) => ({ ...current, [afterId]: "" }));
      setExpandedAddAfterId(null);
    } finally {
      setResolvingStopId(null);
    }
  }

  async function resolvePlace(query: string, stableId: string, placeId?: string) {
    const response = await fetch("/api/resolve-place", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, location, placeId, stableId }),
    });

    if (!response.ok) {
      throw new Error("Could not resolve place.");
    }

    const data = (await response.json()) as { place: RankedPlace };
    return data.place;
  }

  function updateTripStartTimePart(part: "hour" | "minute" | "period", value: string) {
    const nextParts = {
      hour: tripStartTimeParts.hour || "9",
      minute: tripStartTimeParts.minute || "00",
      period: tripStartTimeParts.period || "AM",
      [part]: value,
    };

    setTripStartTime(
      toClockInputFromSelectParts(nextParts.hour, nextParts.minute, nextParts.period),
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] p-3 text-[#20211d]">
      <section
        className={`grid min-h-screen grid-cols-1 gap-3 lg:h-[calc(100vh-1.5rem)] lg:overflow-hidden ${
          isSidebarCollapsed
            ? "lg:grid-cols-[42px_minmax(0,1fr)]"
            : "lg:grid-cols-[390px_minmax(0,1fr)]"
        }`}
      >
        <aside
          className={`rounded-[22px] border border-[#eeeae2] bg-white/95 p-4 shadow-[0_18px_60px_rgba(32,33,29,0.05)] transition-all sm:p-6 lg:h-full lg:overflow-y-auto ${
            isSidebarCollapsed ? "lg:overflow-hidden lg:p-1" : ""
          }`}
        >
          <div
            className={`flex items-center justify-between gap-4 ${
              isSidebarCollapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
              <div className="grid size-10 place-items-center rounded-lg bg-[#20211d] text-white">
                <Route size={20} />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-normal">LocalFlow</p>
                <p className="text-sm text-[#6f6b60]">Describe your vibe. Build your route.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              className="hidden size-8 place-items-center rounded-full border border-[#ded9cc] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d] lg:grid"
              aria-label={isSidebarCollapsed ? "Expand search panel" : "Collapse search panel"}
              title={isSidebarCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <div className={`mt-8 space-y-4 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
            {searchControlsCollapsed ? (
              <button
                type="button"
                onClick={() => setSearchControlsCollapsed(false)}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e8e3da] bg-white text-sm font-semibold text-[#20211d] shadow-[0_10px_28px_rgba(32,33,29,0.045)] transition hover:-translate-y-0.5 hover:border-[#20211d] hover:shadow-[0_16px_34px_rgba(32,33,29,0.08)]"
                aria-label="Start a new search"
                title="Start a new search"
              >
                <Search size={16} />
                New search
                <ChevronDown size={15} className="transition group-hover:translate-y-0.5" />
              </button>
            ) : (
              <>
            <button
              type="button"
              onClick={() => setSearchControlsCollapsed(true)}
              className="group flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#eee8dc] bg-white/80 text-xs font-semibold text-[#6f6b60] shadow-[0_8px_22px_rgba(32,33,29,0.035)] transition hover:-translate-y-0.5 hover:border-[#20211d] hover:bg-white hover:text-[#20211d]"
              aria-label="Collapse search controls"
              title="Collapse search controls"
            >
              Collapse search
              <ChevronDown size={14} className="rotate-180 transition group-hover:-translate-y-0.5" />
            </button>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4b4a43]">
                <LocateFixed size={16} />
                Location
              </span>
              <LocationAutocompleteInput
                value={location}
                onValueChange={(value) => {
                  setLocation(value);
                  setFocusRouteOnMap(false);
                }}
                location=""
                placeholder="San Francisco, CA"
                inputClassName="h-12 w-full rounded-xl border border-[#e8e3da] bg-white px-4 text-sm outline-none transition focus:border-[#20211d]"
                onSubmit={() => undefined}
                onPick={(suggestion) => {
                  setLocation(suggestion.description);
                  setFocusRouteOnMap(false);
                }}
              />
            </label>

            <label className="block p-1">
              <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-[#4b4a43]">
                <span>Search radius</span>
                <span className="rounded-full bg-[#f1eee8] px-2 py-0.5 text-[11px] text-[#6f6b60]">
                  {minRadiusMiles}-{maxRadiusMiles} mi
                </span>
              </span>
              <RangeSlider
                min={0}
                max={100}
                minValue={minRadiusMiles}
                maxValue={maxRadiusMiles}
                onMinChange={setMinRadiusMiles}
                onMaxChange={setMaxRadiusMiles}
              />
            </label>

            <div className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#20211d]">
                <Sparkles size={13} />
                What vibe are you going for?
              </span>
              <div className="flex h-11 items-center gap-1 rounded-md border border-[#e8e3da] bg-white px-2 focus-within:border-[#20211d]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium outline-none"
                  placeholder="quiet places to think"
                />
                <button
                  type="button"
                  onClick={randomizeIntent}
                  className="grid size-8 shrink-0 place-items-center rounded-md border border-[#e8e3da] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d]"
                  aria-label="Random intent"
                  title="Random intent"
                >
                  <Sparkles size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="grid size-8 shrink-0 place-items-center rounded-md border border-[#e8e3da] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d]"
                  aria-label="Clear intent"
                  title="Clear intent"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {examples.map((example) => (
                <button
                  type="button"
                  key={example.label}
                  onClick={() => {
                    setQuery(example.query);
                  }}
                  className={`h-[30px] min-w-0 overflow-hidden rounded-md border px-1.5 text-center font-medium leading-none tracking-normal transition hover:border-[#20211d] ${
                    query === example.query
                      ? "border-[#20211d] bg-[#20211d] text-white"
                      : "border-[#e8e3da] bg-white text-[#4b4a43]"
                  }`}
                >
                  <span className="block truncate whitespace-nowrap" style={{ fontSize: 11, lineHeight: 1 }}>
                    {example.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <button
                type="button"
                onClick={() => runExplore()}
                disabled={loadingExplore}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#20211d] text-sm font-semibold text-white shadow-[0_14px_32px_rgba(32,33,29,0.18)] transition hover:-translate-y-0.5 hover:bg-[#2a2b26] hover:shadow-[0_18px_38px_rgba(32,33,29,0.22)] disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
              >
                <Search size={17} className="transition group-hover:scale-105" />
                Apply search
              </button>
              <label
                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#e8e3da] bg-white px-3 text-[11px] font-semibold leading-tight text-[#6f6b60] shadow-[0_10px_24px_rgba(32,33,29,0.035)] transition hover:border-[#20211d] hover:text-[#20211d]"
                title="Keep the current route while refreshing nearby places"
              >
                <input
                  type="checkbox"
                  checked={keepCurrentRoute}
                  onChange={(event) => setKeepCurrentRoute(event.target.checked)}
                  className="size-3.5 accent-[#20211d]"
                />
                <span className="w-10">Keep route</span>
              </label>
            </div>
              </>
            )}
          </div>

          {(warnings.length > 0 || routePlan.warnings.length > 0) && (
            <div
              className={`mt-5 rounded-lg border border-[#e4cda4] bg-[#fff8e8] p-3 text-xs leading-5 text-[#7b5a1f] ${
                isSidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              {[...warnings, ...routePlan.warnings].slice(0, 3).join(" ")}
            </div>
          )}

          <div
              className={`mt-5 rounded-xl border border-[#e8e3da] bg-white ${
              isSidebarCollapsed ? "lg:hidden" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setShowIntentModel((current) => !current)}
              className="flex w-full items-center justify-between gap-3 p-3 text-left"
              aria-expanded={showIntentModel}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Compass size={16} className="text-[#4f7c6b]" />
                Intent model
              </span>
              <ChevronDown
                size={17}
                className={`text-[#6f6b60] transition ${showIntentModel ? "rotate-180" : ""}`}
              />
            </button>
            {showIntentModel && (
              <div className="grid gap-3 border-t border-[#eee8dc] p-3 pt-3 text-sm">
                <IntentRow label="Categories" values={parsedIntent.categories} />
                <IntentRow label="Vibe" values={parsedIntent.vibe} />
                <IntentRow
                  label="Avoid"
                  values={parsedIntent.avoid.length ? parsedIntent.avoid : ["none"]}
                />
                <IntentRow label="Mobility" values={[parsedIntent.mobility]} />
              </div>
            )}
          </div>

          <div className={`mt-5 space-y-4 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4b4a43]">
                <House size={16} />
                Home address <span className="text-xs font-normal text-[#8a8476]">(optional)</span>
                <span className="group relative inline-grid size-5 place-items-center">
                  <Info size={13} className="text-[#8a8476]" />
                  <span className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-[#e8e3da] bg-white px-3 py-2 text-xs font-normal leading-5 text-[#4b4a43] shadow-[0_14px_34px_rgba(32,33,29,0.12)] group-hover:block">
                    Copy from location or enter a custom address. It will be added as the route start and final destination.
                  </span>
                </span>
              </span>
              <div className="grid grid-cols-[minmax(0,1fr)_36px_36px] gap-2 rounded-xl border border-[#e8e3da] bg-white p-2 focus-within:border-[#20211d]">
                <LocationAutocompleteInput
                  value={homeAddress}
                  onValueChange={(value) => {
                    setHomeAddress(value);

                    if (!value.trim()) {
                      resetRestaurantSuggestions();
                      setHomePlace(null);
                      setFinalDestination(null);
                    }
                  }}
                  location={location}
                  placeholder="123 Main St, San Francisco"
                  inputClassName="h-9 w-full min-w-0 bg-transparent px-2 text-sm leading-9 outline-none placeholder:text-xs placeholder:leading-9"
                  onSubmit={() => resolveHomeAddress()}
                  onPick={(suggestion) => {
                    setHomeAddress(suggestion.description);
                    resolveHomeAddress(suggestion);
                  }}
                />
                <button
                  type="button"
                  onClick={useLocationAsHomeAddress}
                  disabled={!location.trim() || resolvingHome}
                  className="grid size-9 place-items-center rounded-md border border-[#ded9cc] text-[#6f6b60] transition hover:border-[#20211d] hover:text-[#20211d] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Copy location into home address"
                  title="Copy location into home"
                >
                  <CopyPlus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => resolveHomeAddress()}
                  disabled={resolvingHome}
                  className="grid size-9 place-items-center rounded-md bg-[#20211d] text-white disabled:cursor-wait disabled:opacity-60"
                  aria-label="Set home address"
                  title="Set home address"
                >
                  <Check size={17} />
                </button>
                {homePlace && (
                  <button
                    type="button"
                    onClick={() => {
                      resetRestaurantSuggestions();
                      setHomeAddress("");
                      setHomePlace(null);
                      setFinalDestination(null);
                    }}
                    className="grid size-9 place-items-center rounded-md border border-[#ded9cc] text-[#8a8476]"
                    aria-label="Clear home address"
                    title="Clear home address"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </label>

            <div>
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4b4a43]">
                <Clock3 size={16} />
                Trip start time <span className="text-xs font-normal text-[#8a8476]">(optional)</span>
              </span>
              <div className="grid grid-cols-[minmax(0,1fr)_36px] gap-2 bg-transparent">
                <div className="grid min-w-0 grid-cols-[1fr_1fr_1.1fr] gap-1.5">
                  <TimePartSelect
                    label="Hour"
                    value={tripStartTimeParts.hour}
                    options={tripStartHourOptions}
                    onChange={(value) => updateTripStartTimePart("hour", value)}
                  />
                  <TimePartSelect
                    label="Min"
                    value={tripStartTimeParts.minute}
                    options={tripStartMinuteOptions}
                    onChange={(value) => updateTripStartTimePart("minute", value)}
                  />
                  <TimePartSelect
                    label="AM/PM"
                    value={tripStartTimeParts.period}
                    options={tripStartPeriodOptions}
                    onChange={(value) => updateTripStartTimePart("period", value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTripStartTime("")}
                  disabled={!tripStartTime}
                  className="grid size-9 place-items-center rounded-md border border-[#ded9cc] text-[#8a8476] transition hover:border-[#20211d] hover:text-[#20211d] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Clear trip start time"
                  title="Clear start time"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className={`mt-7 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#4b4a43]">
                <span
                  className={`grid size-3.5 place-items-center rounded-full ${
                    loadingExplore ? "bg-[#f1eee8]" : "bg-[#e5f3ea]"
                  }`}
                >
                  <span
                    className={`block rounded-full ${
                      loadingExplore
                        ? "size-1.5 animate-pulse bg-[#8a8476]"
                        : "size-1.5 bg-[#2f8a63]"
                    }`}
                  />
                </span>
                {loadingExplore
                  ? "Searching and ranking nearby places..."
                  : `${uniqueRankedPlaces.length} nearby places found and ranked`}
              </h2>
            </div>

            <div className="space-y-3">
              {!loadingExplore && uniqueRankedPlaces.slice(0, 8).map((place) => {
                const selected = selectedIds.includes(place.id);

                return (
                  <button
                    type="button"
                    key={place.id}
                    onClick={() => togglePlace(place.id)}
                    className="group w-full rounded-xl border border-[#e8e3da] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#20211d] hover:shadow-sm"
                  >
                    <div className="flex gap-3">
                      <div
                        className="h-20 w-20 shrink-0 rounded-md bg-cover bg-center"
                        style={{ backgroundImage: `url(${getPlaceImageUrl(place)})` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{place.name}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-[#6f6b60]">
                              <MapPin size={13} />
                              {place.neighborhood}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#e7f0ea] px-2 py-1 text-xs font-semibold text-[#2f6b55]">
                            {place.fitScore}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#5d5a51]">
                          {place.reason}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-[#8a6b30]">
                            {place.category} · {place.durationMinutes} min · {place.price}
                          </span>
                          <span
                            className={`grid size-6 place-items-center rounded-full border ${
                              selected
                                ? "border-[#2f6b55] bg-[#2f6b55] text-white"
                                : "border-[#d8d1c1] text-transparent"
                            }`}
                          >
                            <Check size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-h-screen flex-col overflow-hidden rounded-[22px] border border-[#eeeae2] bg-white/95 shadow-[0_18px_60px_rgba(32,33,29,0.05)] lg:h-full lg:min-h-0">
          <div
            className={`grid gap-4 border-b border-[#f0ece5] bg-white/80 p-4 sm:p-6 ${
              isSidebarCollapsed
                ? "sm:grid-cols-[minmax(0,1fr)_430px]"
                : "sm:grid-cols-[minmax(0,1fr)_390px]"
            }`}
          >
            <div className="relative min-w-0">
              <div className="relative inline-block max-w-full pl-20 sm:pl-24">
                <NextImage
                  src="/localflow-daydreamer.png"
                  alt=""
                  aria-hidden="true"
                  width={1024}
                  height={1536}
                  className="pointer-events-none absolute left-0 top-1/2 hidden h-[104px] w-auto -translate-y-1/2 object-contain md:block"
                />
                <div className="min-w-0">
                  <h1 className="mt-1 max-w-full text-3xl font-semibold tracking-normal lg:whitespace-nowrap lg:text-5xl">
                    A good day generator
                  </h1>
                  <p className="mt-2 text-sm text-[#6f6b60]">Turn your mood into a little adventure</p>
                </div>
              </div>
            </div>
            <HeaderSummary
              duration={loadingRoute ? "..." : formatDuration(totalItineraryMinutes)}
              transit={loadingRoute ? "..." : formatDuration(routeTravelMinutes)}
              stops={`${routeStopCount} ${routeStopCount === 1 ? "stop" : "stops"}`}
            />
          </div>

          <div
            className={`grid flex-1 grid-cols-1 gap-4 overflow-y-auto bg-white/70 p-4 sm:p-4 xl:overflow-hidden ${
              isSidebarCollapsed
                ? "xl:grid-cols-[minmax(0,1fr)_430px]"
                : "xl:grid-cols-[minmax(0,1fr)_390px]"
            }`}
          >
            <div className="grid min-h-0 grid-rows-[minmax(360px,1fr)_auto] gap-4">
              <LiveMap
                places={loadingExplore && !keepCurrentRoute ? [] : mapPlaces}
                selectedIds={loadingExplore && !keepCurrentRoute ? [] : selectedIds}
                routePlan={loadingExplore && !keepCurrentRoute ? emptyRoute : routePlan}
                onTogglePlace={togglePlace}
                onAddRestaurant={addRestaurantToRoute}
                showUnselectedPlaces={showUnselectedMapPlaces}
                onToggleUnselectedPlaces={() => setShowUnselectedMapPlaces((current) => !current)}
                showPlaceNames={showMapPlaceNames}
                onTogglePlaceNames={() => setShowMapPlaceNames((current) => !current)}
                showLegTimes={showMapLegTimes}
                onToggleLegLabels={() => setShowMapLegTimes((current) => !current)}
                legTravelModes={legTravelModes}
                focusRoute={focusRouteOnMap}
              />
              <RouteNarrative narrative={routePlan.narrative} />
            </div>

            <div className="min-h-0 overflow-y-auto rounded-[18px] border border-[#eeeae2] bg-white p-4 shadow-[0_12px_40px_rgba(32,33,29,0.035)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRoutePreview((current) => !current)}
                    className={`grid h-8 w-8 place-items-center rounded-md border transition ${
                      isRoutePreview
                        ? "border-[#20211d] bg-[#20211d] text-white"
                        : "border-[#ded9cc] bg-white text-[#4b4a43] hover:border-[#20211d] hover:text-[#20211d]"
                    }`}
                    aria-label={isRoutePreview ? "Exit preview mode" : "Preview route"}
                    title={isRoutePreview ? "Exit preview" : "Preview"}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={saveRoutePlan}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#ded9cc] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d]"
                    aria-label="Save route JPG"
                    title="Save JPG"
                  >
                    <Save size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={shareRoutePlan}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#ded9cc] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d]"
                    aria-label="Open route in Google Maps"
                    title="Open in Google Maps"
                  >
                    <Share2 size={14} />
                  </button>
                  {routeActionMessage && (
                    <span className="self-center text-[11px] font-medium text-[#6f6b60]">
                      {routeActionMessage}
                    </span>
                  )}
                </div>
                {!isRoutePreview && (
                  <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={reverseRouteSequence}
                    disabled={routeInputPlaces.length < 2 || loadingRoute}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#ded9cc] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Reverse route sequence"
                    title="Reverse route sequence"
                  >
                    <ArrowUpDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={findRestaurantsNearRoute}
                    disabled={routeInputPlaces.length < 2 || loadingRestaurants}
                    className="grid h-8 w-8 place-items-center rounded-md border border-[#ded9cc] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Find restaurants near route"
                    title="Find restaurants near route"
                  >
                    <Utensils size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={optimizeShortestItinerary}
                    disabled={routeInputPlaces.length < 3 || loadingRoute}
                    className="flex h-8 items-center gap-1.5 rounded-md bg-[#20211d] px-2.5 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wand2 size={13} />
                    <span style={{ fontSize: 12 }}>Optimize</span>
                  </button>
                </div>
                )}
              </div>

              {!isRoutePreview && (loadingRestaurants || restaurantCandidates.length > 0 || restaurantError) && (
                <div className="mt-3 rounded-lg border border-[#ded9cc] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase text-[#6f6b60]">Food nearby</p>
                    <div className="flex items-center gap-1.5">
                    {loadingRestaurants && <span className="text-xs text-[#8a8476]">searching...</span>}
                      {(restaurantCandidates.length > 0 || restaurantError) && (
                        <>
                          <button
                            type="button"
                            onClick={() => setFoodNearbyCollapsed((current) => !current)}
                            className="grid size-7 place-items-center rounded-md border border-[#ded9cc] text-[#6f6b60] transition hover:border-[#20211d] hover:text-[#20211d]"
                            aria-label={foodNearbyCollapsed ? "Show food nearby list" : "Hide food nearby list"}
                            title={foodNearbyCollapsed ? "Show list" : "Hide list"}
                          >
                            <ChevronDown
                              size={14}
                              className={`transition ${foodNearbyCollapsed ? "" : "rotate-180"}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={resetRestaurantSuggestions}
                            className="grid size-7 place-items-center rounded-md border border-[#ded9cc] text-[#8a8476] transition hover:border-[#b35f3c] hover:text-[#b35f3c]"
                            aria-label="Close food nearby list"
                            title="Close food nearby"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {!foodNearbyCollapsed && restaurantError && (
                    <p className="text-xs leading-5 text-[#8a6b30]">{restaurantError}</p>
                  )}
                  {!foodNearbyCollapsed && <div className="grid gap-2">
                    {restaurantCandidates.map((place) => {
                      const alreadySelected = selectedIds.includes(place.id);

                      return (
                        <div
                          key={place.id}
                          className="grid grid-cols-[40px_minmax(0,1fr)_28px] items-center gap-2 rounded-md border border-[#eee8dc] p-2"
                        >
                          <div
                            className="size-10 rounded bg-cover bg-center"
                            style={{ backgroundImage: `url(${getPlaceImageUrl(place)})` }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{place.name}</p>
                            <p className="truncate text-[10px] text-[#6f6b60]">
                              {place.rating.toFixed(1)} · {place.neighborhood}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addRestaurantToRoute(place)}
                            disabled={alreadySelected}
                            className="grid size-7 place-items-center rounded-md bg-[#20211d] text-white disabled:bg-[#e7f0ea] disabled:text-[#2f6b55]"
                            aria-label={`Add ${place.name} to route`}
                            title={alreadySelected ? "Already in route" : "Add to route"}
                          >
                            {alreadySelected ? <Check size={13} /> : <Plus size={13} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>}
                </div>
              )}

              <div className="relative mt-4">
                <div className="pointer-events-none absolute bottom-2 left-[18px] top-2 border-l border-dashed border-[#bfb6a4]" />
                <div className="relative space-y-3">
                  {routePlan.orderedPlaces.map((place, index) => {
                  const leg = routePlan.legs[index];
                  const homeStop = isHomeStop(place.id);
                  const finalStop = isFinalDestination(place.id);
                  const selectedIndex = selectedIds.indexOf(place.id);
                  const reorderable = !isRoutePreview && !homeStop && !finalStop;
                  const canAddAfterStop = !isRoutePreview;
                  const routeColor = getRouteProgressColor(index, routePlan.orderedPlaces.length);
                  const arrivalTime = stopArrivalTimes[index];

                  return (
                    <div
                      key={place.id}
                      draggable={reorderable}
                      onDragStart={(event) => {
                        if (!reorderable) {
                          event.preventDefault();
                          return;
                        }

                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(selectedIndex));
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!reorderable) {
                          return;
                        }

                        const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                        moveSelectedPlace(fromIndex, selectedIndex);
                      }}
                    >
                      <motion.div
                        layout
                        className={`rounded-lg px-1 py-2 ${
                          isRoutePreview ? "" : "cursor-grab active:cursor-grabbing"
                        }`}
                      >
                        <div className="grid grid-cols-[28px_minmax(0,1fr)_auto_auto_auto] items-start gap-2.5">
                          <div
                            className="z-10 grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: routeColor }}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            {!isRoutePreview && !homeStop && expandedReplaceId === place.id ? (
                              <div className="grid grid-cols-[minmax(0,1fr)_30px] gap-2">
                                <LocationAutocompleteInput
                                  value={overrideInputs[place.id] ?? ""}
                                  onValueChange={(value) =>
                                    setOverrideInputs((current) => ({
                                      ...current,
                                      [place.id]: value,
                                    }))
                                  }
                                  location={location}
                                  onSubmit={() => resolveStopOverride(place.id)}
                                  onPick={(suggestion) => {
                                    setOverrideInputs((current) => ({
                                      ...current,
                                      [place.id]: suggestion.description,
                                    }));
                                    resolveStopOverride(place.id, suggestion);
                                  }}
                                  inputClassName="h-7 w-full min-w-0 rounded-md border border-[#ded9cc] px-2 py-0 text-[10px] leading-none outline-none placeholder:text-[10px] focus:border-[#20211d]"
                                  placeholder={place.name}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => resolveStopOverride(place.id)}
                                  disabled={resolvingStopId === place.id}
                                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[#20211d] text-white disabled:cursor-wait disabled:opacity-60"
                                  aria-label={`Resolve custom location for ${place.name}`}
                                  title="Match location"
                                >
                                  <Search size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <p className="text-sm font-semibold">{place.name}</p>
                                  {arrivalTime && (
                                    <span className="rounded-full bg-[#f1eee8] px-1.5 py-0.5 text-[10px] font-semibold text-[#4b4a43]">
                                      {arrivalTime}
                                    </span>
                                  )}
                                  {isRoutePreview && !homeStop && (
                                    <span className="text-[11px] font-medium text-[#6f6b60]">
                                      {Math.max(0, stopDurationOverrides[place.id] ?? place.durationMinutes)}m
                                    </span>
                                  )}
                                </div>
                                {!isRoutePreview && (
                                  <p className="mt-0.5 text-[11px] leading-4 text-[#6f6b60]">{place.bestFor}</p>
                                )}
                              </>
                            )}
                            {!homeStop && !isRoutePreview && (
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#6f6b60]">
                                <label className="flex items-center gap-1.5">
                                  <Clock3 size={13} className="text-[#8a8476]" />
                                  Stay
                                  <input
                                    type="number"
                                    min={0}
                                    max={480}
                                    value={stopDurationOverrides[place.id] ?? place.durationMinutes}
                                    onChange={(event) =>
                                      setStopDurationOverrides((current) => ({
                                        ...current,
                                        [place.id]: Number(event.target.value) || 0,
                                      }))
                                    }
                                    className="h-5 w-10 rounded border border-[#ded9cc] bg-white px-1 text-center text-[10px] font-semibold text-[#20211d] outline-none focus:border-[#20211d]"
                                  />
                                  min
                                </label>
                                {place.openingHoursText && (
                                  <>
                                    <span className="text-[#8a8476]">•</span>
                                    <span
                                      className={
                                        place.openNow === false ? "text-[#b35f3c]" : "text-[#2f8a63]"
                                      }
                                    >
                                      {place.openingHoursText}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {!isRoutePreview && !homeStop && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedReplaceId((current) => (current === place.id ? null : place.id));
                              }}
                              className="grid size-7 place-items-center rounded-md border border-[#ded9cc] bg-white text-[#4b4a43] transition hover:border-[#20211d] hover:text-[#20211d]"
                              aria-label={`Replace ${place.name}`}
                              title={`Replace ${place.name}`}
                            >
                              <ArrowLeftRight size={13} />
                            </button>
                          )}
                          {!isRoutePreview && !homeStop && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeStop(place.id);
                              }}
                              className="grid size-7 shrink-0 place-items-center rounded-md border border-[#ded9cc] text-[#8a8476] transition hover:border-[#b35f3c] hover:text-[#b35f3c]"
                              aria-label={`Remove ${place.name}`}
                              title={`Remove ${place.name}`}
                            >
                              <X size={16} />
                            </button>
                          )}
                          {!isRoutePreview && reorderable && <GripVertical size={18} className="mt-1 shrink-0 text-[#8a8476]" />}
                        </div>
                      </motion.div>
                      {(leg || canAddAfterStop) && (
                        <div
                          className={`relative ml-[18px] grid min-h-10 gap-2 pl-4 text-xs font-medium text-[#6f6b60] ${
                            isRoutePreview ? "py-1.5" : "py-3"
                          }`}
                        >
                          {canAddAfterStop && expandedAddAfterId !== place.id && (
                            <button
                              type="button"
                              onClick={() => setExpandedAddAfterId(place.id)}
                              className="absolute left-0 top-1/2 z-10 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#d8d1c1] bg-white text-[#6f6b60] shadow-sm transition hover:border-[#20211d] hover:text-[#20211d]"
                              aria-label={`Add custom stop after ${place.name}`}
                              title={`Add stop after ${place.name}`}
                            >
                              <Plus size={15} />
                            </button>
                          )}
                          {leg && (
                            <>
                              {(() => {
                                const selectedMode = legTravelModes[getLegKey(leg)] ?? "drive";
                                const selectedDuration = getLegDurationForMode(leg, selectedMode);

                                return (
                                  <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                                    <div className="flex shrink-0 items-center gap-1.5 pr-0.5">
                                      <Navigation size={14} className="text-[#2f6b55]" />
                                      <span>{formatDistance(leg.distanceMeters)}</span>
                                    </div>
                                    {isRoutePreview ? (
                                      <div className="flex w-fit items-center gap-1.5 text-[#4b4a43]">
                                        {selectedMode === "walk" ? (
                                          <WalkingPersonIcon />
                                        ) : selectedMode === "transit" ? (
                                          <BusFront size={16} strokeWidth={2.4} />
                                        ) : (
                                          <CarFront size={16} strokeWidth={2.4} />
                                        )}
                                        <span>{formatCompactDuration(selectedDuration)}</span>
                                      </div>
                                    ) : (
                                      <div className="flex shrink-0 flex-nowrap items-center gap-2">
                                        <TravelMetric
                                          icon={<CarFront size={18} strokeWidth={2.4} />}
                                          label="Driving time"
                                          value={formatCompactDuration(leg.durationMinutes)}
                                          selected={selectedMode === "drive"}
                                          onClick={() =>
                                            setLegTravelModes((current) => ({
                                              ...current,
                                              [getLegKey(leg)]: "drive",
                                            }))
                                          }
                                        />
                                        <TravelMetric
                                          icon={<WalkingPersonIcon />}
                                          label="Walking time"
                                          value={formatCompactDuration(leg.walkingDurationMinutes)}
                                          selected={selectedMode === "walk"}
                                          onClick={() =>
                                            setLegTravelModes((current) => ({
                                              ...current,
                                              [getLegKey(leg)]: "walk",
                                            }))
                                          }
                                        />
                                        <TravelMetric
                                          icon={<BusFront size={18} strokeWidth={2.4} />}
                                          label="Public transportation time"
                                          value={formatCompactDuration(leg.transitDurationMinutes)}
                                          selected={selectedMode === "transit"}
                                          onClick={() =>
                                            setLegTravelModes((current) => ({
                                              ...current,
                                              [getLegKey(leg)]: "transit",
                                            }))
                                          }
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      )}
                      {!isRoutePreview && canAddAfterStop && expandedAddAfterId === place.id && (
                        <div className="ml-[18px] pb-3 pl-4">
                            <div className="flex gap-2 rounded-lg border border-[#ded9cc] bg-white p-2">
                              <LocationAutocompleteInput
                                value={newStopInputs[place.id] ?? ""}
                                onValueChange={(value) =>
                                  setNewStopInputs((current) => ({
                                    ...current,
                                    [place.id]: value,
                                  }))
                                }
                                location={location}
                                onSubmit={() => addCustomStopAfter(place.id)}
                                onCancel={() => setExpandedAddAfterId(null)}
                                onPick={(suggestion) => {
                                  setNewStopInputs((current) => ({
                                    ...current,
                                    [place.id]: suggestion.description,
                                  }));
                                  addCustomStopAfter(place.id, suggestion);
                                }}
                                inputClassName="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                                placeholder="Add custom location after this stop"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => addCustomStopAfter(place.id)}
                                disabled={!newStopInputs[place.id]?.trim() || Boolean(resolvingStopId)}
                                className="grid size-8 place-items-center rounded-md bg-[#20211d] text-white disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Add custom location"
                                title="Add custom location"
                              >
                                <Search size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandedAddAfterId(null)}
                                className="grid size-8 place-items-center rounded-md border border-[#ded9cc] text-[#8a8476]"
                                aria-label="Cancel adding custom location"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>

            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function LocationAutocompleteInput({
  value,
  onValueChange,
  location,
  placeholder,
  inputClassName,
  autoFocus = false,
  onPick,
  onSubmit,
  onCancel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  location: string;
  placeholder: string;
  inputClassName: string;
  autoFocus?: boolean;
  onPick: (suggestion: PlaceSuggestion) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasTypedForSuggestions, setHasTypedForSuggestions] = useState(false);
  const sessionTokenRef = useRef<string>("");
  const fallbackSessionIndexRef = useRef(0);

  const nextSessionToken = useCallback(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }

    fallbackSessionIndexRef.current += 1;
    return `session-${fallbackSessionIndexRef.current}`;
  }, []);

  useEffect(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = nextSessionToken();
    }
  }, [nextSessionToken]);

  useEffect(() => {
    const query = value.trim();

    if (!hasTypedForSuggestions || query.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch("/api/place-autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: query,
            location,
            sessionToken: sessionTokenRef.current,
          }),
          signal: controller.signal,
        });
        const data = (await response.json()) as { suggestions?: PlaceSuggestion[] };

        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [hasTypedForSuggestions, location, value]);

  function chooseSuggestion(suggestion: PlaceSuggestion) {
    onValueChange(suggestion.description);
    setOpen(false);
    setSuggestions([]);
    setHasTypedForSuggestions(false);
    sessionTokenRef.current = nextSessionToken();
    onPick(suggestion);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          setHasTypedForSuggestions(true);
          if (event.target.value.trim().length < 3) {
            setSuggestions([]);
            setLoadingSuggestions(false);
          }
          setOpen(true);
        }}
        onFocus={() => {
          if (hasTypedForSuggestions) {
            setOpen(true);
          }
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 140)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }

          if (event.key === "Escape") {
            setOpen(false);
            onCancel?.();
          }
        }}
        className={inputClassName}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {open && hasTypedForSuggestions && value.trim().length >= 3 && (suggestions.length > 0 || loadingSuggestions) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-[#ded9cc] bg-white shadow-lg">
          {loadingSuggestions && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-[#8a8476]">Searching...</div>
          )}
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <button
              type="button"
              key={`${suggestion.placeId}-${index}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseSuggestion(suggestion)}
              className="block w-full border-b border-[#f1ede4] px-3 py-2 text-left last:border-b-0 hover:bg-[#f7f5ef]"
            >
              <span className="block truncate text-xs font-semibold text-[#20211d]">
                {suggestion.mainText}
              </span>
              {suggestion.secondaryText && (
                <span className="mt-0.5 block truncate text-[11px] text-[#6f6b60]">
                  {suggestion.secondaryText}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LiveMap({
  places,
  selectedIds,
  routePlan,
  onTogglePlace,
  onAddRestaurant,
  showUnselectedPlaces,
  onToggleUnselectedPlaces,
  showPlaceNames,
  onTogglePlaceNames,
  showLegTimes,
  onToggleLegLabels,
  legTravelModes,
  focusRoute,
}: {
  places: RankedPlace[];
  selectedIds: string[];
  routePlan: ApiRoutePlan;
  onTogglePlace: (placeId: string) => void;
  onAddRestaurant: (place: RankedPlace) => void;
  showUnselectedPlaces: boolean;
  onToggleUnselectedPlaces: () => void;
  showPlaceNames: boolean;
  onTogglePlaceNames: () => void;
  showLegTimes: boolean;
  onToggleLegLabels: () => void;
  legTravelModes: Record<string, TravelMode>;
  focusRoute: boolean;
}) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const legLabels = useRef<mapboxgl.Marker[]>([]);
  const placeNameLabels = useRef<mapboxgl.Marker[]>([]);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const hasValidMapboxToken = Boolean(token?.startsWith("pk."));
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!hasValidMapboxToken || !token || !mapNode.current || map.current) {
      return;
    }

    mapboxgl.accessToken = token;
    map.current = new mapboxgl.Map({
      container: mapNode.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-122.4312, 37.7739],
      zoom: 11.7,
      attributionControl: false,
    });
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.current.on("error", (event) => {
      setMapError(event.error?.message ?? "Mapbox could not load this map.");
    });
    map.current.on("load", () => {
      requestAnimationFrame(() => {
        map.current?.resize();
        setMapReady(true);
      });
      setMapError(null);
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      legLabels.current.forEach((marker) => marker.remove());
      legLabels.current = [];
      placeNameLabels.current.forEach((marker) => marker.remove());
      placeNameLabels.current = [];
      map.current?.remove();
      map.current = null;
      setMapReady(false);
    };
  }, [hasValidMapboxToken, token]);

  useEffect(() => {
    if (!map.current || !mapReady) {
      return;
    }

    map.current.resize();
    markers.current.forEach((marker) => marker.remove());
    legLabels.current.forEach((marker) => marker.remove());
    placeNameLabels.current.forEach((marker) => marker.remove());
    markers.current = buildMarkers({
      map: map.current,
      places,
      selectedIds,
      orderedPlaces: routePlan.orderedPlaces,
      onTogglePlace,
      onAddRestaurant,
    });
    legLabels.current = buildLegLabels({
      map: map.current,
      orderedPlaces: routePlan.orderedPlaces,
      legs: routePlan.legs,
      routePath: routePlan.routePath,
      showLegTimes,
      legTravelModes,
    });
    placeNameLabels.current = showPlaceNames
      ? buildPlaceNameLabels({
          map: map.current,
          places,
          orderedPlaces: routePlan.orderedPlaces,
        })
      : [];

    fitMapToVisibleArea(map.current, routePlan, places, focusRoute);
  }, [
    places,
    selectedIds,
    routePlan,
    showPlaceNames,
    showLegTimes,
    legTravelModes,
    focusRoute,
    onTogglePlace,
    onAddRestaurant,
    mapReady,
  ]);

  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap || !mapReady) {
      return;
    }

    renderRouteLine(currentMap, routePlan.routePath);
  }, [routePlan.routePath, mapReady]);

  if (!hasValidMapboxToken || mapError) {
    return (
      <FallbackMap
        places={places}
        selectedIds={selectedIds}
        routePlan={routePlan}
        onTogglePlace={onTogglePlace}
        onAddRestaurant={onAddRestaurant}
        notice={
          mapError
            ? "Mapbox token could not load the live style"
            : "Add a valid Mapbox token for live map"
        }
        showUnselectedPlaces={showUnselectedPlaces}
        onToggleUnselectedPlaces={onToggleUnselectedPlaces}
        showPlaceNames={showPlaceNames}
        onTogglePlaceNames={onTogglePlaceNames}
        showLegTimes={showLegTimes}
        onToggleLegLabels={onToggleLegLabels}
        legTravelModes={legTravelModes}
      />
    );
  }

  return (
    <div className="relative min-h-0 overflow-hidden rounded-[18px] border border-[#eeeae2] bg-[#f0eadf] shadow-[0_12px_40px_rgba(32,33,29,0.04)]">
      <div ref={mapNode} className="absolute inset-0" />
      <div className="absolute left-5 top-5 z-10 rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/90 px-3 py-2 text-xs font-medium text-[#4b4a43] backdrop-blur">
        {mapReady ? "Mapbox map" : "Loading map"} ·{" "}
        {routePlan.provider === "google" ? "Google route" : "local route"}
      </div>
      <div className="absolute right-5 top-5 z-10 grid gap-2">
        <button
          type="button"
          onClick={onToggleUnselectedPlaces}
          className="grid size-10 place-items-center rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/95 text-[#4b4a43] shadow-sm backdrop-blur transition hover:border-[#20211d] hover:text-[#20211d]"
          aria-label={showUnselectedPlaces ? "Hide unselected places" : "Show unselected places"}
          title={showUnselectedPlaces ? "Hide unselected places" : "Show unselected places"}
        >
          {showUnselectedPlaces ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
        <button
          type="button"
          onClick={onTogglePlaceNames}
          className="grid size-10 place-items-center rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/95 text-xs font-bold text-[#4b4a43] shadow-sm backdrop-blur transition hover:border-[#20211d] hover:text-[#20211d]"
          aria-label={showPlaceNames ? "Hide location names" : "Show location names"}
          title={showPlaceNames ? "Hide location names" : "Show location names"}
        >
          <MapNameToggleIcon hidden={!showPlaceNames} />
        </button>
        <button
          type="button"
          onClick={onToggleLegLabels}
          className="grid size-10 place-items-center rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/95 text-[11px] font-bold text-[#4b4a43] shadow-sm backdrop-blur transition hover:border-[#20211d] hover:text-[#20211d]"
          aria-label={showLegTimes ? "Show leg distances" : "Show leg times"}
          title={showLegTimes ? "Show distances" : "Show times"}
        >
          {showLegTimes ? <Clock3 size={17} /> : "mi"}
        </button>
      </div>
    </div>
  );
}

function fitMapToVisibleArea(
  map: mapboxgl.Map,
  routePlan: ApiRoutePlan,
  places: RankedPlace[],
  focusRoute: boolean,
) {
  const routePoints = routePlan.routePath.length
    ? routePlan.routePath
    : routePlan.orderedPlaces.map((place) => ({ lat: place.lat, lng: place.lng }));
  const visiblePoints = places.map((place) => ({ lat: place.lat, lng: place.lng }));
  const fitPoints = focusRoute ? routePoints : visiblePoints.length ? visiblePoints : routePoints;

  if (!fitPoints.length) {
    return;
  }

  if (fitPoints.length === 1) {
    map.flyTo({
      center: [fitPoints[0].lng, fitPoints[0].lat],
      zoom: 14,
      duration: 700,
    });
    return;
  }

  const bounds = fitPoints.reduce(
    (nextBounds, point) => nextBounds.extend([point.lng, point.lat]),
    new LngLatBounds([fitPoints[0].lng, fitPoints[0].lat], [fitPoints[0].lng, fitPoints[0].lat]),
  );
  map.fitBounds(bounds, { padding: 48, maxZoom: 15.2, duration: 700 });
}

function buildMarkers({
  map,
  places,
  selectedIds,
  orderedPlaces,
  onTogglePlace,
  onAddRestaurant,
}: {
  map: mapboxgl.Map;
  places: RankedPlace[];
  selectedIds: string[];
  orderedPlaces: RankedPlace[];
  onTogglePlace: (placeId: string) => void;
  onAddRestaurant: (place: RankedPlace) => void;
}) {
  const routeOrder = new Map(orderedPlaces.map((place, index) => [place.id, index + 1]));
  const finalRoutePlace = orderedPlaces[orderedPlaces.length - 1];
  const hideFinalMarker =
    orderedPlaces.length > 1 &&
    finalRoutePlace &&
    isSameMapLocation(orderedPlaces[0], finalRoutePlace);

  return places.flatMap((place) => {
    const order = routeOrder.get(place.id);
    const routeIndex = order ? order - 1 : -1;
    const startStop = routeIndex === 0;
    const endStop = routeIndex === orderedPlaces.length - 1;
    const routeColor = order ? getRouteProgressColor(routeIndex, orderedPlaces.length) : undefined;
    const restaurantCandidate = !order && isRestaurantCandidate(place);

    if (endStop && hideFinalMarker) {
      return [];
    }

    const selected = selectedIds.includes(place.id) || Boolean(order);
    const element = document.createElement("button");
    element.type = "button";
    element.className = [
      "map-marker",
      selected ? "map-marker-selected" : "",
      restaurantCandidate ? "map-marker-restaurant" : "",
      startStop ? "map-marker-start" : "",
      endStop ? "map-marker-end" : "",
    ]
      .filter(Boolean)
      .join(" ");
    element.title = place.name;
    element.setAttribute("aria-label", place.name);
    const popup = new mapboxgl.Popup({ offset: 18, closeButton: false, closeOnClick: false }).setText(place.name);
    if (order) {
      element.textContent = String(order);
      element.style.backgroundColor = routeColor ?? "";
      element.style.borderColor = "#ffffff";
      element.style.color = "#ffffff";
    } else if (restaurantCandidate) {
      element.innerHTML =
        '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v20"/><path d="M11 2v8"/><path d="M3 2v8a4 4 0 0 0 8 0"/><path d="M17 2v20"/><path d="M17 2h2a3 3 0 0 1 0 6h-2"/></svg>';
    }
    if (!isHomeStop(place.id)) {
      element.addEventListener("click", () => {
        if (restaurantCandidate) {
          onAddRestaurant(place);
          return;
        }

        onTogglePlace(place.id);
      });
    }
    element.addEventListener("mouseenter", () => popup.addTo(map));
    element.addEventListener("mouseleave", () => popup.remove());

    return [
      new mapboxgl.Marker({ element })
        .setLngLat([place.lng, place.lat])
        .setPopup(popup)
        .addTo(map),
    ];
  });
}

function buildPlaceNameLabels({
  map,
  places,
  orderedPlaces,
}: {
  map: mapboxgl.Map;
  places: RankedPlace[];
  orderedPlaces: RankedPlace[];
}) {
  const finalRoutePlace = orderedPlaces[orderedPlaces.length - 1];
  const hideFinalMarker =
    orderedPlaces.length > 1 &&
    finalRoutePlace &&
    isSameMapLocation(orderedPlaces[0], finalRoutePlace);
  const routeOrder = new Map(orderedPlaces.map((place, index) => [place.id, index + 1]));

  return places.flatMap((place) => {
    const order = routeOrder.get(place.id);

    if (order === orderedPlaces.length && hideFinalMarker) {
      return [];
    }

    const element = document.createElement("div");
    element.className = [
      "map-place-label",
      !order && isRestaurantCandidate(place) ? "map-place-label-restaurant" : "",
    ]
      .filter(Boolean)
      .join(" ");
    element.textContent = place.name;

    return [
      new mapboxgl.Marker({ element, anchor: "bottom", offset: [0, -18] })
        .setLngLat([place.lng, place.lat])
        .addTo(map),
    ];
  });
}

function buildLegLabels({
  map,
  orderedPlaces,
  legs,
  routePath,
  showLegTimes,
  legTravelModes,
}: {
  map: mapboxgl.Map;
  orderedPlaces: RankedPlace[];
  legs: ApiRoutePlan["legs"];
  routePath: ApiRoutePlan["routePath"];
  showLegTimes: boolean;
  legTravelModes: Record<string, TravelMode>;
}) {
  const routeSegments = splitRoutePathByLeg(routePath, orderedPlaces);
  clearLegLabelConnectors(map);

  return legs.flatMap((leg, index) => {
    const from = orderedPlaces[index];
    const to = orderedPlaces[index + 1];
    const element = document.createElement("div");
    element.className = "map-leg-label";
    const mode = legTravelModes[getLegKey(leg)] ?? "drive";
    if (showLegTimes) {
      element.innerHTML = `${getMapTravelModeIconMarkup(mode)}<span>${formatCompactDuration(getLegDurationForMode(leg, mode))}</span>`;
    } else {
      element.textContent = formatDistance(leg.distanceMeters);
    }
    element.style.width = "max-content";
    element.style.maxWidth = "max-content";
    element.style.inlineSize = "max-content";
    const basePoint = routeSegments[index]?.length
      ? getPathMidpoint(routeSegments[index])
      : { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };

    return [
      new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat([basePoint.lng, basePoint.lat])
        .addTo(map),
    ];
  });
}

function clearLegLabelConnectors(map: mapboxgl.Map) {
  const sourceId = "localflow-leg-label-connectors";
  const layerId = "localflow-leg-label-connectors";

  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

function getRouteInsertAfterId(place: RankedPlace, routePlan: ApiRoutePlan) {
  if (routePlan.orderedPlaces.length < 2) {
    return undefined;
  }

  const routeSegments = splitRoutePathByLeg(routePlan.routePath, routePlan.orderedPlaces);
  let closestLegIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < routePlan.orderedPlaces.length - 1; index += 1) {
    const segment = routeSegments[index]?.length
      ? routeSegments[index]
      : [routePlan.orderedPlaces[index], routePlan.orderedPlaces[index + 1]];
    const distance = getMinDistanceToRouteSegment(place, segment);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestLegIndex = index;
    }
  }

  return routePlan.orderedPlaces[closestLegIndex]?.id;
}

function getMinDistanceToRouteSegment(
  place: { lat: number; lng: number },
  segment: Array<{ lat: number; lng: number }>,
) {
  return segment.reduce(
    (nearest, point) => Math.min(nearest, estimatePointDistanceMeters(place, point)),
    Number.POSITIVE_INFINITY,
  );
}

function splitRoutePathByLeg(routePath: ApiRoutePlan["routePath"], orderedPlaces: RankedPlace[]) {
  if (!routePath.length || orderedPlaces.length < 2) {
    return [];
  }

  const segments: Array<ApiRoutePlan["routePath"]> = [];
  let startIndex = 0;

  for (let placeIndex = 1; placeIndex < orderedPlaces.length; placeIndex += 1) {
    const target = orderedPlaces[placeIndex];
    const endIndex = findNearestPathIndex(routePath, target, startIndex);
    segments.push(routePath.slice(startIndex, endIndex + 1));
    startIndex = endIndex;
  }

  return segments;
}

function findNearestPathIndex(
  routePath: ApiRoutePlan["routePath"],
  target: { lat: number; lng: number },
  startIndex: number,
) {
  let nearestIndex = startIndex;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = startIndex; index < routePath.length; index += 1) {
    const distance = estimatePointDistanceMeters(routePath[index], target);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

function getPathMidpoint(path: ApiRoutePlan["routePath"]) {
  if (path.length <= 1) {
    return path[0] ?? { lat: 0, lng: 0 };
  }

  const total = path
    .slice(0, -1)
    .reduce((sum, point, index) => sum + estimatePointDistanceMeters(point, path[index + 1]), 0);
  const midpointDistance = total / 2;
  let traveled = 0;

  for (let index = 0; index < path.length - 1; index += 1) {
    const from = path[index];
    const to = path[index + 1];
    const segmentDistance = estimatePointDistanceMeters(from, to);

    if (traveled + segmentDistance >= midpointDistance) {
      const ratio = segmentDistance ? (midpointDistance - traveled) / segmentDistance : 0;

      return {
        lat: from.lat + (to.lat - from.lat) * ratio,
        lng: from.lng + (to.lng - from.lng) * ratio,
      };
    }

    traveled += segmentDistance;
  }

  return path[path.length - 1];
}

function estimatePointDistanceMeters(
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

  return earthRadius * c;
}

function getFallbackLabelPoints(routePlan: ApiRoutePlan) {
  const routeSegments = splitRoutePathByLeg(routePlan.routePath, routePlan.orderedPlaces);

  return routePlan.legs.map((_, index) => {
    const from = routePlan.orderedPlaces[index];
    const to = routePlan.orderedPlaces[index + 1];
    const basePoint = routeSegments[index]?.length
      ? getPathMidpoint(routeSegments[index])
      : { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };

    return { basePoint, labelPoint: basePoint, needsConnector: false };
  });
}

function renderRouteLine(map: mapboxgl.Map, routePath: Array<{ lat: number; lng: number }>) {
  if (!routePath.length) {
    return;
  }

  const sourceId = "localflow-route";
  const layerId = "localflow-route-line";
  const data = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: routePath.map((point) => [point.lng, point.lat]),
    },
  };

  if (map.getSource(sourceId)) {
    (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(data);
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, "line-gradient", routeLineGradientExpression);
      map.setPaintProperty(layerId, "line-width", 5);
      map.setPaintProperty(layerId, "line-opacity", 0.92);
    }
    return;
  }

  map.addSource(sourceId, { type: "geojson", data, lineMetrics: true });
  map.addLayer({
    id: layerId,
    type: "line",
    source: sourceId,
    paint: {
      "line-gradient": routeLineGradientExpression,
      "line-width": 5,
      "line-opacity": 0.92,
    },
  } as mapboxgl.LineLayer);
}

const routeLineGradientExpression: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["line-progress"],
  0,
  "#2f8f63",
  0.52,
  "#e3b43f",
  1,
  "#c44d3c",
];

function isSameMapLocation(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  return estimatePointDistanceMeters(from, to) < 35;
}

function FallbackMap({
  places,
  selectedIds,
  routePlan,
  onTogglePlace,
  onAddRestaurant,
  notice,
  showUnselectedPlaces,
  onToggleUnselectedPlaces,
  showPlaceNames,
  onTogglePlaceNames,
  showLegTimes,
  onToggleLegLabels,
  legTravelModes,
}: {
  places: RankedPlace[];
  selectedIds: string[];
  routePlan: ApiRoutePlan;
  onTogglePlace: (placeId: string) => void;
  onAddRestaurant: (place: RankedPlace) => void;
  notice?: string;
  showUnselectedPlaces: boolean;
  onToggleUnselectedPlaces: () => void;
  showPlaceNames: boolean;
  onTogglePlaceNames: () => void;
  showLegTimes: boolean;
  onToggleLegLabels: () => void;
  legTravelModes: Record<string, TravelMode>;
}) {
  const finalRoutePlace = routePlan.orderedPlaces[routePlan.orderedPlaces.length - 1];
  const hideFinalMarker =
    routePlan.orderedPlaces.length > 1 &&
    finalRoutePlace &&
    isSameMapLocation(routePlan.orderedPlaces[0], finalRoutePlace);

  return (
    <div className="relative min-h-0 overflow-hidden rounded-[18px] border border-[#eeeae2] bg-[#f0eadf] shadow-[0_12px_40px_rgba(32,33,29,0.04)]">
      <div className="absolute inset-0 map-grid" />
      <div className="absolute left-5 top-5 z-10 rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/90 px-3 py-2 text-xs font-medium text-[#4b4a43] backdrop-blur">
        {notice ?? "Add Mapbox token for live map"}
      </div>
      <div className="absolute right-5 top-5 z-30 grid gap-2">
        <button
          type="button"
          onClick={onToggleUnselectedPlaces}
          className="grid size-10 place-items-center rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/95 text-[#4b4a43] shadow-sm backdrop-blur transition hover:border-[#20211d] hover:text-[#20211d]"
          aria-label={showUnselectedPlaces ? "Hide unselected places" : "Show unselected places"}
          title={showUnselectedPlaces ? "Hide unselected places" : "Show unselected places"}
        >
          {showUnselectedPlaces ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
        <button
          type="button"
          onClick={onTogglePlaceNames}
          className="grid size-10 place-items-center rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/95 text-xs font-bold text-[#4b4a43] shadow-sm backdrop-blur transition hover:border-[#20211d] hover:text-[#20211d]"
          aria-label={showPlaceNames ? "Hide location names" : "Show location names"}
          title={showPlaceNames ? "Hide location names" : "Show location names"}
        >
          <MapNameToggleIcon hidden={!showPlaceNames} />
        </button>
        <button
          type="button"
          onClick={onToggleLegLabels}
          className="grid size-10 place-items-center rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/95 text-[11px] font-bold text-[#4b4a43] shadow-sm backdrop-blur transition hover:border-[#20211d] hover:text-[#20211d]"
          aria-label={showLegTimes ? "Show leg distances" : "Show leg times"}
          title={showLegTimes ? "Show distances" : "Show times"}
        >
          {showLegTimes ? <Clock3 size={17} /> : "mi"}
        </button>
      </div>

      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="fallbackRouteOrderGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#2f8f63" />
            <stop offset="52%" stopColor="#e3b43f" />
            <stop offset="100%" stopColor="#c44d3c" />
          </linearGradient>
        </defs>
        <AnimatePresence>
          {routePlan.orderedPlaces.length > 1 && (
            <motion.polyline
              key={routePlan.orderedPlaces.map((place) => place.id).join("-")}
              points={routePlan.orderedPlaces
                .map((place) => {
                  const pos = toMapPosition(place);
                  return `${pos.x},${pos.y}`;
                })
                .join(" ")}
              pathLength="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
              vectorEffect="non-scaling-stroke"
              fill="none"
              stroke="url(#fallbackRouteOrderGradient)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.4"
            />
          )}
        </AnimatePresence>
      </svg>

      {places.map((place, index) => {
        const pos = toMapPosition(place);
        const order = routePlan.orderedPlaces.findIndex((orderedPlace) => orderedPlace.id === place.id) + 1;
        const routeIndex = order - 1;
        const endStop = routeIndex === routePlan.orderedPlaces.length - 1;
        const routeColor = order ? getRouteProgressColor(routeIndex, routePlan.orderedPlaces.length) : undefined;
        const restaurantCandidate = !order && isRestaurantCandidate(place);

        if (endStop && hideFinalMarker) {
          return null;
        }

        const selected = selectedIds.includes(place.id) || order > 0;

        return (
          <motion.button
            type="button"
            key={place.id}
            onClick={() => {
              if (!isHomeStop(place.id)) {
                if (restaurantCandidate) {
                  onAddRestaurant(place);
                  return;
                }

                onTogglePlace(place.id);
              }
            }}
            className={`group absolute z-20 grid size-11 place-items-center rounded-full border shadow-sm transition ${
              restaurantCandidate
                ? "border-white bg-[#b86b2a] text-white"
                : order || selected
                ? "border-white text-white"
                : "border-white bg-[#fbfaf6] text-[#20211d]"
            }`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              backgroundColor: routeColor ?? (selected ? "#20211d" : undefined),
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.04 }}
            title={place.name}
            aria-label={place.name}
          >
            {order ? (
              <span className="text-sm font-semibold">{order}</span>
            ) : restaurantCandidate ? (
              <Utensils size={17} />
            ) : (
              <MapPin size={18} />
            )}
            <span
              className={`pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold shadow-sm group-hover:block ${
                restaurantCandidate
                  ? "border-[#b86b2a] bg-[#b86b2a]/95 text-white"
                  : "border-[#d8d1c1] bg-[#fbfaf6]/95 text-[#20211d]"
              }`}
            >
              {place.name}
            </span>
          </motion.button>
        );
      })}

      {showPlaceNames &&
        places.map((place) => {
          const pos = toMapPosition(place);
          const order = routePlan.orderedPlaces.findIndex((orderedPlace) => orderedPlace.id === place.id) + 1;
          const routeIndex = order - 1;
          const endStop = routeIndex === routePlan.orderedPlaces.length - 1;
          const restaurantCandidate = !order && isRestaurantCandidate(place);

          if (endStop && hideFinalMarker) {
            return null;
          }

          return (
            <div
              key={`label-${place.id}`}
              className={`pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold shadow-sm ${
                restaurantCandidate
                  ? "border-[#b86b2a] bg-[#b86b2a]/95 text-white"
                  : "border-[#d8d1c1] bg-[#fbfaf6]/95 text-[#20211d]"
              }`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {place.name}
            </div>
          );
        })}

      {routePlan.legs.map((leg, index) => {
        const labelPlacements = getFallbackLabelPoints(routePlan);
        const placement = labelPlacements[index];

        if (!placement) {
          return null;
        }

        const pos = toMapPosition({
          ...routePlan.orderedPlaces[index],
          lat: placement.labelPoint.lat,
          lng: placement.labelPoint.lng,
        });

        return (
          <div key={`${leg.fromId}-${leg.toId}`}>
            <div
              className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-[#d8d1c1] bg-[#fbfaf6]/95 px-2 py-1 text-xs font-semibold text-[#383832] shadow-sm"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {(() => {
                const mode = legTravelModes[getLegKey(leg)] ?? "drive";

                return showLegTimes ? (
                  <>
                    <TravelModeMapIcon mode={mode} />
                    <span>{formatCompactDuration(getLegDurationForMode(leg, mode))}</span>
                  </>
                ) : (
                  formatDistance(leg.distanceMeters)
                );
              })()}
            </div>
          </div>
        );
      })}

    </div>
  );
}

function RouteNarrative({ narrative }: { narrative: string }) {
  return (
    <div className="shrink-0 rounded-[18px] border border-[#eeeae2] bg-white p-4 shadow-[0_12px_40px_rgba(32,33,29,0.035)]">
      <p className="text-xs font-semibold uppercase text-[#6f6b60]">Route narrative</p>
      <p className="mt-2 text-sm leading-6 text-[#383832]">{narrative}</p>
    </div>
  );
}

function IntentRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="grid grid-cols-[86px_1fr] gap-2">
      <span className="text-[#8a8476]">{label}</span>
      <span className="text-[#383832]">{values.join(", ")}</span>
    </div>
  );
}

function RangeSlider({
  min,
  max,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [draggingThumb, setDraggingThumb] = useState<"min" | "max" | null>(null);
  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;
  const tickValues = useMemo(
    () => [25, 50, 75].filter((value) => value > min && value < max),
    [max, min],
  );
  const snapValues = useMemo(() => [min, ...tickValues, max], [max, min, tickValues]);

  const snapRadiusValue = useCallback((value: number) => {
    const snapTarget = snapValues.find((snapValue) => Math.abs(value - snapValue) <= 2);

    return snapTarget ?? value;
  }, [snapValues]);

  const getValueFromClientX = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect) {
      return min;
    }

    const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snapRadiusValue(Math.round(min + percent * (max - min)));
  }, [max, min, snapRadiusValue]);

  const updateValueFromClientX = useCallback((clientX: number, thumb: "min" | "max") => {
    const value = getValueFromClientX(clientX);

    if (thumb === "min") {
      onMinChange(Math.min(value, maxValue - 1));
    } else {
      onMaxChange(Math.max(value, minValue + 1));
    }
  }, [getValueFromClientX, maxValue, minValue, onMaxChange, onMinChange]);

  useEffect(() => {
    if (!draggingThumb) {
      return;
    }

    const thumb = draggingThumb;

    function handlePointerMove(event: PointerEvent) {
      updateValueFromClientX(event.clientX, thumb);
    }

    function handlePointerUp() {
      setDraggingThumb(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingThumb, updateValueFromClientX]);

  function handleTrackPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const value = getValueFromClientX(event.clientX);
    const nearestThumb = Math.abs(value - minValue) <= Math.abs(value - maxValue) ? "min" : "max";

    setDraggingThumb(nearestThumb);
    updateValueFromClientX(event.clientX, nearestThumb);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, thumb: "min" | "max") {
    const delta = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1;

    if (!["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (thumb === "min") {
      onMinChange(Math.min(maxValue - 1, Math.max(min, minValue + delta)));
    } else {
      onMaxChange(Math.max(minValue + 1, Math.min(max, maxValue + delta)));
    }
  }

  return (
    <div className="pt-1">
      <div ref={trackRef} className="relative h-7" onPointerDown={handleTrackPointerDown}>
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#ded9cc]" />
        {tickValues.map((value) => (
          <span
            key={value}
            className="pointer-events-none absolute top-1/2 z-10 h-3 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#bdb6aa]"
            style={{ left: `${((value - min) / (max - min)) * 100}%` }}
          />
        ))}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#2f8a63] to-[#c44f3d]"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
        <button
          type="button"
          role="slider"
          className="absolute top-1/2 z-30 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fbfaf6] bg-[#2f8a63] shadow-[0_6px_14px_rgba(32,33,29,0.22)] outline-none transition focus:ring-2 focus:ring-[#20211d]"
          style={{ left: `${minPercent}%` }}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDraggingThumb("min");
          }}
          onKeyDown={(event) => handleKeyDown(event, "min")}
          aria-label="Minimum radius"
          aria-valuemin={min}
          aria-valuemax={maxValue - 1}
          aria-valuenow={minValue}
        />
        <button
          type="button"
          role="slider"
          className="absolute top-1/2 z-30 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#fbfaf6] bg-[#c44f3d] shadow-[0_6px_14px_rgba(32,33,29,0.22)] outline-none transition focus:ring-2 focus:ring-[#20211d]"
          style={{ left: `${maxPercent}%` }}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDraggingThumb("max");
          }}
          onKeyDown={(event) => handleKeyDown(event, "max")}
          aria-label="Maximum radius"
          aria-valuemin={minValue + 1}
          aria-valuemax={max}
          aria-valuenow={maxValue}
        />
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-[#8a8476]">
        <span className="absolute left-0 top-0">{min} mi</span>
        {tickValues.map((value) => (
          <span
            key={value}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${((value - min) / (max - min)) * 100}%` }}
          >
            {value}
          </span>
        ))}
        <span className="absolute right-0 top-0">{max} mi</span>
      </div>
    </div>
  );
}

function HeaderSummary({
  duration,
  transit,
  stops,
}: {
  duration: string;
  transit: string;
  stops: string;
}) {
  return (
    <div className="grid w-full shrink-0 grid-cols-3 overflow-hidden rounded-xl border border-[#eeeae2] bg-white shadow-[0_10px_30px_rgba(32,33,29,0.035)] sm:w-auto">
      <SummaryMetric icon={<Clock3 size={14} />} label="Duration" value={duration} />
      <SummaryMetric icon={<Navigation size={14} />} label="Transit" value={transit} divided />
      <SummaryMetric icon={<MapPin size={14} />} label="Stops" value={stops} divided />
    </div>
  );
}

function TimePartSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative h-9 min-w-0 rounded-md bg-[#f7f4ee]">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-full w-full cursor-pointer appearance-none rounded-md bg-transparent px-2 pr-6 text-xs font-semibold outline-none ${
          value ? "text-[#20211d]" : "text-[#8a8476]"
        }`}
        aria-label={`Trip start ${label.toLowerCase()}`}
      >
        <option value="" disabled>
          {label}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6f6b60]"
      />
    </div>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  divided = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div className={`min-w-24 px-4 py-3 ${divided ? "border-l border-[#eeeae2]" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-[#6f6b60]">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-base font-semibold text-[#201f1b] sm:text-lg">{value}</p>
    </div>
  );
}

function MapNameToggleIcon({ hidden }: { hidden: boolean }) {
  return (
    <span className="relative grid size-6 place-items-center text-xs font-bold">
      Aa
      {hidden && (
        <span className="absolute h-7 w-0.5 -rotate-45 rounded-full bg-[#4b4a43]" />
      )}
    </span>
  );
}

function TravelModeMapIcon({ mode }: { mode: TravelMode }) {
  if (mode === "walk") {
    return <WalkingPersonIcon />;
  }

  if (mode === "transit") {
    return <BusFront size={15} strokeWidth={2.4} />;
  }

  return <CarFront size={15} strokeWidth={2.4} />;
}

function TravelMetric({
  icon,
  label,
  value,
  selected = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="grid size-5 shrink-0 place-items-center text-current">{icon}</span>
      <span className="font-semibold">{value}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex h-8 min-w-[60px] shrink-0 items-center justify-center gap-1 rounded-md px-1.5 transition ${
          selected
            ? "bg-[#20211d] text-white"
            : "bg-[#f3efe6] text-[#5d5a51] hover:bg-[#e8dfcf]"
        }`}
        title={label}
        aria-label={`${label}: ${value}`}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className="flex h-8 min-w-[60px] shrink-0 items-center justify-center gap-1 rounded-md bg-[#f3efe6] px-1.5 text-[#5d5a51]"
      title={label}
      aria-label={`${label}: ${value}`}
    >
      {content}
    </div>
  );
}

function WalkingPersonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px] overflow-visible"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
      viewBox="-3 -3 30 30"
    >
      <circle cx="13" cy="4.5" r="2.1" />
      <path d="M10.5 9.2 13 7.8l2.6 2.8" />
      <path d="M12.8 8.2 11.3 14l-3.4 4.8" />
      <path d="M12 14.2 16 18.8" />
      <path d="M9.6 10.2 6.4 12" />
      <path d="M15.4 10.8 18.2 10" />
    </svg>
  );
}
