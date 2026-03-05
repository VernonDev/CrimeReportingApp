'use client';

import { divIcon } from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import { Report } from '@/lib/api';

interface CrimeMarkerProps {
  report: Report;
  onClick?: (report: Report) => void;
}

export default function CrimeMarker({ report, onClick }: CrimeMarkerProps) {
  const color = report.category.color || '#808080';

  const icon = divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      background-color: ${color};
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

  return (
    <Marker
      position={[parseFloat(report.latitude), parseFloat(report.longitude)]}
      icon={icon}
      eventHandlers={{ click: () => onClick?.(report) }}
    >
      <Popup>
        <div className="min-w-[160px]">
          <span
            className="inline-block text-xs font-semibold px-2 py-0.5 rounded mb-1"
            style={{ backgroundColor: color, color: 'white' }}
          >
            {report.category.name}
          </span>
          <p className="font-semibold text-sm mb-1">{report.title}</p>
          <p className="text-xs text-gray-500 mb-2">
            {new Date(report.incidentDate).toLocaleDateString()}
          </p>
          <Link
            href={`/report/${report.id}`}
            className="text-xs text-blue-600 hover:underline"
          >
            View Details →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
