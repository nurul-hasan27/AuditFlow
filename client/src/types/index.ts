export type UserRole = 'STAFF' | 'REVIEWER';

export type DocumentStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'APPROVED';

export type AuditAction =
  | 'CLIENT_CREATED'
  | 'DOCUMENT_UPLOADED'
  | 'REVIEW_STARTED'
  | 'CORRECTION_REQUESTED'
  | 'DOCUMENT_REUPLOADED'
  | 'DOCUMENT_APPROVED'
  | 'USER_LOGIN';

export interface Firm {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  firm: Firm;
}

export interface ClientSummary {
  id: string;
  name: string;
  industry: string;
  financialYear: string;
  gstin?: string;
  pan?: string;
  stats: {
    total: number;
    approved: number;
    correctionRequired: number;
    underReview: number;
    pending: number;
    uploaded: number;
    completionPercentage: number;
  };
  lastActivityAt: string;
  createdAt: string;
}

export interface DocumentVersionItem {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  reviewStatus: DocumentStatus;
  reviewComment?: string;
  uploadedBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  reviewedBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  reviewedAt?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  clientId: string | { _id: string; name: string; industry?: string };
  title: string;
  category: string;
  status: DocumentStatus;
  currentVersionNumber: number;
  latestVersionId?: DocumentVersionItem;
  latestCorrectionComment?: string;
  reviewedBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersionItem[];
}

export interface AuditTimelineEvent {
  _id: string;
  action: AuditAction;
  comment?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  versionNumber?: number;
}

export interface ActivityFeedItem {
  _id: string;
  action: AuditAction;
  comment?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
  client: {
    id: string;
    name: string;
  } | null;
  document: {
    id: string;
    title: string;
  } | null;
}

export interface ReviewQueueData {
  needsCorrection: any[];
  awaitingReview: any[];
  recentlyApproved: any[];
  counts: {
    needsCorrection: number;
    awaitingReview: number;
    recentlyApproved: number;
  };
}
