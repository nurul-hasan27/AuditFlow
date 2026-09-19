import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatDate } from '../lib/utils.js';
import {
  History,
  ShieldCheck,
  Filter,
  FileText,
  Building2,
  ArrowRight,
} from 'lucide-react';

export const ActivityFeed: React.FC = () => {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<string>('');

  const { data: activityData, isLoading } = useQuery({
    queryKey: ['activity-feed', selectedAction],
    queryFn: () => api.getActivity({ limit: 50, action: selectedAction || undefined }),
  });

  const actionsList = [
    { value: '', label: 'All Audit Actions' },
    { value: 'DOCUMENT_UPLOADED', label: 'Uploads' },
    { value: 'REVIEW_STARTED', label: 'Review Started' },
    { value: 'CORRECTION_REQUESTED', label: 'Corrections Requested' },
    { value: 'DOCUMENT_REUPLOADED', label: 'Re-uploads' },
    { value: 'DOCUMENT_APPROVED', label: 'Approvals' },
    { value: 'CLIENT_CREATED', label: 'Clients Created' },
    { value: 'USER_LOGIN', label: 'User Logins' },
  ];

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'DOCUMENT_APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CORRECTION_REQUESTED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'REVIEW_STARTED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DOCUMENT_UPLOADED':
      case 'DOCUMENT_REUPLOADED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'CLIENT_CREATED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Firm Audit History & Compliance Trail
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete, immutable log of all operational events for{' '}
            <span className="font-semibold text-slate-800">{user?.firm?.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Append-Only Ledger</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Filter Action:
          </span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {actionsList.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {activityData?.total || 0} Total Events Logged
        </span>
      </div>

      {/* Event List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : activityData?.events?.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-900">No events matched</h4>
            <p className="text-xs text-slate-500 mt-1">Try selecting a different action filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activityData?.events?.map((ev: any) => (
              <div
                key={ev._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border uppercase ${getActionBadge(
                        ev.action
                      )}`}
                    >
                      {ev.action.replace(/_/g, ' ')}
                    </span>
                    {ev.client && (
                      <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {ev.client.name}
                      </span>
                    )}
                    {ev.document && (
                      <span className="text-xs text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        {ev.document.title}
                      </span>
                    )}
                  </div>

                  {ev.comment && (
                    <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium">
                      "{ev.comment}"
                    </div>
                  )}

                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                    <span>
                      Actor: <b className="text-slate-800">{ev.actor?.name || 'System'}</b> (
                      {ev.actor?.role || 'System'})
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">{formatDate(ev.createdAt)}</span>
                  </div>
                </div>

                {ev.document && (
                  <Link
                    to={`/documents/${ev.document.id}`}
                    className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View Document <ArrowRight className="w-3 h-3" />
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
