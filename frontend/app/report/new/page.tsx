'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import ReportForm from '@/components/forms/ReportForm';
import { useAuth } from '@/lib/hooks/useAuth';

export default function NewReportPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Card title="Submit a Crime Report">
        <ReportForm
          onSuccess={(id) => {
            router.push(`/report/${id}`);
          }}
        />
      </Card>
    </div>
  );
}
