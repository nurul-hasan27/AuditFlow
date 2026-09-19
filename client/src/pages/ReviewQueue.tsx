import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatRelativeTime, formatDuration } from '../lib/utils.js';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { cn } from '../lib/utils.js';

export const ReviewQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'awaiting' | 'correction' | 'approved'>('awaiting');

  const { data: queue, isLoading } = useQuery({
    queryKey: ['review-queue'],
    queryFn: () => api.getReviewQueue(),
  });

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  const awaiting = queue?.awaitingReview || [];
  const correction = queue?.needsCorrection || [];
  const approved = queue?.recentlyApproved || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Inbox className="w-6 h-6 text-blue-600" />
          Review Workload Queue
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Prioritized review queue ordered deterministically by waiting time and action urgency.
        </p>
      </div>

      {/* Tabs / Category Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('awaiting')}
          className={cn(
            'pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors relative',
            activeTab === 'awaiting'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Clock className="w-4 h-4" />
          Awaiting Review
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-mono',
              activeTab === 'awaiting' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
            )}
          >
            {awaiting.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('correction')}
          className={cn(
            'pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors relative',
            activeTab === 'correction'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Needs Correction
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-mono',
              activeTab === 'correction' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
            )}
          >
            {correction.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={cn(
            'pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors relative',
            activeTab === 'approved'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          Recently Approved
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full font-mono',
              activeTab === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            )}
          >
            {approved.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'awaiting' && (
          <div>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Sorted: Oldest uploaded first to reduce reviewer turnaround backlog</span>
              <span>{awaiting.length} documents pending review</span>
            </div>

            {awaiting.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-900">You're all caught up!</h4>
                <p className="text-xs text-slate-500 mt-1">No documents awaiting review.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {awaiting.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          v{item.version}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        Client: <b className="text-slate-800">{item.client?.name}</b> • Category:{' '}
                        {item.category}
                      </div>

                      <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span>
                          Uploaded by <b className="text-slate-700">{item.latestVersion?.uploadedBy?.name || 'Staff'}</b>
                        </span>
                        <span>•</span>
                        <span>Uploaded {formatRelativeTime(item.latestVersion?.uploadedAt)}</span>
                        <span>•</span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Waiting {formatDuration(item.waitingDurationMs)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/documents/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" /> Start Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'correction' && (
          <div>
            <div className="p-4 border-b border-slate-100 bg-rose-50/40 flex items-center justify-between text-xs text-rose-800 font-medium">
              <span>Documents with review findings requiring staff correction</span>
              <span>{correction.length} correction items</span>
            </div>

            {correction.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-900">No active corrections!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  There are no documents currently flagged for correction.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {correction.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 max-w-2xl">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          v{item.version}
                        </span>
                        <StatusBadge status="CORRECTION_REQUIRED" size="sm" />
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        Client: <b className="text-slate-800">{item.client?.name}</b>
                      </div>

                      {item.correctionComment && (
                        <div className="mt-2 text-xs bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-rose-950 font-medium">
                          <span className="font-bold">Feedback:</span> "{item.correctionComment}"
                        </div>
                      )}

                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                        <span>Requested {formatRelativeTime(item.updatedAt)}</span>
                        <span>•</span>
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          Waiting on revision {formatDuration(item.waitingDurationMs)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/documents/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'approved' && (
          <div>
            <div className="p-4 border-b border-slate-100 bg-emerald-50/40 flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span>Recently verified and certified audit documents</span>
              <span>{approved.length} approved</span>
            </div>

            {approved.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-base font-bold text-slate-900">No approved documents yet</h4>
                <p className="text-xs text-slate-500 mt-1">Completed reviews will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {approved.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        <span className="text-xs font-mono text-slate-500">v{item.version}</span>
                        <StatusBadge status="APPROVED" size="sm" />
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Client: <b className="text-slate-800">{item.client?.name}</b>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Approved {formatRelativeTime(item.updatedAt)}
                      </div>
                    </div>

                    <Link
                      to={`/documents/${item.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors shrink-0"
                    >
                      View Audit Trail <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
