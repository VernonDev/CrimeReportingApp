'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reportsApi, Report } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import Card from '@/components/ui/Card';
import ReportList from '@/components/reports/ReportList';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      reportsApi
        .myReports()
        .then((r) => setReports(r.data.data))
        .finally(() => setFetching(false));
    }
  }, [isAuthenticated]);

  if (isLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pending = reports.filter((r) => r.status === 'pending').length;
  const verified = reports.filter((r) => r.status === 'verified').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.username}</p>
        </div>
        <Link
          href="/report/new"
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          + New Report
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total Reports</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{pending}</p>
            <p className="text-sm text-gray-500 mt-1">Pending Review</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{verified}</p>
            <p className="text-sm text-gray-500 mt-1">Verified</p>
          </div>
        </Card>
      </div>

      {/* Reports */}
      <Card title="My Reports">
        <ReportList reports={reports} emptyMessage="You haven't submitted any reports yet." />
      </Card>
    </div>
  );
}
