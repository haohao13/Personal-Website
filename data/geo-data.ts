export type HierarchyLevel = 'continent' | 'country' | 'region' | 'city';

export interface GeoLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  level?: HierarchyLevel;
  continent?: string;
  country?: string;
  region?: string;
  continentId?: string;
  countryId?: string;
  regionId?: string;
  countryCode?: string;
  stateCode?: string;
}

export type TravelSelections = Record<HierarchyLevel, string[]>;

export type GeoOptions = Record<HierarchyLevel, GeoLocation[]>;

export function createEmptyGeoOptions(): GeoOptions {
  return {
    continent: [],
    country: [],
    region: [],
    city: [],
  };
}

export function createEmptyTravelSelections(): TravelSelections {
  return {
    continent: [],
    country: [],
    region: [],
    city: [],
  };
}

export function getRandomLocation(options: GeoLocation[]): GeoLocation | null {
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
}
