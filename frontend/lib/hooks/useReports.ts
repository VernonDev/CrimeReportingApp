'use client';

import { useState, useCallback } from 'react';
import { reportsApi, Report, ReportQuery } from '../api';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (query?: ReportQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportsApi.list(query);
      setReports(res.data.data);
    } catch {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  return { reports, loading, error, fetchReports };
}
