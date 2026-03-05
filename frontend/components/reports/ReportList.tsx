import { Report } from '@/lib/api';
import ReportCard from './ReportCard';

interface ReportListProps {
  reports: Report[];
  emptyMessage?: string;
}

export default function ReportList({
  reports,
  emptyMessage = 'No reports found.',
}: ReportListProps) {
  if (reports.length === 0) {
    return <p className="text-gray-500 text-sm text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
}
