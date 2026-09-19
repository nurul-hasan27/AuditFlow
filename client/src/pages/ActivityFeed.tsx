import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatDate } from '../lib/utils.js';
import {
  History,
  Building2,
  FileText,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<string>('');

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['activity-feed', selectedAction],
    queryFn: () => api.getActivity({ limit: 50, action: selectedAction || undefined }),
  });

  const actionsList = [
    { value: '', label: 'All Actions' },
    { value: 'DOCUMENT_UPLOADED', label: 'Uploads' },
    { value: 'REVIEW_STARTED', label: 'Review Started' },
    { value: 'CORRECTION_REQUESTED', label: 'Corrections Requested' },
    { value: 'DOCUMENT_REUPLOADED', label: 'Re-uploads' },
    { value: 'DOCUMENT_APPROVED', label: 'Approvals' },
    { value: 'REQUIREMENT_CREATED', label: 'Requirement Created' },
    { value: 'REQUIREMENT_UPDATED', label: 'Requirement Updated' },
    { value: 'REQUIREMENT_DEACTIVATED', label: 'Requirement Deactivated' },
    { value: 'REQUIREMENT_REACTIVATED', label: 'Requirement Reactivated' },
    { value: 'CLIENT_CREATED', label: 'Clients Created' },
    { value: 'USER_LOGIN', label: 'User Logins' },
  ];

  const getActionDot = (action: string) => {
    switch (action) {
      case 'DOCUMENT_APPROVED':
      case 'REQUIREMENT_CREATED':
      case 'REQUIREMENT_REACTIVATED':
        return 'bg-emerald-500';
      case 'CORRECTION_REQUESTED':
        return 'bg-rose-500';
      case 'REVIEW_STARTED':
      case 'REQUIREMENT_DEACTIVATED':
        return 'bg-amber-500';
      case 'DOCUMENT_UPLOADED':
      case 'DOCUMENT_REUPLOADED':
        return 'bg-blue-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Activity Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Append-only compliance audit trail for <span className="text-slate-700 font-medium">{user?.firm?.name}</span>.
          </p>
        </div>

        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 shrink-0 self-start sm:self-auto">
          Append-Only Ledger
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Filter:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 shadow-xs"
          >
            {actionsList.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {activityData?.total || 0} Total Events
        </span>
      </div>

      {/* Events Table / List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : activityData?.events?.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">No events matched</p>
            <p className="text-xs text-slate-500 mt-0.5">Try selecting a different action filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activityData?.events?.map((ev: any) => (
              <div
                key={ev._id}
                className="p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getActionDot(ev.action)}`} />
                    <span className="text-[11px] font-mono font-medium text-slate-800 uppercase tracking-tight">
                      {ev.action?.replace(/_/g, ' ')}
                    </span>

                    {ev.client && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium bg-slate-100/70 px-1.5 py-0.2 rounded">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{ev.client.name}</span>
                      </span>
                    )}

                    {ev.document && (
                      <span className="text-[11px] text-slate-700 flex items-center gap-1 font-medium bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/60">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>{ev.document.title}</span>
                      </span>
                    )}
                  </div>

                  {ev.comment && (
                    <div className="mt-1.5 text-xs text-slate-700 bg-slate-50/80 p-2 rounded-lg border border-slate-200/60 max-w-xl font-normal leading-relaxed">
                      "{ev.comment}"
                    </div>
                  )}

                  <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                    <span>
                      By <span className="font-medium text-slate-700">{ev.actor?.name || 'System'}</span>
                      {ev.actor?.role && <span> ({ev.actor.role})</span>}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">{formatDate(ev.createdAt)}</span>
                  </div>
                </div>

                {ev.document && (
                  <Link
                    to={`/documents/${ev.document.id}`}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors self-start sm:self-auto"
                  >
                    <span>View</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
