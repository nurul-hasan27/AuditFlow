import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../api/client.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { CardSkeleton } from '../components/common/Skeleton.js';
import { formatRelativeTime, formatDuration } from '../lib/utils.js';
import {
  ArrowRight,
  CheckCircle2,
  Inbox,
  Building2,
  History,
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || user?.name || 'there';

  return (
    <div className="space-y-8">
      {/* Calm, Typographic Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isReviewer
              ? `Reviewer workstation for ${user?.firm?.name}. ${awaitingReviewCount} ${
                  awaitingReviewCount === 1 ? 'document requires' : 'documents require'
                } review.`
              : `Staff audit workspace for ${user?.firm?.name}. Manage audit document uploads and revisions.`}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0">
          <Link
            to={isReviewer ? '/review-queue' : '/clients'}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-xs"
          >
            {isReviewer ? (
              <>
                <Inbox className="w-3.5 h-3.5" />
                <span>Open Queue</span>
              </>
            ) : (
              <>
                <Building2 className="w-3.5 h-3.5" />
                <span>View Clients</span>
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Understated Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Awaiting Review
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {awaitingReviewCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Pending verification</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Correction Required
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {needsCorrectionCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isReviewer ? 'Waiting on staff' : 'Requires fix'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Approved Today
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {recentlyApprovedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Certified audit files</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Active Engagements
          </div>
          <div className="text-2xl font-semibold text-slate-900 mt-1.5 tracking-tight">
            {clients?.length || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Client portfolios</div>
        </div>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Priority Queue & Client Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Callout if items need correction */}
          {needsCorrectionCount > 0 && (
            <div className="bg-white rounded-xl border border-rose-200/70 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Action Needed: Correction Required ({needsCorrectionCount})
                  </h3>
                </div>
                <Link
                  to="/review-queue"
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {reviewQueue?.needsCorrection?.slice(0, 3).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">v{item.version}</span>
                        <StatusBadge status="CORRECTION_REQUIRED" size="sm" />
                      </div>
                      <div className="text-slate-500 mt-0.5 truncate">
                        {item.client?.name}
                        {item.correctionComment && (
                          <span className="text-rose-800 font-normal italic ml-2">
                            — "{item.correctionComment}"
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/documents/${item.id}`}
                      className="shrink-0 px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {isReviewer ? 'View' : 'Upload'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Queue List */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Review Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documents awaiting verification by reviewer
                </p>
              </div>
              <Link
                to="/review-queue"
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                Open Full Queue <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {reviewQueue?.awaitingReview?.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500/80 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">You're all caught up</p>
                <p className="text-xs text-slate-500 mt-0.5">No documents are waiting for review.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviewQueue?.awaitingReview?.slice(0, 5).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">v{item.version}</span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-slate-700">{item.client?.name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.latestVersion?.uploadedAt)}</span>
                        <span>•</span>
                        <span className="text-amber-800 font-mono">
                          Waiting {formatDuration(item.waitingDurationMs)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/documents/${item.id}`}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                    >
                      {isReviewer ? 'Review' : 'View'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Audit Summary List */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Client Engagements</h2>
                <p className="text-xs text-slate-500 mt-0.5">Statutory audit completion progress</p>
              </div>
              <Link
                to="/clients"
                className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                All Clients <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {clients?.slice(0, 4).map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{c.name}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                        FY {c.financialYear}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {c.industry || 'General Industry'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-800">
                        {c.stats?.approved || 0} / {c.stats?.total || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Documents</div>
                    </div>

                    <Link
                      to={`/clients/${c.id}`}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Recent Operational Activity */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Recent Activity
                </h3>
              </div>
              <Link
                to="/activity"
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                View all
              </Link>
            </div>

            {!activityData?.events || activityData.events.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No activity recorded yet.</p>
            ) : (
              <div className="relative pl-4 space-y-4 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200">
                {activityData.events.slice(0, 6).map((ev: any) => (
                  <div key={ev._id} className="relative text-xs">
                    {/* Tiny bullet dot */}
                    <div className="absolute -left-[15px] top-1.5 w-2 h-2 rounded-full bg-slate-400 ring-2 ring-white" />

                    <div>
                      <div className="font-medium text-slate-800">
                        {ev.actor?.name || 'System'}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                        <span className="font-mono text-slate-600 text-[10px] uppercase">
                          {ev.action?.replace(/_/g, ' ')}
                        </span>
                        {ev.document && <span> on {ev.document.title}</span>}
                        {ev.client && <span> ({ev.client.name})</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {formatRelativeTime(ev.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
