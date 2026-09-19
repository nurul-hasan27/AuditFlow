import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { Modal } from '../components/common/Modal.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatRelativeTime } from '../lib/utils.js';
import {
  ArrowLeft,
  UploadCloud,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const isStaff = user?.role === 'STAFF';

  // Modal upload state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.getClient(id!),
    enabled: !!id,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ docId, file, notes }: { docId: string; file: File; notes?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (notes) formData.append('notes', notes);
      return api.uploadDocumentVersion(docId, formData);
    },
    onSuccess: (data) => {
      success(`${data.title} (v${data.currentVersionNumber}) uploaded successfully.`);
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      setSelectedDoc(null);
      setFileToUpload(null);
      setUploadNotes('');
    },
    onError: (err: any) => {
      toastError(err.message || 'File upload failed.');
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload || !selectedDoc) {
      toastError('Please select a file to upload.');
      return;
    }
    uploadMutation.mutate({
      docId: selectedDoc.id,
      file: fileToUpload,
      notes: uploadNotes,
    });
  };

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  if (error || !client) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Client Not Found or Inaccessible</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          The requested client does not exist or belongs to another firm. Multi-tenant isolation
          prohibits cross-tenant data access.
        </p>
        <Link
          to="/clients"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Clients
        </Link>
      </div>

      {/* Client Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{client.name}</h2>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-medium">
              FY {client.financialYear}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {client.industry} • Firm: <span className="font-semibold text-slate-800">{user?.firm?.name}</span>
          </p>
          {(client.gstin || client.pan) && (
            <div className="flex gap-4 mt-3 text-xs text-slate-500 font-mono">
              {client.gstin && <span>GSTIN: <b className="text-slate-800">{client.gstin}</b></span>}
              {client.pan && <span>PAN: <b className="text-slate-800">{client.pan}</b></span>}
            </div>
          )}
        </div>

        {/* Status Pill & Progress */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 w-full md:w-64">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
            <span>Audit Documentation</span>
            <span className="text-emerald-700 font-bold">
              {client.stats.approved} / {client.stats.total} Approved
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  client.stats.total > 0
                    ? Math.round((client.stats.approved / client.stats.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{client.stats.underReview} under review</span>
            <span className="text-rose-600 font-semibold">{client.stats.correctionRequired} require fix</span>
          </div>
        </div>
      </div>

      {/* Required Audit Documents Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Audit Document Checklist</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory documents required for CA audit file completion
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {client.documents?.length || 0} Total Requirements
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {client.documents?.map((doc: any) => {
            const canUpload = isStaff && (doc.status === 'PENDING' || doc.status === 'CORRECTION_REQUIRED');

            return (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{doc.title}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {doc.category}
                    </span>
                    <StatusBadge status={doc.status} size="sm" />
                    {doc.currentVersionNumber > 0 && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        v{doc.currentVersionNumber}
                      </span>
                    )}
                  </div>

                  {/* If correction requested, show reviewer comment */}
                  {doc.status === 'CORRECTION_REQUIRED' && doc.latestCorrectionComment && (
                    <div className="mt-2 text-xs bg-rose-50/90 text-rose-900 p-2.5 rounded-lg border border-rose-200 max-w-2xl font-medium">
                      <span className="font-bold">Reviewer Feedback:</span> "{doc.latestCorrectionComment}"
                    </div>
                  )}

                  <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-3">
                    <span>Updated {formatRelativeTime(doc.updatedAt)}</span>
                    {doc.reviewedBy && (
                      <span>
                        • Reviewed by <b className="text-slate-700">{doc.reviewedBy.name}</b>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {canUpload && (
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      {doc.status === 'CORRECTION_REQUIRED' ? 'Upload Revision' : 'Upload File'}
                    </button>
                  )}

                  <Link
                    to={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {user?.role === 'REVIEWER' ? 'Review Document' : 'View Audit History'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={
          selectedDoc?.status === 'CORRECTION_REQUIRED'
            ? `Upload Revised Version for ${selectedDoc?.title}`
            : `Upload ${selectedDoc?.title}`
        }
        description={`Supported formats: PDF, Excel (XLS, XLSX), Images (PNG, JPG) up to 10MB.`}
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {selectedDoc?.status === 'CORRECTION_REQUIRED' && selectedDoc?.latestCorrectionComment && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
              <div className="font-bold mb-1">Previous Reviewer Correction Request:</div>
              "{selectedDoc.latestCorrectionComment}"
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
              Select Audit File *
            </label>
            <input
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileToUpload(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Upload Notes / Summary (Optional)
            </label>
            <textarea
              rows={2}
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="e.g. Attached complete ledger including reconciled Q4 entries"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !fileToUpload}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
