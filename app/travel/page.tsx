'use client';

import React, { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  createEmptyGeoOptions,
  createEmptyTravelSelections,
  type GeoLocation,
  type GeoOptions,
  type HierarchyLevel,
  type TravelSelections,
} from '@/data/geo-data';
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

function buildTravelQuery(targetLevel: HierarchyLevel, selections: TravelSelections, mode: 'options' | 'random') {
  const params = new URLSearchParams({
    mode,
    targetLevel,
  });

  for (const level of LEVELS) {
    for (const value of selections[level]) {
      params.append(level, value);
    }
  }

  return params.toString();
}

function getEmptyMessage(level: HierarchyLevel, isLoading: boolean, selections: TravelSelections) {
  if (level === 'country' && selections.continent.length === 0) {
    return 'Select a continent to load countries';
  }

  if (level === 'region' && selections.country.length === 0) {
    return 'Select a country to load provinces / states';
  }

  if (level === 'city' && selections.region.length === 0) {
    return 'Select a province / state to load cities';
  }

  if (isLoading) {
    return 'Loading options...';
  }

  return 'No options available';
}

function hasParentSelection(level: HierarchyLevel, selections: TravelSelections) {
  if (level === 'continent') return true;
  if (level === 'country') return selections.continent.length > 0;
  if (level === 'region') return selections.country.length > 0;
  return selections.region.length > 0;
}

function createEmptySearchTerms(): Record<HierarchyLevel, string> {
  return {
    continent: '',
    country: '',
    region: '',
    city: '',
  };
}

export default function TravelPage() {
  const [targetLevel, setTargetLevel] = useState<HierarchyLevel>('country');
  const [selectedFilters, setSelectedFilters] = useState<TravelSelections>(createEmptyTravelSelections);
  const [availableOptions, setAvailableOptions] = useState<GeoOptions>(createEmptyGeoOptions);
  const [searchTerms, setSearchTerms] = useState<Record<HierarchyLevel, string>>(createEmptySearchTerms);
  const [randomDestination, setRandomDestination] = useState<GeoLocation | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const deferredSearchTerms = useDeferredValue(searchTerms);

  const levelIndex = LEVELS.indexOf(targetLevel);
  const relevantLevels = LEVELS.slice(0, levelIndex + 1);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOptions() {
      setIsLoadingOptions(true);

      try {
        const response = await fetch(`/api/travel?${buildTravelQuery(targetLevel, selectedFilters, 'options')}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to load travel options');
        }

        const data = (await response.json()) as { options: GeoOptions };
        setAvailableOptions(data.options);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error(error);
          setAvailableOptions(createEmptyGeoOptions());
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadOptions();

    return () => controller.abort();
  }, [selectedFilters, targetLevel]);

  const handleGenerateRandom = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/travel?${buildTravelQuery(targetLevel, selectedFilters, 'random')}`);

      if (!response.ok) {
        throw new Error('Failed to generate destination');
      }

      const data = (await response.json()) as { destination: GeoLocation | null };
      setRandomDestination(data.destination);
    } catch (error) {
      console.error(error);
      setRandomDestination(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFilterToggle = (level: HierarchyLevel, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[level];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      const newFilters = { ...prev, [level]: updated };

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

    setSearchTerms((prev) => {
      const next = { ...prev };

      if (level === 'continent') {
        next.country = '';
        next.region = '';
        next.city = '';
      } else if (level === 'country') {
        next.region = '';
        next.city = '';
      } else if (level === 'region') {
        next.city = '';
      }

      return next;
    });

    setRandomDestination(null);
  };

  const handleTargetLevelChange = (level: HierarchyLevel) => {
    setTargetLevel(level);
    setSelectedFilters(createEmptyTravelSelections());
    setSearchTerms(createEmptySearchTerms());
    setRandomDestination(null);
  };

  const handleSearchChange = (level: HierarchyLevel, value: string) => {
    setSearchTerms((prev) => ({
      ...prev,
      [level]: value,
    }));
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

        <div>
          <p className="text-sm font-medium text-neutral-500 mb-3 uppercase tracking-wider">
            Narrow it down (leave empty to include all)
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${relevantLevels.length}, minmax(0, 1fr))` }}>
            {relevantLevels.map((level, i) => {
              const options = availableOptions[level];
              const searchTerm = deferredSearchTerms[level].trim().toLowerCase();
              const filteredOptions = searchTerm
                ? options.filter((option) => option.name.toLowerCase().includes(searchTerm))
                : options;
              const selected = selectedFilters[level];
              const isParentReady = hasParentSelection(level, selectedFilters);
              const isDisabled = i > 0 && !isParentReady;

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
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <input
                      type="text"
                      value={searchTerms[level]}
                      onChange={(event) => handleSearchChange(level, event.target.value)}
                      placeholder={`Type to find a ${LEVEL_LABELS[level].toLowerCase()}`}
                      disabled={!isParentReady || isLoadingOptions}
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto p-2">
                    {options.length === 0 ? (
                      <p className="text-xs text-neutral-400 px-3 py-2">
                        {getEmptyMessage(level, isLoadingOptions, selectedFilters)}
                      </p>
                    ) : filteredOptions.length === 0 ? (
                      <p className="text-xs text-neutral-400 px-3 py-2">
                        No matches for &quot;{searchTerms[level].trim()}&quot;
                      </p>
                    ) : (
                      filteredOptions.map((option) => {
                        const isSelected = selected.includes(option.id);

                        return (
                          <button
                            key={option.id}
                            onClick={() => !isDisabled && handleFilterToggle(level, option.id)}
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

        <div className="flex justify-center pt-2">
          <button
            onClick={handleGenerateRandom}
            disabled={isGenerating}
            className="group flex items-center gap-3 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 active:scale-95 disabled:opacity-60 disabled:cursor-wait text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            {isGenerating ? 'Generating...' : 'Generate Random Destination'}
          </button>
        </div>

        {randomDestination && (
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
            <div className="px-8 py-7 border-b border-neutral-100">
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
