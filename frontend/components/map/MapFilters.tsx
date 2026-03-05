'use client';

import { useState, useEffect } from 'react';
import { categoriesApi, Category } from '@/lib/api';

interface Filters {
  categoryIds: number[];
  status?: string;
  dateRange: '7d' | '30d' | '90d' | 'all';
}

interface MapFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  showStatusFilter?: boolean;
}

export default function MapFilters({ onFiltersChange, showStatusFilter = false }: MapFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<Filters>({ categoryIds: [], dateRange: 'all' });

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.data.data));
  }, []);

  const toggleCategory = (id: number) => {
    const next = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter((c) => c !== id)
      : [...filters.categoryIds, id];
    const updated = { ...filters, categoryIds: next };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const setDateRange = (dateRange: Filters['dateRange']) => {
    const updated = { ...filters, dateRange };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const setStatus = (status: string) => {
    const updated = { ...filters, status: status || undefined };
    setFilters(updated);
    onFiltersChange(updated);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                filters.categoryIds.includes(cat.id)
                  ? 'text-white border-transparent'
                  : 'text-gray-700 border-gray-300 bg-white hover:bg-gray-50'
              }`}
              style={
                filters.categoryIds.includes(cat.id)
                  ? { backgroundColor: cat.color, borderColor: cat.color }
                  : {}
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Date Range</h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`text-xs px-3 py-1 rounded border transition-colors ${
                filters.dateRange === d
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {d === 'all' ? 'All' : `Last ${d}`}
            </button>
          ))}
        </div>
      </div>

      {showStatusFilter && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1"
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}
    </div>
  );
}
