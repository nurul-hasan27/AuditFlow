import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatDate, formatRelativeTime, formatFileSize } from '../lib/utils.js';
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  UploadCloud,
  Clock,
  Layers,
  History,
} from 'lucide-react';

export const DocumentReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isReviewer = user?.role === 'REVIEWER';
  const isStaff = user?.role === 'STAFF';

  // Reviewer form states
  const [reviewComment, setReviewComment] = useState('');

  // Staff upload states
  const [staffFile, setStaffFile] = useState<File | null>(null);
  const [staffNotes, setStaffNotes] = useState('');

  // Queries
  const {
    data: document,
    isLoading: loadingDoc,
    error: docError,
  } = useQuery({
    queryKey: ['document', id],
    queryFn: () => api.getDocument(id!),
    enabled: !!id,
  });

  const { data: versions, isLoading: loadingVersions } = useQuery({
    queryKey: ['document-versions', id],
    queryFn: () => api.getDocumentVersions(id!),
    enabled: !!id,
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['document-timeline', id],
    queryFn: () => api.getDocumentAuditHistory(id!),
    enabled: !!id,
  });

  // Mutations
  const startReviewMutation = useMutation({
    mutationFn: () => api.startReview(id!),
    onSuccess: () => {
      success('Review started. Document status updated to Under Review.');
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
    onError: (err: any) => toastError(err.message || 'Failed to start review.'),
  });

  const requestCorrectionMutation = useMutation({
    mutationFn: (comment: string) => api.requestCorrection(id!, comment),
    onSuccess: () => {
      success('Correction requested. Staff will be notified to revise.');
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
      queryClient.invalidateQueries({ queryKey: ['document-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      setReviewComment('');
    },
    onError: (err: any) => toastError(err.message || 'Failed to request correction.'),
  });

  const approveMutation = useMutation({
    mutationFn: (comment?: string) => api.approveDocument(id!, comment),
    onSuccess: () => {
      success('Document verified and approved successfully.');
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
      queryClient.invalidateQueries({ queryKey: ['document-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      setReviewComment('');
    },
    onError: (err: any) => toastError(err.message || 'Failed to approve document.'),
  });

  const staffUploadMutation = useMutation({
    mutationFn: async () => {
      if (!staffFile) throw new Error('Please select a file to upload');
      const formData = new FormData();
      formData.append('file', staffFile);
      if (staffNotes) formData.append('notes', staffNotes);
      return api.uploadDocumentVersion(id!, formData);
    },
    onSuccess: (data) => {
      success(`Version ${data.currentVersionNumber} uploaded successfully.`);
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
      queryClient.invalidateQueries({ queryKey: ['document-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      setStaffFile(null);
      setStaffNotes('');
    },
    onError: (err: any) => toastError(err.message || 'Failed to upload document version.'),
  });

  if (loadingDoc || loadingVersions || loadingTimeline) {
    return <TableSkeleton rows={8} />;
  }

  if (docError || !document) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Document Not Found or Inaccessible</h3>
        <p className="text-sm text-slate-500 mt-1">
          This document does not exist or belongs to another firm tenant.
        </p>
        <Link
          to="/clients"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Clients
        </Link>
      </div>
    );
  }

  const latestVersion = document.latestVersionId;
  const clientObj = document.clientId as any;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          to={`/clients/${clientObj?._id || clientObj?.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {clientObj?.name || 'Client Details'}
        </Link>
      </div>

      {/* Main Document Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{document.title}</h2>
              <StatusBadge status={document.status} size="md" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Client: <span className="font-semibold text-slate-800">{clientObj?.name}</span> • Category:{' '}
              <span className="font-medium text-slate-700">{document.category}</span>
            </p>
          </div>

          <div className="text-right sm:text-right text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
            <div>
              Current Version: <b className="text-slate-900 font-mono">v{document.currentVersionNumber || 0}</b>
            </div>
            {latestVersion && (
              <div className="mt-1">
                Uploaded by <b className="text-slate-900">{latestVersion.uploadedBy?.name || 'Staff'}</b>
              </div>
            )}
            <div className="mt-0.5 text-[11px] text-slate-400">
              {formatDate(latestVersion?.createdAt || document.updatedAt)}
            </div>
          </div>
        </div>

        {/* Highlight correction comment if status is CORRECTION_REQUIRED */}
        {document.status === 'CORRECTION_REQUIRED' && document.latestCorrectionComment && (
          <div className="mt-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                Correction Required by Reviewer
              </div>
              <p className="mt-1 text-sm font-medium leading-relaxed">
                "{document.latestCorrectionComment}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Document Preview & File Information Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Document File & Preview
        </h3>

        {latestVersion ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                PDF
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{latestVersion.fileName}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatFileSize(latestVersion.fileSize)} • Version {latestVersion.versionNumber} •{' '}
                  {formatRelativeTime(latestVersion.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={latestVersion.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Document
              </a>
              <a
                href={latestVersion.fileUrl}
                download={latestVersion.fileName}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No document uploaded yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Document requirement is currently PENDING initial staff upload.
            </p>
          </div>
        )}
      </div>

      {/* Reviewer Action Desk (REVIEWER ONLY) */}
      {isReviewer && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Reviewer Action Desk
            </h3>
            <span className="text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
              Role: Reviewer
            </span>
          </div>

          {document.status === 'UPLOADED' && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-blue-900">Document Uploaded & Ready for Review</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Click 'Start Review' to claim this document and lock its review state.
                </p>
              </div>
              <button
                onClick={() => startReviewMutation.mutate()}
                disabled={startReviewMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Review
              </button>
            </div>
          )}

          {document.status === 'UNDER_REVIEW' && (
            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Reviewer Findings / Audit Note
                  <span className="text-rose-600 ml-1">
                    * (Mandatory when requesting correction)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Verified reconciliation with ledger. Or: Page 3 is missing, please upload complete statement."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={requestCorrectionMutation.isPending}
                  onClick={() => {
                    if (!reviewComment.trim()) {
                      toastError('A comment is required when requesting correction.');
                      return;
                    }
                    requestCorrectionMutation.mutate(reviewComment);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" /> Request Correction
                </button>

                <button
                  type="button"
                  disabled={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(reviewComment)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Document
                </button>
              </div>
            </div>
          )}

          {document.status === 'CORRECTION_REQUIRED' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold">Awaiting Staff Revision:</span> Correction has been requested.
              Staff must upload a revised version before review can resume.
            </div>
          )}

          {document.status === 'APPROVED' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Document has been verified and approved. No further reviewer action needed.
            </div>
          )}
        </div>
      )}

      {/* Staff Upload Section (STAFF ONLY) */}
      {isStaff && (document.status === 'PENDING' || document.status === 'CORRECTION_REQUIRED') && (
        <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-600" />
              {document.status === 'CORRECTION_REQUIRED' ? 'Upload Revised Document' : 'Upload Document'}
            </h3>
            <span className="text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
              Role: Staff
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              staffUploadMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Select File (PDF, Excel, Images) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setStaffFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Upload Notes
              </label>
              <input
                type="text"
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="e.g. Corrected version with page 3 included as requested"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={staffUploadMutation.isPending || !staffFile}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
              >
                {staffUploadMutation.isPending
                  ? 'Uploading...'
                  : document.status === 'CORRECTION_REQUIRED'
                  ? 'Upload Revision (New Version)'
                  : 'Upload Initial Version'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Version History (Section 11) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Version History ({versions?.length || 0})
        </h3>

        {!versions || versions.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No versions recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {versions.map((ver: any) => (
              <div key={ver.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      Version {ver.versionNumber}
                    </span>
                    <StatusBadge status={ver.reviewStatus} size="sm" />
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Uploaded by <b className="text-slate-800">{ver.uploadedBy?.name || 'Staff'}</b> •{' '}
                    {formatDate(ver.createdAt)}
                  </div>
                  {ver.reviewComment && (
                    <div className="mt-1 text-xs text-slate-500 italic">
                      Review Note: "{ver.reviewComment}"
                    </div>
                  )}
                </div>

                <a
                  href={ver.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                >
                  View File
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Audit Timeline (Section 16 - Append Only, Immutable) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              Immutable Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only cryptographic timeline of all review and upload events
            </p>
          </div>
          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
            Tamper-Resistant
          </span>
        </div>

        {!timeline || timeline.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No audit events recorded for this document.</p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            {timeline.map((event: any, idx: number) => {
              const actionColors: Record<string, string> = {
                DOCUMENT_UPLOADED: 'bg-blue-500 ring-blue-100',
                DOCUMENT_REUPLOADED: 'bg-indigo-500 ring-indigo-100',
                REVIEW_STARTED: 'bg-amber-500 ring-amber-100',
                CORRECTION_REQUESTED: 'bg-rose-500 ring-rose-100',
                DOCUMENT_APPROVED: 'bg-emerald-500 ring-emerald-100',
              };
              const dotColor = actionColors[event.action] || 'bg-slate-400 ring-slate-100';

              return (
                <div key={event._id || idx} className="relative group">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full ${dotColor} ring-4 transition-all`}
                  />

                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                          {event.action.replace(/_/g, ' ')}
                        </span>
                        {event.versionNumber && (
                          <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                            v{event.versionNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      By <b className="text-slate-900">{event.actor?.name || 'System'}</b> (
                      {event.actor?.role || 'System'})
                    </div>

                    {event.comment && (
                      <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium">
                        "{event.comment}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
