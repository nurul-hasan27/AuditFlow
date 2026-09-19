import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatRelativeTime } from '../lib/utils.js';
import {
  Building2,
  Plus,
  Search,
  ArrowRight,
} from 'lucide-react';

export const Clients: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Manufacturing & Trading');
  const [financialYear, setFinancialYear] = useState('2025-26');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.getClients(),
  });

  const createClientMutation = useMutation({
    mutationFn: (newClientData: any) => api.createClient(newClientData),
    onSuccess: (data) => {
      success(`Client '${data.name}' created with standard 5 audit document requirements.`);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsModalOpen(false);
      setName('');
      setGstin('');
      setPan('');
    },
    onError: (err: any) => {
      toastError(err.message || 'Failed to create client.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Client company name is required.');
      return;
    }
    createClientMutation.mutate({
      name,
      industry,
      financialYear,
      gstin,
      pan,
    });
  };

  const filteredClients = clients?.filter(
    (c: any) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Client Engagements
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage audit clients, checklists, and document verification progress.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> New Client Engagement
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search clients by company name or industry..."
          className="w-full text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
        />
      </div>

      {/* Client List */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : filteredClients?.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No client engagements found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchTerm
              ? `No clients matched "${searchTerm}". Try another search term.`
              : 'Get started by creating your first client audit engagement.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClients?.map((client: any) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-sm transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {client.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {client.industry} • FY {client.financialYear}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                    {client.stats.approved} / {client.stats.total} Approved
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                    <span>Audit Documentation Progress</span>
                    <span>{client.stats.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${client.stats.completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Detailed counts */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-500">Under Review</div>
                    <div className="text-sm font-bold text-amber-700 mt-0.5">
                      {client.stats.underReview}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-500">Needs Fix</div>
                    <div className="text-sm font-bold text-rose-600 mt-0.5">
                      {client.stats.correctionRequired}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-500">Pending</div>
                    <div className="text-sm font-bold text-slate-700 mt-0.5">
                      {client.stats.pending}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Last activity {formatRelativeTime(client.lastActivityAt)}
                </span>
                <Link
                  to={`/clients/${client.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View Document Checklist <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Client Audit Engagement"
        description="Creates client profile and automatically provisions standard 5 audit document requirements."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Company / Client Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Global Solutions Pvt. Ltd."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology / Retail"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Financial Year
              </label>
              <input
                type="text"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                placeholder="2025-26"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="27AABCA1234F1Z5"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                PAN (Optional)
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                placeholder="AABCA1234F"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800">Auto-provisioned checklist:</span>
            <p className="text-slate-500">
              1. Bank Statement • 2. Sales Register • 3. Purchase Register • 4. GST Return • 5. Expense Summary
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClientMutation.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {createClientMutation.isPending ? 'Creating Client...' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
