import Link from 'next/link';
import { Report } from '@/lib/api';

interface ReportCardProps {
  report: Report;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  flagged: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-600',
};

export default function ReportCard({ report }: ReportCardProps) {
  return (
    <Link href={`/report/${report.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{ backgroundColor: report.category.color, color: 'white' }}
          >
            {report.category.name}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[report.status] || 'bg-gray-100 text-gray-600'}`}
          >
            {report.status}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{report.title}</h3>

        {report.neighborhood && (
          <p className="text-xs text-gray-500 mb-1">{report.neighborhood}</p>
        )}

        <p className="text-xs text-gray-400">
          {new Date(report.incidentDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </Link>
  );
}
