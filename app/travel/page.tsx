'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GEO_DATA, flattenGeoData, type Continent, type Country, type Region, type City, type GeoLocation } from '@/data/geo-data';
import { ChevronDown, X } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />,
});

export default function TravelPage() {
  const [selectedLocations, setSelectedLocations] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allLocations = flattenGeoData(GEO_DATA);
  const filteredLocations = allLocations.filter((loc) =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedLocations.find((s) => s.name === loc.name)
  );

  const handleSelect = (location: GeoLocation) => {
    setSelectedLocations([...selectedLocations, location]);
    setSearchTerm('');
  };

  const handleRemove = (name: string) => {
    setSelectedLocations(selectedLocations.filter((loc) => loc.name !== name));
  };

  const centerPoint =
    selectedLocations.length > 0
      ? {
          lat: selectedLocations.reduce((sum, loc) => sum + loc.lat, 0) / selectedLocations.length,
          lng: selectedLocations.reduce((sum, loc) => sum + loc.lng, 0) / selectedLocations.length,
          zoom: Math.max(
            ...selectedLocations.map((loc) => loc.zoom)
          ),
        }
      : { lat: 20, lng: 0, zoom: 2 };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f1ea]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">Hao About Travel</h1>
          <p className="mt-4 text-lg text-neutral-600">
            Explore destinations across the globe. Pick any continent, country, region, or city.
          </p>
        </div>

        {/* Custom Dropdown */}
        <div className="relative mb-8" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left shadow-sm hover:shadow-md transition"
          >
            <span className="text-sm text-neutral-600">
              {selectedLocations.length === 0 ? 'Select destinations...' : `${selectedLocations.length} selected`}
            </span>
            <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-neutral-200 bg-white shadow-lg z-50">
              <input
                type="text"
                placeholder="Search continents, countries, regions, cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border-b border-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 rounded-t-2xl"
              />
              <div className="max-h-60 overflow-y-auto">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleSelect(loc)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition border-b border-neutral-100 last:border-b-0"
                    >
                      {loc.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-neutral-500">No results found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Tags */}
        {selectedLocations.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {selectedLocations.map((loc) => (
              <div
                key={loc.name}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm"
              >
                {loc.name}
                <button
                  onClick={() => handleRemove(loc.name)}
                  className="hover:text-red-500 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-neutral-200">
          <MapComponent center={centerPoint} locations={selectedLocations} />
        </div>
      </div>
    </div>
  );
}
