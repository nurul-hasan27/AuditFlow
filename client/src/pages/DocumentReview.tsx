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
  Layers,
  History,
  Info,
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

  const { data: versions } = useQuery({
    queryKey: ['document-versions', id],
    queryFn: () => api.getDocumentVersions(id!),
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ['document-timeline', id],
    queryFn: () => api.getDocumentAuditHistory(id!),
    enabled: !!id,
  });

  // Mutations
  const startReviewMutation = useMutation({
    mutationFn: () => api.startReview(id!),
    onSuccess: () => {
      success('Review started. Document status is now Under Review.');
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-timeline', id] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
    },
    onError: (err: any) => toastError(err.message || 'Failed to start review.'),
  });

  const requestCorrectionMutation = useMutation({
    mutationFn: (comment: string) => api.requestCorrection(id!, comment),
    onSuccess: () => {
      success('Correction requested. Staff has been notified.');
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
      success('Document verified and approved.');
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
      if (!staffFile) throw new Error('Please select a file to upload.');
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
    onError: (err: any) => toastError(err.message || 'File upload failed.'),
  });

  if (loadingDoc) {
    return <TableSkeleton rows={5} />;
  }

  if (docError || !document) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200/80 shadow-xs max-w-lg mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-900">Document Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          This document does not exist or is inaccessible under your current firm's tenant boundary.
        </p>
        <Link
          to="/clients"
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
        </Link>
      </div>
    );
  }

  const latestVersion = document.latestVersionId;
  const clientObj = document.clientId as any;
  const clientId = clientObj?._id || clientObj?.id || clientObj;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          to={`/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {clientObj?.name || 'Client Details'}
        </Link>
      </div>

      {/* Main Document Header Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{document.title}</h1>
              <StatusBadge status={document.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client: <span className="font-medium text-slate-800">{clientObj?.name}</span> • Category:{' '}
              <span className="text-slate-700 font-medium">{document.category}</span>
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50/80 p-3 rounded-lg border border-slate-200/60 shrink-0 text-left sm:text-right">
            <div>
              Version: <b className="text-slate-900 font-mono">v{document.currentVersionNumber || 0}</b>
            </div>
            {latestVersion && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                By <span className="text-slate-800 font-medium">{latestVersion.uploadedBy?.name || 'Staff'}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-500 mt-0.5">
              {formatDate(latestVersion?.createdAt || document.updatedAt)}
            </div>
          </div>
        </div>

        {/* Correction Feedback Notice */}
        {document.status === 'CORRECTION_REQUIRED' && document.latestCorrectionComment && (
          <div className="mt-5 p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-900 uppercase tracking-wider text-[10px]">
                Correction Required by Reviewer
              </div>
              <p className="mt-1 text-xs text-rose-900 leading-relaxed font-normal">
                "{document.latestCorrectionComment}"
              </p>
            </div>
          </div>
        )}

        {/* Deactivated Notice */}
        {document.isActive === false && (
          <div className="mt-5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-900 text-[11px]">
                Deactivated Requirement
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                This document requirement was deactivated for this client. Existing file versions and immutable audit trails remain preserved.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Document File & Preview Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Document File</span>
        </h2>

        {latestVersion ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {latestVersion.fileType?.includes('pdf')
                  ? 'PDF'
                  : latestVersion.fileType?.includes('sheet') || latestVersion.fileName?.endsWith('.xlsx')
                  ? 'XLS'
                  : 'FILE'}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">{latestVersion.fileName}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {formatFileSize(latestVersion.fileSize)} • Version {latestVersion.versionNumber} •{' '}
                  {formatRelativeTime(latestVersion.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={latestVersion.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open File</span>
              </a>

              <a
                href={latestVersion.fileUrl}
                download={latestVersion.fileName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No document uploaded yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              This statutory requirement is currently pending initial file upload.
            </p>
          </div>
        )}
      </div>

      {/* Reviewer Action Desk (REVIEWER ONLY) */}
      {isReviewer && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Review Workspace</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              Reviewer
            </span>
          </div>

          {document.isActive === false ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
              This requirement is deactivated. Verification actions are disabled while inactive.
            </div>
          ) : (
            <>
              {document.status === 'UPLOADED' && (
                <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Document Ready for Review</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Start review to verify the document and lock its review state.
                    </p>
                  </div>
                  <button
                    onClick={() => startReviewMutation.mutate()}
                    disabled={startReviewMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Review</span>
                  </button>
                </div>
              )}

              {document.status === 'UNDER_REVIEW' && (
                <div className="space-y-4 p-4 bg-slate-50/60 border border-slate-200/70 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                      Review Findings / Audit Note
                      <span className="text-rose-600 ml-1">* (Required when requesting correction)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="e.g. Page 3 missing, please upload complete statement. Or: Reconciliation confirmed with ledger."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Request Correction</span>
                    </button>

                    <button
                      type="button"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(reviewComment)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Document</span>
                    </button>
                  </div>
                </div>
              )}

              {document.status === 'CORRECTION_REQUIRED' && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900">
                  <span className="font-semibold">Awaiting Staff Revision:</span> Reviewer requested correction. Staff must upload a revised version before review can resume.
                </div>
              )}

              {document.status === 'APPROVED' && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Document verified and approved. No further review required.</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Staff Upload Section (STAFF ONLY) */}
      {isStaff && document.isActive !== false && (document.status === 'PENDING' || document.status === 'CORRECTION_REQUIRED') && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
              <span>{document.status === 'CORRECTION_REQUIRED' ? 'Upload Revision' : 'Upload Document'}</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              Staff
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              staffUploadMutation.mutate();
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1.5">
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
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-lg p-1.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                Upload Notes (Optional)
              </label>
              <input
                type="text"
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                placeholder="e.g. Corrected version with page 3 included"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={staffUploadMutation.isPending || !staffFile}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{staffUploadMutation.isPending ? 'Uploading...' : 'Confirm Upload'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Version History */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Version History</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {versions?.length || 0} {versions?.length === 1 ? 'version' : 'versions'}
          </span>
        </div>

        {!versions || versions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No versions recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {versions.map((ver: any) => (
              <div key={ver.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      v{ver.versionNumber}
                    </span>
                    <span className="font-medium text-slate-800 truncate">{ver.fileName}</span>
                    <StatusBadge status={ver.reviewStatus} size="sm" />
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>Uploaded by {ver.uploadedBy?.name || 'Staff'}</span>
                    <span>•</span>
                    <span>{formatDate(ver.createdAt)}</span>
                    <span>•</span>
                    <span>{formatFileSize(ver.fileSize)}</span>
                  </div>
                  {ver.reviewComment && (
                    <div className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 max-w-xl">
                      Note: "{ver.reviewComment}"
                    </div>
                  )}
                </div>

                <a
                  href={ver.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                  title="Open version file"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Audit Timeline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Immutable Audit Trail</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cryptographic, append-only timeline of review and upload actions
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Append-Only
          </span>
        </div>

        {!timeline || timeline.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No audit events recorded for this document.</p>
        ) : (
          <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2.5 before:bottom-2.5 before:w-[1px] before:bg-slate-200">
            {timeline.map((event: any, idx: number) => {
              const actionColors: Record<string, string> = {
                DOCUMENT_UPLOADED: 'bg-blue-500',
                DOCUMENT_REUPLOADED: 'bg-blue-600',
                REVIEW_STARTED: 'bg-amber-500',
                CORRECTION_REQUESTED: 'bg-rose-500',
                DOCUMENT_APPROVED: 'bg-emerald-500',
                REQUIREMENT_CREATED: 'bg-emerald-500',
                REQUIREMENT_UPDATED: 'bg-slate-600',
                REQUIREMENT_DEACTIVATED: 'bg-amber-500',
                REQUIREMENT_REACTIVATED: 'bg-emerald-500',
              };
              const dotColor = actionColors[event.action] || 'bg-slate-400';

              return (
                <div key={event._id || idx} className="relative text-xs">
                  {/* Timeline bullet dot */}
                  <div
                    className={`absolute -left-[15px] top-1.5 w-2 h-2 rounded-full ${dotColor} ring-2 ring-white`}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {event.action?.replace(/_/g, ' ')}
                        </span>
                        {event.versionNumber && (
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                            v{event.versionNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      By <span className="font-medium text-slate-800">{event.actor?.name || 'System'}</span>
                      {event.actor?.role && (
                        <span className="text-slate-500"> • {event.actor.role}</span>
                      )}
                    </div>

                    {event.comment && (
                      <div className="mt-1 text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed font-normal">
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
