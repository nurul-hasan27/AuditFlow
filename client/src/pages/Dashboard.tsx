import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { formatRelativeTime, formatDuration } from '../lib/utils.js';
import {
  FileCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Inbox,
  Building2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isReviewer = user?.role === 'REVIEWER';

  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients(),
  });

  const { data: reviewQueue, isLoading: loadingQueue } = useQuery({
    queryKey: ['review-queue'],
    queryFn: () => api.getReviewQueue(),
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity-dashboard'],
    queryFn: () => api.getActivity({ limit: 6 }),
  });

  if (loadingClients || loadingQueue || loadingActivity) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const needsCorrectionCount = reviewQueue?.counts?.needsCorrection || 0;
  const awaitingReviewCount = reviewQueue?.counts?.awaitingReview || 0;
  const recentlyApprovedCount = reviewQueue?.counts?.recentlyApproved || 0;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isReviewer
              ? `Reviewer Workstation for ${user?.firm?.name}. You have ${awaitingReviewCount} documents awaiting verification.`
              : `Staff Audit Workspace for ${user?.firm?.name}. Keep client audits moving forward.`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={isReviewer ? '/review-queue' : '/clients'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            {isReviewer ? (
              <>
                <Inbox className="w-4 h-4" /> Go to Review Queue
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" /> View All Clients
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isReviewer ? 'Awaiting Review' : 'Total Clients'}
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {isReviewer ? awaitingReviewCount : clients?.length || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isReviewer ? 'Require review action' : 'Active firm engagements'}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            {isReviewer ? <Clock className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Needs Correction
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-1">{needsCorrectionCount}</div>
            <p className="text-xs text-slate-500 mt-1">
              {isReviewer ? 'Waiting on staff revisions' : 'Action required from staff'}
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Approved Documents
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{recentlyApprovedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Verified and certified</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tenant Boundary
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1 truncate max-w-[150px]">
              {user?.firm?.name}
            </div>
            <p className="text-xs text-emerald-600 mt-1 font-mono">100% Isolated Data</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Role-Specific Core Workflow Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* If there are items needing correction, highlight them prominently */}
          {needsCorrectionCount > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-rose-950">
                      Correction Required ({needsCorrectionCount})
                    </h3>
                    <p className="text-xs text-rose-700">
                      {isReviewer
                        ? 'Staff has been requested to fix the following documents'
                        : 'Reviewer requested revisions. Please re-upload updated documents.'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/review-queue"
                  className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                >
                  View Queue <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {reviewQueue?.needsCorrection?.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{item.title}</span>
                        <span className="text-xs font-mono text-slate-500">v{item.version}</span>
                        <StatusBadge status="CORRECTION_REQUIRED" size="sm" />
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Client: <span className="font-medium text-slate-900">{item.client?.name}</span>
                      </div>
                      {item.correctionComment && (
                        <div className="mt-2 text-xs bg-rose-50/90 text-rose-900 p-2 rounded-lg border border-rose-100 font-medium">
                          "{item.correctionComment}"
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/documents/${item.id}`}
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors text-center"
                    >
                      {isReviewer ? 'Review Status' : 'Upload Revision'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer: Documents Awaiting Review || Staff: Client Audit Status List */}
          {isReviewer ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Documents Awaiting Review</h3>
                  <p className="text-xs text-slate-500">
                    Uploaded by staff, ready for audit verification
                  </p>
                </div>
                <Link
                  to="/review-queue"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  Full Queue <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {reviewQueue?.awaitingReview?.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">You're all caught up!</p>
                  <p className="text-xs text-slate-500 mt-1">No pending documents awaiting review.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviewQueue?.awaitingReview?.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {item.title}
                          </span>
                          <span className="text-xs font-mono text-slate-400">v{item.version}</span>
                          <StatusBadge status={item.status} size="sm" />
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span>{item.client?.name}</span>
                          <span>•</span>
                          <span>Uploaded {formatRelativeTime(item.latestVersion?.uploadedAt)}</span>
                          <span>•</span>
                          <span className="text-amber-700 font-medium">
                            Waiting {formatDuration(item.waitingDurationMs)}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/documents/${item.id}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Staff Client Engagements List */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Your Client Engagements</h3>
                  <p className="text-xs text-slate-500">Track documentation and audit progress</p>
                </div>
                <Link
                  to="/clients"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  All Clients <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {clients?.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Link
                          to={`/clients/${c.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-slate-500">{c.industry}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {c.stats.approved} / {c.stats.total} Approved
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${c.stats.completionPercentage}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex gap-3">
                        <span>{c.stats.underReview} Under Review</span>
                        <span>•</span>
                        <span>{c.stats.correctionRequired} Corrections</span>
                        <span>•</span>
                        <span>{c.stats.pending} Pending</span>
                      </div>
                      <Link
                        to={`/clients/${c.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Open Checklist →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column: Recent Audit Activity (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Recent Audit Activity</h3>
              <Link
                to="/activity"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Full Trail <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {activityData?.events?.map((ev: any) => (
                <div key={ev._id} className="text-xs relative pl-4 border-l-2 border-slate-200">
                  <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>{ev.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatRelativeTime(ev.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{ev.comment || 'Audit action logged'}</p>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    By <span className="text-slate-900">{ev.actor?.name}</span> ({ev.actor?.role})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
