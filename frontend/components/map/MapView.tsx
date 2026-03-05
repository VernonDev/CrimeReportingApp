'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { Report } from '@/lib/api';
import CrimeMarker from './CrimeMarker';

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT || '37.7749');
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG || '-122.4194');
const DEFAULT_ZOOM = parseInt(process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM || '12');

interface BoundsTrackerProps {
  onBoundsChange: (bounds: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  }) => void;
}

function BoundsTracker({ onBoundsChange }: BoundsTrackerProps) {
  const map = useMapEvents({
    moveend() {
      emitBounds(map.getBounds());
    },
    zoomend() {
      emitBounds(map.getBounds());
    },
  });

  function emitBounds(bounds: LatLngBounds) {
    onBoundsChange({
      neLat: bounds.getNorthEast().lat,
      neLng: bounds.getNorthEast().lng,
      swLat: bounds.getSouthWest().lat,
      swLng: bounds.getSouthWest().lng,
    });
  }

  // Emit initial bounds
  const emitted = useRef(false);
  useEffect(() => {
    if (!emitted.current) {
      emitted.current = true;
      emitBounds(map.getBounds());
    }
  });

  return null;
}

interface MapViewProps {
  reports: Report[];
  onBoundsChange?: (bounds: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  }) => void;
  onMarkerClick?: (report: Report) => void;
}

export default function MapView({ reports, onBoundsChange, onMarkerClick }: MapViewProps) {
  return (
    <MapContainer
      center={[DEFAULT_LAT, DEFAULT_LNG]}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {onBoundsChange && <BoundsTracker onBoundsChange={onBoundsChange} />}
      {reports.map((report) => (
        <CrimeMarker key={report.id} report={report} onClick={onMarkerClick} />
      ))}
    </MapContainer>
  );
}
