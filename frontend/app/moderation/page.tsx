'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reportsApi, Report } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ReportCard from '@/components/reports/ReportCard';

type Tab = 'pending' | 'flagged';

export default function ModerationPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user && user.role === 'user'))) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchReports = useCallback(async (status: Tab) => {
    setFetching(true);
    try {
      const res = await reportsApi.list({ status, limit: 100 });
      setReports(res.data.data);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'user') {
      fetchReports(tab);
    }
  }, [isAuthenticated, user, tab, fetchReports]);

  const handleVerify = async (id: number) => {
    setActionLoading(id);
    try {
      await reportsApi.verify(id);
      setReports((r) => r.filter((rep) => rep.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await reportsApi.reject(id);
      setReports((r) => r.filter((rep) => rep.id !== id));
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role === 'user') return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Moderation Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['pending', 'flagged'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t} Reports
          </button>
        ))}
      </div>

      {fetching ? (
        <p className="text-gray-500 text-sm">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No {tab} reports to review.
        </p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <ReportCard report={report} />
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/report/${report.id}`}
                    className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    View
                  </Link>
                  {tab === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleVerify(report.id)}
                      loading={actionLoading === report.id}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleReject(report.id)}
                    loading={actionLoading === report.id}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
