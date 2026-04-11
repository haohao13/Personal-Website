export type HierarchyLevel = 'continent' | 'country' | 'region' | 'city';

export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  level?: HierarchyLevel;
  continent?: string;
  country?: string;
  region?: string;
}

export interface City extends GeoLocation {}

export interface Region extends GeoLocation {
  cities?: City[];
}

export interface Country extends GeoLocation {
  regions?: Region[];
}

export interface Continent extends GeoLocation {
  countries: Country[];
}

// Helper function to flatten geo data into a searchable array
export function flattenGeoData(geoData: Continent[]): GeoLocation[] {
  const result: GeoLocation[] = [];

  for (const continent of geoData) {
    result.push({ ...continent, level: 'continent' });

    for (const country of continent.countries) {
      result.push({ ...country, level: 'country', continent: continent.name });

      if (country.regions) {
        for (const region of country.regions) {
          result.push({ ...region, level: 'region', continent: continent.name, country: country.name });

          if (region.cities) {
            for (const city of region.cities) {
              result.push({ ...city, level: 'city', continent: continent.name, country: country.name, region: region.name });
            }
          }
        }
      }
    }
  }

  return result;
}

// Get filtered options for each level based on current selections
export function getFilteredOptions(
  geoData: Continent[],
  targetLevel: HierarchyLevel,
  selections: { continent?: string; country?: string; region?: string }
): Record<HierarchyLevel, GeoLocation[]> {
  const levels = ['continent', 'country', 'region', 'city'] as HierarchyLevel[];
  const levelIndex = levels.indexOf(targetLevel);
  const relevantLevels = levels.slice(0, levelIndex + 1);

  const result: Record<HierarchyLevel, GeoLocation[]> = {
    continent: [],
    country: [],
    region: [],
    city: [],
  };

  // Get all continents
  result.continent = geoData.map((c) => ({ ...c, level: 'continent' as const }));

  // Filter countries based on selected continent
  for (const continent of geoData) {
    if (!selections.continent || continent.name === selections.continent) {
      for (const country of continent.countries) {
        result.country.push({ ...country, level: 'country' as const, continent: continent.name });
      }
    }
  }

  // Filter regions based on selected country
  for (const continent of geoData) {
    if (!selections.continent || continent.name === selections.continent) {
      for (const country of continent.countries) {
        if (!selections.country || country.name === selections.country) {
          if (country.regions) {
            for (const region of country.regions) {
              result.region.push({ ...region, level: 'region' as const, continent: continent.name, country: country.name });
            }
          }
        }
      }
    }
  }

  // Filter cities based on selected region
  for (const continent of geoData) {
    if (!selections.continent || continent.name === selections.continent) {
      for (const country of continent.countries) {
        if (!selections.country || country.name === selections.country) {
          if (country.regions) {
            for (const region of country.regions) {
              if (!selections.region || region.name === selections.region) {
                if (region.cities) {
                  for (const city of region.cities) {
                    result.city.push({ ...city, level: 'city' as const, continent: continent.name, country: country.name, region: region.name });
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
}

// Get a random location from filtered options
export function getRandomLocation(options: GeoLocation[]): GeoLocation | null {
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
}

export const GEO_DATA: Continent[] = [
  {
    name: "Asia",
    lat: 34.0479,
    lng: 100.6197,
    zoom: 3,
    countries: [
      {
        name: "Japan",
        lat: 36.2048,
        lng: 138.2529,
        zoom: 5,
        regions: [
          {
            name: "Tokyo",
            lat: 35.6762,
            lng: 139.6503,
            zoom: 10,
            cities: [
              { name: "Shibuya", lat: 35.6595, lng: 139.7004, zoom: 14 },
              { name: "Shinjuku", lat: 35.6895, lng: 139.7006, zoom: 14 },
            ],
          },
          {
            name: "Kyoto",
            lat: 35.0116,
            lng: 135.7681,
            zoom: 11,
            cities: [
              { name: "Gion", lat: 35.0075, lng: 135.7754, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "China",
        lat: 35.8617,
        lng: 104.1954,
        zoom: 4,
        regions: [
          {
            name: "Beijing",
            lat: 39.9042,
            lng: 116.4074,
            zoom: 10,
            cities: [
              { name: "Chaoyang", lat: 39.9288, lng: 116.5663, zoom: 13 },
            ],
          },
          {
            name: "Shanghai",
            lat: 31.2304,
            lng: 121.4737,
            zoom: 10,
            cities: [
              { name: "Pudong", lat: 31.2404, lng: 121.5724, zoom: 13 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Europe",
    lat: 54.5973,
    lng: 15.2551,
    zoom: 3,
    countries: [
      {
        name: "France",
        lat: 46.2276,
        lng: 2.2137,
        zoom: 5,
        regions: [
          {
            name: "Paris",
            lat: 48.8566,
            lng: 2.3522,
            zoom: 11,
            cities: [
              { name: "Marais", lat: 48.8597, lng: 2.3634, zoom: 14 },
              { name: "Montmartre", lat: 48.8867, lng: 2.3431, zoom: 14 },
            ],
          },
          {
            name: "Provence",
            lat: 43.9159,
            lng: 6.6309,
            zoom: 9,
            cities: [
              { name: "Marseille", lat: 43.2965, lng: 5.3698, zoom: 13 },
            ],
          },
        ],
      },
      {
        name: "Italy",
        lat: 41.8719,
        lng: 12.5674,
        zoom: 5,
        regions: [
          {
            name: "Tuscany",
            lat: 43.2717,
            lng: 11.8729,
            zoom: 9,
            cities: [
              { name: "Florence", lat: 43.7696, lng: 11.2558, zoom: 13 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "North America",
    lat: 45.2538,
    lng: -99.4760,
    zoom: 3,
    countries: [
      {
        name: "United States",
        lat: 37.0902,
        lng: -95.7129,
        zoom: 4,
        regions: [
          {
            name: "California",
            lat: 36.1162,
            lng: -119.6816,
            zoom: 6,
            cities: [
              { name: "San Francisco", lat: 37.7749, lng: -122.4194, zoom: 12 },
              { name: "Los Angeles", lat: 34.0522, lng: -118.2437, zoom: 11 },
            ],
          },
          {
            name: "New York",
            lat: 43.2994,
            lng: -74.2179,
            zoom: 7,
            cities: [
              { name: "New York City", lat: 40.7128, lng: -74.0060, zoom: 12 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "South America",
    lat: -8.7832,
    lng: -55.4915,
    zoom: 3,
    countries: [
      {
        name: "Brazil",
        lat: -14.2350,
        lng: -51.9253,
        zoom: 4,
        regions: [
          {
            name: "Rio de Janeiro",
            lat: -22.9068,
            lng: -43.1729,
            zoom: 10,
            cities: [
              { name: "Copacabana", lat: -22.9829, lng: -43.1871, zoom: 13 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Africa",
    lat: -8.6753,
    lng: 34.8888,
    zoom: 3,
    countries: [
      {
        name: "Egypt",
        lat: 26.8206,
        lng: 30.8025,
        zoom: 5,
        regions: [
          {
            name: "Cairo",
            lat: 30.0444,
            lng: 31.2357,
            zoom: 10,
            cities: [
              { name: "Downtown Cairo", lat: 30.0626, lng: 31.2453, zoom: 13 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Oceania",
    lat: -22.7359,
    lng: 140.0188,
    zoom: 3,
    countries: [
      {
        name: "Australia",
        lat: -25.2744,
        lng: 133.7751,
        zoom: 4,
        regions: [
          {
            name: "New South Wales",
            lat: -33.8688,
            lng: 151.2093,
            zoom: 7,
            cities: [
              { name: "Sydney", lat: -33.8688, lng: 151.2093, zoom: 12 },
            ],
          },
        ],
      },
    ],
  },
];
