import 'server-only';

import { City, Country, State } from 'country-state-city';
import type { ICity } from 'country-state-city';
import worldCountries from 'world-countries';

import {
  createEmptyGeoOptions,
  getRandomLocation,
  type GeoLocation,
  type GeoOptions,
  type HierarchyLevel,
  type TravelSelections,
} from '@/data/geo-data';

type WorldCountry = {
  cca2: string;
  latlng?: [number, number];
  region?: string;
  subregion?: string;
};

const CONTINENT_ORDER = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
  'Antarctica',
] as const;

const worldCountryByIso = new Map(
  (worldCountries as WorldCountry[]).map((country) => [country.cca2, country])
);

function normalizeContinent(region?: string, subregion?: string) {
  if (region === 'Americas') {
    return subregion === 'South America' ? 'South America' : 'North America';
  }

  if (region === 'Antarctic') {
    return 'Antarctica';
  }

  return region;
}

function parseCoordinate(value: string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function averageCoordinates(locations: Array<{ lat: number; lng: number }>) {
  if (locations.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const totals = locations.reduce(
    (acc, location) => ({
      lat: acc.lat + location.lat,
      lng: acc.lng + location.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: totals.lat / locations.length,
    lng: totals.lng / locations.length,
  };
}

function sortByName<T extends GeoLocation>(locations: T[]) {
  return locations.sort((a, b) => a.name.localeCompare(b.name));
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function buildContinentId(name: string) {
  return `continent:${name}`;
}

function buildCountryId(countryCode: string) {
  return `country:${countryCode}`;
}

function buildRegionId(countryCode: string, stateCode: string) {
  return `region:${countryCode}:${stateCode}`;
}

function buildCityId(city: ICity) {
  return `city:${city.countryCode}:${city.stateCode || '_'}:${city.name}:${city.latitude || ''}:${city.longitude || ''}`;
}

const countryRecords = sortByName(
  Country.getAllCountries()
    .map((country) => {
      const worldCountry = worldCountryByIso.get(country.isoCode);
      const continent = normalizeContinent(worldCountry?.region, worldCountry?.subregion);

      if (!continent) {
        return null;
      }

      const fallbackLat = worldCountry?.latlng?.[0] ?? 0;
      const fallbackLng = worldCountry?.latlng?.[1] ?? 0;
      const countryId = buildCountryId(country.isoCode);
      const continentId = buildContinentId(continent);

      return {
        id: countryId,
        name: country.name,
        lat: parseCoordinate(country.latitude, fallbackLat),
        lng: parseCoordinate(country.longitude, fallbackLng),
        zoom: 5,
        level: 'country' as const,
        continent,
        continentId,
        country: country.name,
        countryId,
        countryCode: country.isoCode,
      } satisfies GeoLocation;
    })
    .filter(isDefined)
);

const countryByCode = new Map(countryRecords.map((country) => [country.countryCode!, country]));

const regionRecords = sortByName(
  State.getAllStates()
    .map((state) => {
      const country = countryByCode.get(state.countryCode);

      if (!country) {
        return null;
      }

      const regionId = buildRegionId(state.countryCode, state.isoCode);

      return {
        id: regionId,
        name: state.name,
        lat: parseCoordinate(state.latitude, country.lat),
        lng: parseCoordinate(state.longitude, country.lng),
        zoom: 7,
        level: 'region' as const,
        continent: country.continent,
        continentId: country.continentId,
        country: country.name,
        countryId: country.id,
        region: state.name,
        regionId,
        countryCode: state.countryCode,
        stateCode: state.isoCode,
      } satisfies GeoLocation;
    })
    .filter(isDefined)
);

const regionByKey = new Map(
  regionRecords.map((region) => [`${region.countryCode}:${region.stateCode}`, region])
);

const cityRecords = sortByName(
  City.getAllCities()
    .map((city) => {
      const country = countryByCode.get(city.countryCode);

      if (!country) {
        return null;
      }

      const region = city.stateCode
        ? regionByKey.get(`${city.countryCode}:${city.stateCode}`)
        : undefined;

      const lat = parseCoordinate(city.latitude, region?.lat ?? country.lat);
      const lng = parseCoordinate(city.longitude, region?.lng ?? country.lng);

      return {
        id: buildCityId(city),
        name: city.name,
        lat,
        lng,
        zoom: 10,
        level: 'city' as const,
        continent: country.continent,
        continentId: country.continentId,
        country: country.name,
        countryId: country.id,
        region: region?.name,
        regionId: region?.id,
        countryCode: city.countryCode,
        stateCode: city.stateCode,
      } satisfies GeoLocation;
    })
    .filter(isDefined)
);

const continentRecords = CONTINENT_ORDER.map((continent) => {
  const countries = countryRecords.filter((country) => country.continent === continent);
  const center = averageCoordinates(countries);

  return {
    id: buildContinentId(continent),
    name: continent,
    lat: center.lat,
    lng: center.lng,
    zoom: continent === 'Antarctica' ? 4 : 3,
    level: 'continent' as const,
    continent,
    continentId: buildContinentId(continent),
  };
}).filter((continent) => continent.name !== 'Antarctica' || continent.lat !== 0 || continent.lng !== 0);

function includesSelection(values: string[], current?: string) {
  return values.length === 0 || (current !== undefined && values.includes(current));
}

function matchesParentSelections(location: GeoLocation, selections: TravelSelections) {
  return (
    includesSelection(selections.continent, location.continentId) &&
    includesSelection(selections.country, location.countryId) &&
    includesSelection(selections.region, location.regionId)
  );
}

function hasRequiredParentSelection(level: HierarchyLevel, selections: TravelSelections) {
  if (level === 'continent') return true;
  if (level === 'country') return selections.continent.length > 0;
  if (level === 'region') return selections.country.length > 0;
  return selections.region.length > 0;
}

export function getTravelOptions(targetLevel: HierarchyLevel, selections: TravelSelections): GeoOptions {
  const options = createEmptyGeoOptions();

  options.continent = continentRecords;
  if (hasRequiredParentSelection('country', selections)) {
    options.country = countryRecords.filter((country) =>
      includesSelection(selections.continent, country.continentId)
    );
  }

  if ((targetLevel === 'region' || targetLevel === 'city') && hasRequiredParentSelection('region', selections)) {
    options.region = regionRecords.filter((region) => matchesParentSelections(region, selections));
  }

  if (targetLevel === 'city' && hasRequiredParentSelection('city', selections)) {
    options.city = cityRecords.filter((city) => matchesParentSelections(city, selections));
  }

  return options;
}

export function getRandomTravelLocation(targetLevel: HierarchyLevel, selections: TravelSelections) {
  switch (targetLevel) {
    case 'continent':
      return getRandomLocation(
        continentRecords.filter((continent) =>
          includesSelection(selections.continent, continent.id)
        )
      );
    case 'country':
      return getRandomLocation(
        countryRecords.filter((country) => {
          return (
            includesSelection(selections.continent, country.continentId) &&
            includesSelection(selections.country, country.id)
          );
        })
      );
    case 'region':
      return getRandomLocation(
        regionRecords.filter((region) => {
          return (
            includesSelection(selections.continent, region.continentId) &&
            includesSelection(selections.country, region.countryId) &&
            includesSelection(selections.region, region.id)
          );
        })
      );
    case 'city':
      return getRandomLocation(
        cityRecords.filter((city) => {
          return (
            includesSelection(selections.continent, city.continentId) &&
            includesSelection(selections.country, city.countryId) &&
            includesSelection(selections.region, city.regionId) &&
            includesSelection(selections.city, city.id)
          );
        })
      );
  }
}
