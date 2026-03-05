'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { reportsApi, Report, ReportQuery } from '@/lib/api';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });
const MapFilters = dynamic(() => import('@/components/map/MapFilters'), { ssr: false });

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<ReportQuery>({ status: 'verified', limit: 500 });

  const fetchReports = useCallback(async (q: ReportQuery) => {
    setLoading(true);
    try {
      const res = await reportsApi.list(q);
      setReports(res.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(query);
  }, [query, fetchReports]);

  const handleBoundsChange = useCallback(
    (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => {
      setQuery((q) => ({ ...q, ...bounds }));
    },
    [],
  );

  const handleFiltersChange = useCallback(
    (filters: { categoryIds: number[]; status?: string; dateRange: string }) => {
      setQuery((q) => ({
        ...q,
        categoryId: filters.categoryIds.length === 1 ? filters.categoryIds[0] : undefined,
        status: filters.status || 'verified',
      }));
    },
    [],
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Crime Map</h2>
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>

        <MapFilters onFiltersChange={handleFiltersChange} />

        <p className="text-xs text-gray-500">{reports.length} reports shown</p>

        <Link
          href="/report/new"
          className="block w-full text-center px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          + Report a Crime
        </Link>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          reports={reports}
          onBoundsChange={handleBoundsChange}
        />
      </div>
    </div>
  );
}
