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
import { DocumentRequirement } from '../types/index.js';
import {
  ArrowLeft,
  UploadCloud,
  Eye,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'Banking',
  'Taxation',
  'Financial Statements',
  'Operations',
  'Legal / Statutory',
  'Payroll / HR',
  'General',
];

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const isReviewer = user?.role === 'REVIEWER';
  const isStaff = user?.role === 'STAFF';

  // Upload modal state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');

  // Requirement management modals state (Reviewer only)
  const [isAddReqOpen, setIsAddReqOpen] = useState(false);
  const [newReqName, setNewReqName] = useState('');
  const [newReqCategory, setNewReqCategory] = useState('Taxation');
  const [newReqDescription, setNewReqDescription] = useState('');

  const [editingReq, setEditingReq] = useState<DocumentRequirement | null>(null);
  const [editReqName, setEditReqName] = useState('');
  const [editReqCategory, setEditReqCategory] = useState('Taxation');
  const [editReqDescription, setEditReqDescription] = useState('');

  const [deactivatingReq, setDeactivatingReq] = useState<DocumentRequirement | null>(null);

  // Tab filter: Active vs Inactive requirements
  const [filterTab, setFilterTab] = useState<'active' | 'inactive'>('active');

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.getClient(id!),
    enabled: !!id,
  });

  // --- Mutations ---

  // Upload document version mutation
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
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedDoc(null);
      setFileToUpload(null);
      setUploadNotes('');
    },
    onError: (err: any) => {
      toastError(err.message || 'File upload failed.');
    },
  });

  // Create requirement mutation (Reviewer only)
  const createReqMutation = useMutation({
    mutationFn: (data: { name: string; category?: string; description?: string }) =>
      api.createRequirement(id!, data),
    onSuccess: (data) => {
      success(`Requirement "${data.name}" added.`);
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddReqOpen(false);
      setNewReqName('');
      setNewReqDescription('');
      setNewReqCategory('Taxation');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to add requirement.');
    },
  });

  // Update requirement mutation (Reviewer only)
  const updateReqMutation = useMutation({
    mutationFn: ({
      reqId,
      data,
    }: {
      reqId: string;
      data: { name?: string; category?: string; description?: string };
    }) => api.updateRequirement(reqId, data),
    onSuccess: (data) => {
      success(`Requirement "${data.name}" updated.`);
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditingReq(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to update requirement.');
    },
  });

  // Deactivate requirement mutation (Reviewer only)
  const deactivateReqMutation = useMutation({
    mutationFn: (reqId: string) => api.deactivateRequirement(reqId),
    onSuccess: (data) => {
      success(`Requirement "${data.name}" deactivated.`);
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['review-queue'] });
      setDeactivatingReq(null);
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to deactivate requirement.');
    },
  });

  // Reactivate requirement mutation (Reviewer only)
  const reactivateReqMutation = useMutation({
    mutationFn: (reqId: string) => api.activateRequirement(reqId),
    onSuccess: (data) => {
      success(`Requirement "${data.name}" reactivated.`);
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to reactivate requirement.');
    },
  });

  // Handlers
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

  const handleAddReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqName.trim()) {
      toastError('Requirement name is required.');
      return;
    }
    createReqMutation.mutate({
      name: newReqName.trim(),
      category: newReqCategory,
      description: newReqDescription.trim() || undefined,
    });
  };

  const handleEditReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReq || !editReqName.trim()) {
      toastError('Requirement name is required.');
      return;
    }
    updateReqMutation.mutate({
      reqId: editingReq.id,
      data: {
        name: editReqName.trim(),
        category: editReqCategory,
        description: editReqDescription.trim(),
      },
    });
  };

  const openEditModal = (req: DocumentRequirement) => {
    setEditingReq(req);
    setEditReqName(req.name);
    setEditReqCategory(req.category || 'Taxation');
    setEditReqDescription(req.description || '');
  };

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  if (error || !client) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200/80 shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-900">Client Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          The requested client does not exist or belongs to another firm. Multi-tenant isolation
          prohibits cross-tenant access.
        </p>
        <Link
          to="/clients"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
        </Link>
      </div>
    );
  }

  // Derive requirements list
  const requirements: DocumentRequirement[] = client.requirements || [];
  const activeRequirements = requirements.filter((r) => r.isActive !== false);
  const inactiveRequirements = requirements.filter((r) => r.isActive === false);
  const displayedRequirements = filterTab === 'active' ? activeRequirements : inactiveRequirements;

  const totalDocs = client.stats?.total || 0;
  const approvedDocs = client.stats?.approved || 0;
  const completionPercent = totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All Clients
        </Link>
      </div>

      {/* Client Overview Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{client.name}</h1>
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              FY {client.financialYear}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {client.industry || 'General'} • Firm: <span className="font-medium text-slate-700">{user?.firm?.name}</span>
          </p>

          {(client.gstin || client.pan) && (
            <div className="flex gap-4 mt-3 text-[11px] text-slate-500 font-mono">
              {client.gstin && <span>GSTIN: <b className="text-slate-800 font-medium">{client.gstin}</b></span>}
              {client.pan && <span>PAN: <b className="text-slate-800 font-medium">{client.pan}</b></span>}
            </div>
          )}
        </div>

        {/* Audit Progress Box */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 shrink-0 w-full md:w-60">
          <div className="flex justify-between items-center text-xs text-slate-700 mb-1.5">
            <span className="font-medium text-[11px] text-slate-500 uppercase tracking-wider">Progress</span>
            <span className="text-xs font-mono font-semibold text-slate-800">
              {approvedDocs} / {totalDocs} Approved
            </span>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
            <span>{client.stats?.underReview || 0} in review</span>
            {client.stats?.correctionRequired > 0 && (
              <span className="text-rose-700 font-medium">
                {client.stats.correctionRequired} need fix
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Document Requirements Management Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Document Requirements</h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                {activeRequirements.length} active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client-specific statutory audit checklist.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isReviewer && (
              <button
                onClick={() => setIsAddReqOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Requirement</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab switcher: Active vs Inactive (visible to Reviewers to manage deactivated items) */}
        {isReviewer && (
          <div className="flex items-center gap-1 px-5 pt-3 pb-2 border-b border-slate-100 text-xs">
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filterTab === 'active'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Active</span>
              <span className="text-[10px] font-mono text-slate-500">
                {activeRequirements.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('inactive')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                filterTab === 'inactive'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Inactive / Deactivated</span>
              <span className="text-[10px] font-mono text-slate-500">
                {inactiveRequirements.length}
              </span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {displayedRequirements.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">
              {filterTab === 'active'
                ? 'No active document requirements configured for this client.'
                : 'No deactivated requirements.'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
              {filterTab === 'active' && isReviewer
                ? 'Click "Add Requirement" above to add statutory audit documents.'
                : 'All configured requirements are currently active.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedRequirements.map((req) => {
              const doc = req.document;
              const docStatus = doc?.status || 'PENDING';
              const docVersion = doc?.currentVersionNumber || 0;
              const isDocActive = req.isActive !== false;
              const canUpload =
                isStaff &&
                isDocActive &&
                !!doc &&
                (docStatus === 'PENDING' || docStatus === 'CORRECTION_REQUIRED');

              return (
                <div
                  key={req.id}
                  className={`p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    !isDocActive ? 'bg-slate-50/40 opacity-75' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{req.name}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                        {req.category || 'General'}
                      </span>

                      {isDocActive ? (
                        <StatusBadge status={docStatus} size="sm" />
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Deactivated
                        </span>
                      )}

                      {docVersion > 0 && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                          v{docVersion}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {req.description && (
                      <p className="text-[11px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
                        {req.description}
                      </p>
                    )}

                    {/* Feedback quote if correction required */}
                    {docStatus === 'CORRECTION_REQUIRED' && doc?.latestCorrectionComment && isDocActive && (
                      <div className="mt-2 text-xs bg-rose-50/70 text-rose-900 p-2.5 rounded-lg border border-rose-200/70 max-w-2xl">
                        <span className="font-medium">Reviewer Note:</span> "{doc.latestCorrectionComment}"
                      </div>
                    )}

                    {!isDocActive && (
                      <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deactivated requirement. Historical files and audit records remain preserved.</span>
                      </div>
                    )}

                    <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Updated {formatRelativeTime(doc?.updatedAt || req.updatedAt || req.createdAt)}</span>
                      {doc?.reviewedBy && (
                        <span>
                          • Reviewed by <span className="font-medium text-slate-700">{doc.reviewedBy.name}</span>
                        </span>
                      )}
                      {req.createdBy && (
                        <span>
                          • Added by <span className="text-slate-600">{req.createdBy.name}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Container */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Staff Upload Button */}
                    {canUpload && doc && (
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{docStatus === 'CORRECTION_REQUIRED' ? 'Upload Revision' : 'Upload File'}</span>
                      </button>
                    )}

                    {/* Reviewer Actions */}
                    {isReviewer && (
                      <>
                        <button
                          onClick={() => openEditModal(req)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-xs font-medium transition-colors"
                          title="Edit requirement"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {isDocActive ? (
                          <button
                            onClick={() => setDeactivatingReq(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md text-xs font-medium transition-colors"
                            title="Deactivate requirement"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateReqMutation.mutate(req.id)}
                            disabled={reactivateReqMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md text-xs font-medium transition-colors"
                            title="Reactivate requirement"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* View / Review Document Link */}
                    {doc && doc.id && (
                      <Link
                        to={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isReviewer ? 'Review' : 'History'}</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Add Requirement Modal (Reviewer Only) */}
      <Modal
        isOpen={isAddReqOpen}
        onClose={() => setIsAddReqOpen(false)}
        title="Add Document Requirement"
        description={`Add a custom audit document requirement for ${client.name}.`}
      >
        <form onSubmit={handleAddReqSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Requirement Name *
            </label>
            <input
              type="text"
              required
              value={newReqName}
              onChange={(e) => setNewReqName(e.target.value)}
              placeholder="e.g. TDS Certificate, Inventory Report"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Category
            </label>
            <select
              value={newReqCategory}
              onChange={(e) => setNewReqCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            >
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Description / Specific Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={newReqDescription}
              onChange={(e) => setNewReqDescription(e.target.value)}
              placeholder="e.g. Include signed Form 16A quarterly summary"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddReqOpen(false)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createReqMutation.isPending || !newReqName.trim()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {createReqMutation.isPending ? 'Adding...' : 'Add Requirement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Requirement Modal (Reviewer Only) */}
      <Modal
        isOpen={!!editingReq}
        onClose={() => setEditingReq(null)}
        title="Edit Requirement"
        description="Update requirement name, category, or instructions."
      >
        <form onSubmit={handleEditReqSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Requirement Name *
            </label>
            <input
              type="text"
              required
              value={editReqName}
              onChange={(e) => setEditReqName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Category
            </label>
            <select
              value={editReqCategory}
              onChange={(e) => setEditReqCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            >
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Description / Instructions
            </label>
            <textarea
              rows={2}
              value={editReqDescription}
              onChange={(e) => setEditReqDescription(e.target.value)}
              placeholder="e.g. Scope, fiscal period, or specific requirements"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingReq(null)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateReqMutation.isPending || !editReqName.trim()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {updateReqMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Deactivate Requirement Modal (Reviewer Only) */}
      <Modal
        isOpen={!!deactivatingReq}
        onClose={() => setDeactivatingReq(null)}
        title="Deactivate Requirement"
        description="Are you sure you want to deactivate this requirement?"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">
                Deactivating: <span className="text-amber-900">{deactivatingReq?.name}</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                This requirement will no longer be required for this client. Existing uploaded files, version history, and audit trails will <b>remain preserved</b>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeactivatingReq(null)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deactivatingReq) {
                  deactivateReqMutation.mutate(deactivatingReq.id);
                }
              }}
              disabled={deactivateReqMutation.isPending}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {deactivateReqMutation.isPending ? 'Deactivating...' : 'Confirm Deactivate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Upload Document Modal */}
      <Modal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={
          selectedDoc?.status === 'CORRECTION_REQUIRED'
            ? `Upload Revised Version — ${selectedDoc?.title}`
            : `Upload File — ${selectedDoc?.title}`
        }
        description="Supported formats: PDF, Excel (XLS, XLSX), Images (PNG, JPG) up to 10MB."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          {selectedDoc?.status === 'CORRECTION_REQUIRED' && selectedDoc?.latestCorrectionComment && (
            <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-lg text-xs text-rose-900">
              <div className="font-semibold mb-0.5">Previous Reviewer Correction Request:</div>
              "{selectedDoc.latestCorrectionComment}"
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1.5">
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
              className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-lg p-1"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Upload Notes / Summary (Optional)
            </label>
            <textarea
              rows={2}
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="e.g. Attached complete ledger including reconciled Q4 entries"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedDoc(null)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !fileToUpload}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Confirm Upload'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
