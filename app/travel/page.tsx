'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { GEO_DATA, getFilteredOptions, getRandomLocation, type GeoLocation, type HierarchyLevel } from '@/data/geo-data';
import { Sparkles, Home, MapPin, ChevronRight } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="h-[420px] bg-neutral-100 rounded-2xl animate-pulse" />,
});

const LEVELS: HierarchyLevel[] = ['continent', 'country', 'region', 'city'];

const LEVEL_LABELS: Record<HierarchyLevel, string> = {
  continent: 'Continent',
  country: 'Country',
  region: 'Province / State',
  city: 'City',
};

export default function TravelPage() {
  const [targetLevel, setTargetLevel] = useState<HierarchyLevel>('country');
  const [selectedFilters, setSelectedFilters] = useState<Record<HierarchyLevel, string[]>>({
    continent: [],
    country: [],
    region: [],
    city: [],
  });
  const [randomDestination, setRandomDestination] = useState<GeoLocation | null>(null);

  const levelIndex = LEVELS.indexOf(targetLevel);
  const relevantLevels = LEVELS.slice(0, levelIndex + 1);

  // Narrowed-down options for each filter column
  const availableOptions = useMemo(
    () =>
      getFilteredOptions(GEO_DATA, targetLevel, {
        continent: selectedFilters.continent,
        country: selectedFilters.country,
        region: selectedFilters.region,
      }),
    [targetLevel, selectedFilters]
  );

  // Collect locations matching the current filter state at the target level
  const getAvailableLocations = (): GeoLocation[] => {
    const result: GeoLocation[] = [];
    const { continent: contSel, country: countSel, region: regSel } = selectedFilters;

    for (const cont of GEO_DATA) {
      if (contSel.length > 0 && !contSel.includes(cont.name)) continue;

      for (const coun of cont.countries) {
        if (countSel.length > 0 && !countSel.includes(coun.name)) continue;

        if (levelIndex === 0) {
          // target = continent — already pushed below, skip duplicates
        } else if (levelIndex === 1) {
          result.push({ ...coun, level: 'country', continent: cont.name });
        } else if (coun.regions) {
          for (const reg of coun.regions) {
            if (regSel.length > 0 && !regSel.includes(reg.name)) continue;

            if (levelIndex === 2) {
              result.push({ ...reg, level: 'region', continent: cont.name, country: coun.name });
            } else if (reg.cities && levelIndex === 3) {
              for (const cit of reg.cities) {
                result.push({ ...cit, level: 'city', continent: cont.name, country: coun.name, region: reg.name });
              }
            }
          }
        }
      }

      // continent-level target
      if (levelIndex === 0) {
        result.push({ ...cont, level: 'continent' });
      }
    }

    return result;
  };

  const handleGenerateRandom = () => {
    const available = getAvailableLocations();
    const random = getRandomLocation(available);
    if (random) setRandomDestination(random);
  };

  const handleFilterToggle = (level: HierarchyLevel, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[level];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      const newFilters = { ...prev, [level]: updated };

      // Reset downstream filters
      if (level === 'continent') {
        newFilters.country = [];
        newFilters.region = [];
        newFilters.city = [];
      } else if (level === 'country') {
        newFilters.region = [];
        newFilters.city = [];
      } else if (level === 'region') {
        newFilters.city = [];
      }

      return newFilters;
    });
    setRandomDestination(null);
  };

  const handleTargetLevelChange = (level: HierarchyLevel) => {
    setTargetLevel(level);
    setSelectedFilters({ continent: [], country: [], region: [], city: [] });
    setRandomDestination(null);
  };

  const breadcrumb = randomDestination
    ? [
        randomDestination.continent,
        randomDestination.country,
        randomDestination.region,
        randomDestination.level === 'city' ? randomDestination.name : undefined,
      ].filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#f4f1ea]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-neutral-200/70 sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-800">
            Hao About Travel
          </h1>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">

        {/* Target level selector */}
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-3 uppercase tracking-wider">
            I want to discover a random
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => handleTargetLevelChange(level)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  targetLevel === level
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-3 uppercase tracking-wider">
            Narrow it down (leave empty to include all)
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${relevantLevels.length}, minmax(0, 1fr))` }}>
            {relevantLevels.map((level, i) => {
              const options = availableOptions[level];
              const selected = selectedFilters[level];
              const isDisabled = i > 0 && availableOptions[LEVELS[i - 1]].length === 0;

              return (
                <div key={level} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      {LEVEL_LABELS[level]}
                    </span>
                    {selected.length > 0 && (
                      <span className="text-xs bg-neutral-900 text-white rounded-full px-2 py-0.5">
                        {selected.length}
                      </span>
                    )}
                  </div>
                  <div className="max-h-44 overflow-y-auto p-2">
                    {options.length === 0 ? (
                      <p className="text-xs text-neutral-400 px-3 py-2">No options available</p>
                    ) : (
                      options.map((option) => {
                        const isSelected = selected.includes(option.name);
                        return (
                          <button
                            key={option.name}
                            onClick={() => !isDisabled && handleFilterToggle(level, option.name)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                              isSelected
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-white border-white' : 'border-neutral-300'
                            }`}>
                              {isSelected && (
                                <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                                  <path d="M1 4l3 3 5-6" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            {option.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleGenerateRandom}
            className="group flex items-center gap-3 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            Generate Random Destination
          </button>
        </div>

        {/* Result */}
        {randomDestination && (
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
            <div className="px-8 py-7 border-b border-neutral-100">
              {/* Breadcrumb path */}
              {breadcrumb.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-3 flex-wrap">
                  {breadcrumb.map((part, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
                      <span>{part}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 leading-tight">
                    {randomDestination.name}
                  </h2>
                  <p className="text-sm text-neutral-400 mt-1">
                    {randomDestination.lat.toFixed(4)}°, {randomDestination.lng.toFixed(4)}°
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <MapComponent
                center={{ lat: randomDestination.lat, lng: randomDestination.lng, zoom: randomDestination.zoom }}
                locations={[randomDestination]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
