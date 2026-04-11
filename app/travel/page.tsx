'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { GEO_DATA, getFilteredOptions, getRandomLocation, type GeoLocation, type HierarchyLevel } from '@/data/geo-data';
import { Sparkles, ChevronDown } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />,
});

export default function TravelPage() {
  const [targetLevel, setTargetLevel] = useState<HierarchyLevel>('country');
  const [selections, setSelections] = useState({ continent: '', country: '', region: '' });
  const [randomDestination, setRandomDestination] = useState<GeoLocation | null>(null);

  const levels: HierarchyLevel[] = ['continent', 'country', 'region', 'city'];
  const levelIndex = levels.indexOf(targetLevel);
  const relevantLevels = levels.slice(0, levelIndex + 1);

  // Get filtered options
  const filteredOptions = useMemo(
    () => getFilteredOptions(GEO_DATA, targetLevel, selections),
    [targetLevel, selections]
  );

  // Get available options for each relevant level
  const availableOptions = useMemo(() => {
    const options: Record<HierarchyLevel, GeoLocation[]> = {
      continent: [],
      country: [],
      region: [],
      city: [],
    };

    relevantLevels.forEach((level) => {
      options[level] = filteredOptions[level];
    });

    return options;
  }, [filteredOptions, relevantLevels]);

  // Get selected items for each level (all items in that level are selected by default)
  const getSelectedForLevel = (level: HierarchyLevel): GeoLocation[] => {
    const key = level as keyof typeof selections;
    if (!selections[key]) {
      return availableOptions[level];
    }
    return availableOptions[level].filter((item) => item.name === selections[key]);
  };

  // Get all locations matching current selections (for randomization)
  const getAvailableLocations = (): GeoLocation[] => {
    const levelKey = levels[levelIndex] as keyof typeof selections;
    let continent = selections.continent;
    let country = selections.country;
    let region = selections.region;

    const result: GeoLocation[] = [];

    for (const cont of GEO_DATA) {
      if (continent && cont.name !== continent) continue;

      for (const coun of cont.countries) {
        if (country && coun.name !== country) continue;

        if (levelIndex === 1) {
          // Target is country
          result.push({ ...coun, level: 'country', continent: cont.name });
        } else if (coun.regions) {
          for (const reg of coun.regions) {
            if (region && reg.name !== region) continue;

            if (levelIndex === 2) {
              // Target is region
              result.push({ ...reg, level: 'region', continent: cont.name, country: coun.name });
            } else if (reg.cities && levelIndex === 3) {
              // Target is city
              for (const cit of reg.cities) {
                result.push({ ...cit, level: 'city', continent: cont.name, country: coun.name, region: reg.name });
              }
            }
          }
        }
      }
    }

    return result;
  };

  const handleGenerateRandom = () => {
    const available = getAvailableLocations();
    const random = getRandomLocation(available);
    if (random) {
      setRandomDestination(random);
    }
  };

  const handleSelectionChange = (level: HierarchyLevel, value: string) => {
    setSelections((prev) => {
      const updated = { ...prev };
      (updated as any)[level] = value === 'all' ? '' : value;

      // Reset dependent selections
      if (level === 'continent') {
        updated.country = '';
        updated.region = '';
      } else if (level === 'country') {
        updated.region = '';
      }

      return updated;
    });
    setRandomDestination(null);
  };

  const getDisplayName = (level: HierarchyLevel): string => {
    const names: Record<HierarchyLevel, string> = {
      continent: 'Continent',
      country: 'Country',
      region: 'Region',
      city: 'City',
    };
    return names[level];
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#f4f1ea]">
      {/* Map - Bottom Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <MapComponent
          center={randomDestination ? { lat: randomDestination.lat, lng: randomDestination.lng, zoom: randomDestination.zoom } : { lat: 20, lng: 0, zoom: 2 }}
          locations={randomDestination ? [randomDestination] : []}
        />
      </div>

      {/* Content - Top Layer */}
      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 bg-white/80 backdrop-blur rounded-2xl p-8">
            <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">Hao About Travel</h1>
            <p className="mt-4 text-lg text-neutral-600">
              Pick your exploration level, then select filters to discover a random destination.
            </p>
          </div>

          {/* Step 1: Select Target Level */}
          <div className="mb-8 bg-white/80 backdrop-blur rounded-2xl p-6">
            <label className="block text-sm font-medium text-neutral-700 mb-4">
              What level do you want to explore?
            </label>
            <div className="flex flex-wrap gap-3">
              {['continent', 'country', 'region', 'city'].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setTargetLevel(level as HierarchyLevel);
                    setSelections({ continent: '', country: '', region: '' });
                    setRandomDestination(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    targetLevel === level
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Filters */}
          <div className="mb-8 bg-white/80 backdrop-blur rounded-2xl p-6">
            <label className="block text-sm font-medium text-neutral-700 mb-4">
              Refine your selection:
            </label>
            <div className="flex flex-wrap gap-4">
              {relevantLevels.map((level) => (
                <div key={level} className="flex-1 min-w-48">
                  <label className="text-xs font-medium text-neutral-600 mb-2 block">
                    {getDisplayName(level)}
                  </label>
                  <select
                    value={(selections as any)[level] || 'all'}
                    onChange={(e) => handleSelectionChange(level, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All {getDisplayName(level).toLowerCase()}s</option>
                    {availableOptions[level].map((option) => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Current Selection Display */}
          {(selections.continent || selections.country || selections.region) && (
            <div className="mb-8 bg-white/80 backdrop-blur rounded-2xl p-6">
              <p className="text-sm text-neutral-700">
                <span className="font-medium">Current selection:</span>
                {' '}
                {[selections.continent, selections.country, selections.region].filter(Boolean).join(' → ')}
              </p>
            </div>
          )}

          {/* Generate Button */}
          <div className="mb-8 flex justify-center">
            <button
              onClick={handleGenerateRandom}
              className="flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition transform hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-5 w-5" />
              Generate Random Destination
            </button>
          </div>

          {/* Destination Result */}
          {randomDestination && (
            <div className="mb-8 bg-white/80 backdrop-blur rounded-2xl p-8 border-2 border-blue-500">
              <h2 className="text-3xl font-bold text-neutral-800 mb-4">
                {randomDestination.name}
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm text-neutral-700">
                <div>
                  <p className="font-medium text-neutral-600">Coordinates</p>
                  <p>{randomDestination.lat.toFixed(4)}°N, {randomDestination.lng.toFixed(4)}°E</p>
                </div>
                <div>
                  <p className="font-medium text-neutral-600">Zoom Level</p>
                  <p>×{randomDestination.zoom}</p>
                </div>
                {randomDestination.continent && (
                  <div>
                    <p className="font-medium text-neutral-600">Continent</p>
                    <p>{randomDestination.continent}</p>
                  </div>
                )}
                {randomDestination.country && (
                  <div>
                    <p className="font-medium text-neutral-600">Country</p>
                    <p>{randomDestination.country}</p>
                  </div>
                )}
                {randomDestination.region && (
                  <div>
                    <p className="font-medium text-neutral-600">Region</p>
                    <p>{randomDestination.region}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
