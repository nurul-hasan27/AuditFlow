import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatRelativeTime, formatDuration } from '../lib/utils.js';
import {
  Inbox,
  CheckCircle2,
  ChevronRight,
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Review Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Documents waiting for your attention, ordered deterministically by waiting time.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {awaiting.length + correction.length} items requiring attention
        </div>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('awaiting')}
          className={cn(
            'px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
            activeTab === 'awaiting'
              ? 'bg-slate-900 text-white font-medium shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <span>Awaiting Review</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded font-mono',
              activeTab === 'awaiting' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            )}
          >
            {awaiting.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('correction')}
          className={cn(
            'px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
            activeTab === 'correction'
              ? 'bg-slate-900 text-white font-medium shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <span>Needs Correction</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded font-mono',
              activeTab === 'correction' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            )}
          >
            {correction.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={cn(
            'px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
            activeTab === 'approved'
              ? 'bg-slate-900 text-white font-medium shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <span>Recently Approved</span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.2 rounded font-mono',
              activeTab === 'approved' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            )}
          >
            {approved.length}
          </span>
        </button>
      </div>

      {/* Tab Content List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Awaiting Review Tab */}
        {activeTab === 'awaiting' && (
          <div>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Sorted by oldest upload first</span>
              <span>{awaiting.length} pending review</span>
            </div>

            {awaiting.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">You're all caught up</p>
                <p className="text-xs text-slate-500 mt-0.5">No documents are waiting for review.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {awaiting.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          v{item.version}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{item.client?.name}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>Uploaded by {item.latestVersion?.uploadedBy?.name || 'Staff'}</span>
                        <span>•</span>
                        <span className="text-amber-800 font-mono">
                          Waiting {formatDuration(item.waitingDurationMs)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/documents/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <span>Start Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Needs Correction Tab */}
        {activeTab === 'correction' && (
          <div>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Documents with review findings awaiting staff revision</span>
              <span>{correction.length} correction items</span>
            </div>

            {correction.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/80 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">No corrections pending</p>
                <p className="text-xs text-slate-500 mt-0.5">All flagged items have been resolved.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {correction.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          v{item.version}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{item.client?.name}</span>
                        <span>•</span>
                        <span>Reviewed by {item.reviewedBy?.name || 'Reviewer'}</span>
                      </div>

                      {item.correctionComment && (
                        <div className="mt-2 text-xs bg-rose-50/70 text-rose-900 p-2.5 rounded-lg border border-rose-200/70 max-w-xl">
                          <span className="font-medium">Finding:</span> "{item.correctionComment}"
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/documents/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <span>View File</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recently Approved Tab */}
        {activeTab === 'approved' && (
          <div>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Verified and certified audit documents</span>
              <span>{approved.length} approved items</span>
            </div>

            {approved.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">No recently approved documents</p>
                <p className="text-xs text-slate-500 mt-0.5">Approved documents will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {approved.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          v{item.version}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{item.client?.name}</span>
                        <span>•</span>
                        <span>Approved by {item.reviewedBy?.name || 'Reviewer'}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.reviewedAt)}</span>
                      </div>
                    </div>

                    <Link
                      to={`/documents/${item.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <span>View History</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
