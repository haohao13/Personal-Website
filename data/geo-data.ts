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

// Get filtered options for each level based on current multi-selections
export function getFilteredOptions(
  geoData: Continent[],
  targetLevel: HierarchyLevel,
  selections: { continent?: string[]; country?: string[]; region?: string[] }
): Record<HierarchyLevel, GeoLocation[]> {
  const result: Record<HierarchyLevel, GeoLocation[]> = {
    continent: [],
    country: [],
    region: [],
    city: [],
  };

  const continentSel = selections.continent ?? [];
  const countrySel = selections.country ?? [];
  const regionSel = selections.region ?? [];

  // All continents always available
  result.continent = geoData.map((c) => ({ ...c, level: 'continent' as const }));

  for (const continent of geoData) {
    const contMatch = continentSel.length === 0 || continentSel.includes(continent.name);
    if (!contMatch) continue;

    for (const country of continent.countries) {
      result.country.push({ ...country, level: 'country' as const, continent: continent.name });

      const countryMatch = countrySel.length === 0 || countrySel.includes(country.name);
      if (!countryMatch) continue;

      if (country.regions) {
        for (const region of country.regions) {
          result.region.push({ ...region, level: 'region' as const, continent: continent.name, country: country.name });

          const regionMatch = regionSel.length === 0 || regionSel.includes(region.name);
          if (!regionMatch) continue;

          if (region.cities) {
            for (const city of region.cities) {
              result.city.push({ ...city, level: 'city' as const, continent: continent.name, country: country.name, region: region.name });
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
      {
        name: "Spain",
        lat: 40.4637,
        lng: -3.7492,
        zoom: 5,
        regions: [
          {
            name: "Catalonia",
            lat: 41.5978,
            lng: 1.8711,
            zoom: 8,
            cities: [
              { name: "Barcelona", lat: 41.3851, lng: 2.1734, zoom: 12 },
            ],
          },
          {
            name: "Andalusia",
            lat: 37.3891,
            lng: -4.5598,
            zoom: 8,
            cities: [
              { name: "Granada", lat: 37.1769, lng: -3.5979, zoom: 12 },
            ],
          },
        ],
      },
      {
        name: "Germany",
        lat: 51.1657,
        lng: 10.4515,
        zoom: 5,
        regions: [
          {
            name: "Berlin",
            lat: 52.5200,
            lng: 13.4050,
            zoom: 11,
            cities: [
              { name: "Mitte", lat: 52.5200, lng: 13.4050, zoom: 13 },
            ],
          },
          {
            name: "Bavaria",
            lat: 48.7758,
            lng: 11.4312,
            zoom: 8,
            cities: [
              { name: "Munich", lat: 48.1351, lng: 11.5820, zoom: 12 },
            ],
          },
        ],
      },
      {
        name: "United Kingdom",
        lat: 55.3781,
        lng: -3.4360,
        zoom: 5,
        regions: [
          {
            name: "England",
            lat: 52.3555,
            lng: -1.1743,
            zoom: 7,
            cities: [
              { name: "London", lat: 51.5074, lng: -0.1278, zoom: 12 },
            ],
          },
          {
            name: "Scotland",
            lat: 56.4907,
            lng: -4.2026,
            zoom: 7,
            cities: [
              { name: "Edinburgh", lat: 55.9533, lng: -3.1883, zoom: 12 },
            ],
          },
        ],
      },
      {
        name: "Netherlands",
        lat: 52.1326,
        lng: 5.2913,
        zoom: 6,
        regions: [
          {
            name: "Amsterdam",
            lat: 52.3676,
            lng: 4.9041,
            zoom: 12,
            cities: [
              { name: "Dam Square", lat: 52.3728, lng: 4.8936, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "Greece",
        lat: 39.0742,
        lng: 21.8243,
        zoom: 5,
        regions: [
          {
            name: "Attica",
            lat: 37.9838,
            lng: 23.7275,
            zoom: 9,
            cities: [
              { name: "Athens", lat: 37.9838, lng: 23.7275, zoom: 12 },
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
      {
        name: "Canada",
        lat: 56.1304,
        lng: -106.3468,
        zoom: 4,
        regions: [
          {
            name: "Ontario",
            lat: 51.2538,
            lng: -85.3232,
            zoom: 6,
            cities: [
              { name: "Toronto", lat: 43.6532, lng: -79.3832, zoom: 12 },
            ],
          },
          {
            name: "British Columbia",
            lat: 53.7267,
            lng: -127.6476,
            zoom: 6,
            cities: [
              { name: "Vancouver", lat: 49.2827, lng: -123.1207, zoom: 12 },
            ],
          },
        ],
      },
      {
        name: "Mexico",
        lat: 23.6345,
        lng: -102.5528,
        zoom: 5,
        regions: [
          {
            name: "Mexico City",
            lat: 19.4326,
            lng: -99.1332,
            zoom: 11,
            cities: [
              { name: "Centro Histórico", lat: 19.4326, lng: -99.1332, zoom: 14 },
            ],
          },
          {
            name: "Yucatán",
            lat: 20.7099,
            lng: -89.0943,
            zoom: 9,
            cities: [
              { name: "Mérida", lat: 20.9674, lng: -89.5926, zoom: 12 },
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
      {
        name: "Argentina",
        lat: -38.4161,
        lng: -63.6167,
        zoom: 4,
        regions: [
          {
            name: "Buenos Aires",
            lat: -34.6118,
            lng: -58.3965,
            zoom: 11,
            cities: [
              { name: "La Boca", lat: -34.6345, lng: -58.3631, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "Chile",
        lat: -35.6751,
        lng: -71.5430,
        zoom: 4,
        regions: [
          {
            name: "Santiago",
            lat: -33.4489,
            lng: -70.6693,
            zoom: 11,
            cities: [
              { name: "Bellavista", lat: -33.4314, lng: -70.6323, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "Colombia",
        lat: 4.5709,
        lng: -74.2973,
        zoom: 5,
        regions: [
          {
            name: "Bogotá",
            lat: 4.7110,
            lng: -74.0721,
            zoom: 12,
            cities: [
              { name: "La Candelaria", lat: 4.5964, lng: -74.0721, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "Peru",
        lat: -9.1900,
        lng: -75.0152,
        zoom: 5,
        regions: [
          {
            name: "Cusco",
            lat: -13.5319,
            lng: -71.9675,
            zoom: 11,
            cities: [
              { name: "Sacsayhuamán", lat: -13.5097, lng: -71.9797, zoom: 14 },
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
      {
        name: "Morocco",
        lat: 31.7917,
        lng: -7.0926,
        zoom: 5,
        regions: [
          {
            name: "Marrakech",
            lat: 31.6295,
            lng: -7.9811,
            zoom: 11,
            cities: [
              { name: "Jemaa el-Fnaa", lat: 31.6258, lng: -7.9894, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "South Africa",
        lat: -30.5595,
        lng: 22.9375,
        zoom: 5,
        regions: [
          {
            name: "Cape Town",
            lat: -33.9249,
            lng: 18.4241,
            zoom: 11,
            cities: [
              { name: "Table Mountain", lat: -33.9628, lng: 18.4098, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "Kenya",
        lat: -0.0236,
        lng: 37.9062,
        zoom: 5,
        regions: [
          {
            name: "Nairobi",
            lat: -1.2921,
            lng: 36.8219,
            zoom: 11,
            cities: [
              { name: "Westlands", lat: -1.2630, lng: 36.8065, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "Ghana",
        lat: 7.9465,
        lng: -1.0232,
        zoom: 6,
        regions: [
          {
            name: "Accra",
            lat: 5.6037,
            lng: -0.1870,
            zoom: 11,
            cities: [
              { name: "Osu", lat: 5.5580, lng: -0.1830, zoom: 14 },
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
      {
        name: "New Zealand",
        lat: -40.9006,
        lng: 174.8860,
        zoom: 5,
        regions: [
          {
            name: "Auckland",
            lat: -36.8485,
            lng: 174.7633,
            zoom: 11,
            cities: [
              { name: "Sky Tower", lat: -36.8485, lng: 174.7633, zoom: 14 },
            ],
          },
        ],
      },
      {
        name: "Fiji",
        lat: -17.7134,
        lng: 178.0650,
        zoom: 7,
        regions: [
          {
            name: "Suva",
            lat: -18.1416,
            lng: 178.4419,
            zoom: 12,
            cities: [
              { name: "Suva CBD", lat: -18.1416, lng: 178.4419, zoom: 14 },
            ],
          },
        ],
      },
    ],
  },
];
