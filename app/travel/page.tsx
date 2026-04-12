'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { GEO_DATA, getFilteredOptions, getRandomLocation, type GeoLocation, type HierarchyLevel } from '@/data/geo-data';
import { Sparkles, Home } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />,
});

export default function TravelPage() {
  const [targetLevel, setTargetLevel] = useState<HierarchyLevel>('country');
  const [selectedFilters, setSelectedFilters] = useState<Record<HierarchyLevel, string[]>>({
    continent: [],
    country: [],
    region: [],
    city: [],
  });
  const [randomDestination, setRandomDestination] = useState<GeoLocation | null>(null);

  const levels: HierarchyLevel[] = ['continent', 'country', 'region', 'city'];
  const levelIndex = levels.indexOf(targetLevel);
  const relevantLevels = levels.slice(0, levelIndex + 1);

  // Get filtered options
  const filteredOptions = useMemo(
    () => getFilteredOptions(GEO_DATA, targetLevel, {
      continent: selectedFilters.continent.length > 0 ? selectedFilters.continent[0] : '',
      country: selectedFilters.country.length > 0 ? selectedFilters.country[0] : '',
      region: selectedFilters.region.length > 0 ? selectedFilters.region[0] : '',
    }),
    [targetLevel, selectedFilters]
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

  // Get all locations matching current selections (for randomization)
  const getAvailableLocations = (): GeoLocation[] => {
    const result: GeoLocation[] = [];

    for (const cont of GEO_DATA) {
      // Check if continent is selected (if any continents selected, must match)
      if (selectedFilters.continent.length > 0 && !selectedFilters.continent.includes(cont.name)) continue;

      for (const coun of cont.countries) {
        // Check if country is selected (if any countries selected, must match)
        if (selectedFilters.country.length > 0 && !selectedFilters.country.includes(coun.name)) continue;

        if (levelIndex === 1) {
          // Target is country
          result.push({ ...coun, level: 'country', continent: cont.name });
        } else if (coun.regions) {
          for (const reg of coun.regions) {
            // Check if region is selected (if any regions selected, must match)
            if (selectedFilters.region.length > 0 && !selectedFilters.region.includes(reg.name)) continue;

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

  const handleFilterToggle = (level: HierarchyLevel, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[level];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      const newFilters = { ...prev, [level]: updated };

      // Reset dependent filters when parent changes
      if (level === 'continent') {
        newFilters.country = [];
        newFilters.region = [];
      } else if (level === 'country') {
        newFilters.region = [];
      }

      return newFilters;
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

  const getCurrentSelectionText = (): string => {
    const parts: string[] = [];
    if (selectedFilters.continent.length > 0) {
      parts.push(`${selectedFilters.continent.length} continent${selectedFilters.continent.length > 1 ? 's' : ''}`);
    }
    if (selectedFilters.country.length > 0) {
      parts.push(`${selectedFilters.country.length} countr${selectedFilters.country.length > 1 ? 'ies' : 'y'}`);
    }
    if (selectedFilters.region.length > 0) {
      parts.push(`${selectedFilters.region.length} region${selectedFilters.region.length > 1 ? 's' : ''}`);
    }
    return parts.join(', ') || 'All locations';
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea]">
      {/* Header with Home Button */}
      <div className="bg-white/80 backdrop-blur border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Hao About Travel</h1>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <p className="text-lg text-neutral-600">
            Pick your exploration level, then select multiple filters to discover a random destination.
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
                  setSelectedFilters({ continent: [], country: [], region: [], city: [] });
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

        {/* Step 2: Multi-select Filters */}
        <div className="mb-8 bg-white/80 backdrop-blur rounded-2xl p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-4">
            Refine your selection (multi-select):
          </label>
          <div className="flex flex-wrap gap-4">
            {relevantLevels.map((level) => (
              <div key={level} className="flex-1 min-w-48">
                <label className="text-xs font-medium text-neutral-600 mb-2 block">
                  {getDisplayName(level)}
                </label>
                <div className="max-h-40 overflow-y-auto border border-neutral-200 rounded-lg p-2 bg-white">
                  {availableOptions[level].map((option) => {
                    const isSelected = selectedFilters[level].includes(option.name);
                    return (
                      <button
                        key={option.name}
                        onClick={() => handleFilterToggle(level, option.name)}
                        className={`w-full text-left px-3 py-1 mb-1 rounded text-sm transition ${
                          isSelected
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="mb-8 bg-white/80 backdrop-blur rounded-2xl p-6">
          <p className="text-sm text-neutral-700">
            <span className="font-medium">Current selection:</span> {getCurrentSelectionText()}
          </p>
        </div>

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
            <div className="grid grid-cols-2 gap-4 text-sm text-neutral-700 mb-6">
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

            {/* Map below destination */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-neutral-200">
              <MapComponent center={{ lat: randomDestination.lat, lng: randomDestination.lng, zoom: randomDestination.zoom }} locations={[randomDestination]} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}