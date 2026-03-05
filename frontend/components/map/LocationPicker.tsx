'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { divIcon, LatLng } from 'leaflet';

const DEFAULT_LAT = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT || '37.7749');
const DEFAULT_LNG = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG || '-122.4194');

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

function ClickHandler({ onSelect }: { onSelect: (latlng: LatLng) => void }) {
  useMapEvents({ click: (e) => onSelect(e.latlng) });
  return null;
}

const markerIcon = divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function LocationPicker({
  onLocationSelect,
  initialLat,
  initialLng,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null,
  );
  const [loading, setLoading] = useState(false);

  const handleClick = async (latlng: LatLng) => {
    const coords: [number, number] = [latlng.lat, latlng.lng];
    setPosition(coords);
    setLoading(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`,
      );
      const data = await res.json();
      onLocationSelect(latlng.lat, latlng.lng, data.display_name);
    } catch {
      onLocationSelect(latlng.lat, latlng.lng);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={position || [DEFAULT_LAT, DEFAULT_LNG]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ClickHandler onSelect={handleClick} />
          {position && <Marker position={position} icon={markerIcon} />}
        </MapContainer>
      </div>
      {loading && <p className="text-xs text-gray-500">Looking up address...</p>}
      {position && (
        <p className="text-xs text-gray-500">
          Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </p>
      )}
      {!position && (
        <p className="text-xs text-gray-400 italic">Click on the map to select a location</p>
      )}
    </div>
  );
}
