'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoLocation } from '@/data/geo-data';

interface MapComponentProps {
  center: { lat: number; lng: number; zoom: number };
  locations: GeoLocation[];
}

const MapComponent: React.FC<MapComponentProps> = ({ center, locations }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([center.lat, center.lng], center.zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for selected locations
    locations.forEach((loc) => {
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 8,
        fillColor: '#3b82f6',
        color: '#1e40af',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .addTo(mapRef.current!)
        .bindPopup(`<div class="text-sm font-semibold">${loc.name}</div>`);

      markersRef.current.push(marker);
    });

    // Animate to center with zoom
    mapRef.current.flyTo([center.lat, center.lng], center.zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });

    // Cleanup
    return () => {
      // Keep map instance for reuse
    };
  }, [center, locations]);

  return <div id="map" style={{ width: '100%', height: '400px' }} />;
};

export default MapComponent;
