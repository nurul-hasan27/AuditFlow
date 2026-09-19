import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ClientDetail } from '../src/pages/ClientDetail.js';
import * as AuthContextModule from '../src/context/AuthContext.js';
import * as ToastContextModule from '../src/context/ToastContext.js';
import { api } from '../src/api/client.js';

vi.mock('../src/api/client.js', () => ({
  api: {
    getClient: vi.fn(),
    createRequirement: vi.fn(),
    updateRequirement: vi.fn(),
    deactivateRequirement: vi.fn(),
    activateRequirement: vi.fn(),
    uploadDocumentVersion: vi.fn(),
  },
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  removeToast: vi.fn(),
  toasts: [],
};

const mockClientData = {
  id: 'client-123',
  name: 'XYZ Manufacturing Pvt. Ltd.',
  industry: 'Heavy Machinery & Components',
  financialYear: '2025-26',
  gstin: '27AABCT3456K1Z8',
  pan: 'AABCT3456K',
  stats: {
    total: 3,
    approved: 1,
    correctionRequired: 1,
    underReview: 0,
    pending: 1,
    uploaded: 0,
  },
  requirements: [
    {
      id: 'req-1',
      firmId: 'firm-1',
      clientId: 'client-123',
      name: 'Bank Statement',
      category: 'Banking',
      isActive: true,
      document: {
        id: 'doc-1',
        title: 'Bank Statement',
        category: 'Banking',
        status: 'APPROVED',
        currentVersionNumber: 1,
      },
    },
    {
      id: 'req-2',
      firmId: 'firm-1',
      clientId: 'client-123',
      name: 'TDS Certificate',
      category: 'Taxation',
      description: 'Form 16A quarterly summary',
      isActive: true,
      document: {
        id: 'doc-2',
        title: 'TDS Certificate',
        category: 'Taxation',
        status: 'CORRECTION_REQUIRED',
        currentVersionNumber: 1,
        latestCorrectionComment: 'Missing Q3 entries',
      },
    },
    {
      id: 'req-3',
      firmId: 'firm-1',
      clientId: 'client-123',
      name: 'Obsolete Report',
      category: 'General',
      isActive: false,
      document: {
        id: 'doc-3',
        title: 'Obsolete Report',
        category: 'General',
        status: 'PENDING',
        currentVersionNumber: 0,
      },
    },
  ],
};

function renderClientDetailWithRole(role: 'REVIEWER' | 'STAFF') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: {
      id: 'user-1',
      name: role === 'REVIEWER' ? 'Senior Reviewer' : 'Junior Staff',
      email: 'user@firm.com',
      role,
      firm: { id: 'firm-1', name: 'Apex & Co.', code: 'APEX' },
    },
    token: 'mock-jwt-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  });

  vi.spyOn(ToastContextModule, 'useToast').mockReturnValue(mockToast);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clients/client-123']}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Document Requirements UI & Role Enforcement', () => {
  it('allows Reviewers to see + Add Requirement button, Edit, and Deactivate controls', async () => {
    vi.mocked(api.getClient).mockResolvedValue(mockClientData as any);

    renderClientDetailWithRole('REVIEWER');

    // Wait for client name to appear
    await waitFor(() => {
      expect(screen.getByText('XYZ Manufacturing Pvt. Ltd.')).toBeInTheDocument();
    });

    // Reviewer should see "+ Add Requirement" button
    expect(screen.getByRole('button', { name: /Add Requirement/i })).toBeInTheDocument();

    // Reviewer should see requirements configured
    expect(screen.getByText('Bank Statement')).toBeInTheDocument();
    expect(screen.getByText('TDS Certificate')).toBeInTheDocument();

    // Reviewer should see Edit and Deactivate buttons for active requirements
    const editButtons = screen.getAllByRole('button', { name: /Edit/i });
    expect(editButtons.length).toBeGreaterThan(0);

    const deactivateButtons = screen.getAllByRole('button', { name: /Deactivate/i });
    expect(deactivateButtons.length).toBeGreaterThan(0);

    // Reviewer should NOT see Staff upload button
    expect(screen.queryByRole('button', { name: /Upload Revision/i })).not.toBeInTheDocument();
  });

  it('restricts Staff from managing requirements: no Add, Edit, or Deactivate controls', async () => {
    vi.mocked(api.getClient).mockResolvedValue(mockClientData as any);

    renderClientDetailWithRole('STAFF');

    // Wait for client name to appear
    await waitFor(() => {
      expect(screen.getByText('XYZ Manufacturing Pvt. Ltd.')).toBeInTheDocument();
    });

    // Staff MUST NOT see "+ Add Requirement" button
    expect(screen.queryByRole('button', { name: /Add Requirement/i })).not.toBeInTheDocument();

    // Staff MUST NOT see Edit or Deactivate buttons
    expect(screen.queryByRole('button', { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Deactivate/i })).not.toBeInTheDocument();

    // Staff SHOULD see Upload Revision button for TDS Certificate (CORRECTION_REQUIRED)
    expect(screen.getByRole('button', { name: /Upload Revision/i })).toBeInTheDocument();
  });

  it('allows Reviewers to switch to Inactive tab and see reactivate option', async () => {
    vi.mocked(api.getClient).mockResolvedValue(mockClientData as any);

    renderClientDetailWithRole('REVIEWER');

    await waitFor(() => {
      expect(screen.getByText('XYZ Manufacturing Pvt. Ltd.')).toBeInTheDocument();
    });

    // Click Inactive tab
    const inactiveTab = screen.getByRole('button', { name: /Inactive \/ Deactivated/i });
    fireEvent.click(inactiveTab);

    // Inactive requirement should now be visible
    expect(screen.getByText('Obsolete Report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reactivate/i })).toBeInTheDocument();
  });
});
