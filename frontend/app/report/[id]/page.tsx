'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { reportsApi, Report } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  flagged: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-600',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [flagModal, setFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    reportsApi
      .get(Number(id))
      .then((r) => setReport(r.data.data))
      .catch(() => router.push('/map'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-500">Loading report...</p>
      </div>
    );
  }

  if (!report) return null;

  const isReporter = user?.id === report.reporterId;
  const isModerator = user?.role === 'moderator' || user?.role === 'admin';

  const handleVerify = async () => {
    setActionLoading(true);
    try {
      await reportsApi.verify(report.id);
      setReport({ ...report, status: 'verified' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await reportsApi.reject(report.id);
      setReport({ ...report, status: 'rejected' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    setActionLoading(true);
    try {
      await reportsApi.flag(report.id, flagReason);
      setReport({ ...report, status: 'flagged' });
      setFlagModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    setActionLoading(true);
    try {
      await reportsApi.delete(report.id);
      router.push('/dashboard');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-sm font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: report.category.color, color: 'white' }}
            >
              {report.category.name}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[report.status]}`}
            >
              {report.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
        </div>
        <Link href="/map" className="text-sm text-blue-600 hover:underline whitespace-nowrap">
          ← Back to Map
        </Link>
      </div>

      {/* Details */}
      <Card>
        <div className="space-y-4">
          <p className="text-gray-700">{report.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Incident Date</span>
              <p className="text-gray-800">{new Date(report.incidentDate).toLocaleString()}</p>
            </div>
            {report.address && (
              <div>
                <span className="font-medium text-gray-500">Location</span>
                <p className="text-gray-800 text-xs">{report.address}</p>
              </div>
            )}
            {report.neighborhood && (
              <div>
                <span className="font-medium text-gray-500">Neighborhood</span>
                <p className="text-gray-800">{report.neighborhood}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-500">Reported</span>
              <p className="text-gray-800">{new Date(report.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Severity</span>
              <p className="text-gray-800">{'★'.repeat(report.category.severity)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Photos */}
      {report.photoPaths && report.photoPaths.length > 0 && (
        <Card title="Photos">
          <div className="flex gap-3 flex-wrap">
            {report.photoPaths.map((p, i) => (
              <a key={i} href={`${API_URL}${p}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_URL}${p}`}
                  alt={`Photo ${i + 1}`}
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 cursor-pointer"
                />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Map */}
      <Card title="Location">
        <div className="h-64 rounded-lg overflow-hidden">
          <MapView reports={[report]} />
        </div>
      </Card>

      {/* Actions */}
      {(isReporter || isModerator || user?.role === 'admin') && (
        <Card title="Actions">
          <div className="flex flex-wrap gap-3">
            {isReporter && report.status === 'pending' && (
              <>
                <Button variant="secondary" size="sm">
                  <Link href={`/report/${report.id}/edit`}>Edit</Link>
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete} loading={actionLoading}>
                  Delete
                </Button>
              </>
            )}
            {isModerator && report.status === 'pending' && (
              <>
                <Button size="sm" onClick={handleVerify} loading={actionLoading}>
                  Verify
                </Button>
                <Button variant="danger" size="sm" onClick={handleReject} loading={actionLoading}>
                  Reject
                </Button>
              </>
            )}
            {user && !isReporter && report.status !== 'flagged' && (
              <Button variant="ghost" size="sm" onClick={() => setFlagModal(true)}>
                Flag Report
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Flag Modal */}
      <Modal isOpen={flagModal} onClose={() => setFlagModal(false)} title="Flag this Report">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Please provide a reason for flagging this report.</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            placeholder="Reason for flagging..."
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFlagModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleFlag}
              loading={actionLoading}
              disabled={!flagReason.trim()}
            >
              Submit Flag
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
