const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auditflow_token');
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set application/json if not uploading FormData (which browser sets boundary for automatically)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError('Unable to connect to AuditFlow server. Please check connection.', 0);
  }

  let data: any = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auditflow_token');
      localStorage.removeItem('auditflow_user');
      // If unauthorized and not already on login, dispatch custom event or redirect
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data.details);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getMe: () => request<any>('/auth/me'),

  // Clients
  getClients: () => request<any[]>('/clients'),
  getClient: (id: string) => request<any>(`/clients/${id}`),
  createClient: (clientData: any) =>
    request<any>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    }),

  // Documents
  getDocument: (id: string) => request<any>(`/documents/${id}`),

  uploadDocumentVersion: (documentId: string, formData: FormData) =>
    request<any>(`/documents/${documentId}/upload`, {
      method: 'POST',
      body: formData,
    }),

  startReview: (documentId: string) =>
    request<any>(`/documents/${documentId}/start-review`, {
      method: 'POST',
    }),

  requestCorrection: (documentId: string, comment: string) =>
    request<any>(`/documents/${documentId}/request-correction`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  approveDocument: (documentId: string, comment?: string) =>
    request<any>(`/documents/${documentId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  getDocumentVersions: (documentId: string) =>
    request<any[]>(`/documents/${documentId}/versions`),

  getDocumentAuditHistory: (documentId: string) =>
    request<any[]>(`/documents/${documentId}/audit-history`),

  // Document Requirements
  getRequirements: (clientId: string, includeInactive?: boolean) => {
    const query = includeInactive !== undefined ? `?includeInactive=${includeInactive}` : '';
    return request<any[]>(`/clients/${clientId}/requirements${query}`);
  },

  createRequirement: (clientId: string, data: { name: string; description?: string; category?: string }) =>
    request<any>(`/clients/${clientId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRequirement: (
    requirementId: string,
    data: { name?: string; description?: string; category?: string }
  ) =>
    request<any>(`/requirements/${requirementId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deactivateRequirement: (requirementId: string) =>
    request<any>(`/requirements/${requirementId}/deactivate`, {
      method: 'PATCH',
    }),

  activateRequirement: (requirementId: string) =>
    request<any>(`/requirements/${requirementId}/activate`, {
      method: 'PATCH',
    }),

  // Review Queue
  getReviewQueue: () => request<any>('/review-queue'),

  // Activity Feed
  getActivity: (params: { limit?: number; skip?: number; action?: string; clientId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.skip) query.set('skip', String(params.skip));
    if (params.action) query.set('action', params.action);
    if (params.clientId) query.set('clientId', params.clientId);
    return request<any>(`/activity?${query.toString()}`);
  },
};
