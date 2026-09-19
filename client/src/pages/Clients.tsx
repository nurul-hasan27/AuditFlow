import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.js';
import { Modal } from '../components/common/Modal.js';
import { TableSkeleton } from '../components/common/Skeleton.js';
import { formatRelativeTime } from '../lib/utils.js';
import {
  Plus,
  Search,
  Building2,
  ChevronRight,
} from 'lucide-react';

export const Clients: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      success(`Client '${data.name}' created with audit document checklist.`);
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
      c.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Client Engagements</h1>
          <p className="text-xs text-slate-500 mt-1">
            Statutory audit client portfolio, document checklists, and review progress.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Engagement</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company or industry..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {filteredClients?.length || 0} {filteredClients?.length === 1 ? 'Client' : 'Clients'}
        </div>
      </div>

      {/* Professional Client List (Table) */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : filteredClients?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-800">No client engagements found</p>
          <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
            {searchTerm
              ? `No clients matched "${searchTerm}".`
              : 'Get started by creating your first client audit engagement.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Engagement
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-medium text-slate-500 uppercase tracking-wider select-none">
                  <th className="py-3 px-4 font-medium">Client</th>
                  <th className="py-3 px-4 font-medium">Financial Year</th>
                  <th className="py-3 px-4 font-medium">Documents</th>
                  <th className="py-3 px-4 font-medium min-w-[120px]">Progress</th>
                  <th className="py-3 px-4 font-medium">Attention</th>
                  <th className="py-3 px-4 font-medium">Last Activity</th>
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients?.map((client: any) => {
                  const total = client.stats?.total || 0;
                  const approved = client.stats?.approved || 0;
                  const needsFix = client.stats?.correctionRequired || 0;
                  const inReview = client.stats?.underReview || 0;
                  const percentage = total > 0 ? Math.round((approved / total) * 100) : 0;

                  return (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      {/* Client Name & Industry */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {client.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                          {client.industry || 'General Corporate'}
                        </div>
                      </td>

                      {/* Financial Year */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          FY {client.financialYear}
                        </span>
                      </td>

                      {/* Documents count */}
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <span>{approved}</span>
                        <span className="text-slate-400"> / </span>
                        <span>{total}</span>
                        <span className="text-slate-400 ml-1">approved</span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 w-8">{percentage}%</span>
                        </div>
                      </td>

                      {/* Attention */}
                      <td className="py-3.5 px-4">
                        {needsFix > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {needsFix} {needsFix === 1 ? 'needs fix' : 'need fix'}
                          </span>
                        ) : inReview > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {inReview} in review
                          </span>
                        ) : approved === total && total > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Complete
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Up to date</span>
                        )}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatRelativeTime(client.lastActivityAt || client.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/clients/${client.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 group-hover:translate-x-0.5 transition-all p-1"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Client Engagement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Client Engagement"
        description="Establish a new statutory audit engagement with a configurable document checklist."
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
              Client Company Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Industries Pvt. Ltd."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Retail, Healthcare"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                Financial Year
              </label>
              <input
                type="text"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                placeholder="2025-26"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="27AABCU9603R1ZM"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 mb-1">
                PAN (Optional)
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="AABCU9603R"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createClientMutation.isPending || !name.trim()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
            >
              {createClientMutation.isPending ? 'Creating...' : 'Create Engagement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
